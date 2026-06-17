import { describe, expect, test } from "vite-plus/test";
import trainingPageSource from "./TrainingPage.tsx?raw";
import trainingMobileNavSource from "./TrainingMobileNav.tsx?raw";

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

describe("TrainingMobileNav", () => {
  test("exposes exactly history and settings panels", () => {
    expect(trainingMobileNavSource).toContain("History");
    expect(trainingMobileNavSource).toContain("Settings");
    expect(trainingMobileNavSource).not.toContain("Graph");
    expect(trainingMobileNavSource).not.toContain("Session");
  });
});
