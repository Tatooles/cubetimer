import { describe, expect, test } from "vite-plus/test";
import eventSelectorSource from "../../features/scrambles/EventSelector.vue?raw";
import sessionSidebarSource from "../../features/sessions/SessionSidebar.vue?raw";

describe("select controls", () => {
  test("keep triggers out of app-level shortcuts", () => {
    expect(eventSelectorSource).toContain('data-slot="select-trigger"');
    expect(eventSelectorSource).toContain('data-global-shortcuts="ignore"');
    expect(sessionSidebarSource).toContain('data-slot="select-trigger"');
    expect(sessionSidebarSource).toContain('data-global-shortcuts="ignore"');
  });
});
