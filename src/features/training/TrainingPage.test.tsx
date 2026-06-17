// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, test } from "vite-plus/test";
import { TimerPage } from "../timer/TimerPage";
import { TRAINING_STORAGE_KEY } from "./trainingStore";
import { TrainingPage } from "./TrainingPage";
import trainingPageSource from "./TrainingPage.tsx?raw";
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

function button(name: string): HTMLButtonElement {
  const candidate = Array.from(document.body.querySelectorAll("button")).find(
    (element) => element.textContent?.trim() === name,
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
    expect(trainingPageSource).toContain("Cross trainer");
    expect(trainingPageSource).toContain("Algorithm trainer");
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
    expect(pageText()).toContain("white cross, 8 move target");
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
});

describe("TrainingMobileNav", () => {
  test("exposes exactly history and settings panels", () => {
    expect(trainingMobileNavSource).toContain("History");
    expect(trainingMobileNavSource).toContain("Settings");
    expect(trainingMobileNavSource).not.toContain("Graph");
    expect(trainingMobileNavSource).not.toContain("Session");
  });
});
