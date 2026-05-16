import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { cube3x3x3 } from "cubing/puzzles";
import { EVENTS } from "./events";
import {
  appendScrambleHistory,
  generateScramble,
  nextScrambleHistory,
  previousScrambleHistory,
  shouldShowScrambleLoading,
} from "./scramble";
import { randomLSLLPatternData } from "./trainingScrambles333";

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

  it("builds LSLL states with cross and three F2L slots solved", () => {
    const pattern = randomLSLLPatternData();

    expect(pattern.EDGES.pieces.slice(4, 8)).toEqual([4, 5, 6, 7]);
    expect(pattern.EDGES.orientation.slice(4, 8)).toEqual([0, 0, 0, 0]);
    expect(pattern.EDGES.pieces.slice(9, 12)).toEqual([9, 10, 11]);
    expect(pattern.EDGES.orientation.slice(9, 12)).toEqual([0, 0, 0]);
    expect(pattern.CORNERS.pieces.slice(5, 8)).toEqual([5, 6, 7]);
    expect(pattern.CORNERS.orientation.slice(5, 8)).toEqual([0, 0, 0]);
  });

  it("generates parseable-looking LSLL scrambles", async () => {
    const moves = (await generateScramble("333-lsll")).split(" ");

    expect(moves.length).toBeGreaterThan(3);
    expect(moves.every((move) => /^[URFDLB][2']?$/.test(move))).toBe(true);
  });

  it("generates LSLL scrambles that preserve the cross and three F2L slots", async () => {
    const kpuzzle = await cube3x3x3.kpuzzle();
    const scramble = await generateScramble("333-lsll");
    const pattern = kpuzzle.defaultPattern().applyAlg(scramble).patternData;

    expect(pattern.EDGES.pieces.slice(4, 8)).toEqual([4, 5, 6, 7]);
    expect(pattern.EDGES.orientation.slice(4, 8)).toEqual([0, 0, 0, 0]);
    expect(pattern.EDGES.pieces.slice(9, 12)).toEqual([9, 10, 11]);
    expect(pattern.EDGES.orientation.slice(9, 12)).toEqual([0, 0, 0]);
    expect(pattern.CORNERS.pieces.slice(5, 8)).toEqual([5, 6, 7]);
    expect(pattern.CORNERS.orientation.slice(5, 8)).toEqual([0, 0, 0]);
  });

  it("rejects when cubing cannot generate a scramble", async () => {
    vi.doMock("cubing/scramble", () => ({
      randomScrambleForEvent: vi.fn().mockRejectedValue(new Error("generation failed")),
    }));

    const { generateScramble } = await import("./scramble");

    await expect(generateScramble("333")).rejects.toThrow("generation failed");
  });

  it("tracks previous and next scrambles", () => {
    const first = appendScrambleHistory({ entries: [], index: -1 }, "first");
    const second = appendScrambleHistory(first, "second");
    const previous = previousScrambleHistory(second);
    const next = nextScrambleHistory(previous);

    expect(previous).toEqual({ entries: ["first", "second"], index: 0 });
    expect(next).toEqual(second);
  });

  it("drops future scrambles when a new scramble is generated after going back", () => {
    const first = appendScrambleHistory({ entries: [], index: -1 }, "first");
    const second = appendScrambleHistory(first, "second");
    const previous = previousScrambleHistory(second);
    const third = appendScrambleHistory(previous, "third");

    expect(third).toEqual({ entries: ["first", "third"], index: 1 });
  });

  it("shows loading only for initial generation and history resets", () => {
    expect(shouldShowScrambleLoading({ entries: [], index: -1 }, false)).toBe(true);
    expect(shouldShowScrambleLoading({ entries: ["first"], index: 0 }, false)).toBe(false);
    expect(shouldShowScrambleLoading({ entries: ["first"], index: 0 }, true)).toBe(true);
  });
});
