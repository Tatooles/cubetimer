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

  test("returns false when legacy copy is unavailable", async () => {
    const previousDocument = typeof document === "undefined" ? undefined : document;

    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {},
    });

    try {
      await expect(copyTextToClipboard("R U")).resolves.toBe(false);
    } finally {
      if (previousDocument) {
        Object.defineProperty(globalThis, "document", {
          configurable: true,
          value: previousDocument,
        });
      } else {
        Reflect.deleteProperty(globalThis, "document");
      }
    }
  });
});
