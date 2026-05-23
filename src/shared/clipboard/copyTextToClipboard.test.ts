import { describe, expect, test } from "vite-plus/test";
import { copyTextToClipboard } from "./copyTextToClipboard";

describe("copyTextToClipboard", () => {
  test("falls back when the async clipboard writer rejects", async () => {
    const copied = await copyTextToClipboard("R U R'", {
      clipboard: {
        writeText: () => Promise.reject(new Error("blocked")),
      },
      legacyCopy: (text) => text === "R U R'",
    });

    expect(copied).toBe(true);
  });
});
