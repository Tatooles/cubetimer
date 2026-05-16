// @vitest-environment jsdom
import { describe, expect, it } from "vite-plus/test";
import { importTimerData, loadData, saveData } from "./storage";
import type { TimerData } from "./types";

describe("timer data storage", () => {
  it("preserves supported custom stored session event ids", () => {
    localStorage.setItem(
      "cubetimer:data",
      JSON.stringify({
        version: 1,
        activeSessionId: "session-1",
        sessions: [
          {
            id: "session-1",
            name: "Main session",
            eventId: "333-lsll",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        solves: [],
      }),
    );

    expect(loadData().sessions[0].eventId).toBe("333-lsll");
  });

  it("preserves supported custom imported session and solve event ids", async () => {
    const file = new File(
      [
        JSON.stringify({
          version: 1,
          activeSessionId: "session-1",
          sessions: [
            {
              id: "session-1",
              name: "Main session",
              eventId: "333-lsll",
              createdAt: "2026-01-01T00:00:00.000Z",
            },
          ],
          solves: [
            {
              id: "solve-1",
              sessionId: "session-1",
              eventId: "333-lsll",
              timeMs: 1000,
              penalty: "none",
              scramble: "R U R'",
              createdAt: "2026-01-01T00:00:00.000Z",
            },
          ],
        }),
      ],
      "cubetimer.json",
      { type: "application/json" },
    );

    const data = await importTimerData(file);

    expect(data.sessions[0].eventId).toBe("333-lsll");
    expect(data.solves[0].eventId).toBe("333-lsll");
  });

  it("normalizes unknown stored event ids to the default event", () => {
    localStorage.setItem(
      "cubetimer:data",
      JSON.stringify({
        version: 1,
        activeSessionId: "session-1",
        sessions: [
          {
            id: "session-1",
            name: "Main session",
            eventId: "renamed-event",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        solves: [
          {
            id: "solve-1",
            sessionId: "session-1",
            eventId: "renamed-event",
            timeMs: 1000,
            penalty: "none",
            scramble: "R U R'",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      }),
    );

    const data = loadData();

    expect(data.sessions[0].eventId).toBe("333");
    expect(data.solves[0].eventId).toBe("333");
  });

  it("persists normalized data", () => {
    const data: TimerData = {
      version: 1,
      activeSessionId: "session-1",
      sessions: [
        {
          id: "session-1",
          name: "Main session",
          eventId: "333",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      solves: [],
    };

    saveData(data);

    expect(JSON.parse(localStorage.getItem("cubetimer:data") ?? "{}")).toEqual(data);
  });
});
