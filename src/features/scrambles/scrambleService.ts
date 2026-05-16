import { randomScrambleForEvent } from "cubing/scramble";
import type { PuzzleEvent } from "../sessions/types";
import { mapPuzzleEventToCubingEvent } from "./eventMap";

const FALLBACK_MOVES = ["R", "L", "U", "D", "F", "B"];
const FALLBACK_SUFFIXES = ["", "'", "2"];

function fallbackScramble(eventId: PuzzleEvent): string {
  const length = eventId === "222" ? 11 : eventId === "444" ? 40 : eventId === "555" ? 60 : 20;
  const output: string[] = [];
  let previous = "";

  while (output.length < length) {
    const face = FALLBACK_MOVES[Math.floor(Math.random() * FALLBACK_MOVES.length)];
    if (face === previous) {
      continue;
    }

    previous = face;
    output.push(
      `${face}${FALLBACK_SUFFIXES[Math.floor(Math.random() * FALLBACK_SUFFIXES.length)]}`,
    );
  }

  return output.join(" ");
}

export async function generateScramble(
  eventId: PuzzleEvent,
): Promise<{ scramble: string; error?: string }> {
  try {
    const alg = await randomScrambleForEvent(mapPuzzleEventToCubingEvent(eventId));
    return { scramble: alg.toString() };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scramble generation failed";
    return { scramble: fallbackScramble(eventId), error: message };
  }
}
