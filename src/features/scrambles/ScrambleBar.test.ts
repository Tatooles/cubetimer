import { describe, expect, test } from "vite-plus/test";
import scrambleBarSource from "./ScrambleBar.vue?raw";

describe("ScrambleBar", () => {
  test("uses the scramble text as the copy control", () => {
    expect(scrambleBarSource).toContain('aria-label="Copy scramble"');
    expect(scrambleBarSource).toContain("scramble-copy-target");
    expect(scrambleBarSource).not.toContain(">Copy</button>");
  });

  test("keeps event selection out of the scramble bar", () => {
    expect(scrambleBarSource).not.toContain('data-slot="select-trigger"');
    expect(scrambleBarSource).not.toContain("event-select-trigger");
  });

  test("disables next control while locked", () => {
    expect(scrambleBarSource).toContain(':disabled="disabled"');
    expect(scrambleBarSource).toContain("Next");
  });
});
