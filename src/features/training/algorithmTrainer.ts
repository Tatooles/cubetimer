import type { AlgorithmCase, AlgorithmSet } from "./algorithmCatalog";
import type { AlgorithmMode } from "./types";

export type AlgorithmStats = {
  count: number;
  bestMs: number | null;
  averageMs: number | null;
  lastMs: number | null;
};

export function casesForMode(
  set: AlgorithmSet,
  mode: AlgorithmMode,
  subsetIds: string[],
): AlgorithmCase[] {
  if (mode !== "subset" || subsetIds.length === 0) {
    return set.cases;
  }

  const subset = new Set(subsetIds);
  return set.cases.filter((algorithmCase) => subset.has(algorithmCase.id));
}

function invertMove(move: string): string {
  if (move.endsWith("2")) {
    return move;
  }
  if (move.endsWith("'")) {
    return move.slice(0, -1);
  }
  return `${move}'`;
}

export function invertAlgorithm(algorithm: string): string {
  return algorithm.trim().split(/\s+/).reverse().map(invertMove).join(" ");
}

export function algorithmStats(times: number[]): AlgorithmStats {
  if (times.length === 0) {
    return {
      count: 0,
      bestMs: null,
      averageMs: null,
      lastMs: null,
    };
  }

  const totalMs = times.reduce((sum, time) => sum + time, 0);

  return {
    count: times.length,
    bestMs: Math.min(...times),
    averageMs: Math.round(totalMs / times.length),
    lastMs: times[times.length - 1]!,
  };
}
