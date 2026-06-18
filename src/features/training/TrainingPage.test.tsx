// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useState, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { TimerPage } from "../timer/TimerPage";
import { defaultTrainingState, loadTrainingState, TRAINING_STORAGE_KEY } from "./trainingStore";
import { TrainingPage } from "./TrainingPage";
import { TrainingModeSwitch } from "./TrainingHeader";
import { TrainingSidebar } from "./TrainingSidebar";
import algorithmSettingsSource from "./AlgorithmSettings.tsx?raw";
import algorithmTrainerSource from "./AlgorithmTrainer.tsx?raw";
import subsetEditorSource from "./SubsetEditor.tsx?raw";
import trainingPageSource from "./TrainingPage.tsx?raw";
import crossSettingsSource from "./CrossSettings.tsx?raw";
import crossTrainerSource from "./CrossTrainer.tsx?raw";
import trainingMobileNavSource from "./TrainingMobileNav.tsx?raw";
import timerPageSource from "../timer/TimerPage.tsx?raw";
import type { TrainingMode } from "./types";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let container: HTMLDivElement;
let root: Root;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function pageText(): string {
  return document.body.textContent ?? "";
}

function timerPageGrid(): HTMLElement {
  const grid = container.querySelector('[data-testid="timer-page-grid"]');

  if (!(grid instanceof HTMLElement)) {
    throw new Error("TimerPage grid not found");
  }

  return grid;
}

function button(name: string): HTMLButtonElement {
  const candidate = Array.from(document.body.querySelectorAll("button")).find(
    (element) =>
      element.textContent?.trim() === name || element.getAttribute("aria-label") === name,
  );

  if (!(candidate instanceof HTMLButtonElement)) {
    throw new Error(`Button not found: ${name}`);
  }

  return candidate;
}

function testId(id: string): HTMLElement {
  const candidate = document.body.querySelector(`[data-testid="${id}"]`);

  if (!(candidate instanceof HTMLElement)) {
    throw new Error(`Test id not found: ${id}`);
  }

  return candidate;
}

function sheetContent(): HTMLElement | null {
  const candidate = document.body.querySelector('[data-slot="sheet-content"]');
  return candidate instanceof HTMLElement ? candidate : null;
}

async function render(element: ReactNode) {
  await act(async () => {
    root.render(element);
  });
}

