import { Brain, Crosshair, History } from "lucide-react";
import type { TrainingMode, TrainingState } from "./types";

type TrainingSidebarProps = {
  state: TrainingState;
  activeTrainer: TrainingMode;
  className?: string;
};

function algorithmRotationCount(state: TrainingState): number {
  const { activeSetId, mode, subsets } = state.algorithms.settings;
  const selectedSubsetCount = subsets[activeSetId]?.length ?? 0;
  return mode === "subset" ? selectedSubsetCount : Math.max(selectedSubsetCount, 0);
}

export function TrainingSidebar({ state, activeTrainer, className = "" }: TrainingSidebarProps) {
  const crossCount = state.cross.history.length;
  const rotationCount = algorithmRotationCount(state);
  const showingCross = activeTrainer === "cross";

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
            {showingCross ? crossCount : rotationCount}
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            {showingCross ? "saved attempts" : `${state.algorithms.settings.activeSetId} cases`}
          </p>
        </div>
      </section>
    </aside>
  );
}
