import type { PuzzleEvent } from "../sessions/types";

export const PUZZLE_EVENTS: Array<{
  id: PuzzleEvent;
  label: string;
  draw: "cube2" | "cube3" | "placeholder";
}> = [
  { id: "333", label: "3x3", draw: "cube3" },
  { id: "222", label: "2x2", draw: "cube2" },
  { id: "444", label: "4x4", draw: "placeholder" },
  { id: "555", label: "5x5", draw: "placeholder" },
  { id: "666", label: "6x6", draw: "placeholder" },
  { id: "777", label: "7x7", draw: "placeholder" },
  { id: "333oh", label: "3x3 OH", draw: "cube3" },
  { id: "333bld", label: "3x3 BLD", draw: "cube3" },
  { id: "pyra", label: "Pyraminx", draw: "placeholder" },
  { id: "skewb", label: "Skewb", draw: "placeholder" },
  { id: "mega", label: "Megaminx", draw: "placeholder" },
  { id: "sq1", label: "Square-1", draw: "placeholder" },
  { id: "clock", label: "Clock", draw: "placeholder" },
];

const CUBING_EVENT_MAP: Record<PuzzleEvent, string> = {
  "333": "333",
  "222": "222",
  "444": "444",
  "555": "555",
  "666": "666",
  "777": "777",
  "333oh": "333",
  "333bld": "333bf",
  pyra: "pyram",
  skewb: "skewb",
  mega: "minx",
  sq1: "sq1",
  clock: "clock",
};

export function mapPuzzleEventToCubingEvent(eventId: PuzzleEvent): string {
  return CUBING_EVENT_MAP[eventId];
}

export function puzzleEventLabel(eventId: PuzzleEvent): string {
  return PUZZLE_EVENTS.find((event) => event.id === eventId)?.label ?? eventId;
}
