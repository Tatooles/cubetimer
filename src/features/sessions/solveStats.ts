import type { SessionStats, Solve, StatKey, StatRecord } from "./types";

const STAT_KEYS: StatKey[] = ["single", "ao5", "ao12", "ao50", "ao100"];

export function effectiveSolveTime(solve: Solve): number {
  if (solve.penalty === "DNF") {
    return Number.POSITIVE_INFINITY;
  }

  return solve.penalty === "+2" ? solve.ms + 2000 : solve.ms;
}

export function calculateAverage(solves: Solve[], size: number): number | null {
  if (solves.length < size) {
    return null;
  }

  const values = solves
    .slice(-size)
    .map(effectiveSolveTime)
    .sort((a, b) => a - b);
  const trimCount = size <= 5 ? 1 : Math.ceil(size * 0.05);
  const dnfCount = values.filter((value) => value === Number.POSITIVE_INFINITY).length;

  if (dnfCount > trimCount) {
    return Number.POSITIVE_INFINITY;
  }

  const trimmed = values.slice(trimCount, values.length - trimCount);
  return trimmed.reduce((sum, value) => sum + value, 0) / trimmed.length;
}

export function meanTime(solves: Solve[]): number | null {
  const valid = solves.map(effectiveSolveTime).filter(Number.isFinite);
  if (valid.length === 0) {
    return null;
  }

  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

export function rollingStats(solves: Solve[]): Record<StatKey, Array<number | null>> {
  const series: Record<StatKey, Array<number | null>> = {
    single: [],
    ao5: [],
    ao12: [],
    ao50: [],
    ao100: [],
  };

  for (let index = 0; index < solves.length; index += 1) {
    const window = solves.slice(0, index + 1);
    series.single.push(effectiveSolveTime(solves[index]));
    series.ao5.push(calculateAverage(window, 5));
    series.ao12.push(calculateAverage(window, 12));
    series.ao50.push(calculateAverage(window, 50));
    series.ao100.push(calculateAverage(window, 100));
  }

  return series;
}

export function sessionStats(solves: Solve[]): SessionStats {
  const current: StatRecord = {
    single: solves.length > 0 ? effectiveSolveTime(solves[solves.length - 1]) : null,
    ao5: calculateAverage(solves, 5),
    ao12: calculateAverage(solves, 12),
    ao50: calculateAverage(solves, 50),
    ao100: calculateAverage(solves, 100),
  };
  const series = rollingStats(solves);
  const best = STAT_KEYS.reduce<StatRecord>(
    (record, key) => {
      const finite = series[key].filter(
        (value): value is number => value != null && Number.isFinite(value),
      );
      record[key] = finite.length > 0 ? Math.min(...finite) : null;
      return record;
    },
    { single: null, ao5: null, ao12: null, ao50: null, ao100: null },
  );

  return {
    current,
    best,
    count: solves.length,
    mean: meanTime(solves),
  };
}
