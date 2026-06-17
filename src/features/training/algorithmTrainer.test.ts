import { describe, expect, test } from "vite-plus/test";
import { ALGORITHM_SETS } from "./algorithmCatalog";
import { algorithmStats, casesForMode, invertAlgorithm } from "./algorithmTrainer";
import type { AlgorithmSetId } from "./types";

const supportedSetIds: AlgorithmSetId[] = ["OLL", "PLL", "COLL", "ZBLL", "LSLL", "CLL2", "PLL4"];

describe("algorithm trainer helpers", () => {
  test("catalog includes every supported algorithm set", () => {
    expect(ALGORITHM_SETS.map((set) => set.id)).toEqual(supportedSetIds);

    for (const set of ALGORITHM_SETS) {
      expect(set.cases.length).toBeGreaterThan(0);
      expect(set.cases[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          description: expect.any(String),
          algorithm: expect.any(String),
        }),
      );
    }
  });

  test("filters cases for subset mode and falls back when subset is empty", () => {
    const pll = ALGORITHM_SETS.find((set) => set.id === "PLL")!;
    const subsetIds = [pll.cases[1]!.id, pll.cases[3]!.id];

    expect(casesForMode(pll, "subset", subsetIds).map((algorithmCase) => algorithmCase.id)).toEqual(
      subsetIds,
    );
    expect(casesForMode(pll, "subset", [])).toBe(pll.cases);
    expect(casesForMode(pll, "drill", subsetIds)).toBe(pll.cases);
  });

  test("inverts algorithms by reversing moves and flipping turn suffixes", () => {
    expect(invertAlgorithm("R U R' U'")).toBe("U R U' R'");
    expect(invertAlgorithm("R2 U F' M")).toBe("M' F U' R2");
  });

  test("summarizes empty timing history", () => {
    expect(algorithmStats([])).toEqual({
      count: 0,
      bestMs: null,
      averageMs: null,
      lastMs: null,
    });
  });

  test("summarizes populated timing history", () => {
    expect(algorithmStats([1200, 900, 1500])).toEqual({
      count: 3,
      bestMs: 900,
      averageMs: 1200,
      lastMs: 1500,
    });
  });
});
