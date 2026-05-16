import { randomScrambleForEvent } from "cubing/scramble";
import { setSearchDebug } from "cubing/search";
import type { EventId } from "./types";
import { generate333LSLLScramble } from "./trainingScrambles333";

if (import.meta.env.PROD) {
  setSearchDebug({ logPerf: false });
}

export type ScrambleHistory = {
  entries: string[];
  index: number;
};

export async function generateScramble(eventId: EventId): Promise<string> {
  if (eventId === "333-lsll") return generate333LSLLScramble();

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

export function shouldShowScrambleLoading(history: ScrambleHistory, resetHistory: boolean): boolean {
  return resetHistory || history.entries.length === 0;
}
