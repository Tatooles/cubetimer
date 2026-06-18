import { describe, expect, test } from "vite-plus/test";
import {
  TRAINING_STORAGE_KEY,
  defaultTrainingState,
  loadTrainingState,
  recordCrossAttempt,
  recordAlgorithmTime,
  saveTrainingState,
  updateAlgorithmSettings,
  updateCrossSettings,
  sanitizeTrainingState,
} from "./trainingStore";

function createStorage(initial: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(initial));

  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.has(key) ? values.get(key)! : null;
    },
    key(index: number) {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  } as Storage;
}

function withThrowingLocalStorage(callback: () => void): void {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      throw new Error("SecurityError");
    },
  });

  try {
    callback();
  } finally {
    if (descriptor) {
      Object.defineProperty(globalThis, "localStorage", descriptor);
    } else {
      delete (globalThis as { localStorage?: unknown }).localStorage;
    }
  }
}

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

  test("merges algorithm subsets with defaults and rejects invalid subset payloads", () => {
    const state = sanitizeTrainingState({
      algorithms: {
        settings: {
          activeSetId: "PLL",
          mode: "subset",
          subsets: {
            PLL: ["T", "U"],
            OLL: "bad",
            EXTRA: ["nope"],
          },
        },
      },
    });

    expect(state.algorithms.settings.subsets).toEqual({
      OLL: [],
      PLL: ["T", "U"],
      COLL: [],
      ZBLL: [],
      LSLL: [],
      CLL2: [],
      PLL4: [],
    });
  });

  test("rejects invalid history entries while keeping valid persisted data capped", () => {
    const state = sanitizeTrainingState({
      cross: {
        history: [
          null,
          {
            id: "bad-0",
            scramble: 123,
            solution: ["R"],
            moveCount: 2,
            rating: "good",
            flagged: true,
            xcross: false,
            timestamp: 1,
          },
          {
            id: "cross-1",
            scramble: "R U",
            solution: ["R", "U"],
            moveCount: 2,
            rating: "good",
            flagged: true,
            xcross: false,
            timestamp: 1,
            extra: "ignored",
          },
          {
            id: "cross-2",
            scramble: "R U2",
            solution: ["R", "U2"],
            moveCount: 2,
            rating: "okay",
            flagged: false,
            xcross: true,
            timestamp: 2,
          },
        ],
      },
      algorithms: {
        historyByCase: {
          T: [
            null,
            { setId: "PLL", caseId: "T", ms: "bad", timestamp: 1 },
            { setId: "PLL", caseId: "T", ms: 1111, timestamp: 2, extra: "ignored" },
          ],
          U: "bad",
        },
      },
    });

    expect(state.cross.history).toEqual([
      {
        id: "cross-1",
        scramble: "R U",
        solution: ["R", "U"],
        moveCount: 2,
        rating: "good",
        flagged: true,
        xcross: false,
        timestamp: 1,
      },
      {
        id: "cross-2",
        scramble: "R U2",
        solution: ["R", "U2"],
        moveCount: 2,
        rating: "okay",
        flagged: false,
        xcross: true,
        timestamp: 2,
      },
    ]);
    expect(state.algorithms.historyByCase).toEqual({
      T: [{ setId: "PLL", caseId: "T", ms: 1111, timestamp: 2 }],
    });
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

    expect(state.cross.settings.colors).toEqual(["white"]);
    expect(state.cross.history).toHaveLength(1);
    expect(state.cross.history[0].flagged).toBe(true);
  });

  test("updates cross settings immutably", () => {
    const base = defaultTrainingState();
    const snapshot = JSON.parse(JSON.stringify(base)) as typeof base;

    const next = updateCrossSettings(base, {
      colors: ["white", "red"],
    });

    expect(base).toEqual(snapshot);
    expect(next.cross.settings).toEqual({
      colors: ["white", "red"],
      moveTarget: 6,
      xcross: false,
      shortScramble: false,
    });
    expect(next.cross.settings).not.toBe(base.cross.settings);
    expect(next.cross).not.toBe(base.cross);
  });

  test("preserves omitted cross settings when patching colors", () => {
    const base = updateCrossSettings(defaultTrainingState(), {
      xcross: true,
      shortScramble: true,
    });

    const next = updateCrossSettings(base, {
      colors: ["red", "blue"],
    });

    expect(base.cross.settings).toEqual({
      colors: ["white"],
      moveTarget: 6,
      xcross: true,
      shortScramble: true,
    });
    expect(next.cross.settings).toEqual({
      colors: ["red", "blue"],
      moveTarget: 6,
      xcross: true,
      shortScramble: true,
    });
  });

  test("migrates legacy cross color and clamps basic cross target to 3 through 8", () => {
    const state = sanitizeTrainingState({
      cross: {
        settings: {
          color: "red",
          colors: ["bad", "white", "white", "blue"],
          moveTarget: 12,
          xcross: true,
        },
      },
    });

    expect(state.cross.settings.colors).toEqual(["white", "blue"]);
    expect(state.cross.settings.moveTarget).toBe(8);

    const legacyState = sanitizeTrainingState({
      cross: {
        settings: {
          color: "green",
          moveTarget: 2,
        },
      },
    });

    expect(legacyState.cross.settings.colors).toEqual(["green"]);
    expect(legacyState.cross.settings.moveTarget).toBe(3);

    const next = updateCrossSettings(defaultTrainingState(), {
      colors: [],
      moveTarget: 99,
    });

    expect(next.cross.settings.colors).toEqual(["white"]);
    expect(next.cross.settings.moveTarget).toBe(8);
  });

  test("updates algorithm settings and subsets immutably", () => {
    const base = defaultTrainingState();
    const snapshot = JSON.parse(JSON.stringify(base)) as typeof base;
    const baseWithCustomSubset = {
      ...base,
      algorithms: {
        ...base.algorithms,
        settings: {
          ...base.algorithms.settings,
          subsets: {
            ...base.algorithms.settings.subsets,
            OLL: ["existing"],
          },
        },
      },
    };

    const next = updateAlgorithmSettings(baseWithCustomSubset, {
      mode: "subset",
      activeSetId: "COLL",
      subsets: {
        PLL: ["T"],
        COLL: "bad",
        EXTRA: ["ignored"],
      } as Record<string, unknown>,
    });

    expect(base).toEqual(snapshot);
    expect(baseWithCustomSubset.algorithms.settings.subsets.OLL).toEqual(["existing"]);
    expect(next.algorithms.settings).toEqual({
      activeSetId: "COLL",
      mode: "subset",
      subsets: {
        OLL: ["existing"],
        PLL: ["T"],
        COLL: [],
        ZBLL: [],
        LSLL: [],
        CLL2: [],
        PLL4: [],
      },
    });
    expect(next.algorithms.settings).not.toBe(baseWithCustomSubset.algorithms.settings);
    expect(next.algorithms).not.toBe(baseWithCustomSubset.algorithms);
  });

  test("preserves omitted algorithm settings when patching subsets", () => {
    const base = updateAlgorithmSettings(defaultTrainingState(), {
      activeSetId: "COLL",
      mode: "subset",
      subsets: {
        PLL: ["T"],
      },
    });

    const next = updateAlgorithmSettings(base, {
      subsets: {
        PLL: ["Ua"],
      },
    });

    expect(base.algorithms.settings).toEqual({
      activeSetId: "COLL",
      mode: "subset",
      subsets: {
        OLL: [],
        PLL: ["T"],
        COLL: [],
        ZBLL: [],
        LSLL: [],
        CLL2: [],
        PLL4: [],
      },
    });
    expect(next.algorithms.settings).toEqual({
      activeSetId: "COLL",
      mode: "subset",
      subsets: {
        OLL: [],
        PLL: ["Ua"],
        COLL: [],
        ZBLL: [],
        LSLL: [],
        CLL2: [],
        PLL4: [],
      },
    });
  });

  test("caps cross attempt history at 100 and keeps previous state immutable", () => {
    const base = {
      ...defaultTrainingState(),
      cross: {
        ...defaultTrainingState().cross,
        history: Array.from({ length: 100 }, (_, index) => ({
          id: `cross-${index}`,
          scramble: "R U",
          solution: ["R", "U"],
          moveCount: 2,
          rating: "good" as const,
          flagged: false,
          xcross: false,
          timestamp: index,
        })),
      },
    };

    const next = recordCrossAttempt(base, {
      id: "cross-100",
      scramble: "R U2",
      solution: ["R", "U2"],
      moveCount: 2,
      rating: "okay",
      flagged: true,
      xcross: true,
      timestamp: 100,
    });

    expect(base.cross.history).toHaveLength(100);
    expect(next.cross.history).toHaveLength(100);
    expect(next.cross.history[0].id).toBe("cross-1");
    expect(next.cross.history[99].id).toBe("cross-100");
    expect(next.cross.history).not.toBe(base.cross.history);
  });

  test("records algorithm times by case with timestamps", () => {
    const state = recordAlgorithmTime(defaultTrainingState(), "PLL", "T", 1234, 10);

    expect(state.algorithms.historyByCase.T).toEqual([
      { setId: "PLL", caseId: "T", ms: 1234, timestamp: 10 },
    ]);
  });

  test("caps algorithm history at 50 and keeps previous state immutable", () => {
    const base = {
      ...defaultTrainingState(),
      algorithms: {
        ...defaultTrainingState().algorithms,
        historyByCase: {
          T: Array.from({ length: 50 }, (_, index) => ({
            setId: "PLL" as const,
            caseId: "T",
            ms: index,
            timestamp: index,
          })),
        },
      },
    };

    const next = recordAlgorithmTime(base, "PLL", "T", 50, 50);

    expect(base.algorithms.historyByCase.T).toHaveLength(50);
    expect(next.algorithms.historyByCase.T).toHaveLength(50);
    expect(next.algorithms.historyByCase.T[0].timestamp).toBe(1);
    expect(next.algorithms.historyByCase.T[49].timestamp).toBe(50);
    expect(next.algorithms.historyByCase.T).not.toBe(base.algorithms.historyByCase.T);
  });

  test("loads malformed local storage payloads as defaults", () => {
    const storage = createStorage({
      [TRAINING_STORAGE_KEY]: "{",
    });

    expect(loadTrainingState(storage)).toEqual(defaultTrainingState());
  });

  test("does not throw when ambient localStorage getter throws on load", () => {
    withThrowingLocalStorage(() => {
      expect(() => loadTrainingState()).not.toThrow();
    });
  });

  test("does not throw when ambient localStorage getter throws on save", () => {
    withThrowingLocalStorage(() => {
      expect(() => saveTrainingState(defaultTrainingState())).not.toThrow();
    });
  });

  test("saves and loads the training state through storage", () => {
    const storage = createStorage();
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

    saveTrainingState(state, storage);

    expect(storage.getItem(TRAINING_STORAGE_KEY)).toBe(JSON.stringify(state));
    expect(loadTrainingState(storage)).toEqual(state);
  });
});
