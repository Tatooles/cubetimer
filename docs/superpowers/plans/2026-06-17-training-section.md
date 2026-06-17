# Training Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a native React Training tab with Cross/XCross and Algorithm trainers while preserving the current Timer/session page except for top-level navigation.

**Architecture:** Keep the app as a single-page application with local state selecting `timer` or `training`; do not add a routing library. Extract the current timer shell into `TimerPage` only as a behavior-preserving boundary, then implement Training under `src/features/training` with isolated storage, domain helpers, desktop Workbench layout, and mobile drawer/sheet surfaces.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Vite+, `vite-plus/test`, Radix/Vaul shared primitives, existing `useTimerController`, existing scramble/cube-net utilities, existing localStorage helpers.

---

## File Structure

### Create

- `src/features/timer/TimerPage.tsx`  
  Behavior-preserving home for the current Timer/session surface extracted from `App.tsx`.

- `src/features/training/types.ts`  
  Shared Training type definitions.

- `src/features/training/trainingStore.ts`  
  Training defaults, sanitization, localStorage key, reducer-style update helpers.

- `src/features/training/trainingStore.test.ts`  
  Storage and state transition tests.

- `src/features/training/crossTrainer.ts`  
  Cross scramble helpers and deterministic mocked cross solver.

- `src/features/training/crossTrainer.test.ts`  
  Mock solver and cross history tests.

- `src/features/training/algorithmCatalog.ts`  
  Algorithm set data and default subset selection.

- `src/features/training/algorithmTrainer.ts`  
  Algorithm rotation, subset filtering, timing record, best/ao5 helpers.

- `src/features/training/algorithmTrainer.test.ts`  
  Algorithm subset and per-case stat tests.

- `src/features/training/TrainingPage.tsx`  
  Training page state owner and desktop/mobile layout composition.

- `src/features/training/TrainingHeader.tsx`  
  Cross/Algorithms segmented trainer picker.

- `src/features/training/TrainingSidebar.tsx`  
  Cross history or algorithm rotation rail.

- `src/features/training/CrossTrainer.tsx`  
  Cross/XCross center surface.

- `src/features/training/CrossSettings.tsx`  
  Cross settings rail/sheet content.

- `src/features/training/AlgorithmTrainer.tsx`  
  Algorithm trainer center surface and timer.

- `src/features/training/AlgorithmSettings.tsx`  
  Algorithm settings rail/sheet content.

- `src/features/training/SubsetEditor.tsx`  
  Modal/drawer body for subset selection.

- `src/features/training/TrainingMobileNav.tsx`  
  Training-specific mobile bottom nav.

- `src/features/training/TrainingPage.test.tsx`  
  Source/component contract tests for Training composition.

### Modify

- `src/App.tsx`  
  Own top-level `activeSection` state and render `TimerPage` or `TrainingPage`.

- `src/App.test.tsx`  
  Update source tests to assert top-level tabs and no routing library.

- `src/features/mobile/MobileNav.tsx` only if the existing `MobileSheetId` type needs to stay Timer-specific. Prefer leaving it unchanged.

- `src/index.css` only for global Training mobile overflow classes that cannot be expressed cleanly in Tailwind. Prefer component-local Tailwind classes first.

---

## Task 1: Extract TimerPage And Add Local Top-Level Navigation

**Files:**
- Create: `src/features/timer/TimerPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Write the failing App source tests**

Replace the relevant top-level navigation assertions in `src/App.test.tsx` with these tests while preserving existing keyboard and mobile panel tests:

```ts
describe("App top-level sections", () => {
  test("uses local state for Timer and Training instead of a routing library", () => {
    expect(appSource).toContain('useState<"timer" | "training">("timer")');
    expect(appSource).toContain('activeSection === "timer"');
    expect(appSource).toContain('activeSection === "training"');
    expect(appSource).not.toContain("react-router");
    expect(appSource).not.toContain("createBrowserRouter");
    expect(appSource).not.toContain("RouterProvider");
  });

  test("renders top-level Timer and Training tabs without Profile", () => {
    expect(appSource).toContain(">Timer<");
    expect(appSource).toContain(">Training<");
    expect(appSource).not.toContain("Profile");
  });
});
```

- [ ] **Step 2: Run the App tests to verify they fail**

Run:

```bash
vp test src/App.test.tsx
```

Expected: FAIL because `App.tsx` does not yet contain top-level Timer/Training section state or Training tab content.

- [ ] **Step 3: Extract the current App body into `TimerPage`**

Move the current Timer/session logic from `App.tsx` into `src/features/timer/TimerPage.tsx`. Keep the component self-contained and export it:

```tsx
export function TimerPage() {
  // Move the current App state, effects, callbacks, keyboard handlers,
  // session sidebar, timer surface, mobile sheets, settings, shortcuts,
  // and solve detail modal here without changing behavior.
}
```

Do not change class names or component props while extracting. Keep `Module`, `initialAppState`, `updateSolveInState`, and `deleteSolveInState` in `TimerPage.tsx` unless a clean existing helper already owns them.

- [ ] **Step 4: Replace `App.tsx` with the top-level shell**

After extraction, `src/App.tsx` should import `TimerPage` and render a simple Training panel. This panel gives the top-level tab a working target before the full Training page is added in Task 5:

```tsx
import { useState } from "react";
import { TimerPage } from "./features/timer/TimerPage";

