import type { EventId } from "./types";

type EventDefinition = {
  id: EventId;
  name: string;
  shortName: string;
  scrambleLength: number;
  kind: "nxn" | "pyraminx" | "skewb" | "megaminx" | "square1" | "clock";
  size?: number;
  baseEventId?: EventId;
  group?: "WCA" | "3x3 training";
};

export const EVENTS: EventDefinition[] = [
  { id: "333", name: "3x3x3", shortName: "3x3", scrambleLength: 20, kind: "nxn", size: 3, group: "WCA" },
  {
    id: "333-lsll",
    name: "3x3x3 Last Slot + Last Layer",
    shortName: "LSLL",
    scrambleLength: 0,
    kind: "nxn",
    size: 3,
    baseEventId: "333",
    group: "3x3 training",
  },
  { id: "222", name: "2x2x2", shortName: "2x2", scrambleLength: 11, kind: "nxn", size: 2 },
  { id: "444", name: "4x4x4", shortName: "4x4", scrambleLength: 40, kind: "nxn", size: 4 },
  { id: "555", name: "5x5x5", shortName: "5x5", scrambleLength: 60, kind: "nxn", size: 5 },
  { id: "666", name: "6x6x6", shortName: "6x6", scrambleLength: 80, kind: "nxn", size: 6 },
  { id: "777", name: "7x7x7", shortName: "7x7", scrambleLength: 100, kind: "nxn", size: 7 },
  { id: "333oh", name: "3x3x3 One-Handed", shortName: "OH", scrambleLength: 20, kind: "nxn", size: 3 },
  { id: "333bf", name: "3x3x3 Blindfolded", shortName: "3BLD", scrambleLength: 20, kind: "nxn", size: 3 },
  { id: "pyram", name: "Pyraminx", shortName: "Pyra", scrambleLength: 11, kind: "pyraminx" },
  { id: "skewb", name: "Skewb", shortName: "Skewb", scrambleLength: 11, kind: "skewb" },
  { id: "minx", name: "Megaminx", shortName: "Mega", scrambleLength: 70, kind: "megaminx" },
  { id: "sq1", name: "Square-1", shortName: "SQ1", scrambleLength: 14, kind: "square1" },
  { id: "clock", name: "Clock", shortName: "Clock", scrambleLength: 0, kind: "clock" },
];

export function getEvent(eventId: EventId): EventDefinition {
  return EVENTS.find((event) => event.id === eventId) ?? EVENTS[0];
}
