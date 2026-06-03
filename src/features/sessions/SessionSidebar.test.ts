import { describe, expect, test } from "vite-plus/test";
import sidebarSource from "./SessionSidebar.vue?raw";

describe("SessionSidebar", () => {
  test("includes a new session action in the session dropdown", () => {
    expect(sidebarSource).toContain("newSessionValue");
    expect(sidebarSource).toContain("+ New session...");
  });

  test("renders the session select with a visible field treatment", () => {
    expect(sidebarSource).toContain('from "@/components/ui/select"');
    expect(sidebarSource).toContain("<SelectTrigger");
    expect(sidebarSource).toContain("session-select-trigger");
    expect(sidebarSource).toContain("bg-zinc-900/80");
    expect(sidebarSource).toContain("border-white/15");
  });

  test("leaves mobile presentation to the sheet component", () => {
    expect(sidebarSource).not.toContain("mobileOpen");
    expect(sidebarSource).not.toContain("translate-x-full");
    expect(sidebarSource).not.toContain("fixed inset-y-0");
  });

  test("disables session mutation controls while locked", () => {
    expect(sidebarSource).toContain(':disabled="disabled"');
    expect(sidebarSource).toContain("New");
    expect(sidebarSource).toContain("Clear");
  });
});
