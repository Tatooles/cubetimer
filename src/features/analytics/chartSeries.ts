import { calculateAverage, effectiveSolveTime } from "../sessions/solveStats";
import type { Solve } from "../sessions/types";

export type ProgressPoint = {
  index: number;
  single: number | null;
  ao5: number | null;
  ao12: number | null;
};

function seconds(value: number | null): number | null {
  return value == null || !Number.isFinite(value) ? null : value / 1000;
}

export function progressSeries(solves: Solve[]): ProgressPoint[] {
  return solves.map((solve, index) => {
    const window = solves.slice(0, index + 1);
    return {
      index: index + 1,
      single: seconds(effectiveSolveTime(solve)),
      ao5: seconds(calculateAverage(window, 5)),
      ao12: seconds(calculateAverage(window, 12)),
    };
  });
}

export type HistogramBucket = {
  label: string;
  min: number;
  max: number;
  count: number;
};

export function histogramBuckets(solves: Solve[], bucketCount = 8): HistogramBucket[] {
  const values = solves
    .map(effectiveSolveTime)
    .filter(Number.isFinite)
    .map((value) => value / 1000);
  if (values.length === 0) {
    return [];
  }

  const min = Math.floor(Math.min(...values));
  const max = Math.ceil(Math.max(...values));
  const span = Math.max(1, max - min);
  const size = Math.max(1, Math.ceil(span / bucketCount));
  const buckets = Array.from({ length: Math.ceil(span / size) + 1 }, (_, index) => {
    const bucketMin = min + index * size;
    const bucketMax = bucketMin + size;
    return {
      label: `${bucketMin}-${bucketMax}s`,
      min: bucketMin,
      max: bucketMax,
      count: 0,
    };
  });

  values.forEach((value) => {
    const bucket =
      buckets.find((candidate) => value >= candidate.min && value < candidate.max) ??
      buckets[buckets.length - 1];
    bucket.count += 1;
  });

  return buckets;
}
