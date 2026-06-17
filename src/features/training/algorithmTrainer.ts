import type { AlgorithmCase, AlgorithmSet } from "./algorithmCatalog";
import type { AlgorithmMode, AlgorithmTime } from "./types";

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

  const casesById = new Map(set.cases.map((algorithmCase) => [algorithmCase.id, algorithmCase]));
  return subsetIds.flatMap((caseId) => {
    const algorithmCase = casesById.get(caseId);
    return algorithmCase ? [algorithmCase] : [];
  });
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

export function algorithmStats(history: AlgorithmTime[]): AlgorithmStats {
  if (history.length === 0) {
    return {
      count: 0,
      bestMs: null,
      averageMs: null,
      lastMs: null,
    };
  }

  const times = history.map((time) => time.ms);
  const totalMs = times.reduce((sum, time) => sum + time, 0);

  return {
    count: history.length,
    bestMs: Math.min(...times),
    averageMs: Math.round(totalMs / history.length),
    lastMs: history[history.length - 1]!.ms,
  };
}
