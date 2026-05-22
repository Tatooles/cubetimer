import { describe, expect, test } from "vite-plus/test";
import { progressSeries } from "./chartSeries";
import type { Solve } from "../sessions/types";

function solve(ms: number): Solve {
  return {
    id: String(ms),
    ms,
    eventId: "333",
    scramble: "R U R'",
    timestamp: ms,
    penalty: "OK",
  };
}

describe("chart series", () => {
  test("prepares single, ao5, and ao12 values by solve index", () => {
    const series = progressSeries([
      solve(10_000),
      solve(11_000),
      solve(12_000),
      solve(13_000),
      solve(14_000),
    ]);

    expect(series).toHaveLength(5);
    expect(series[0]).toMatchObject({ index: 1, single: 10 });
    expect(series[4]).toMatchObject({ index: 5, single: 14, ao5: 12 });
    expect(series[4].ao12).toBeNull();
  });
});
