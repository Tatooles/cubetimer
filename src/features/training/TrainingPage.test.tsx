// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, test } from "vite-plus/test";
import { TimerPage } from "../timer/TimerPage";
import { defaultTrainingState, TRAINING_STORAGE_KEY } from "./trainingStore";
import { TrainingPage } from "./TrainingPage";
import { TrainingSidebar } from "./TrainingSidebar";
import algorithmSettingsSource from "./AlgorithmSettings.tsx?raw";
import algorithmTrainerSource from "./AlgorithmTrainer.tsx?raw";
import subsetEditorSource from "./SubsetEditor.tsx?raw";
import trainingPageSource from "./TrainingPage.tsx?raw";
import crossSettingsSource from "./CrossSettings.tsx?raw";
import crossTrainerSource from "./CrossTrainer.tsx?raw";
import trainingMobileNavSource from "./TrainingMobileNav.tsx?raw";
import timerPageSource from "../timer/TimerPage.tsx?raw";

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

beforeEach(() => {
  localStorage.clear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  localStorage.clear();
});

describe("TrainingPage shell composition", () => {
  test("composes the shell around persisted training state", () => {
    expect(trainingPageSource).toContain("loadTrainingState()");
    expect(trainingPageSource).toContain("saveTrainingState(state)");
    expect(trainingPageSource).toContain("<TrainingHeader");
    expect(trainingPageSource).toContain("<TrainingSidebar");
    expect(trainingPageSource).toContain("activeMobilePanel");
    expect(trainingPageSource).toContain("history");
    expect(trainingPageSource).toContain("settings");
  });

  test("clears the active mobile panel when switching trainers", () => {
    expect(trainingPageSource).toContain("function setActiveTrainer");
    expect(trainingPageSource).toContain("setActiveMobilePanel(null)");
    expect(trainingPageSource).toContain("activeTrainer:");
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

  test("cross trainer source exposes reveal, rating, and inspection controls", () => {
    expect(crossTrainerSource).toContain("Reveal next move");
    expect(crossTrainerSource).toContain("How did that go?");
    expect(crossTrainerSource).toContain("Inspect");
    expect(crossTrainerSource).toContain("copyTextToClipboard");
  });

  test("cross settings source exposes color, target, and xcross controls", () => {
    expect(crossSettingsSource).toContain("Cross color");
    expect(crossSettingsSource).toContain("Move target");
    expect(crossSettingsSource).toContain("XCross practice");
  });
});

describe("TrainingPage interactions", () => {
  test("starts on Cross trainer and persists Algorithm trainer selection", async () => {
    await render(<TrainingPage />);

    expect(pageText()).toContain("Cross trainer");

    await click(button("Algorithms"));

    expect(pageText()).toContain("Algorithm trainer");
    expect(localStorage.getItem(TRAINING_STORAGE_KEY)).toContain('"activeTrainer":"algorithms"');

    await render(<TrainingPage />);

    expect(pageText()).toContain("Algorithm trainer");
  });

  test("renders algorithm case controls and advances cases", async () => {
    await render(<TrainingPage />);

    await click(button("Algorithms"));

    expect(pageText()).toContain("PLL");
    expect(pageText()).toContain("T Perm");
    expect(pageText()).toContain("Hold space");
    expect(pageText()).toContain("Next case");

    await click(button("Next case"));

    expect(pageText()).toContain("Jb Perm");
  });

  test("opens algorithm settings and saves a subset selection", async () => {
    await render(<TrainingPage />);

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

  test("opens and toggles history and settings mobile panels", async () => {
    await render(<TrainingPage />);

    expect(pageText()).not.toContain("Training history");

    await click(button("History"));

    expect(pageText()).toContain("Training history");
    expect(pageText()).toContain("Cross attempts");

    await click(button("History"));

    expect(pageText()).not.toContain("Training history");

    await click(button("Settings"));

    expect(pageText()).toContain("Training settings");
    expect(pageText()).toContain("Cross color");
    expect(pageText()).toContain("Move target");
  });

  test("rating a cross attempt records it in sidebar history", async () => {
    await render(<TrainingPage />);

    expect(pageText()).toContain("Cross attempts");
    expect(pageText()).toContain("saved attempts");
    expect(pageText()).toContain("0");

    await click(button("Good"));

    expect(pageText()).toContain("1");
    expect(pageText()).toContain("#1");
    expect(pageText()).toContain("good");
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
      await render(<TrainingPage />);

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
    await render(<TrainingPage />);

    await click(button("Flag"));
    await click(button("Inspect"));
    await click(button("Reveal next move"));

    expect(pageText()).toContain("Flagged");
    expect(pageText()).toContain("15s inspection active");
    expect(pageText()).not.toContain("Reveal the solution when ready.");

    await click(button("Short scramble"));

    expect(pageText()).toContain("Flag");
    expect(pageText()).not.toContain("Flagged");
    expect(pageText()).not.toContain("15s inspection active");
    expect(pageText()).toContain("Reveal the solution when ready.");
  });

  test("does not expose graph or session controls in training mobile nav", async () => {
    await render(<TrainingPage />);

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
