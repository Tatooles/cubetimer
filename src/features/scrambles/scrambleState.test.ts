import { describe, expect, test } from "vite-plus/test";
import { defaultAppState } from "../sessions/sessionStore";
import type { AppState } from "../sessions/types";
import { applyScrambleResult } from "./scrambleState";

describe("scramble result state", () => {
  test("clears the previous scramble when generation fails", () => {
    const state = {
      ...defaultAppState(),
      currentScramble: "old 333 scramble",
      eventId: "444",
    } satisfies AppState;

    expect(
      applyScrambleResult(state, {
        error: "offline",
      }).currentScramble,
    ).toBe("");
  });
});
