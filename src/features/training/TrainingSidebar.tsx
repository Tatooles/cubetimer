import { Brain, Crosshair, History } from "lucide-react";
import { formatSolveTime } from "../timer/timerFormat";
import { ALGORITHM_SETS } from "./algorithmCatalog";
import { algorithmStats, casesForMode } from "./algorithmTrainer";
import type { TrainingMode, TrainingState } from "./types";

type TrainingSidebarProps = {
  state: TrainingState;
  activeTrainer: TrainingMode;
  className?: string;
  onClearCrossHistory?: () => void;
};

function activeAlgorithmCases(state: TrainingState) {
  const { activeSetId, mode, subsets } = state.algorithms.settings;
  const set =
    ALGORITHM_SETS.find((candidate) => candidate.id === activeSetId) ?? ALGORITHM_SETS[0]!;
  const subsetIds = subsets[set.id] ?? [];
  const cases =
    mode === "subset" && subsetIds.length === 0
      ? casesForMode(set, mode, ["__empty_subset__"])
      : casesForMode(set, mode, subsetIds);

  return { set, cases };
}

export function TrainingSidebar({
  state,
  activeTrainer,
  className = "",
  onClearCrossHistory,
}: TrainingSidebarProps) {
  const crossCount = state.cross.history.length;
  const algorithmRotation = activeAlgorithmCases(state);
  const showingCross = activeTrainer === "cross";
  const latestCrossAttempts = state.cross.history
    .map((attempt, index) => ({ attempt, number: index + 1 }))
    .slice(-8)
    .reverse();

  return (
    <aside className={`flex flex-col overflow-y-auto border-white/[0.07] ${className}`}>
      <section className="border-b border-white/[0.07] px-5 py-4">
        <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
          <History aria-hidden="true" size={13} />
          <span>History</span>
        </div>
        <div className="rounded-md border border-white/[0.07] bg-white/[0.02] p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
            {showingCross ? (
              <Crosshair aria-hidden="true" size={16} />
            ) : (
              <Brain aria-hidden="true" size={16} />
            )}
            <span>{showingCross ? "Cross attempts" : "Algorithm rotation"}</span>
          </div>
          <p className="mt-2 font-mono text-2xl text-zinc-100">
            {showingCross ? crossCount : algorithmRotation.cases.length}
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            {showingCross ? "saved attempts" : `${algorithmRotation.set.name} cases`}
          </p>
        </div>
      </section>

      {showingCross ? (
        <section className="px-5 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
              Latest
            </div>
            {crossCount > 0 ? (
              <button
                type="button"
                onClick={onClearCrossHistory}
                className="rounded border border-white/[0.07] px-2 py-1 text-[10px] font-medium text-zinc-500 hover:border-white/15 hover:text-zinc-200"
              >
                Clear
              </button>
            ) : null}
          </div>
          <div className="space-y-2">
            {latestCrossAttempts.length > 0 ? (
              latestCrossAttempts.map(({ attempt, number }) => (
                <div
                  key={`${attempt.id}-${number}`}
                  className="rounded-md border border-white/[0.07] bg-white/[0.02] px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs text-zinc-500">#{number}</span>
                    <span className="text-xs font-medium capitalize text-zinc-200">
                      {attempt.rating}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3 text-xs text-zinc-600">
                    <span>{attempt.moveCount} moves</span>
                    {attempt.flagged ? <span className="text-amber-200">Flagged</span> : null}
                  </div>
                  <p className="mt-2 break-words font-mono text-[11px] leading-relaxed text-zinc-500">
                    {attempt.scramble}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-600">No cross attempts yet.</p>
            )}
          </div>
        </section>
      ) : (
        <section className="px-5 py-4">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
            Active cases
          </div>
          <div className="space-y-2">
            {algorithmRotation.cases.length > 0 ? (
              algorithmRotation.cases.map((algorithmCase) => {
                const stats = algorithmStats(
                  state.algorithms.historyByCase[algorithmCase.id] ?? [],
                );

                return (
                  <div
                    key={algorithmCase.id}
                    className="rounded-md border border-white/[0.07] bg-white/[0.02] px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-xs font-medium text-zinc-200">
                        {algorithmCase.name}
                      </span>
                      <span className="font-mono text-xs text-zinc-500">
                        {formatSolveTime(stats.bestMs)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3 text-xs text-zinc-600">
                      <span>{algorithmCase.id}</span>
                      <span>{algorithmCase.group}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-zinc-600">No algorithm cases selected.</p>
            )}
          </div>
        </section>
      )}
    </aside>
  );
}
