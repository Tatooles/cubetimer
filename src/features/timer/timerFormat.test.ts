import { describe, expect, test } from "vite-plus/test";
import { formatTimerTime, formatSolveTime } from "./timerFormat";

describe("timer formatting", () => {
  test("formats active timer milliseconds with fixed hundredths", () => {
    expect(formatTimerTime(0)).toBe("0.00");
    expect(formatTimerTime(9876)).toBe("9.87");
    expect(formatTimerTime(65_432)).toBe("1:05.43");
  });

  test("formats recorded solves with penalties", () => {
    expect(formatSolveTime(12_340, "OK")).toBe("12.34");
    expect(formatSolveTime(12_340, "+2")).toBe("14.34+");
    expect(formatSolveTime(12_340, "DNF")).toBe("DNF");
  });
});
