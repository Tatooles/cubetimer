import { describe, expect, test } from "vite-plus/test";
import {
  TRAINING_STORAGE_KEY,
  defaultTrainingState,
  recordCrossAttempt,
  recordAlgorithmTime,
  sanitizeTrainingState,
} from "./trainingStore";

describe("training store", () => {
  test("uses storage separate from timer sessions", () => {
    expect(TRAINING_STORAGE_KEY).toBe("cube-timer-training-v1");
  });

  test("defaults to cross trainer with isolated history", () => {
    const state = defaultTrainingState();

    expect(state.activeTrainer).toBe("cross");
    expect(state.cross.history).toEqual([]);
    expect(state.algorithms.historyByCase).toEqual({});
    expect(state.algorithms.settings.activeSetId).toBe("PLL");
  });

  test("sanitizes malformed payloads", () => {
    expect(sanitizeTrainingState(null)).toEqual(defaultTrainingState());
    expect(sanitizeTrainingState({ activeTrainer: "bad" }).activeTrainer).toBe("cross");
  });

  test("records cross attempts without replacing settings", () => {
    const state = recordCrossAttempt(defaultTrainingState(), {
      id: "cross-1",
      scramble: "R U R'",
      solution: ["D", "L'"],
      moveCount: 2,
      rating: "good",
      flagged: true,
      xcross: false,
      timestamp: 1,
    });

    expect(state.cross.settings.color).toBe("white");
    expect(state.cross.history).toHaveLength(1);
    expect(state.cross.history[0].flagged).toBe(true);
  });

  test("records algorithm times by case with timestamps", () => {
    const state = recordAlgorithmTime(defaultTrainingState(), "PLL", "T", 1234, 10);

    expect(state.algorithms.historyByCase.T).toEqual([
      { setId: "PLL", caseId: "T", ms: 1234, timestamp: 10 },
    ]);
  });
});
