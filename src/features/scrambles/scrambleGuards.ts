import type { PuzzleEvent } from "../sessions/types";

type ScrambleResultGuard = {
  currentEventId: PuzzleEvent;
  latestRequestId: number;
  requestedEventId: PuzzleEvent;
  requestId: number;
};

export function hasReadyScramble(scramble: string, isLoading: boolean): boolean {
  return !isLoading && scramble.trim().length > 0;
}

export function canApplyScrambleResult({
  currentEventId,
  latestRequestId,
  requestedEventId,
  requestId,
}: ScrambleResultGuard): boolean {
  return requestId === latestRequestId && requestedEventId === currentEventId;
}
