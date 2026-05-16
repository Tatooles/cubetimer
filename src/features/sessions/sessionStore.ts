import { DEFAULT_SETTINGS } from "../settings/settingsStore";
import type { AppState, PuzzleEvent, Session, Solve } from "./types";

const STORAGE_VERSION = 1;

export const APP_STORAGE_KEY = `cube-timer-studio-v${STORAGE_VERSION}`;

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

export function createDemoSession(): Session {
  const now = Date.now();
  return {
    id: "main",
    name: "Main",
    solves: DEMO_TIMES.map((ms, index) => ({
      id: `seed-${index}`,
      ms,
      eventId: "333",
      scramble: DEMO_SCRAMBLES[index % DEMO_SCRAMBLES.length],
      timestamp: now - (DEMO_TIMES.length - index) * 45_000,
      penalty: index === 11 ? "+2" : index === 24 ? "DNF" : "OK",
      comment: index === 4 ? "Clean F2L" : undefined,
    })),
  };
}

export function defaultAppState(): AppState {
  return {
    eventId: "333",
    selectedSessionId: "main",
    sessions: [
      createDemoSession(),
      { id: "practice-oh", name: "OH practice", solves: [] },
      { id: "big-cubes", name: "Big cubes", solves: [] },
    ],
    currentScramble: DEMO_SCRAMBLES[0],
    settings: DEFAULT_SETTINGS,
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
