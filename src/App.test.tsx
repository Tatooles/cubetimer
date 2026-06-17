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