async function click(element: HTMLElement) {
  await act(async () => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function TrainingPageHarness() {
  const [activeTrainer, setActiveTrainer] = useState<TrainingMode>(
    () => loadTrainingState().activeTrainer,
  );

  return (
    <>
      <TrainingModeSwitch activeTrainer={activeTrainer} onTrainerChange={setActiveTrainer} />
      <TrainingPage activeTrainer={activeTrainer} />
    </>
  );
}

beforeEach(() => {
  localStorage.clear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  vi.restoreAllMocks();
  act(() => root.unmount());
  container.remove();
  localStorage.clear();
});

describe("TrainingPage shell composition", () => {
  test("composes the shell around persisted training state", () => {
    expect(trainingPageSource).toContain("loadTrainingState()");
    expect(trainingPageSource).toContain("saveTrainingState(state)");
    expect(trainingPageSource).not.toContain("<TrainingHeader");
    expect(trainingPageSource).toContain("<TrainingSidebar");
    expect(trainingPageSource).toContain("activeMobilePanel");
    expect(trainingPageSource).toContain("history");
    expect(trainingPageSource).toContain("settings");
  });

  test("clears the active mobile panel when switching trainers", () => {
    expect(trainingPageSource).toContain("useEffect(() =>");
    expect(trainingPageSource).toContain("setActiveMobilePanel(null)");
    expect(trainingPageSource).toContain("activeTrainer:");
  });

  test("does not render the old training practice shell header", () => {
    expect(trainingPageSource).not.toContain("Practice shell");
    expect(trainingPageSource).not.toContain("<h1");
    expect(trainingPageSource).not.toContain("TrainingHeader");
  });

  test("renders placeholder trainer content until concrete trainers land", () => {
    expect(trainingPageSource).toContain("<CrossTrainer");
    expect(trainingPageSource).toContain("<CrossSettings");
    expect(trainingPageSource).toContain("<AlgorithmTrainer");
    expect(trainingPageSource).toContain("<AlgorithmSettings");
    expect(trainingPageSource).toContain("<SubsetEditor");
  });

  test("algorithm trainer source exposes timer and case controls", () => {
    expect(algorithmTrainerSource).toContain("Hold space");
    expect(algorithmTrainerSource).toContain("Next case");
  });

  test("algorithm settings source exposes drill and subset controls", () => {
    expect(algorithmSettingsSource).toContain("Drill");
    expect(algorithmSettingsSource).toContain("Subset");
  });

  test("subset editor source exposes bulk selection controls", () => {
    expect(subsetEditorSource).toContain("Select all");
    expect(subsetEditorSource).toContain("Select none");
  });

  test("cross trainer source exposes reveal and rating controls without inspection controls", () => {
    expect(crossTrainerSource).toContain("Reveal next move");
    expect(crossTrainerSource).toContain("How did that go?");
    expect(crossTrainerSource).not.toContain("Inspect");
    expect(crossTrainerSource).not.toContain("15s inspection active");
    expect(crossTrainerSource).toContain("copyTextToClipboard");
  });

  test("cross trainer source scopes keyboard shortcuts away from controls", () => {
    expect(crossTrainerSource).toContain('window.addEventListener("keydown"');
    expect(crossTrainerSource).toContain('window.removeEventListener("keydown"');
    expect(crossTrainerSource).toContain("shouldIgnoreGlobalShortcut");
    expect(crossTrainerSource).toContain('[data-global-shortcuts="ignore"]');
    expect(crossTrainerSource).toContain("event.repeat");
    expect(crossTrainerSource).toContain("revealNext()");
    expect(crossTrainerSource).toContain("advance()");
    expect(crossTrainerSource).toContain("setFlagged((current) => !current)");
    expect(crossTrainerSource).toContain("revealAll()");
    expect(crossTrainerSource).not.toContain("setInspecting");
  });

  test("cross settings source exposes color, target, and xcross controls", () => {
    expect(crossSettingsSource).toContain("Cross color");
    expect(crossSettingsSource).toContain('type="checkbox"');
    expect(crossSettingsSource).toContain('min="3"');
    expect(crossSettingsSource).toContain('max="8"');
    expect(crossSettingsSource).toContain("Move target");
    expect(crossSettingsSource).toContain("XCross practice");
    expect(crossSettingsSource).not.toContain("15s inspection");
    expect(crossSettingsSource).not.toContain("Reveal mode");
    expect(crossSettingsSource).not.toContain("One at a time");
    expect(crossSettingsSource).not.toContain("All at once");
  });
});

describe("TrainingPage interactions", () => {
  test("starts on Cross trainer and persists Algorithm trainer selection", async () => {
    await render(<TrainingPageHarness />);

    expect(pageText()).toContain("Cross trainer");

    await click(button("Algorithms"));

    expect(pageText()).toContain("Algorithm trainer");
    expect(localStorage.getItem(TRAINING_STORAGE_KEY)).toContain('"activeTrainer":"algorithms"');

    await render(<TrainingPageHarness />);

    expect(pageText()).toContain("Algorithm trainer");
  });

  test("renders algorithm case controls and advances cases", async () => {
    await render(<TrainingPageHarness />);

    await click(button("Algorithms"));

    const currentCase = testId("algorithm-current-case");

    expect(currentCase.textContent).toContain("Aa Perm");
    expect(currentCase.textContent).not.toContain("Ab Perm");
    expect(pageText()).toContain("Hold space");
    expect(pageText()).toContain("Next case");

    await click(button("Next case"));

    expect(currentCase.textContent).toContain("Ab Perm");
    expect(currentCase.textContent).not.toContain("Aa Perm");
  });

  test("ignores global space shortcuts from algorithm settings controls", async () => {
    await render(<TrainingPageHarness />);

    await click(button("Algorithms"));
    await click(button("Settings"));

    const select = sheetContent()?.querySelector("select");
    if (!(select instanceof HTMLSelectElement)) {
      throw new Error("Algorithm set select not found");
    }
    await act(async () => {
      select.focus();
    });

    const keydown = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      code: "Space",
    });

    await act(async () => {
      select.dispatchEvent(keydown);
    });

    expect(keydown.defaultPrevented).toBe(false);
    expect(testId("algorithm-timer-surface").textContent).not.toContain("Release to start");
  });

  test("records algorithm time against the case active when the run started", async () => {
    let now = 1_000;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    vi.spyOn(window, "setTimeout").mockImplementation((handler) => {
      if (typeof handler === "function") {
        handler();
      }
      return 1;
    });
    vi.spyOn(window, "clearTimeout").mockImplementation(() => undefined);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);

    await render(<TrainingPageHarness />);
    await click(button("Algorithms"));

    const timerSurface = testId("algorithm-timer-surface");

    await act(async () => {
      timerSurface.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      timerSurface.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    });

    await click(button("Next case"));

    now = 2_250;

    await act(async () => {
      timerSurface.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    });

    const saved = JSON.parse(localStorage.getItem(TRAINING_STORAGE_KEY) ?? "{}") as {
      algorithms?: { historyByCase?: Record<string, Array<{ caseId: string; ms: number }>> };
    };

    expect(saved.algorithms?.historyByCase?.Aa?.[0]).toMatchObject({ caseId: "Aa", ms: 1250 });
    expect(saved.algorithms?.historyByCase?.Ab).toBeUndefined();
  });

  test("opens algorithm settings and saves a subset selection", async () => {
    await render(<TrainingPageHarness />);

    await click(button("Algorithms"));
    await click(button("Settings"));

    expect(pageText()).toContain("Training settings");
    expect(pageText()).toContain("Drill");
    expect(pageText()).toContain("Subset");

    await click(button("Subset"));
    await click(button("Edit subset"));

    expect(pageText()).toContain("Select all");
    expect(pageText()).toContain("Select none");

    await click(button("Select none"));
    await click(button("Done"));

    expect(pageText()).toContain("Choose at least one case");
    expect(localStorage.getItem(TRAINING_STORAGE_KEY)).toContain('"PLL":[]');
  });

  test("saves subset changes to the set that opened the editor", async () => {
    await render(<TrainingPageHarness />);

    await click(button("Algorithms"));
    await click(button("Settings"));
    await click(button("Edit subset"));

    const select = sheetContent()?.querySelector("select");
    if (!(select instanceof HTMLSelectElement)) {
      throw new Error("Algorithm set select not found");
    }

    await act(async () => {
      select.value = "OLL";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await click(button("Select none"));
    await click(button("Done"));

    const saved = JSON.parse(localStorage.getItem(TRAINING_STORAGE_KEY) ?? "{}") as {
      algorithms?: { settings?: { subsets?: Record<string, string[]> } };
    };

    expect(saved.algorithms?.settings?.subsets?.PLL).toEqual([]);
    expect(saved.algorithms?.settings?.subsets?.OLL).toEqual([]);
    expect(pageText()).not.toContain("Choose at least one case");
  });

  test("does not run algorithm space shortcuts behind the subset editor", async () => {
    let now = 1_000;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    vi.spyOn(window, "setTimeout").mockImplementation((handler) => {
      if (typeof handler === "function") {
        handler();
      }
      return 1;
    });
    vi.spyOn(window, "clearTimeout").mockImplementation(() => undefined);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);

    await render(<TrainingPageHarness />);

    await click(button("Algorithms"));
    await click(button("Settings"));
    await click(button("Edit subset"));

    await act(async () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      document.body.focus();
    });

    await act(async () => {
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, code: "Space" }),
      );
      document.body.dispatchEvent(
        new KeyboardEvent("keyup", { bubbles: true, cancelable: true, code: "Space" }),
      );
    });

    expect(testId("algorithm-timer-surface").textContent).not.toContain(
      "Tap or press space to stop",
    );

    now = 2_000;

    await act(async () => {
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, code: "Space" }),
      );
    });

    const saved = JSON.parse(localStorage.getItem(TRAINING_STORAGE_KEY) ?? "{}") as {
      algorithms?: { historyByCase?: Record<string, unknown[]> };
    };

    expect(saved.algorithms?.historyByCase ?? {}).toEqual({});
  });

  test("opens and toggles history and settings mobile panels", async () => {
    await render(<TrainingPageHarness />);

    expect(pageText()).not.toContain("Training history");

    await click(button("History"));

    expect(pageText()).toContain("Training history");
    expect(pageText()).toContain("Cross attempts");

    await click(button("History"));

    expect(pageText()).not.toContain("Training history");

    await click(button("Settings"));

    expect(sheetContent()?.textContent).toContain("Training settings");
    expect(sheetContent()?.textContent).toContain("Cross color");
    expect(sheetContent()?.textContent).toContain("Move target");
  });

  test("escape closes training mobile panels and subset editor", async () => {
    await render(<TrainingPageHarness />);

    await click(button("Settings"));
    expect(sheetContent()?.textContent).toContain("Training settings");

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    });

    expect(sheetContent()).toBeNull();

    await click(button("Algorithms"));
    await click(button("Settings"));
    await click(button("Edit subset"));
    expect(pageText()).toContain("Select all");

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    });

    expect(pageText()).not.toContain("Select all");
  });

  test("escape from training form controls does not close panels", async () => {
    await render(<TrainingPageHarness />);

    await click(button("Algorithms"));
    await click(button("Settings"));

    const select = sheetContent()?.querySelector("select");
    if (!(select instanceof HTMLSelectElement)) {
      throw new Error("Algorithm set select not found");
    }
    await act(async () => {
      select.focus();
    });

    await act(async () => {
      select.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    });

    expect(sheetContent()?.textContent).toContain("Training settings");
  });

  test("cross keyboard shortcuts reveal, advance, flag, and ignore controls", async () => {
    await render(<TrainingPageHarness />);

    expect(pageText()).toContain("Reveal the solution when ready.");

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, code: "Space" }),
      );
    });

    expect(pageText()).not.toContain("Reveal the solution when ready.");

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "f" }));
    });

    expect(pageText()).toContain("Flagged");

    const beforeNext = testId("cross-scramble").textContent;

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "n" }));
    });

    expect(testId("cross-scramble").textContent).not.toBe(beforeNext);
    expect(pageText()).toContain("Reveal the solution when ready.");
    expect(pageText()).not.toContain("Flagged");
    expect(pageText()).not.toContain("15s inspection active");

    const nextButton = button("Next");
    nextButton.focus();
    const beforeIgnoredNext = testId("cross-scramble").textContent;

    await act(async () => {
      nextButton.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "n" }));
    });

    expect(testId("cross-scramble").textContent).toBe(beforeIgnoredNext);
  });

  test("cross keyboard shortcuts are disabled behind mobile panels", async () => {
    await render(<TrainingPageHarness />);

    const initialScramble = testId("cross-scramble").textContent;

    await click(button("Settings"));

    await act(async () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      document.body.focus();
    });

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "f" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "r" }));
      window.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, code: "Space" }),
      );
      window.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "n" }));
    });

    expect(testId("cross-scramble").textContent).toBe(initialScramble);
    expect(pageText()).not.toContain("Flagged");
    expect(pageText()).toContain("Reveal the solution when ready.");
    expect(document.body.querySelectorAll('[data-testid="cross-solution-move"]')).toHaveLength(0);
  });

  test("cross reveal-all shortcut exposes every visible move", async () => {
    await render(<TrainingPageHarness />);

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "r" }));
    });

    expect(pageText()).not.toContain("Reveal the solution when ready.");
    expect(
      document.body.querySelectorAll('[data-testid="cross-solution-move"]').length,
    ).toBeGreaterThan(1);
  });

  test("cross reveal buttons are explicit instead of using a persistent reveal mode", async () => {
    await render(<TrainingPageHarness />);

    await click(button("Reveal next move"));

    expect(document.body.querySelectorAll('[data-testid="cross-solution-move"]')).toHaveLength(1);

    await click(button("Reveal next move"));

    expect(document.body.querySelectorAll('[data-testid="cross-solution-move"]')).toHaveLength(2);

    await click(button("Reveal all"));

    expect(
      document.body.querySelectorAll('[data-testid="cross-solution-move"]').length,
    ).toBeGreaterThan(2);
  });

  test("rating a cross attempt records it in sidebar history", async () => {
    await render(<TrainingPageHarness />);

    expect(pageText()).toContain("Cross attempts");
    expect(pageText()).toContain("saved attempts");
    expect(pageText()).toContain("0");

    await click(button("Good"));

    expect(pageText()).toContain("1");
    expect(pageText()).toContain("#1");
    expect(pageText()).toContain("good");
  });

  test("cross history shows scrambles and can be cleared", async () => {
    await render(<TrainingPageHarness />);

    const scramble = testId("cross-scramble").textContent?.trim();
    if (!scramble) {
      throw new Error("Cross scramble not found");
    }

    await click(button("Good"));

    expect(pageText()).toContain(scramble);
    expect(pageText()).toContain("#1");
    expect(pageText()).toContain("1");

    await click(button("Clear"));

    expect(pageText()).toContain("No cross attempts yet.");
    expect(pageText()).not.toContain(scramble);
    expect(localStorage.getItem(TRAINING_STORAGE_KEY)).toContain('"history":[]');
  });

  test("uses unique fallback ids when randomUUID is unavailable", async () => {
    const cryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");
    const dateNow = Date.now;

    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: {},
    });
    Date.now = () => 123_456;

    try {
      await render(<TrainingPageHarness />);

      await click(button("Good"));
      await click(button("Good"));

      const saved = JSON.parse(localStorage.getItem(TRAINING_STORAGE_KEY) ?? "{}") as {
        cross?: { history?: Array<{ id: string }> };
      };
      const ids = saved.cross?.history?.map((attempt) => attempt.id) ?? [];

      expect(ids).toHaveLength(2);
      expect(new Set(ids).size).toBe(2);
    } finally {
      Date.now = dateNow;
      if (cryptoDescriptor) {
        Object.defineProperty(globalThis, "crypto", cryptoDescriptor);
      }
    }
  });

  test("changing short scramble resets cross trainer local state", async () => {
    await render(<TrainingPageHarness />);

    await click(button("Flag"));
    await click(button("Reveal next move"));

    expect(pageText()).toContain("Flagged");
    expect(pageText()).not.toContain("Reveal the solution when ready.");

    await click(button("Short scramble"));

    expect(pageText()).toContain("Flag");
    expect(pageText()).not.toContain("Flagged");
    expect(pageText()).not.toContain("15s inspection active");
    expect(pageText()).toContain("Reveal the solution when ready.");
  });

  test("does not expose graph or session controls in training mobile nav", async () => {
    await render(<TrainingPageHarness />);

    const nav = container.querySelector('nav[aria-label="Training"]');

    expect(nav?.textContent).toContain("History");
    expect(nav?.textContent).toContain("Settings");
    expect(nav?.textContent).not.toContain("Graph");
    expect(nav?.textContent).not.toContain("Session");
  });
});