function App() {
  const [activeSection, setActiveSection] = useState<"timer" | "training">("timer");

  return (
    <div className="min-h-svh bg-[#0a0a0b] text-zinc-100">
      <div className="grid h-svh grid-rows-[56px_1fr] overflow-hidden">
        <header className="col-span-full flex items-center gap-4 border-b border-white/[0.07] px-4">
          <div className="flex min-w-0 shrink-0 items-center gap-2 overflow-hidden font-mono text-sm font-semibold">
            <span className="grid h-4.5 w-4.5 grid-cols-2 gap-px rounded bg-zinc-100 p-px">
              <span className="rounded-[1px] bg-indigo-400" />
              <span className="rounded-[1px] bg-black" />
              <span className="rounded-[1px] bg-black" />
              <span className="rounded-[1px] bg-black" />
            </span>
            <span>
              cube<span className="text-zinc-600">timer</span>
            </span>
          </div>
          <nav className="flex h-full items-stretch">
            <button
              type="button"
              onClick={() => setActiveSection("timer")}
              className={`relative px-4 text-sm font-medium ${
                activeSection === "timer" ? "text-indigo-200" : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              Timer
              {activeSection === "timer" ? (
                <span className="absolute inset-x-3 bottom-0 h-0.5 bg-indigo-300" />
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("training")}
              className={`relative px-4 text-sm font-medium ${
                activeSection === "training"
                  ? "text-indigo-200"
                  : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              Training
              {activeSection === "training" ? (
                <span className="absolute inset-x-3 bottom-0 h-0.5 bg-indigo-300" />
              ) : null}
            </button>
          </nav>
        </header>
        <main className="min-h-0">
          {activeSection === "timer" ? (
            <TimerPage embedded />
          ) : (
            <section className="flex h-full items-center justify-center text-zinc-500">
              Training
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
```

Add an optional `embedded?: boolean` prop to `TimerPage` so it can omit its old outermost app background wrapper and fit under the new top-level header.

- [ ] **Step 5: Run focused tests**

Run:

```bash
vp test src/App.test.tsx src/features/timer/useTimerController.test.ts
```

Expected: PASS. If the extraction changes the Timer mobile layout, stop and restore the original Timer markup under `TimerPage`.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/App.test.tsx src/features/timer/TimerPage.tsx
git commit -m "Extract timer page behind app sections"
```

---

## Task 2: Add Training Types And Store

**Files:**
- Create: `src/features/training/types.ts`
- Create: `src/features/training/trainingStore.ts`
- Create: `src/features/training/trainingStore.test.ts`

- [ ] **Step 1: Write failing store tests**

Create `src/features/training/trainingStore.test.ts`:

```ts
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
    expect(state.algorithms.activeSetId).toBe("PLL");
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
vp test src/features/training/trainingStore.test.ts
```

Expected: FAIL because Training store files do not exist.

- [ ] **Step 3: Add Training types**

Create `src/features/training/types.ts`:

```ts
export type TrainingMode = "cross" | "algorithms";
export type CrossColor = "white" | "yellow" | "green" | "blue" | "red" | "orange";
export type CrossRating = "good" | "okay" | "missed";
export type RevealMode = "one" | "all";
export type AlgorithmSetId = "OLL" | "PLL" | "COLL" | "ZBLL" | "LSLL" | "CLL2" | "PLL4";
export type AlgorithmMode = "drill" | "subset";

export type CrossSettings = {
  color: CrossColor;
  moveTarget: number;
  xcross: boolean;
  shortScramble: boolean;
  inspection: boolean;
  revealMode: RevealMode;
};

export type CrossAttempt = {
  id: string;
  scramble: string;
  solution: string[];
  moveCount: number;
  rating: CrossRating;
  flagged: boolean;
  xcross: boolean;
  timestamp: number;
};

export type AlgorithmTime = {
  setId: AlgorithmSetId;
  caseId: string;
  ms: number;
  timestamp: number;
};

export type AlgorithmSettings = {
  activeSetId: AlgorithmSetId;
  mode: AlgorithmMode;
  subsets: Record<AlgorithmSetId, string[]>;
};

export type TrainingState = {
  activeTrainer: TrainingMode;
  cross: {
    settings: CrossSettings;
    history: CrossAttempt[];
  };
  algorithms: {
    settings: AlgorithmSettings;
    historyByCase: Record<string, AlgorithmTime[]>;
  };
};
```

- [ ] **Step 4: Add store implementation**

Create `src/features/training/trainingStore.ts`:

```ts
import type {
  AlgorithmSetId,
  AlgorithmTime,
  CrossAttempt,
  CrossColor,
  TrainingMode,
  TrainingState,
} from "./types";

export const TRAINING_STORAGE_KEY = "cube-timer-training-v1";

const SET_IDS: AlgorithmSetId[] = ["OLL", "PLL", "COLL", "ZBLL", "LSLL", "CLL2", "PLL4"];
const CROSS_COLORS: CrossColor[] = ["white", "yellow", "green", "blue", "red", "orange"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTrainingMode(value: unknown): value is TrainingMode {
  return value === "cross" || value === "algorithms";
}

function isAlgorithmSetId(value: unknown): value is AlgorithmSetId {
  return typeof value === "string" && SET_IDS.includes(value as AlgorithmSetId);
}

function clampMoveTarget(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(12, Math.max(4, Math.round(value)))
    : 8;
}

export function defaultTrainingState(): TrainingState {
  return {
    activeTrainer: "cross",
    cross: {
      settings: {
        color: "white",
        moveTarget: 8,
        xcross: false,
        shortScramble: false,
        inspection: false,
        revealMode: "one",
      },
      history: [],
    },
    algorithms: {
      settings: {
        activeSetId: "PLL",
        mode: "drill",
        subsets: {
          OLL: [],
          PLL: ["T", "Jb", "Ua", "Ub", "H", "Z", "Y"],
          COLL: [],
          ZBLL: [],
          LSLL: [],
          CLL2: [],
          PLL4: [],
        },
      },
      historyByCase: {},
    },
  };
}

export function sanitizeTrainingState(value: unknown): TrainingState {
  const fallback = defaultTrainingState();
  if (!isRecord(value)) {
    return fallback;
  }

  const cross = isRecord(value.cross) ? value.cross : {};
  const crossSettings = isRecord(cross.settings) ? cross.settings : {};
  const algorithms = isRecord(value.algorithms) ? value.algorithms : {};
  const algorithmSettings = isRecord(algorithms.settings) ? algorithms.settings : {};
  const activeSetId = isAlgorithmSetId(algorithmSettings.activeSetId)
    ? algorithmSettings.activeSetId
    : fallback.algorithms.settings.activeSetId;

  return {
    activeTrainer: isTrainingMode(value.activeTrainer) ? value.activeTrainer : fallback.activeTrainer,
    cross: {
      settings: {
        color: CROSS_COLORS.includes(crossSettings.color as CrossColor)
          ? (crossSettings.color as CrossColor)
          : fallback.cross.settings.color,
        moveTarget: clampMoveTarget(crossSettings.moveTarget),
        xcross: crossSettings.xcross === true,
        shortScramble: crossSettings.shortScramble === true,
        inspection: crossSettings.inspection === true,
        revealMode: crossSettings.revealMode === "all" ? "all" : "one",
      },
      history: Array.isArray(cross.history) ? (cross.history as CrossAttempt[]) : [],
    },
    algorithms: {
      settings: {
        activeSetId,
        mode: algorithmSettings.mode === "subset" ? "subset" : "drill",
        subsets: {
          ...fallback.algorithms.settings.subsets,
          ...(isRecord(algorithmSettings.subsets) ? algorithmSettings.subsets : {}),
        } as TrainingState["algorithms"]["settings"]["subsets"],
      },
      historyByCase: isRecord(algorithms.historyByCase)
        ? (algorithms.historyByCase as Record<string, AlgorithmTime[]>)
        : {},
    },
  };
}

export function recordCrossAttempt(state: TrainingState, attempt: CrossAttempt): TrainingState {
  return {
    ...state,
    cross: {
      ...state.cross,
      history: [...state.cross.history, attempt].slice(-100),
    },
  };
}

export function recordAlgorithmTime(
  state: TrainingState,
  setId: AlgorithmSetId,
  caseId: string,
  ms: number,
  timestamp = Date.now(),
): TrainingState {
  const nextTime: AlgorithmTime = { setId, caseId, ms, timestamp };
  return {
    ...state,
    algorithms: {
      ...state.algorithms,
      historyByCase: {
        ...state.algorithms.historyByCase,
        [caseId]: [...(state.algorithms.historyByCase[caseId] ?? []), nextTime].slice(-50),
      },
    },
  };
}
```

- [ ] **Step 5: Run store tests**

Run:

```bash
vp test src/features/training/trainingStore.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/training/types.ts src/features/training/trainingStore.ts src/features/training/trainingStore.test.ts
git commit -m "Add training state store"
```

---

## Task 3: Add Cross Trainer Domain Helpers

**Files:**
- Create: `src/features/training/crossTrainer.ts`
- Create: `src/features/training/crossTrainer.test.ts`

- [ ] **Step 1: Write failing cross helper tests**

Create `src/features/training/crossTrainer.test.ts`:

```ts
import { describe, expect, test } from "vite-plus/test";
import { generateCrossScramble, mockCrossSolution, toggleCrossFlag } from "./crossTrainer";
import type { CrossAttempt, CrossSettings } from "./types";

const settings: CrossSettings = {
  color: "white",
  moveTarget: 8,
  xcross: false,
  shortScramble: false,
  inspection: false,
  revealMode: "one",
};

describe("cross trainer helpers", () => {
  test("generates shorter scrambles for short mode", () => {
    expect(generateCrossScramble({ short: true }).split(/\s+/)).toHaveLength(15);
    expect(generateCrossScramble({ short: false }).split(/\s+/)).toHaveLength(20);
  });

  test("mock solution is deterministic for scramble and settings", () => {
    const first = mockCrossSolution("R U R' F2", settings);
    const second = mockCrossSolution("R U R' F2", settings);

    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThanOrEqual(4);
    expect(first.length).toBeLessThanOrEqual(8);
  });

  test("xcross can produce a longer mocked solution", () => {
    const cross = mockCrossSolution("R U R' F2", settings);
    const xcross = mockCrossSolution("R U R' F2", { ...settings, xcross: true });

    expect(xcross.length).toBeGreaterThanOrEqual(cross.length);
  });

  test("toggles flag on matching current scramble attempt", () => {
    const history: CrossAttempt[] = [
      {
        id: "a",
        scramble: "R U",
        solution: ["D"],
        moveCount: 1,
        rating: "good",
        flagged: false,
        xcross: false,
        timestamp: 1,
      },
    ];

    expect(toggleCrossFlag(history, "R U")[0].flagged).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
vp test src/features/training/crossTrainer.test.ts
```

Expected: FAIL because `crossTrainer.ts` does not exist.

- [ ] **Step 3: Implement cross helpers**

Create `src/features/training/crossTrainer.ts`:

```ts
import type { CrossAttempt, CrossSettings } from "./types";

const FACES = ["U", "D", "L", "R", "F", "B"] as const;
const MODIFIERS = ["", "'", "2"] as const;
const OPPOSITE: Record<string, string> = { U: "D", D: "U", L: "R", R: "L", F: "B", B: "F" };

function hashText(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomFromSeed(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateCrossScramble({ short }: { short: boolean }): string {
  const targetLength = short ? 15 : 20;
  const output: string[] = [];
  let last = "";
  let previous = "";

  while (output.length < targetLength) {
    const face = FACES[Math.floor(Math.random() * FACES.length)];
    if (face === last || (face === previous && last === OPPOSITE[face])) {
      continue;
    }
    output.push(`${face}${MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)]}`);
    previous = last;
    last = face;
  }

  return output.join(" ");
}

export function mockCrossSolution(scramble: string, settings: CrossSettings): string[] {
  const seed = hashText(
    `${scramble}|${settings.color}|${settings.moveTarget}|${settings.xcross ? "x" : "cross"}`,
  );
  const random = randomFromSeed(seed);
  const minMoves = settings.xcross ? 6 : 4;
  const maxMoves = Math.max(minMoves, settings.xcross ? settings.moveTarget + 3 : settings.moveTarget);
  const count = minMoves + Math.floor(random() * (maxMoves - minMoves + 1));
  const moves: string[] = [];
  let last = "";

  while (moves.length < count) {
    const face = FACES[Math.floor(random() * FACES.length)];
    if (face === last) {
      continue;
    }
    moves.push(`${face}${MODIFIERS[Math.floor(random() * MODIFIERS.length)]}`);
    last = face;
  }

  return moves;
}

export function toggleCrossFlag(history: CrossAttempt[], scramble: string): CrossAttempt[] {
  return history.map((attempt) =>
    attempt.scramble === scramble ? { ...attempt, flagged: !attempt.flagged } : attempt,
  );
}
```

- [ ] **Step 4: Run cross helper tests**

Run:

```bash
vp test src/features/training/crossTrainer.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/training/crossTrainer.ts src/features/training/crossTrainer.test.ts
git commit -m "Add mocked cross trainer helpers"
```

---

## Task 4: Add Algorithm Catalog And Trainer Helpers

**Files:**
- Create: `src/features/training/algorithmCatalog.ts`
- Create: `src/features/training/algorithmTrainer.ts`
- Create: `src/features/training/algorithmTrainer.test.ts`

- [ ] **Step 1: Write failing algorithm tests**

Create `src/features/training/algorithmTrainer.test.ts`:

```ts
import { describe, expect, test } from "vite-plus/test";
import { ALGORITHM_SETS } from "./algorithmCatalog";
import { algorithmStats, casesForMode, invertAlgorithm } from "./algorithmTrainer";
import { defaultTrainingState, recordAlgorithmTime } from "./trainingStore";

describe("algorithm trainer helpers", () => {
  test("ships the requested algorithm sets", () => {
    expect(Object.keys(ALGORITHM_SETS)).toEqual(["OLL", "PLL", "COLL", "ZBLL", "LSLL", "CLL2", "PLL4"]);
    expect(ALGORITHM_SETS.PLL.cases).toHaveLength(21);
  });

  test("filters cases in subset mode", () => {
    const state = defaultTrainingState();
    const cases = casesForMode(ALGORITHM_SETS.PLL, "subset", state.algorithms.settings.subsets.PLL);

    expect(cases.map((item) => item.id)).toEqual(["T", "Jb", "Ua", "Ub", "H", "Z", "Y"]);
  });

  test("inverts algorithms for setup text", () => {
    expect(invertAlgorithm("R U R' U2")).toBe("U2 R U' R'");
  });

  test("calculates best and ao5 for a case", () => {
    let state = defaultTrainingState();
    [1500, 1200, 1300, 1100, 1400].forEach((ms, index) => {
      state = recordAlgorithmTime(state, "PLL", "T", ms, index);
    });

    expect(algorithmStats(state.algorithms.historyByCase.T)).toEqual({
      last: 1400,
      best: 1100,
      ao5: 1300,
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
vp test src/features/training/algorithmTrainer.test.ts
```

Expected: FAIL because catalog/helper files do not exist.

- [ ] **Step 3: Implement catalog**

Create `src/features/training/algorithmCatalog.ts`. Start with exact PLL data and compact generated sample data for the other requested sets:

```ts
import type { AlgorithmSetId } from "./types";

export type AlgorithmCase = {
  id: string;
  group: string;
  name: string;
  description: string;
  algorithm: string;
};

export type AlgorithmSet = {
  id: AlgorithmSetId;
  label: string;
  puzzle: "2x2" | "3x3" | "4x4";
  cases: AlgorithmCase[];
};

const PLL_CASES: AlgorithmCase[] = [
  { id: "Aa", group: "A", name: "Aa", description: "3 corners clockwise", algorithm: "x R' U R' D2 R U' R' D2 R2" },
  { id: "Ab", group: "A", name: "Ab", description: "3 corners counter-clockwise", algorithm: "x R2 D2 R U R' D2 R U' R" },
  { id: "E", group: "E", name: "E", description: "Diagonal corner swap", algorithm: "x' R U' R' D R U R' D' R U R' D R U' R' D'" },
  { id: "F", group: "F", name: "F", description: "Adjacent swap", algorithm: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R" },
  { id: "Ga", group: "G", name: "Ga", description: "G permutation A", algorithm: "R2 U R' U R' U' R U' R2 U' D R' U R D'" },
  { id: "Gb", group: "G", name: "Gb", description: "G permutation B", algorithm: "R' U' R U D' R2 U R' U R U' R U' R2 D" },
  { id: "Gc", group: "G", name: "Gc", description: "G permutation C", algorithm: "R2 U' R U' R U R' U R2 U D' R U' R' D" },
  { id: "Gd", group: "G", name: "Gd", description: "G permutation D", algorithm: "R U R' U' D R2 U' R U' R' U R' U R2 D'" },
  { id: "H", group: "Edges", name: "H", description: "Opposite edge swap", algorithm: "M2 U M2 U2 M2 U M2" },
  { id: "Ja", group: "J", name: "Ja", description: "J permutation A", algorithm: "R' U L' U2 R U' R' U2 R L" },
  { id: "Jb", group: "J", name: "Jb", description: "J permutation B", algorithm: "R U R' F' R U R' U' R' F R2 U' R'" },
  { id: "Na", group: "N", name: "Na", description: "N permutation A", algorithm: "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'" },
  { id: "Nb", group: "N", name: "Nb", description: "N permutation B", algorithm: "R' U R U' R' F' U' F R U R' F R' F' R U' R" },
  { id: "Ra", group: "R", name: "Ra", description: "R permutation A", algorithm: "R U' R' U' R U R D R' U' R D' R' U2 R'" },
  { id: "Rb", group: "R", name: "Rb", description: "R permutation B", algorithm: "R' U2 R U2 R' F R U R' U' R' F' R2" },
  { id: "T", group: "T", name: "T", description: "T permutation", algorithm: "R U R' U' R' F R2 U' R' U' R U R' F'" },
  { id: "Ua", group: "U", name: "Ua", description: "U permutation A", algorithm: "M2 U M U2 M' U M2" },
  { id: "Ub", group: "U", name: "Ub", description: "U permutation B", algorithm: "M2 U' M U2 M' U' M2" },
  { id: "V", group: "V", name: "V", description: "V permutation", algorithm: "R' U R' U' y R' F' R2 U' R' U R' F R F" },
  { id: "Y", group: "Y", name: "Y", description: "Y permutation", algorithm: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
  { id: "Z", group: "Z", name: "Z", description: "Z permutation", algorithm: "M2 U M2 U M' U2 M2 U2 M'" },
];

function numberedCases(prefix: string, count: number, group: string): AlgorithmCase[] {
  return Array.from({ length: count }, (_, index) => {
    const n = String(index + 1).padStart(2, "0");
    return {
      id: `${prefix}${n}`,
      group,
      name: `${prefix} ${n}`,
      description: `${group} case ${index + 1}`,
      algorithm: "R U R' U' R' F R F'",
    };
  });
}

export const ALGORITHM_SETS: Record<AlgorithmSetId, AlgorithmSet> = {
  OLL: { id: "OLL", label: "OLL", puzzle: "3x3", cases: numberedCases("OLL", 57, "OLL") },
  PLL: { id: "PLL", label: "PLL", puzzle: "3x3", cases: PLL_CASES },
  COLL: { id: "COLL", label: "COLL", puzzle: "3x3", cases: numberedCases("COLL", 40, "COLL") },
  ZBLL: { id: "ZBLL", label: "ZBLL", puzzle: "3x3", cases: numberedCases("ZBLL", 72, "ZBLL sample") },
  LSLL: { id: "LSLL", label: "LS + LL", puzzle: "3x3", cases: numberedCases("LSLL", 72, "Last slot + last layer") },
  CLL2: { id: "CLL2", label: "2x2 CLL", puzzle: "2x2", cases: numberedCases("CLL", 42, "2x2 CLL") },
  PLL4: {
    id: "PLL4",
    label: "4x4 parity",
    puzzle: "4x4",
    cases: [
      { id: "OLL parity", group: "OLL", name: "OLL parity", description: "Single edge flip", algorithm: "r U2 x r U2 r U2 r' U2 l U2 r' U2 r U2 r' U2 r'" },
      { id: "PLL parity", group: "PLL", name: "PLL parity", description: "Two-edge swap", algorithm: "r2 U2 r2 Uw2 r2 Uw2" },
      { id: "OLL+PLL", group: "Both", name: "OLL+PLL", description: "Combined parity", algorithm: "r U2 x r U2 r U2 r' U2 l U2 r' U2 r U2 r' U2 r' U r2 U2 r2 Uw2 r2 Uw2" },
      { id: "Opposite edges", group: "PLL", name: "Opposite edges", description: "Diagonal edge swap", algorithm: "Uw2 Rw2 U2 2R2 U2 Rw2 Uw2" },
    ],
  },
};
```

- [ ] **Step 4: Implement algorithm helpers**

Create `src/features/training/algorithmTrainer.ts`:

```ts
import type { AlgorithmCase, AlgorithmSet } from "./algorithmCatalog";
import type { AlgorithmMode, AlgorithmTime } from "./types";

export function casesForMode(
  set: AlgorithmSet,
  mode: AlgorithmMode,
  subset: string[],
): AlgorithmCase[] {
  if (mode === "drill") {
    return set.cases;
  }

  const selected = new Set(subset);
  return set.cases.filter((item) => selected.has(item.id));
}

export function invertAlgorithm(algorithm: string): string {
  return algorithm
    .split(/\s+/)
    .filter(Boolean)
    .reverse()
    .map((token) => {
      if (token.endsWith("'")) {
        return token.slice(0, -1);
      }
      if (token.endsWith("2")) {
        return token;
      }
      return `${token}'`;
    })
    .join(" ");
}

export function algorithmStats(times: AlgorithmTime[]): {
  last: number | null;
  best: number | null;
  ao5: number | null;
} {
  if (times.length === 0) {
    return { last: null, best: null, ao5: null };
  }

  const values = times.map((time) => time.ms);
  const last = values[values.length - 1];
  const best = Math.min(...values);
  const ao5 =
    values.length >= 5
      ? values
          .slice(-5)
          .sort((a, b) => a - b)
          .slice(1, 4)
          .reduce((sum, value) => sum + value, 0) / 3
      : null;

  return { last, best, ao5 };
}
```

- [ ] **Step 5: Run algorithm tests**

Run:

```bash
vp test src/features/training/algorithmTrainer.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/training/algorithmCatalog.ts src/features/training/algorithmTrainer.ts src/features/training/algorithmTrainer.test.ts
git commit -m "Add algorithm trainer catalog"
```

---

## Task 5: Add Training Page Shell, Header, Sidebar, And Mobile Nav

**Files:**
- Create: `src/features/training/TrainingPage.tsx`
- Create: `src/features/training/TrainingHeader.tsx`
- Create: `src/features/training/TrainingSidebar.tsx`
- Create: `src/features/training/TrainingMobileNav.tsx`
- Create: `src/features/training/TrainingPage.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write failing composition tests**

Create `src/features/training/TrainingPage.test.tsx`:

```ts
import { describe, expect, test } from "vite-plus/test";
import trainingPageSource from "./TrainingPage.tsx?raw";
import mobileNavSource from "./TrainingMobileNav.tsx?raw";

describe("TrainingPage composition", () => {
  test("uses Workbench rails and mobile sheet state", () => {
    expect(trainingPageSource).toContain("TrainingSidebar");
    expect(trainingPageSource).toContain("activeMobilePanel");
    expect(trainingPageSource).toContain("history");
    expect(trainingPageSource).toContain("settings");
  });

  test("keeps training mobile nav to history and settings only", () => {
    expect(mobileNavSource).toContain("History");
    expect(mobileNavSource).toContain("Settings");
    expect(mobileNavSource).not.toContain("Graph");
    expect(mobileNavSource).not.toContain("Session");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
vp test src/features/training/TrainingPage.test.tsx
```

Expected: FAIL because Training page components do not exist.

- [ ] **Step 3: Implement `TrainingHeader`**

Create `src/features/training/TrainingHeader.tsx`:

```tsx
import { Boxes, Crosshair } from "lucide-react";
import type { TrainingMode } from "./types";

type TrainingHeaderProps = {
  activeTrainer: TrainingMode;
  onTrainerChange: (trainer: TrainingMode) => void;
};

export function TrainingHeader({ activeTrainer, onTrainerChange }: TrainingHeaderProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-white/[0.07] bg-zinc-950 p-1">
      {[
        { id: "cross" as const, label: "Cross", icon: Crosshair },
        { id: "algorithms" as const, label: "Algorithms", icon: Boxes },
      ].map((item) => {
        const Icon = item.icon;
        const active = activeTrainer === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onTrainerChange(item.id)}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 font-mono text-[11px] transition ${
              active
                ? "bg-zinc-900 text-zinc-100 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]"
                : "text-zinc-500 hover:text-zinc-200"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Implement `TrainingMobileNav`**

Create `src/features/training/TrainingMobileNav.tsx`:

```tsx
import { History, Settings } from "lucide-react";

export type TrainingMobilePanel = "history" | "settings" | null;

type TrainingMobileNavProps = {
  active: TrainingMobilePanel;
  onSelect: (panel: TrainingMobilePanel) => void;
};

const ITEMS = [
  { id: "history" as const, label: "History", icon: History },
  { id: "settings" as const, label: "Settings", icon: Settings },
];

export function TrainingMobileNav({ active, onSelect }: TrainingMobileNavProps) {
  return (
    <nav className="relative z-50 grid h-16 grid-cols-2 border-t border-white/[0.07] bg-[#0a0a0b] pb-[env(safe-area-inset-bottom,0px)] md:hidden">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(active === item.id ? null : item.id)}
            className={`relative flex flex-col items-center justify-center gap-0.5 text-[10px] uppercase tracking-[0.12em] transition ${
              active === item.id ? "text-indigo-300" : "text-zinc-600 hover:text-zinc-100"
            }`}
          >
            {active === item.id ? (
              <span className="absolute top-0 h-0.5 w-6 rounded-b bg-indigo-300" />
            ) : null}
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 5: Implement Training shell with initial center content**

Create `src/features/training/TrainingPage.tsx` and `TrainingSidebar.tsx` with a working layout. The center panel should render the active trainer label in this task; Tasks 6 and 7 replace that label with the concrete Cross and Algorithm trainer surfaces.

`TrainingPage.tsx`:

```tsx
import { useEffect, useState } from "react";
import { readJson, writeJson } from "../../shared/storage/localStorageStore";
import { defaultTrainingState, sanitizeTrainingState, TRAINING_STORAGE_KEY } from "./trainingStore";
import { TrainingHeader } from "./TrainingHeader";
import { TrainingMobileNav, type TrainingMobilePanel } from "./TrainingMobileNav";
import { TrainingSidebar } from "./TrainingSidebar";
import type { TrainingMode, TrainingState } from "./types";

function initialTrainingState(): TrainingState {
  return sanitizeTrainingState(readJson(TRAINING_STORAGE_KEY, defaultTrainingState()));
}

export function TrainingPage() {
  const [state, setState] = useState<TrainingState>(initialTrainingState);
  const [activeMobilePanel, setActiveMobilePanel] = useState<TrainingMobilePanel>(null);

  useEffect(() => {
    writeJson(TRAINING_STORAGE_KEY, state);
  }, [state]);

  function setActiveTrainer(activeTrainer: TrainingMode) {
    setState((current) => ({ ...current, activeTrainer }));
    setActiveMobilePanel(null);
  }

  return (
    <div className="grid h-full min-w-0 grid-rows-[52px_1fr_64px] overflow-hidden md:grid-cols-[280px_minmax(0,1fr)_296px] md:grid-rows-[52px_1fr]">
      <header className="col-span-full flex min-w-0 items-center justify-between gap-3 border-b border-white/[0.07] px-4 md:px-6">
        <div className="min-w-0">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-600">
            Training
          </div>
        </div>
        <TrainingHeader activeTrainer={state.activeTrainer} onTrainerChange={setActiveTrainer} />
      </header>
      <TrainingSidebar
        state={state}
        className={`fixed inset-y-0 left-0 z-40 w-[min(360px,92vw)] border-r border-white/10 bg-[#0a0a0b] transition-transform md:static md:z-auto md:w-auto md:translate-x-0 ${
          activeMobilePanel === "history" ? "translate-x-0" : "-translate-x-full"
        }`}
      />
      <main className="min-w-0 overflow-y-auto p-3 md:p-6">
        <section className="flex min-h-60 items-center justify-center rounded-xl border border-dashed border-white/10 text-zinc-600">
          {state.activeTrainer === "cross" ? "Cross trainer" : "Algorithm trainer"}
        </section>
      </main>
      <aside
        className={`fixed inset-x-0 bottom-0 z-40 max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-zinc-950 p-5 transition-transform md:static md:max-h-none md:translate-y-0 md:rounded-none md:border-l md:border-t-0 ${
          activeMobilePanel === "settings" ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-600">
          Settings
        </div>
      </aside>
      {activeMobilePanel ? (
        <button
          type="button"
          aria-label="Close training panel"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setActiveMobilePanel(null)}
        />
      ) : null}
      <TrainingMobileNav active={activeMobilePanel} onSelect={setActiveMobilePanel} />
    </div>
  );
}
```

`TrainingSidebar.tsx`:

```tsx
import type { ComponentProps } from "react";
import type { TrainingState } from "./types";

