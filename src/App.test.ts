import { describe, expect, test } from "vite-plus/test";
import appSource from "./App.vue?raw";

describe("App keyboard listeners", () => {
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
    expect(appSource).toContain("@event-change");
  });

  test("fills the center grid column with the desktop selector", () => {
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
  test("uses ShadCN Vue sheet primitives for the mobile session panel", () => {
    expect(appSource).toContain('from "@/components/ui/sheet"');
    expect(appSource).toContain("<Sheet");
    expect(appSource).toContain("<SheetContent");
    expect(appSource).toContain("<SheetDescription");
  });
});

describe("App framework", () => {
  test("is a Vue shell with no legacy framework imports", () => {
    expect(appSource).toContain("<script setup");
    expect(appSource).toContain("createDemoAppState");
  });
});
