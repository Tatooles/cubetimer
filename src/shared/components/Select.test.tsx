import { describe, expect, test } from "vite-plus/test";
import selectSource from "./Select.tsx?raw";

describe("Select", () => {
  test("keeps both trigger and content out of app-level shortcuts", () => {
    expect(selectSource).toContain('data-slot="select-trigger"');
    expect(selectSource).toContain('data-slot="select-content"');
    expect(selectSource.match(/data-global-shortcuts="ignore"/g)).toHaveLength(2);
    expect(selectSource.indexOf('data-slot="select-trigger"')).toBeLessThan(
      selectSource.indexOf('data-slot="select-content"'),
    );
  });
});
