import { describe, expect, test } from "vite-plus/test";
import { defaultAppState } from "../sessions/sessionStore";
import type { AppState } from "../sessions/types";
import { applyScrambleResult } from "./scrambleState";

describe("scramble result state", () => {
  test("applies fallback scramble from an errored result over the previous scramble", () => {
    const state = {
      ...defaultAppState(),
      currentScramble: "old 333 scramble",
      eventId: "444",
    } satisfies AppState;

    expect(
      applyScrambleResult(state, {
        scramble: "fallback 444 scramble",
        error: "offline",
      }).currentScramble,
    ).toBe("fallback 444 scramble");
  });
});
