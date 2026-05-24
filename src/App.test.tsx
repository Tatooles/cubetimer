import { describe, expect, test } from "vite-plus/test";
import appSource from "./App.tsx?raw";

describe("App keyboard listeners", () => {
  test("does not depend on the unstable timer result object", () => {
    expect(appSource).not.toContain(", timer,");
  });

  test("keeps global shortcuts active when buttons have focus", () => {
    expect(appSource).not.toContain("button, input");
    expect(appSource).toContain("input, textarea, select");
  });

  test("lets custom selector controls handle non-escape keys", () => {
    expect(appSource).toContain("[data-global-shortcuts='ignore']");
    expect(appSource.indexOf('event.key === "Escape"')).toBeLessThan(
      appSource.indexOf("[data-global-shortcuts='ignore']"),
    );
  });
});

describe("App event selector layout", () => {
  test("puts both mobile and desktop event selectors in the top bar", () => {
    expect(appSource).toContain('mode="select"');
    expect(appSource).toContain('mode="tabs"');
    expect(appSource).not.toContain("onEventChange={onEventChange}");
  });

  test("fills the center grid column with the desktop selector", () => {
    expect(appSource).toContain("headerDensityClass");
    expect(appSource).toContain("md:col-start-2 md:row-start-1");
    expect(appSource).toContain("w-full");
    expect(appSource).not.toContain("max-w-3xl");
  });

  test("centers the mobile event selector in the top bar", () => {
    expect(appSource).toContain("grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]");
    expect(appSource).toContain("justify-self-center md:hidden");
    expect(appSource).toContain("justify-self-end");
  });
});

describe("App mobile panels", () => {
  test("uses the shared sheet primitive for the mobile session panel", () => {
    expect(appSource).toContain('from "./shared/components/Sheet"');
    expect(appSource).toContain("<Sheet");
    expect(appSource).toContain("<SheetContent");
    expect(appSource).toContain("<SheetDescription");
    expect(appSource).toContain("modal={false}");
    expect(appSource).not.toContain('aria-label="Close session"');
  });
});
