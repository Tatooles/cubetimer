import { DEFAULT_SETTINGS } from "../settings/settingsStore";
import type { AppState, Penalty, PuzzleEvent, Session, Solve } from "./types";

const STORAGE_VERSION = 1;
const PUZZLE_EVENT_IDS = new Set<PuzzleEvent>([
  "333",
  "222",
  "444",
  "555",
  "666",
  "777",
  "333oh",
  "333bld",
  "pyra",
  "skewb",
  "mega",
  "sq1",
  "clock",
]);

export const APP_STORAGE_KEY = `cube-timer-studio-v${STORAGE_VERSION}`;
export const LEGACY_STORAGE_KEY = "cubetimer:data";

const DEMO_TIMES = [
  12_410, 11_980, 13_220, 12_760, 10_940, 14_070, 12_030, 11_540, 13_890, 12_180, 10_620, 15_030,
  12_690, 11_730, 13_140, 12_020, 10_880, 14_420, 11_910, 12_570, 13_610, 10_970, 12_260, 11_640,
  15_480, 12_730, 11_280, 13_050, 12_360, 10_790, 14_110, 12_080, 11_860, 13_720, 12_510, 10_660,
  14_860, 11_990, 12_440, 13_180, 11_320, 10_910, 12_830, 14_270, 11_750, 13_360, 12_150, 10_840,
  12_620, 11_570,
];

const DEMO_SCRAMBLES = [
  "R U R' F2 D L2 B' U2 R2 F D'",
  "F R U' R' D2 L B2 U F' L2",
  "U2 R2 F' L D B2 R' U F2 D'",
  "B L2 D' R U2 F' D2 L' U R2",
];

export function createSolve(ms: number, eventId: PuzzleEvent, scramble: string): Solve {
  return {
    id: crypto.randomUUID(),
    ms,
    eventId,
    scramble,
    timestamp: Date.now(),
    penalty: "OK",
  };
}

export function defaultAppState(): AppState {
  return {
    eventId: "333",
    selectedSessionId: "main",
    sessions: [{ id: "main", name: "Main", solves: [] }],
    currentScramble: "",
    settings: DEFAULT_SETTINGS,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function numberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function timestampValue(value: unknown): number {
  const numeric = numberValue(value);
  if (numeric != null) {
    return numeric;
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return Date.now();
}

function puzzleEventValue(value: unknown, fallback: PuzzleEvent): PuzzleEvent {
  return typeof value === "string" && PUZZLE_EVENT_IDS.has(value as PuzzleEvent)
    ? (value as PuzzleEvent)
    : fallback;
}

function penaltyValue(value: unknown): Penalty {
  return value === "+2" || value === "DNF" ? value : "OK";
}

function migrateLegacySolve(
  value: unknown,
  index: number,
  fallbackEventId: PuzzleEvent,
): Solve | null {
  if (!isRecord(value)) {
    return null;
  }

  const ms = numberValue(value.ms ?? value.time ?? value.elapsedMs ?? value.duration);
  if (ms == null || ms <= 0) {
    return null;
  }

  const timestamp = timestampValue(value.timestamp ?? value.ts ?? value.date);
  const id = stringValue(value.id, `legacy-${timestamp}-${index}`);
  const scramble = stringValue(value.scramble);
  const comment = stringValue(value.comment);

  return {
    id,
    ms: Math.round(ms),
    eventId: puzzleEventValue(value.eventId ?? value.event, fallbackEventId),
    scramble,
    timestamp,
    penalty: penaltyValue(value.penalty),
    comment: comment || undefined,
  };
}

function migrateLegacySession(
  value: unknown,
  fallbackId: string,
  fallbackEventId: PuzzleEvent,
): Session | null {
  if (!isRecord(value)) {
    return null;
  }

  const rawSolves = Array.isArray(value.solves) ? value.solves : [];
  const solves = rawSolves
    .map((solve, index) => migrateLegacySolve(solve, index, fallbackEventId))
    .filter((solve): solve is Solve => solve != null);

  return {
    id: stringValue(value.id, fallbackId),
    name: stringValue(value.name, fallbackId === "main" ? "Main" : fallbackId),
    solves,
  };
}

function migrateLegacySessions(value: unknown, fallbackEventId: PuzzleEvent): Session[] {
  if (Array.isArray(value)) {
    return value
      .map((session, index) =>
        migrateLegacySession(session, `session-${index + 1}`, fallbackEventId),
      )
      .filter((session): session is Session => session != null);
  }

  if (!isRecord(value)) {
    return [];
  }

  return Object.entries(value)
    .map(([id, session]) => migrateLegacySession(session, id, fallbackEventId))
    .filter((session): session is Session => session != null);
}

export function migrateLegacyState(value: unknown): AppState | null {
  if (!isRecord(value)) {
    return null;
  }

  const eventId = puzzleEventValue(value.eventId ?? value.event, "333");
  const migratedSessions = migrateLegacySessions(value.sessions, eventId);
  const sessions =
    migratedSessions.length > 0
      ? migratedSessions
      : migrateLegacySession({ id: "main", name: "Main", solves: value.solves }, "main", eventId);

  const sessionList = Array.isArray(sessions) ? sessions : sessions == null ? [] : [sessions];
  if (sessionList.length === 0) {
    return null;
  }

  const selectedSessionId = stringValue(
    value.selectedSessionId ?? value.activeSessionId ?? value.session,
    sessionList[0].id,
  );

  return sanitizeState({
    ...defaultAppState(),
    eventId,
    selectedSessionId,
    sessions: sessionList,
    currentScramble: stringValue(value.currentScramble),
  });
}

export function createDemoAppState(): AppState {
  const now = Date.now();

  return {
    ...defaultAppState(),
    sessions: [
      {
        id: "main",
        name: "Main",
        solves: DEMO_TIMES.map((ms, index) => ({
          id: `demo-${index}`,
          ms,
          eventId: "333",
          scramble: DEMO_SCRAMBLES[index % DEMO_SCRAMBLES.length],
          timestamp: now - (DEMO_TIMES.length - index) * 45_000,
          penalty: index === 11 ? "+2" : index === 24 ? "DNF" : "OK",
          comment: index === 4 ? "Clean F2L" : undefined,
        })),
      },
      { id: "practice-oh", name: "OH practice", solves: [] },
      { id: "big-cubes", name: "Big cubes", solves: [] },
    ],
    currentScramble: DEMO_SCRAMBLES[0],
  };
}

export function sanitizeState(state: AppState): AppState {
  const fallback = defaultAppState();
  const sessions = state.sessions?.length ? state.sessions : fallback.sessions;
  const selectedSessionId = sessions.some((session) => session.id === state.selectedSessionId)
    ? state.selectedSessionId
    : sessions[0].id;

  return {
    ...fallback,
    ...state,
    selectedSessionId,
    sessions,
    settings: {
      ...DEFAULT_SETTINGS,
      ...state.settings,
    },
  };
}

export function activeSession(state: AppState): Session {
  return (
    state.sessions.find((session) => session.id === state.selectedSessionId) ?? state.sessions[0]
  );
}
