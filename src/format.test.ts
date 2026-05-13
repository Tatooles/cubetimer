import { describe, expect, it } from "vitest";
import { averageOf, bestOf, formatSolveTime, formatTime, meanOf } from "./format";
import type { Solve } from "./types";

function solve(timeMs: number, penalty: Solve["penalty"] = "none", index = 0): Solve {
  return {
    id: `solve-${index}`,
    sessionId: "session",
    eventId: "333",
    timeMs,
    penalty,
    scramble: "R U R' U'",
    createdAt: new Date(2026, 0, index + 1).toISOString(),
  };
}

describe("time formatting and stats", () => {
  it("formats centiseconds and minute times", () => {
    expect(formatTime(12340)).toBe("12.34");
    expect(formatTime(83450)).toBe("1:23.45");
    expect(formatSolveTime(12000, "+2")).toBe("14.00+");
    expect(formatSolveTime(12000, "DNF")).toBe("DNF");
  });

  it("computes best, mean, and trimmed averages with penalties", () => {
    const solves = [solve(10000, "none", 0), solve(12000, "+2", 1), solve(9000, "none", 2), solve(15000, "none", 3), solve(11000, "none", 4)];

    expect(bestOf(solves)).toBe("9.00");
    expect(meanOf(solves)).toBe("11.80");
    expect(averageOf(solves, 5)).toBe("11.66");
  });

  it("requires enough solves for an average and treats multiple DNFs as DNF", () => {
    expect(averageOf([solve(10000)], 5)).toBe("-");
    expect(averageOf([solve(10000), solve(12000), solve(11000, "DNF"), solve(9000, "DNF"), solve(13000)], 5)).toBe("DNF");
  });
});