describe("TimerPage training layout", () => {
  test("hides timer session/sidebar layout and lets training span the app content area", () => {
    expect(timerPageSource).toContain('activeSection === "timer" ? (');
    expect(timerPageSource).toContain("<SessionSidebar");
    expect(timerPageSource).toContain('activeSection === "training" ? "md:col-span-3"');
    expect(timerPageSource).toContain(
      'activeSection === "training" ? "grid-rows-[56px_1fr]" : "grid-rows-[56px_1fr_64px]"',
    );
  });

  test("does not expose timer session controls while training is active", async () => {
    await render(<TimerPage activeSection="training" />);

    expect(pageText()).toContain("Cross trainer");
    expect(pageText()).not.toContain("New session");
    expect(pageText()).not.toContain("Session");
  });

  test("renders timer and training with section-specific mobile rows", async () => {
    await render(<TimerPage activeSection="timer" />);

    expect(timerPageGrid().className).toContain("grid-rows-[56px_1fr_64px]");
    expect(timerPageGrid().className).not.toContain("grid-rows-[56px_1fr] overflow-hidden");

    await render(<TimerPage activeSection="training" />);

    expect(timerPageGrid().className).toContain("grid-rows-[56px_1fr]");
    expect(timerPageGrid().className).not.toContain("grid-rows-[56px_1fr_64px]");
  });
});

