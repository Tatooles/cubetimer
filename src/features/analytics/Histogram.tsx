import { useMemo } from "react";
import { histogramBuckets } from "./chartSeries";
import type { Solve } from "../sessions/types";

type HistogramProps = {
  solves: Solve[];
};

export function Histogram({ solves }: HistogramProps) {
  const buckets = useMemo(() => histogramBuckets(solves), [solves]);
  const max = Math.max(1, ...buckets.map((bucket) => bucket.count));

  if (buckets.length === 0) {
    return (
      <div className="flex h-[150px] items-center text-xs text-zinc-600">No solve data yet</div>
    );
  }

  return (
    <div className="flex h-[150px] items-end gap-1">
      {buckets.map((bucket) => (
        <div key={bucket.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div
            className="w-full rounded-t-sm bg-indigo-400/80"
            style={{ height: `${Math.max(6, (bucket.count / max) * 118)}px` }}
            title={`${bucket.label}: ${bucket.count}`}
          />
          <span className="truncate font-mono text-[9px] text-zinc-700">{bucket.min}</span>
        </div>
      ))}
    </div>
  );
}
