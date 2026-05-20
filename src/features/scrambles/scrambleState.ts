import type { AppState } from "../sessions/types";

export type ScrambleResult = {
  scramble: string;
  error?: string;
};

export function applyScrambleResult(state: AppState, result: ScrambleResult): AppState {
  return { ...state, currentScramble: result.scramble };
}
