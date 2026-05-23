import { describe, expect, test } from "vite-plus/test";

describe("global component styles", () => {
  test("overrides shared select defaults for the mobile event toolbar trigger", async () => {
    // @ts-expect-error The test runner has Node APIs, but the app tsconfig omits Node module types.
    const { readFileSync } = await import("node:fs");
    const cssSource = readFileSync(new URL("./index.css", import.meta.url), "utf8") as string;

    expect(cssSource).toContain(".event-select-toolbar-trigger");
    expect(cssSource).toContain("background: transparent");
    expect(cssSource).toContain("border-color: transparent");
    expect(cssSource).toContain("height: 36px");
  });
});
