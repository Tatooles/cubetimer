import { afterEach, describe, expect, it, vi } from "vitest";
import { EVENTS } from "./events";
import { generateScramble } from "./scramble";

describe("scramble generation", () => {
  afterEach(() => {
    vi.doUnmock("cubing/scramble");
    vi.resetModules();
  });

  it("generates non-empty scrambles for every supported event", async () => {
    for (const event of EVENTS) {
      expect((await generateScramble(event.id)).trim(), event.name).not.toBe("");
    }
  });

  it("generates parseable-looking 3x3 move tokens", async () => {
    const moves = (await generateScramble("333")).split(" ");
    expect(moves.length).toBeGreaterThan(10);
    expect(moves.every((move) => /^[URFDLB][w]?[2']?$/.test(move))).toBe(true);
  });

  it("rejects when cubing cannot generate a scramble", async () => {
    vi.doMock("cubing/scramble", () => ({
      randomScrambleForEvent: vi.fn().mockRejectedValue(new Error("generation failed")),
    }));

    const { generateScramble } = await import("./scramble");

    await expect(generateScramble("333")).rejects.toThrow("generation failed");
  });
});
