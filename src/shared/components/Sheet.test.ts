import { describe, expect, test } from "vite-plus/test";
import appSource from "../../App.vue?raw";

describe("mobile session sheet", () => {
  test("uses controlled Vue sheet markup with accessible title and description", () => {
    expect(appSource).toContain('data-slot="sheet"');
    expect(appSource).toContain('data-slot="sheet-title"');
    expect(appSource).toContain('data-slot="sheet-description"');
    expect(appSource).toContain("activeSheet === 'session'");
  });
});
