import { describe, expect, test } from "vite-plus/test";
import { PUZZLE_EVENTS, mapPuzzleEventToCubingEvent } from "./eventMap";

describe("event mapping", () => {
  test("maps app event ids to cubing event ids", () => {
    expect(mapPuzzleEventToCubingEvent("333")).toBe("333");
    expect(mapPuzzleEventToCubingEvent("333oh")).toBe("333");
    expect(mapPuzzleEventToCubingEvent("333bld")).toBe("333bf");
    expect(mapPuzzleEventToCubingEvent("pyra")).toBe("pyram");
    expect(mapPuzzleEventToCubingEvent("mega")).toBe("minx");
  });

  test("draws 3x3 BLD scrambles with wide-move capable cube rendering", () => {
    expect(PUZZLE_EVENTS.find((event) => event.id === "333bld")?.draw).toBe("cube3");
  });
});
