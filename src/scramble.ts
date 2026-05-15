import { randomScrambleForEvent } from "cubing/scramble";
import type { EventId } from "./types";

export type ScrambleHistory = {
  entries: string[];
  index: number;
};

export async function generateScramble(eventId: EventId): Promise<string> {
  return (await randomScrambleForEvent(eventId)).toString();
}

export function appendScrambleHistory(history: ScrambleHistory, scramble: string): ScrambleHistory {
  return {
    entries: [...history.entries.slice(0, history.index + 1), scramble],
    index: history.index + 1,
  };
}

export function previousScrambleHistory(history: ScrambleHistory): ScrambleHistory {
  return {
    ...history,
    index: Math.max(0, history.index - 1),
  };
}

export function nextScrambleHistory(history: ScrambleHistory): ScrambleHistory {
  return {
    ...history,
    index: Math.min(history.entries.length - 1, history.index + 1),
  };
}
