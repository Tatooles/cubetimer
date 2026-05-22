import { describe, expect, test } from "vite-plus/test";
import { calculateAverage, effectiveSolveTime, sessionStats } from "./solveStats";
import type { Solve } from "./types";

function solve(ms: number, penalty: Solve["penalty"] = "OK"): Solve {
  return {
    id: String(ms),
    ms,
    eventId: "333",
    scramble: "R U R'",
    timestamp: ms,
    penalty,
  };
}

describe("solve stats", () => {
  test("applies penalties to effective solve time", () => {
    expect(effectiveSolveTime(solve(10_000))).toBe(10_000);
    expect(effectiveSolveTime(solve(10_000, "+2"))).toBe(12_000);
    expect(effectiveSolveTime(solve(10_000, "DNF"))).toBe(Number.POSITIVE_INFINITY);
  });

  test("calculates ao5 by trimming best and worst", () => {
    const solves = [solve(10_000), solve(11_000), solve(12_000), solve(13_000), solve(40_000)];
    expect(calculateAverage(solves, 5)).toBe(12_000);
  });

  test("returns DNF average when untrimmed DNFs remain", () => {
    const solves = [
      solve(10_000),
      solve(11_000),
      solve(12_000),
      solve(13_000, "DNF"),
      solve(14_000, "DNF"),
    ];
    expect(calculateAverage(solves, 5)).toBe(Number.POSITIVE_INFINITY);
  });

  test("computes current and best rolling session stats", () => {
    const solves = [
      solve(10_000),
      solve(11_000),
      solve(12_000),
      solve(13_000),
      solve(14_000),
      solve(9_000),
    ];
    const stats = sessionStats(solves);
    expect(stats.current.single).toBe(9_000);
    expect(stats.current.ao5).toBe(12_000);
    expect(stats.best.single).toBe(9_000);
    expect(stats.best.ao5).toBe(12_000);
    expect(stats.count).toBe(6);
  });
});
