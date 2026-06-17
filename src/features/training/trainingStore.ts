import type {
  AlgorithmSetId,
  AlgorithmMode,
  AlgorithmTime,
  CrossAttempt,
  CrossColor,
  CrossRating,
  CrossSettings,
  TrainingMode,
  TrainingState,
} from "./types";

export const TRAINING_STORAGE_KEY = "cube-timer-training-v1";
const MAX_CROSS_HISTORY = 100;
const MAX_ALGORITHM_HISTORY = 50;

const SET_IDS: AlgorithmSetId[] = ["OLL", "PLL", "COLL", "ZBLL", "LSLL", "CLL2", "PLL4"];
const CROSS_COLORS: CrossColor[] = ["white", "yellow", "green", "blue", "red", "orange"];
const CROSS_RATINGS: CrossRating[] = ["good", "okay", "missed"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTrainingMode(value: unknown): value is TrainingMode {
  return value === "cross" || value === "algorithms";
}

function isAlgorithmSetId(value: unknown): value is AlgorithmSetId {
  return typeof value === "string" && SET_IDS.includes(value as AlgorithmSetId);
}

function isCrossRating(value: unknown): value is CrossRating {
  return typeof value === "string" && CROSS_RATINGS.includes(value as CrossRating);
}

function isAlgorithmMode(value: unknown): value is AlgorithmMode {
  return value === "drill" || value === "subset";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function clampMoveTarget(value: unknown): number {
  return isFiniteNumber(value) ? Math.min(12, Math.max(4, Math.round(value))) : 8;
}

function sanitizeCrossAttempt(value: unknown): CrossAttempt | null {
  if (!isRecord(value)) {
    return null;
  }

  return typeof value.id === "string" &&
    typeof value.scramble === "string" &&
    isStringArray(value.solution) &&
    isFiniteNumber(value.moveCount) &&
    isCrossRating(value.rating) &&
    typeof value.flagged === "boolean" &&
    typeof value.xcross === "boolean" &&
    isFiniteNumber(value.timestamp)
    ? {
        id: value.id,
        scramble: value.scramble,
        solution: value.solution,
        moveCount: value.moveCount,
        rating: value.rating,
        flagged: value.flagged,
        xcross: value.xcross,
        timestamp: value.timestamp,
      }
    : null;
}

function sanitizeAlgorithmTime(value: unknown): AlgorithmTime | null {
  if (!isRecord(value)) {
    return null;
  }

  return isAlgorithmSetId(value.setId) &&
    typeof value.caseId === "string" &&
    isFiniteNumber(value.ms) &&
    isFiniteNumber(value.timestamp)
    ? {
        setId: value.setId,
        caseId: value.caseId,
        ms: value.ms,
        timestamp: value.timestamp,
      }
    : null;
}

function sanitizeCrossSettings(value: unknown, fallback: CrossSettings): CrossSettings {
  const settings = isRecord(value) ? value : {};

  return {
    color: CROSS_COLORS.includes(settings.color as CrossColor)
      ? (settings.color as CrossColor)
      : fallback.color,
    moveTarget: clampMoveTarget(settings.moveTarget),
    xcross: settings.xcross === true,
    shortScramble: settings.shortScramble === true,
    inspection: settings.inspection === true,
    revealMode: settings.revealMode === "all" ? "all" : "one",
  };
}

function sanitizeAlgorithmSubsets(
  value: unknown,
  fallback: TrainingState["algorithms"]["settings"]["subsets"],
): TrainingState["algorithms"]["settings"]["subsets"] {
  const subsets = isRecord(value) ? value : {};

  return SET_IDS.reduce<TrainingState["algorithms"]["settings"]["subsets"]>(
    (acc, setId) => {
      const subset = subsets[setId];
      acc[setId] = isStringArray(subset) ? subset : fallback[setId];
      return acc;
    },
    {} as TrainingState["algorithms"]["settings"]["subsets"],
  );
}

function sanitizeCrossHistory(value: unknown): CrossAttempt[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(sanitizeCrossAttempt)
    .filter((entry): entry is CrossAttempt => entry !== null)
    .slice(-MAX_CROSS_HISTORY);
}

function sanitizeHistoryByCase(value: unknown): Record<string, AlgorithmTime[]> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(value).reduce<Record<string, AlgorithmTime[]>>((acc, [caseId, history]) => {
    if (!Array.isArray(history)) {
      return acc;
    }

    acc[caseId] = history
      .map(sanitizeAlgorithmTime)
      .filter((entry): entry is AlgorithmTime => entry !== null)
      .slice(-MAX_ALGORITHM_HISTORY);
    return acc;
  }, {});
}

function getStorage(storage?: Storage): Storage | undefined {
  if (storage) {
    return storage;
  }

  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

export function defaultTrainingState(): TrainingState {
  return {
    activeTrainer: "cross",
    cross: {
      settings: {
        color: "white",
        moveTarget: 8,
        xcross: false,
        shortScramble: false,
        inspection: false,
        revealMode: "one",
      },
      history: [],
    },
    algorithms: {
      settings: {
        activeSetId: "PLL",
        mode: "drill",
        subsets: {
          OLL: [],
          PLL: ["T", "Jb", "Ua", "Ub", "H", "Z", "Y"],
          COLL: [],
          ZBLL: [],
          LSLL: [],
          CLL2: [],
          PLL4: [],
        },
      },
      historyByCase: {},
    },
  };
}

export function sanitizeTrainingState(value: unknown): TrainingState {
  const fallback = defaultTrainingState();
  if (!isRecord(value)) {
    return fallback;
  }

  const cross = isRecord(value.cross) ? value.cross : {};
  const algorithms = isRecord(value.algorithms) ? value.algorithms : {};
  const algorithmSettings = isRecord(algorithms.settings) ? algorithms.settings : {};

  return {
    activeTrainer: isTrainingMode(value.activeTrainer)
      ? value.activeTrainer
      : fallback.activeTrainer,
    cross: {
      settings: sanitizeCrossSettings(cross.settings, fallback.cross.settings),
      history: sanitizeCrossHistory(cross.history),
    },
    algorithms: {
      settings: {
        activeSetId: isAlgorithmSetId(algorithmSettings.activeSetId)
          ? algorithmSettings.activeSetId
          : fallback.algorithms.settings.activeSetId,
        mode: isAlgorithmMode(algorithmSettings.mode) ? algorithmSettings.mode : "drill",
        subsets: sanitizeAlgorithmSubsets(
          algorithmSettings.subsets,
          fallback.algorithms.settings.subsets,
        ),
      },
      historyByCase: sanitizeHistoryByCase(algorithms.historyByCase),
    },
  };
}

export function updateCrossSettings(
  state: TrainingState,
  patch: Partial<CrossSettings>,
): TrainingState {
  const fallback = defaultTrainingState();

  return {
    ...state,
    cross: {
      ...state.cross,
      settings: {
        ...fallback.cross.settings,
        ...state.cross.settings,
        ...sanitizeCrossSettings(patch, {
          ...fallback.cross.settings,
          ...state.cross.settings,
        }),
      },
    },
  };
}

export function updateAlgorithmSettings(
  state: TrainingState,
  patch: Partial<Omit<TrainingState["algorithms"]["settings"], "subsets">> & {
    subsets?: Record<string, unknown>;
  },
): TrainingState {
  const fallback = defaultTrainingState();
  const currentSettings = state.algorithms.settings;
  const nextSubsetsSource = patch.subsets ?? {};

  return {
    ...state,
    algorithms: {
      ...state.algorithms,
      settings: {
        activeSetId: isAlgorithmSetId(patch.activeSetId)
          ? patch.activeSetId
          : (currentSettings.activeSetId ?? fallback.algorithms.settings.activeSetId),
        mode: isAlgorithmMode(patch.mode) ? patch.mode : (currentSettings.mode ?? "drill"),
        subsets: sanitizeAlgorithmSubsets(nextSubsetsSource, {
          ...fallback.algorithms.settings.subsets,
          ...currentSettings.subsets,
        }),
      },
    },
  };
}

export function loadTrainingState(storage?: Storage): TrainingState {
  const resolvedStorage = getStorage(storage);
  if (!resolvedStorage) {
    return defaultTrainingState();
  }

  try {
    const raw = resolvedStorage.getItem(TRAINING_STORAGE_KEY);
    if (raw === null) {
      return defaultTrainingState();
    }

    return sanitizeTrainingState(JSON.parse(raw));
  } catch {
    return defaultTrainingState();
  }
}

export function saveTrainingState(state: TrainingState, storage?: Storage): void {
  const resolvedStorage = getStorage(storage);
  if (!resolvedStorage) {
    return;
  }

  try {
    resolvedStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(sanitizeTrainingState(state)));
  } catch {
    // Ignore storage write failures.
  }
}

export function recordCrossAttempt(state: TrainingState, attempt: CrossAttempt): TrainingState {
  return {
    ...state,
    cross: {
      ...state.cross,
      history: [...state.cross.history, attempt].slice(-MAX_CROSS_HISTORY),
    },
  };
}

export function recordAlgorithmTime(
  state: TrainingState,
  setId: AlgorithmSetId,
  caseId: string,
  ms: number,
  timestamp = Date.now(),
): TrainingState {
  const nextTime: AlgorithmTime = { setId, caseId, ms, timestamp };
  return {
    ...state,
    algorithms: {
      ...state.algorithms,
      historyByCase: {
        ...state.algorithms.historyByCase,
        [caseId]: [...(state.algorithms.historyByCase[caseId] ?? []), nextTime].slice(
          -MAX_ALGORITHM_HISTORY,
        ),
      },
    },
  };
}
