import { describe, expect, test } from "vite-plus/test";
import { mapPuzzleEventToCubingEvent } from "./eventMap";

describe("event mapping", () => {
  test("maps app event ids to cubing event ids", () => {
    expect(mapPuzzleEventToCubingEvent("333")).toBe("333");
    expect(mapPuzzleEventToCubingEvent("333oh")).toBe("333");
    expect(mapPuzzleEventToCubingEvent("333bld")).toBe("333bf");
    expect(mapPuzzleEventToCubingEvent("pyra")).toBe("pyram");
    expect(mapPuzzleEventToCubingEvent("mega")).toBe("minx");
  });
});
