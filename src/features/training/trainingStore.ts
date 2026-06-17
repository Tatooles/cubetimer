import type {
  AlgorithmSetId,
  AlgorithmTime,
  CrossAttempt,
  CrossColor,
  TrainingMode,
  TrainingState,
} from "./types";

export const TRAINING_STORAGE_KEY = "cube-timer-training-v1";

const SET_IDS: AlgorithmSetId[] = ["OLL", "PLL", "COLL", "ZBLL", "LSLL", "CLL2", "PLL4"];
const CROSS_COLORS: CrossColor[] = ["white", "yellow", "green", "blue", "red", "orange"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTrainingMode(value: unknown): value is TrainingMode {
  return value === "cross" || value === "algorithms";
}

function isAlgorithmSetId(value: unknown): value is AlgorithmSetId {
  return typeof value === "string" && SET_IDS.includes(value as AlgorithmSetId);
}

function clampMoveTarget(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(12, Math.max(4, Math.round(value)))
    : 8;
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
  const crossSettings = isRecord(cross.settings) ? cross.settings : {};
  const algorithms = isRecord(value.algorithms) ? value.algorithms : {};
  const algorithmSettings = isRecord(algorithms.settings) ? algorithms.settings : {};
  const activeSetId = isAlgorithmSetId(algorithmSettings.activeSetId)
    ? algorithmSettings.activeSetId
    : fallback.algorithms.settings.activeSetId;

  return {
    activeTrainer: isTrainingMode(value.activeTrainer)
      ? value.activeTrainer
      : fallback.activeTrainer,
    cross: {
      settings: {
        color: CROSS_COLORS.includes(crossSettings.color as CrossColor)
          ? (crossSettings.color as CrossColor)
          : fallback.cross.settings.color,
        moveTarget: clampMoveTarget(crossSettings.moveTarget),
        xcross: crossSettings.xcross === true,
        shortScramble: crossSettings.shortScramble === true,
        inspection: crossSettings.inspection === true,
        revealMode: crossSettings.revealMode === "all" ? "all" : "one",
      },
      history: Array.isArray(cross.history) ? (cross.history as CrossAttempt[]) : [],
    },
    algorithms: {
      settings: {
        activeSetId,
        mode: algorithmSettings.mode === "subset" ? "subset" : "drill",
        subsets: {
          ...fallback.algorithms.settings.subsets,
          ...(isRecord(algorithmSettings.subsets) ? algorithmSettings.subsets : {}),
        } as TrainingState["algorithms"]["settings"]["subsets"],
      },
      historyByCase: isRecord(algorithms.historyByCase)
        ? (algorithms.historyByCase as Record<string, AlgorithmTime[]>)
        : {},
    },
  };
}

export function recordCrossAttempt(state: TrainingState, attempt: CrossAttempt): TrainingState {
  return {
    ...state,
    cross: {
      ...state.cross,
      history: [...state.cross.history, attempt].slice(-100),
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
        [caseId]: [...(state.algorithms.historyByCase[caseId] ?? []), nextTime].slice(-50),
      },
    },
  };
}
