import { randomScrambleForEvent } from "cubing/scramble";
import type { PuzzleEvent } from "../sessions/types";
import { mapPuzzleEventToCubingEvent } from "./eventMap";

export async function generateScramble(
  eventId: PuzzleEvent,
): Promise<{ scramble?: string; error?: string }> {
  try {
    const alg = await randomScrambleForEvent(mapPuzzleEventToCubingEvent(eventId));
    return { scramble: alg.toString() };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scramble generation failed";
    return { error: message };
  }
}