type TrainingSidebarProps = ComponentProps<"aside"> & {
  state: TrainingState;
};

export function TrainingSidebar({ state, className, ...props }: TrainingSidebarProps) {
  const title = state.activeTrainer === "cross" ? "Cross history" : "In rotation";
  const count =
    state.activeTrainer === "cross"
      ? state.cross.history.length
      : state.algorithms.settings.subsets[state.algorithms.settings.activeSetId].length;

  return (
    <aside className={className} {...props}>
      <div className="border-b border-white/[0.07] px-6 py-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
          {title}
        </div>
        <div className="mt-1 font-mono text-[11px] text-zinc-500">{count} items</div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 6: Wire TrainingPage into App**

Modify `src/App.tsx`:

```tsx
import { TrainingPage } from "./features/training/TrainingPage";
```

Replace the simple Training panel with:

```tsx
<TrainingPage />
```

- [ ] **Step 7: Run focused tests**

Run:

```bash
vp test src/App.test.tsx src/features/training/TrainingPage.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx src/features/training/TrainingPage.tsx src/features/training/TrainingHeader.tsx src/features/training/TrainingSidebar.tsx src/features/training/TrainingMobileNav.tsx src/features/training/TrainingPage.test.tsx
git commit -m "Add training page shell"
```

---

## Task 6: Implement Cross Trainer UI And Settings

**Files:**
- Create: `src/features/training/CrossTrainer.tsx`
- Create: `src/features/training/CrossSettings.tsx`
- Modify: `src/features/training/TrainingPage.tsx`
- Modify: `src/features/training/TrainingSidebar.tsx`
- Modify: `src/features/training/TrainingPage.test.tsx`

- [ ] **Step 1: Add failing source tests for Cross UI**

Add to `TrainingPage.test.tsx`:

```ts
import crossTrainerSource from "./CrossTrainer.tsx?raw";
import crossSettingsSource from "./CrossSettings.tsx?raw";

describe("Cross trainer UI", () => {
  test("renders scoped controls from the design", () => {
    expect(crossTrainerSource).toContain("Reveal next move");
    expect(crossTrainerSource).toContain("How did that go?");
    expect(crossTrainerSource).toContain("Inspect");
    expect(crossSettingsSource).toContain("Cross color");
    expect(crossSettingsSource).toContain("Move target");
    expect(crossSettingsSource).toContain("XCross practice");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
vp test src/features/training/TrainingPage.test.tsx
```

Expected: FAIL because Cross UI files do not exist.

- [ ] **Step 3: Implement `CrossSettings`**

Create `src/features/training/CrossSettings.tsx`:

```tsx
import { Toggle } from "../../shared/components/Toggle";
import type { CrossColor, CrossSettings as CrossSettingsType } from "./types";

const COLORS: Array<{ id: CrossColor; label: string; value: string }> = [
  { id: "white", label: "White", value: "#f4f4f0" },
  { id: "yellow", label: "Yellow", value: "#facc15" },
  { id: "green", label: "Green", value: "#22c55e" },
  { id: "blue", label: "Blue", value: "#3b82f6" },
  { id: "red", label: "Red", value: "#ef4444" },
  { id: "orange", label: "Orange", value: "#f97316" },
];

type CrossSettingsProps = {
  settings: CrossSettingsType;
  onChange: (settings: CrossSettingsType) => void;
};

export function CrossSettings({ settings, onChange }: CrossSettingsProps) {
  function update<Key extends keyof CrossSettingsType>(key: Key, value: CrossSettingsType[Key]) {
    onChange({ ...settings, [key]: value });
  }

  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
          Cross color
        </h3>
        <div className="grid grid-cols-6 gap-2">
          {COLORS.map((color) => (
            <button
              key={color.id}
              type="button"
              aria-label={color.label}
              onClick={() => update("color", color.id)}
              className={`aspect-square rounded-md border ${
                settings.color === color.id ? "border-indigo-300" : "border-black/60"
              }`}
              style={{ background: color.value }}
            />
          ))}
        </div>
      </section>
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
            Move target
          </h3>
          <span className="font-mono text-xs text-zinc-300">≤ {settings.moveTarget}</span>
        </div>
        <input
          type="range"
          min={4}
          max={12}
          value={settings.moveTarget}
          onChange={(event) => update("moveTarget", Number(event.target.value))}
          className="w-full accent-indigo-300"
        />
      </section>
      <Toggle
        checked={settings.xcross}
        label="XCross practice"
        onChange={(checked) => update("xcross", checked)}
      />
      <Toggle
        checked={settings.shortScramble}
        label="Short scramble"
        onChange={(checked) => update("shortScramble", checked)}
      />
      <Toggle
        checked={settings.inspection}
        label="15s inspection"
        onChange={(checked) => update("inspection", checked)}
      />
      <div className="grid grid-cols-2 gap-1 rounded-md border border-white/[0.07] bg-black p-1">
        {[
          { id: "one" as const, label: "One at a time" },
          { id: "all" as const, label: "All at once" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => update("revealMode", item.id)}
            className={`rounded px-2 py-1.5 font-mono text-[11px] ${
              settings.revealMode === item.id ? "bg-zinc-900 text-zinc-100" : "text-zinc-600"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Implement `CrossTrainer`**

Create `src/features/training/CrossTrainer.tsx`:

```tsx
import { useMemo, useState } from "react";
import { ScrambleDraw } from "../scrambles/ScrambleDraw";
import { copyTextToClipboard } from "../../shared/clipboard/copyTextToClipboard";
import { generateCrossScramble, mockCrossSolution } from "./crossTrainer";
import type { CrossRating, CrossSettings } from "./types";

type CrossTrainerProps = {
  settings: CrossSettings;
  onRate: (rating: CrossRating, attempt: { scramble: string; solution: string[]; flagged: boolean }) => void;
};

export function CrossTrainer({ settings, onRate }: CrossTrainerProps) {
  const [scramble, setScramble] = useState(() =>
    generateCrossScramble({ short: settings.shortScramble }),
  );
  const [revealed, setRevealed] = useState(0);
  const [flagged, setFlagged] = useState(false);
  const solution = useMemo(() => mockCrossSolution(scramble, settings), [scramble, settings]);

  function nextScramble() {
    setScramble(generateCrossScramble({ short: settings.shortScramble }));
    setRevealed(0);
    setFlagged(false);
  }

  function revealNext() {
    setRevealed((current) => Math.min(solution.length, current + 1));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-zinc-500">
        <span className="rounded-full border border-white/[0.07] px-2 py-1">{settings.color} cross</span>
        <span className="rounded-full border border-white/[0.07] px-2 py-1">≤ {settings.moveTarget} moves</span>
        {settings.xcross ? (
          <span className="rounded-full border border-indigo-300/40 bg-indigo-400/10 px-2 py-1 text-indigo-200">
            XCross
          </span>
        ) : null}
      </div>
      <section className="grid gap-5 rounded-xl border border-white/[0.07] bg-zinc-950 p-4 md:grid-cols-[1fr_240px]">
        <div className="min-w-0 space-y-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
            Scramble
          </div>
          <div className="break-words font-mono text-lg leading-relaxed text-zinc-100">{scramble}</div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="sidebar-button flex-none" onClick={nextScramble}>
              Next
            </button>
            <button type="button" className="sidebar-button flex-none" onClick={() => setFlagged((value) => !value)}>
              {flagged ? "Flagged" : "Flag"}
            </button>
            <button type="button" className="sidebar-button flex-none" onClick={() => void copyTextToClipboard(scramble)}>
              Copy
            </button>
            <button type="button" className="sidebar-button flex-none">
              Inspect
            </button>
          </div>
        </div>
        <ScrambleDraw eventId="333" scramble={scramble} />
      </section>
      <section className="space-y-3 rounded-xl border border-white/[0.07] bg-zinc-950 p-4">
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
          <span>Cross solution</span>
          <span>{revealed} / {solution.length} moves</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {solution.map((move, index) => (
            <span
              key={`${move}-${index}`}
              className={`min-w-10 rounded-md border px-3 py-2 text-center font-mono text-sm ${
                index < revealed
                  ? "border-white/[0.12] bg-zinc-900 text-zinc-100"
                  : "border-dashed border-white/[0.07] text-zinc-700"
              }`}
            >
              {index < revealed ? move : "•"}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="modal-button" onClick={revealNext}>
            Reveal next move
          </button>
          <button type="button" className="modal-button" onClick={() => setRevealed(solution.length)}>
            Reveal all
          </button>
        </div>
      </section>
      <section className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.07] bg-zinc-950 p-4">
        <span className="mr-auto text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
          How did that go?
        </span>
        {(["good", "okay", "missed"] as const).map((rating) => (
          <button
            key={rating}
            type="button"
            className="modal-button flex-none capitalize"
            onClick={() => onRate(rating, { scramble, solution, flagged })}
          >
            {rating}
          </button>
        ))}
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Wire Cross UI into TrainingPage**

In `TrainingPage.tsx`, import and render `CrossTrainer` and `CrossSettings`. Add handlers:

```tsx
import { CrossTrainer } from "./CrossTrainer";
import { CrossSettings } from "./CrossSettings";
import { recordCrossAttempt } from "./trainingStore";
```

Use:

```tsx
function setCrossSettings(settings: TrainingState["cross"]["settings"]) {
  setState((current) => ({ ...current, cross: { ...current.cross, settings } }));
}

function recordRatedCrossAttempt(
  rating: CrossRating,
  attempt: { scramble: string; solution: string[]; flagged: boolean },
) {
  setState((current) =>
    recordCrossAttempt(current, {
      id: crypto.randomUUID(),
      scramble: attempt.scramble,
      solution: attempt.solution,
      moveCount: attempt.solution.length,
      rating,
      flagged: attempt.flagged,
      xcross: current.cross.settings.xcross,
      timestamp: Date.now(),
    }),
  );
}
```

Render `CrossTrainer` in the center when `state.activeTrainer === "cross"` and `CrossSettings` in the right rail/mobile settings when active.

- [ ] **Step 6: Update TrainingSidebar for cross history**

Render the latest cross attempts as rows with scramble number, move count, rating, and flag. For algorithm mode in this task, keep the existing "In rotation" count from Task 5; Task 7 replaces it with real algorithm rows.

- [ ] **Step 7: Run tests**

Run:

```bash
vp test src/features/training/TrainingPage.test.tsx src/features/training/crossTrainer.test.ts src/features/training/trainingStore.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/features/training/CrossTrainer.tsx src/features/training/CrossSettings.tsx src/features/training/TrainingPage.tsx src/features/training/TrainingSidebar.tsx src/features/training/TrainingPage.test.tsx
git commit -m "Build cross training surface"
```

---

## Task 7: Implement Algorithm Trainer UI, Settings, And Subset Editor

**Files:**
- Create: `src/features/training/AlgorithmTrainer.tsx`
- Create: `src/features/training/AlgorithmSettings.tsx`
- Create: `src/features/training/SubsetEditor.tsx`
- Modify: `src/features/training/TrainingPage.tsx`
- Modify: `src/features/training/TrainingSidebar.tsx`
- Modify: `src/features/training/TrainingPage.test.tsx`

- [ ] **Step 1: Add failing source tests for Algorithm UI**

Add to `TrainingPage.test.tsx`:

```ts
import algorithmTrainerSource from "./AlgorithmTrainer.tsx?raw";
import algorithmSettingsSource from "./AlgorithmSettings.tsx?raw";
import subsetEditorSource from "./SubsetEditor.tsx?raw";

describe("Algorithm trainer UI", () => {
  test("renders trainer timing and subset controls", () => {
    expect(algorithmTrainerSource).toContain("Hold space");
    expect(algorithmTrainerSource).toContain("Next case");
    expect(algorithmSettingsSource).toContain("Drill");
    expect(algorithmSettingsSource).toContain("Subset");
    expect(subsetEditorSource).toContain("Select all");
    expect(subsetEditorSource).toContain("Select none");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
vp test src/features/training/TrainingPage.test.tsx
```

Expected: FAIL because Algorithm UI files do not exist.

- [ ] **Step 3: Implement `AlgorithmSettings`**

Create `src/features/training/AlgorithmSettings.tsx`:

```tsx
import { ALGORITHM_SETS } from "./algorithmCatalog";
import type { AlgorithmSettings as AlgorithmSettingsType, AlgorithmSetId } from "./types";

type AlgorithmSettingsProps = {
  settings: AlgorithmSettingsType;
  onChange: (settings: AlgorithmSettingsType) => void;
  onEditSubset: () => void;
};

export function AlgorithmSettings({ settings, onChange, onEditSubset }: AlgorithmSettingsProps) {
  function setMode(mode: AlgorithmSettingsType["mode"]) {
    onChange({ ...settings, mode });
  }

  function setActiveSetId(activeSetId: AlgorithmSetId) {
    onChange({ ...settings, activeSetId });
  }

  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
          Algorithm set
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.values(ALGORITHM_SETS).map((set) => (
            <button
              key={set.id}
              type="button"
              onClick={() => setActiveSetId(set.id)}
              className={`rounded-md border px-3 py-2 font-mono text-[11px] ${
                settings.activeSetId === set.id
                  ? "border-indigo-300 bg-indigo-400/10 text-indigo-200"
                  : "border-white/[0.07] text-zinc-500 hover:text-zinc-200"
              }`}
            >
              {set.label}
            </button>
          ))}
        </div>
      </section>
      <section>
        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
          Mode
        </h3>
        <div className="grid grid-cols-2 gap-1 rounded-md border border-white/[0.07] bg-black p-1">
          {[
            { id: "drill" as const, label: "Drill" },
            { id: "subset" as const, label: "Subset" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className={`rounded px-2 py-1.5 font-mono text-[11px] ${
                settings.mode === item.id ? "bg-zinc-900 text-zinc-100" : "text-zinc-600"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>
      <button type="button" className="modal-button" onClick={onEditSubset}>
        Edit subset
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Implement `SubsetEditor`**

Create `src/features/training/SubsetEditor.tsx`:

```tsx
import { useMemo, useState } from "react";
import type { AlgorithmSet } from "./algorithmCatalog";

type SubsetEditorProps = {
  set: AlgorithmSet;
  selectedIds: string[];
  onCancel: () => void;
  onSave: (ids: string[]) => void;
};

export function SubsetEditor({ set, selectedIds, onCancel, onSave }: SubsetEditorProps) {
  const [selected, setSelected] = useState(() => new Set(selectedIds));
  const grouped = useMemo(() => {
    const groups = new Map<string, typeof set.cases>();
    set.cases.forEach((item) => groups.set(item.group, [...(groups.get(item.group) ?? []), item]));
    return Array.from(groups.entries());
  }, [set.cases]);

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60 p-0 md:items-center md:justify-center md:p-6">
      <section className="max-h-[84vh] w-full overflow-hidden rounded-t-3xl border-t border-white/10 bg-zinc-950 p-5 md:max-w-3xl md:rounded-xl md:border">
        <header className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
            Edit subset · {set.label}
          </h2>
          <span className="font-mono text-[11px] text-zinc-500">
            {selected.size} / {set.cases.length}
          </span>
        </header>
        <div className="max-h-[55vh] overflow-y-auto">
          {grouped.map(([group, cases]) => (
            <section key={group} className="mb-4">
              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
                {group} · {cases.length}
              </h3>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {cases.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggle(item.id)}
                    className={`rounded-md border p-2 text-left ${
                      selected.has(item.id)
                        ? "border-indigo-300 bg-indigo-400/10"
                        : "border-white/[0.07] bg-black/20"
                    }`}
                  >
                    <span className="block font-mono text-xs text-zinc-100">{item.name}</span>
                    <span className="block truncate font-mono text-[10px] text-zinc-600">
                      {item.algorithm}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
        <footer className="mt-4 flex flex-wrap justify-end gap-2 border-t border-white/[0.07] pt-4">
          <button type="button" className="sidebar-button flex-none" onClick={() => setSelected(new Set(set.cases.map((item) => item.id)))}>
            Select all
          </button>
          <button type="button" className="sidebar-button flex-none" onClick={() => setSelected(new Set())}>
            Select none
          </button>
          <button type="button" className="sidebar-button flex-none" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="modal-button flex-none" onClick={() => onSave(Array.from(selected))}>
            Done
          </button>
        </footer>
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Implement `AlgorithmTrainer`**

Create `src/features/training/AlgorithmTrainer.tsx`:

```tsx
import { useMemo, useState } from "react";
import { ScrambleDraw } from "../scrambles/ScrambleDraw";
import { useTimerController } from "../timer/useTimerController";
import { formatTimerTime } from "../timer/timerFormat";
import { ALGORITHM_SETS } from "./algorithmCatalog";
import { algorithmStats, casesForMode, invertAlgorithm } from "./algorithmTrainer";
import type { AlgorithmSettings, AlgorithmTime } from "./types";

type AlgorithmTrainerProps = {
  settings: AlgorithmSettings;
  historyByCase: Record<string, AlgorithmTime[]>;
  onRecordTime: (caseId: string, ms: number) => void;
};

export function AlgorithmTrainer({ settings, historyByCase, onRecordTime }: AlgorithmTrainerProps) {
  const set = ALGORITHM_SETS[settings.activeSetId];
  const cases = useMemo(
    () => casesForMode(set, settings.mode, settings.subsets[set.id]),
    [set, settings.mode, settings.subsets],
  );
  const [index, setIndex] = useState(0);
  const currentCase = cases[index % Math.max(1, cases.length)] ?? null;
  const timer = useTimerController((ms) => {
    if (currentCase) {
      onRecordTime(currentCase.id, ms);
    }
  });
  const stats = currentCase ? algorithmStats(historyByCase[currentCase.id] ?? []) : null;
  const setup = currentCase ? invertAlgorithm(currentCase.algorithm) : "";

  if (!currentCase) {
    return (
      <section className="rounded-xl border border-white/[0.07] bg-zinc-950 p-6 text-zinc-500">
        Empty subset. Open Settings and add cases to train this set.
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-white/[0.07] px-2 py-1 font-mono text-[11px] text-zinc-500">
          {set.label}
        </span>
        <span className="rounded-full border border-white/[0.07] px-2 py-1 font-mono text-[11px] text-zinc-500">
          {settings.mode}
        </span>
      </div>
      <section className="grid gap-5 rounded-xl border border-white/[0.07] bg-zinc-950 p-5 md:grid-cols-[1fr_220px]">
        <div className="min-w-0 space-y-3">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-indigo-200">
            <span className="rounded border border-white/[0.07] px-2 py-0.5 text-zinc-500">
              {currentCase.group}
            </span>
            <span>{currentCase.name}</span>
          </div>
          <div className="text-3xl text-zinc-100">{currentCase.description}</div>
          <div className="break-words font-mono text-base leading-relaxed text-zinc-100">
            {currentCase.algorithm}
          </div>
          <div className="break-words font-mono text-xs leading-relaxed text-zinc-600">
            setup {setup}
          </div>
        </div>
        <ScrambleDraw eventId={set.puzzle === "2x2" ? "222" : "333"} scramble={setup} />
      </section>
      <button
        type="button"
        className={`w-full rounded-xl border border-white/[0.07] bg-zinc-950 p-8 text-center ${
          timer.stage === "ready" ? "text-green-300" : timer.stage === "holding" ? "text-red-300" : "text-zinc-100"
        }`}
        onPointerDown={timer.press}
        onPointerUp={timer.release}
      >
        <div className="font-mono text-7xl font-light tabular-nums">{formatTimerTime(timer.elapsedMs)}</div>
        <div className="mt-3 text-[10px] uppercase tracking-[0.18em] text-zinc-700">
          Hold space · release to start
        </div>
      </button>
      <section className="rounded-xl border border-white/[0.07] bg-zinc-950 p-4">
        <div className="mb-3 flex flex-wrap justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
          <span>Recent · {currentCase.name}</span>
          <span className="font-mono normal-case tracking-normal text-zinc-500">
            last {stats?.last ?? "-"} · best {stats?.best ?? "-"} · ao5 {stats?.ao5 ?? "-"}
          </span>
        </div>
        <button type="button" className="modal-button flex-none" onClick={() => setIndex((value) => value + 1)}>
          Next case
        </button>
      </section>
    </div>
  );
}
```

- [ ] **Step 6: Wire Algorithm UI into TrainingPage**

In `TrainingPage.tsx`, render `AlgorithmTrainer` and `AlgorithmSettings` for `state.activeTrainer === "algorithms"`. Wire:

```tsx
function setAlgorithmSettings(settings: TrainingState["algorithms"]["settings"]) {
  setState((current) => ({ ...current, algorithms: { ...current.algorithms, settings } }));
}

function recordAlgorithmCaseTime(caseId: string, ms: number) {
  setState((current) =>
    recordAlgorithmTime(current, current.algorithms.settings.activeSetId, caseId, ms),
  );
}
```

Manage subset editor state:

```tsx
const [subsetOpen, setSubsetOpen] = useState(false);
```

When saving subset ids, update:

```tsx
setState((current) => ({
  ...current,
  algorithms: {
    ...current.algorithms,
    settings: {
      ...current.algorithms.settings,
      subsets: {
        ...current.algorithms.settings.subsets,
        [current.algorithms.settings.activeSetId]: ids,
      },
    },
  },
}));
```

- [ ] **Step 7: Update TrainingSidebar for algorithm rotation**

For algorithm mode, render cases from `casesForMode` with case id, group, and best time from `algorithmStats`. Keep the cross history rendering from Task 6.

- [ ] **Step 8: Run tests**

Run:

```bash
vp test src/features/training/TrainingPage.test.tsx src/features/training/algorithmTrainer.test.ts src/features/training/trainingStore.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/features/training/AlgorithmTrainer.tsx src/features/training/AlgorithmSettings.tsx src/features/training/SubsetEditor.tsx src/features/training/TrainingPage.tsx src/features/training/TrainingSidebar.tsx src/features/training/TrainingPage.test.tsx
git commit -m "Build algorithm training surface"
```

---

## Task 8: Add Section-Aware Keyboard Shortcuts And Responsive Hardening

**Files:**
- Modify: `src/features/training/TrainingPage.tsx`
- Modify: `src/features/training/CrossTrainer.tsx`
- Modify: `src/features/training/AlgorithmTrainer.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/features/training/TrainingPage.test.tsx`
- Modify: `src/index.css` only if a global class is needed

- [ ] **Step 1: Add source tests for shortcut isolation and overflow guards**

Add to `src/App.test.tsx`:

```ts
test("keeps Timer and Training keyboard handlers section scoped", () => {
  expect(appSource).toContain("activeSection");
  expect(appSource).toContain("<TimerPage");
  expect(appSource).toContain("<TrainingPage");
});
```

Add to `TrainingPage.test.tsx`:

```ts
describe("Training responsive guards", () => {
  test("uses min-width zero and break wrapping around training content", () => {
    expect(trainingPageSource).toContain("min-w-0");
    expect(trainingPageSource).toContain("overflow-hidden");
    expect(trainingPageSource).toContain("TrainingMobileNav");
  });
});
```

- [ ] **Step 2: Run tests**

Run:

```bash
vp test src/App.test.tsx src/features/training/TrainingPage.test.tsx
```

Expected: PASS if prior tasks already included these guards; otherwise FAIL and fix in the next steps.

- [ ] **Step 3: Add Training keyboard handling**

In `TrainingPage.tsx`, add a `useEffect` that ignores form controls and handles Escape to close `activeMobilePanel` and subset editor. Pass explicit keyboard callbacks into `CrossTrainer` and `AlgorithmTrainer` instead of letting Timer shortcuts run globally when Training is active.

Use this pattern:

```tsx
useEffect(() => {
  function onKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea, select, [contenteditable='true'], [data-global-shortcuts='ignore']")) {
      return;
    }
    if (event.key === "Escape") {
      setActiveMobilePanel(null);
      setSubsetOpen(false);
    }
  }

  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}, []);
```

Extend Cross/Algorithm components with their own scoped handlers only while mounted:

- Cross: `Space` reveal, `N` next, `F` flag, `R` reveal all, `I` inspect.
- Algorithms: `Space` timer press/release, `N` next case.

- [ ] **Step 4: Harden mobile Training layout**

Verify and adjust class names:

- root grid has `min-w-0 overflow-hidden`
- center `main` has `min-w-0 overflow-y-auto`
- scramble and algorithm text uses `break-words`
- action rows use `flex-wrap`
- mobile settings panel uses `max-h-[80vh] overflow-y-auto`
- history sheet width uses `w-[min(360px,92vw)]`

If Tailwind cannot express a needed rule, add only the smallest global CSS class to `src/index.css`.

- [ ] **Step 5: Run focused tests**

Run:

```bash
vp test src/App.test.tsx src/features/training/TrainingPage.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/App.test.tsx src/features/training/TrainingPage.tsx src/features/training/CrossTrainer.tsx src/features/training/AlgorithmTrainer.tsx src/features/training/TrainingPage.test.tsx src/index.css
git commit -m "Harden training shortcuts and mobile layout"
```

If `src/index.css` was not modified, omit it from `git add`.

---

## Task 9: Final Verification And Polish

**Files:**
- Modify only files needed to address verification failures.

- [ ] **Step 1: Run install after remote changes if dependencies changed**

Run:

```bash
vp install
```

Expected: dependencies are current. If `vp install` changes lockfiles, inspect and commit only expected dependency metadata.

- [ ] **Step 2: Run full checks**

Run:

```bash
vp check
```

Expected: PASS.

- [ ] **Step 3: Run full tests**

Run:

```bash
vp test
```

Expected: PASS.

- [ ] **Step 4: Start local dev server**

Run:

```bash
vp dev
```

Expected: dev server starts and prints a localhost URL. Keep the session running for browser verification, then stop it before finishing.

- [ ] **Step 5: Browser verify desktop**

At desktop width:

- Timer tab renders the existing timer/session UI.
- Timer event selector, settings, shortcuts, session sidebar, graph, draw, histogram still work.
- Training tab renders Workbench layout with left rail, center content, right settings rail.
- Cross and Algorithms switch without affecting Timer sessions.

- [ ] **Step 6: Browser verify mobile**

At phone widths around 390px, 402px, and 430px:

- Timer tab still uses the existing mobile layout and sheets.
- Training Cross mode has no horizontal overflow.
- Training Algorithms mode has no horizontal overflow.
- Training History opens as side sheet.
- Training Settings opens as bottom sheet.
- Long scramble/algorithm text wraps.

- [ ] **Step 7: Commit verification fixes**

If fixes were required:

```bash
git diff --name-only
git add src/App.tsx src/App.test.tsx src/index.css src/features/timer/TimerPage.tsx src/features/training
git commit -m "Polish training section verification"
```

If no fixes were required, do not create an empty commit.

---

## Self-Review Notes

- Spec coverage: the plan covers no-router top-level navigation, Timer preservation, separate Training storage, Cross/XCross, Algorithm/subset trainer, Workbench desktop, mobile sheets, mocked solver, tests, and verification.
- Red-flag scan: plan uses no unresolved implementation slots. The initial Training shell in Task 5 is immediately replaced by concrete Cross/Algorithm surfaces in Tasks 6 and 7.
- Type consistency: `TrainingMode` uses `"cross" | "algorithms"` across App, store, header, and components. `AlgorithmSetId` uses `OLL`, `PLL`, `COLL`, `ZBLL`, `LSLL`, `CLL2`, `PLL4`. Cross rating uses `"missed"` consistently.
