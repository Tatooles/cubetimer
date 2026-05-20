import { describe, expect, test } from "vite-plus/test";
import {
  createDemoAppState,
  defaultAppState,
  recordSolveInState,
  sanitizeState,
} from "./sessionStore";
import type { AppState } from "./types";

describe("session store defaults", () => {
  test("starts new users with an empty real session and no demo scramble", () => {
    const state = defaultAppState();

    expect(state.selectedSessionId).toBe("main");
    expect(state.sessions).toEqual([{ id: "main", name: "Main", solves: [] }]);
    expect(state.currentScramble).toBe("");
  });

  test("keeps an explicit demo state available for testing", () => {
    const state = createDemoAppState();

    expect(state.selectedSessionId).toBe("main");
    expect(state.sessions[0].solves).toHaveLength(50);
    expect(state.sessions[0].solves[0].id).toBe("demo-0");
    expect(state.currentScramble).toBe("R U R' F2 D L2 B' U2 R2 F D'");
  });

  test("preserves stored sessions and scramble without legacy cleanup", () => {
    const state = sanitizeState({
      ...defaultAppState(),
      currentScramble: "R U R' F2 D L2 B' U2 R2 F D'",
      sessions: [
        {
          id: "main",
          name: "Main",
          solves: [
            {
              id: "seed-0",
              ms: 12_410,
              eventId: "333",
              scramble: "R U R' F2 D L2 B' U2 R2 F D'",
              timestamp: 1,
              penalty: "OK",
            },
            {
              id: "real-solve",
              ms: 9_870,
              eventId: "333",
              scramble: "generated scramble",
              timestamp: 2,
              penalty: "OK",
            },
          ],
        },
        { id: "practice-oh", name: "OH practice", solves: [] },
        { id: "big-cubes", name: "Big cubes", solves: [] },
      ],
    } satisfies AppState);

    expect(state.sessions).toEqual([
      {
        id: "main",
        name: "Main",
        solves: [
          {
            id: "seed-0",
            ms: 12_410,
            eventId: "333",
            scramble: "R U R' F2 D L2 B' U2 R2 F D'",
            timestamp: 1,
            penalty: "OK",
          },
          {
            id: "real-solve",
            ms: 9_870,
            eventId: "333",
            scramble: "generated scramble",
            timestamp: 2,
            penalty: "OK",
          },
        ],
      },
      { id: "practice-oh", name: "OH practice", solves: [] },
      { id: "big-cubes", name: "Big cubes", solves: [] },
    ]);
    expect(state.currentScramble).toBe("R U R' F2 D L2 B' U2 R2 F D'");
  });

  test("falls back to default state for non-object storage payloads", () => {
    expect(sanitizeState(null)).toEqual(defaultAppState());
  });
});

describe("solve recording", () => {
  test("does not record solves before a scramble is available", () => {
    const state = defaultAppState();

    expect(recordSolveInState(state, 12_345).sessions[0].solves).toHaveLength(0);
  });
});
