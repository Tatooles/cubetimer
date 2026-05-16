import { describe, expect, test } from "vite-plus/test";
import { solvesToCsv } from "./csvExport";
import type { Solve } from "./types";

describe("CSV export", () => {
  test("exports solves with escaped comments and scrambles", () => {
    const solves: Solve[] = [
      {
        id: "1",
        ms: 12_340,
        eventId: "333",
        scramble: "R U R'",
        timestamp: Date.UTC(2026, 4, 16, 12, 0, 0),
        penalty: "+2",
        comment: 'fast, but "messy"',
      },
    ];

    expect(solvesToCsv(solves)).toContain(
      '1,14.34,+2,333,"R U R\'","fast, but ""messy""",2026-05-16T12:00:00.000Z',
    );
  });
});