describe("Training responsive hardening", () => {
  test("guards TrainingPage shell, main area, and mobile sheets against overflow", () => {
    expect(trainingPageSource).toContain("min-w-0");
    expect(trainingPageSource).toContain("overflow-hidden");
    expect(trainingPageSource).toContain("overflow-y-auto");
    expect(trainingPageSource).toContain("TrainingMobileNav");
    expect(trainingPageSource).toContain("max-h");
    expect(trainingPageSource).toContain("w-[min(320px,88vw)]");
  });

  test("guards trainer text and action rows for narrow screens", () => {
    expect(crossTrainerSource).toContain("break-words");
    expect(crossTrainerSource).toContain("flex-wrap");
    expect(crossTrainerSource).toContain('data-testid="cross-scramble"');
    expect(algorithmTrainerSource).toContain("break-words");
    expect(algorithmTrainerSource).toContain("min-w-0");
  });
});

describe("TrainingMobileNav", () => {
  test("exposes exactly history and settings panels", () => {
    expect(trainingMobileNavSource).toContain("History");
    expect(trainingMobileNavSource).toContain("Settings");
    expect(trainingMobileNavSource).not.toContain("Graph");
    expect(trainingMobileNavSource).not.toContain("Session");
  });
});

describe("TrainingSidebar", () => {
  test("numbers duplicate cross attempt object references by row position", async () => {
    const duplicateAttempt = {
      id: "cross-1",
      scramble: "R U",
      solution: ["D", "L"],
      moveCount: 2,
      rating: "good" as const,
      flagged: false,
      xcross: false,
      timestamp: 1,
    };
    const state = {
      ...defaultTrainingState(),
      cross: {
        ...defaultTrainingState().cross,
        history: [duplicateAttempt, duplicateAttempt],
      },
    };

    await render(<TrainingSidebar state={state} activeTrainer="cross" />);

    expect(pageText()).toContain("#2");
    expect(pageText()).toContain("#1");
  });
});
