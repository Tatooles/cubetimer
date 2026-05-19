import { describe, expect, test } from "vite-plus/test";
import {
  createDemoAppState,
  defaultAppState,
  migrateLegacyState,
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

  test("migrates legacy cubetimer data into the current app state", () => {
    const state = migrateLegacyState({
      event: "333oh",
      session: "archive",
      currentScramble: "U R F",
      sessions: {
        main: {
          name: "Main",
          solves: [
            {
              id: "legacy-main",
              ms: 12_340,
              scramble: "R U R'",
              ts: 1_700_000_000_000,
              penalty: null,
              event: "333",
            },
          ],
        },
        archive: {
          name: "Archive",
          solves: [
            {
              id: "legacy-archive",
              time: "9870",
              scramble: "F R U",
              timestamp: "2026-05-01T12:00:00.000Z",
              penalty: "+2",
              comment: "PB",
              eventId: "222",
            },
          ],
        },
      },
    });

    expect(state?.eventId).toBe("333oh");
    expect(state?.selectedSessionId).toBe("archive");
    expect(state?.currentScramble).toBe("U R F");
    expect(state?.sessions).toEqual([
      {
        id: "main",
        name: "Main",
        solves: [
          {
            id: "legacy-main",
            ms: 12_340,
            eventId: "333",
            scramble: "R U R'",
            timestamp: 1_700_000_000_000,
            penalty: "OK",
            comment: undefined,
          },
        ],
      },
      {
        id: "archive",
        name: "Archive",
        solves: [
          {
            id: "legacy-archive",
            ms: 9_870,
            eventId: "222",
            scramble: "F R U",
            timestamp: Date.parse("2026-05-01T12:00:00.000Z"),
            penalty: "+2",
            comment: "PB",
          },
        ],
      },
    ]);
  });

  test("groups top-level legacy solves by session id", () => {
    const state = migrateLegacyState({
      version: 1,
      activeSessionId: "session-oh",
      sessions: [
        {
          id: "session-main",
          name: "Main session",
          eventId: "333",
          createdAt: "2026-05-01T12:00:00.000Z",
        },
        {
          id: "session-oh",
          name: "OH",
          eventId: "333oh",
          createdAt: "2026-05-02T12:00:00.000Z",
        },
      ],
      solves: [
        {
          id: "solve-main",
          sessionId: "session-main",
          eventId: "333",
          timeMs: 12_340,
          penalty: "none",
          scramble: "R U R'",
          createdAt: "2026-05-03T12:00:00.000Z",
        },
        {
          id: "solve-oh",
          sessionId: "session-oh",
          eventId: "333bf",
          timeMs: 45_670,
          penalty: "DNF",
          scramble: "F R U",
          createdAt: "2026-05-04T12:00:00.000Z",
          note: "blind attempt",
        },
      ],
    });

    expect(state?.selectedSessionId).toBe("session-oh");
    expect(state?.sessions).toEqual([
      {
        id: "session-main",
        name: "Main session",
        solves: [
          {
            id: "solve-main",
            ms: 12_340,
            eventId: "333",
            scramble: "R U R'",
            timestamp: Date.parse("2026-05-03T12:00:00.000Z"),
            penalty: "OK",
            comment: undefined,
          },
        ],
      },
      {
        id: "session-oh",
        name: "OH",
        solves: [
          {
            id: "solve-oh",
            ms: 45_670,
            eventId: "333bld",
            scramble: "F R U",
            timestamp: Date.parse("2026-05-04T12:00:00.000Z"),
            penalty: "DNF",
            comment: "blind attempt",
          },
        ],
      },
    ]);
  });
});
