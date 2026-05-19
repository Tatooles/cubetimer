import { describe, expect, test } from "vite-plus/test";
import { canApplyScrambleResult, hasReadyScramble } from "./scrambleGuards";

describe("scramble guards", () => {
  test("only treats a non-empty settled scramble as ready", () => {
    expect(hasReadyScramble("R U R'", false)).toBe(true);
    expect(hasReadyScramble("   ", false)).toBe(false);
    expect(hasReadyScramble("R U R'", true)).toBe(false);
  });

  test("rejects stale scramble responses and event mismatches", () => {
    expect(
      canApplyScrambleResult({
        requestId: 2,
        latestRequestId: 2,
        requestedEventId: "333",
        currentEventId: "333",
      }),
    ).toBe(true);

    expect(
      canApplyScrambleResult({
        requestId: 1,
        latestRequestId: 2,
        requestedEventId: "333",
        currentEventId: "333",
      }),
    ).toBe(false);

    expect(
      canApplyScrambleResult({
        requestId: 2,
        latestRequestId: 2,
        requestedEventId: "222",
        currentEventId: "333",
      }),
    ).toBe(false);
  });
});
