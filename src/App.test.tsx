import { describe, expect, test } from "vite-plus/test";
import appSource from "./App.tsx?raw";
import timerPageSource from "./features/timer/TimerPage.tsx?raw";

describe("App keyboard listeners", () => {
  test("does not depend on the unstable timer result object", () => {
    expect(timerPageSource).not.toContain(", timer,");
  });

  test("keeps global shortcuts active when buttons have focus", () => {
    expect(timerPageSource).not.toContain("button, input");
    expect(timerPageSource).toContain("input, textarea, select");
  });

  test("lets custom selector controls handle non-escape keys", () => {
    expect(timerPageSource).toContain("[data-global-shortcuts='ignore']");
    expect(timerPageSource.indexOf('event.key === "Escape"')).toBeLessThan(
      timerPageSource.indexOf("[data-global-shortcuts='ignore']"),
    );
  });
});

describe("App top-level sections", () => {
  test("uses local state for Timer and Training instead of a routing library", () => {
    expect(appSource).toContain('useState<"timer" | "training">("timer")');
    expect(appSource).toContain("<TimerPage");
    expect(appSource).toContain("activeSection={activeSection}");
    expect(appSource).not.toContain("react-router");
    expect(appSource).not.toContain("createBrowserRouter");
    expect(appSource).not.toContain("RouterProvider");
  });

  test("passes section state into TimerPage instead of rendering a second shell", () => {
    expect(appSource).toContain(
      "<TimerPage activeSection={activeSection} onSectionChange={setActiveSection} />",
    );
    expect(appSource).not.toContain("showTraining");
    expect(appSource).not.toContain("Profile");
  });
});

describe("TimerPage header layout", () => {
  test("renders top-level Timer and Training tabs without Profile", () => {
    expect(timerPageSource).toContain('handleSectionChange("timer")');
    expect(timerPageSource).toContain('handleSectionChange("training")');
    expect(timerPageSource).not.toContain("Profile");
  });

  test("puts both mobile and desktop event selectors in the top bar", () => {
    expect(timerPageSource).toContain('mode="select"');
    expect(timerPageSource).toContain('mode="tabs"');
    expect(timerPageSource).not.toContain("onEventChange={onEventChange}");
  });

  test("fills the center grid column with the desktop selector", () => {
    expect(timerPageSource).toContain("headerDensityClass");
    expect(timerPageSource).toContain("md:col-start-2 md:row-start-1");
    expect(timerPageSource).toContain("w-full");
    expect(timerPageSource).not.toContain("max-w-3xl");
  });

  test("centers the mobile event selector in the top bar", () => {
    expect(timerPageSource).toContain("grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]");
    expect(timerPageSource).toContain("justify-self-center md:hidden");
    expect(timerPageSource).toContain("justify-self-end");
  });

  test("guards training tab switches while the timer is locked", () => {
    expect(timerPageSource).toContain('const timerLocked = timerStage === "running";');
    expect(timerPageSource).toContain('const sectionSwitchLocked = timerStage !== "idle";');
    expect(timerPageSource).toContain('if (sectionSwitchLocked && section === "training")');
    expect(timerPageSource).toContain("disabled={sectionSwitchLocked}");
    expect(timerPageSource).toContain("disabled:opacity-40");
    expect(timerPageSource).toContain("disabled:hover:text-zinc-500");
    expect(timerPageSource).toContain("onSectionChange?.(section)");
    expect(timerPageSource).toContain('activeSection === "training" ? (');
  });

  test("clears timer-only transient ui before switching to training", () => {
    expect(timerPageSource).toContain('if (section === "training") {');
    expect(timerPageSource).toContain("setActiveSheet(null);");
    expect(timerPageSource).toContain("setSettingsOpen(false);");
    expect(timerPageSource).toContain("setShortcutsOpen(false);");
    expect(timerPageSource).toContain("setSelectedSolveId(null);");
  });

  test("guards space keyup timer release when training is active", () => {
    const onKeyUpSource = timerPageSource.slice(timerPageSource.indexOf("function onKeyUp"));

    expect(onKeyUpSource).toContain("if (!timerSectionActive) {");
    expect(onKeyUpSource.indexOf("if (!timerSectionActive) {")).toBeLessThan(
      onKeyUpSource.indexOf("event.preventDefault();"),
    );
    expect(onKeyUpSource.indexOf("if (!timerSectionActive) {")).toBeLessThan(
      onKeyUpSource.indexOf("releaseTimer();"),
    );
  });
});

describe("App mobile panels", () => {
  test("uses the shared sheet primitive for the mobile session panel", () => {
    expect(timerPageSource).toContain('from "../../shared/components/Sheet"');
    expect(timerPageSource).toContain("<Sheet");
    expect(timerPageSource).toContain("<SheetContent");
    expect(timerPageSource).toContain("<SheetDescription");
    expect(timerPageSource).toContain("modal={false}");
    expect(timerPageSource).not.toContain('aria-label="Close session"');
  });
});
