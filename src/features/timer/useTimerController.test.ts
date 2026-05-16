import { describe, expect, test } from "vite-plus/test";
import { stoppedTimerSnapshot } from "./useTimerController";

describe("timer stop state", () => {
  test("keeps the stopped solve time visible while returning to idle", () => {
    expect(stoppedTimerSnapshot(12_345)).toEqual({ stage: "idle", elapsedMs: 12_345 });
  });
});
