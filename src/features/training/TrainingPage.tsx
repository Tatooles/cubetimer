import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "../../shared/components/Sheet";
import { AlgorithmSettings } from "./AlgorithmSettings";
import { AlgorithmTrainer } from "./AlgorithmTrainer.tsx";
import { ALGORITHM_SETS } from "./algorithmCatalog";
import { CrossSettings } from "./CrossSettings";
import { CrossTrainer } from "./CrossTrainer.tsx";
import { SubsetEditor } from "./SubsetEditor";
import {
  loadTrainingState,
  recordAlgorithmTime,
  recordCrossAttempt,
  saveTrainingState,
  updateAlgorithmSettings,
  updateCrossSettings,
} from "./trainingStore";
import { TrainingHeader } from "./TrainingHeader";
import { TrainingMobileNav, type TrainingMobilePanel } from "./TrainingMobileNav";
import { TrainingSidebar } from "./TrainingSidebar";
import type {
  AlgorithmSetId,
  CrossRating,
  CrossSettings as CrossSettingsValue,
  TrainingMode,
  TrainingState,
} from "./types";

let fallbackAttemptIdCounter = 0;

function createAttemptId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  fallbackAttemptIdCounter += 1;
  return `cross-${Date.now().toString(36)}-${fallbackAttemptIdCounter.toString(36)}`;
}

export function TrainingPage() {
  const [state, setState] = useState<TrainingState>(() => loadTrainingState());
  const [activeMobilePanel, setActiveMobilePanel] = useState<TrainingMobilePanel>(null);
  const [editingSubsetSetId, setEditingSubsetSetId] = useState<AlgorithmSetId | null>(null);
  const activeAlgorithmSet =
    ALGORITHM_SETS.find((set) => set.id === state.algorithms.settings.activeSetId) ??
    ALGORITHM_SETS[0]!;
  const editingAlgorithmSet =
    ALGORITHM_SETS.find((set) => set.id === editingSubsetSetId) ?? activeAlgorithmSet;

  useEffect(() => {
    saveTrainingState(state);
  }, [state]);

  function setActiveTrainer(activeTrainer: TrainingMode) {
    setActiveMobilePanel(null);
    setState((current) => ({ ...current, activeTrainer }));
  }

  function updateCrossSettingsPatch(patch: Partial<CrossSettingsValue>) {
    setState((current) => updateCrossSettings(current, patch));
  }

  function updateAlgorithmSettingsPatch(
    patch: Partial<Pick<TrainingState["algorithms"]["settings"], "activeSetId" | "mode">>,
  ) {
    setState((current) => updateAlgorithmSettings(current, patch));
  }

  function saveAlgorithmSubset(selectedIds: string[]) {
    const setId = editingSubsetSetId;
    setEditingSubsetSetId(null);
    if (!setId) {
      return;
    }

    setState((current) =>
      updateAlgorithmSettings(current, {
        subsets: {
          ...current.algorithms.settings.subsets,
          [setId]: selectedIds,
        },
      }),
    );
  }

  function recordAlgorithmCaseTime(setId: AlgorithmSetId, caseId: string, ms: number) {
    setState((current) => recordAlgorithmTime(current, setId, caseId, ms));
  }

  function openSubsetEditor() {
    setEditingSubsetSetId(state.algorithms.settings.activeSetId);
  }

  function recordRatedCrossAttempt(attempt: {
    scramble: string;
    solution: string[];
    moveCount: number;
    rating: CrossRating;
    flagged: boolean;
    xcross: boolean;
  }) {
    setState((current) =>
      recordCrossAttempt(current, {
        id: createAttemptId(),
        scramble: attempt.scramble,
        solution: attempt.solution,
        moveCount: attempt.moveCount,
        rating: attempt.rating,
        flagged: attempt.flagged,
        xcross: attempt.xcross,
        timestamp: Date.now(),
      }),
    );
  }

  function renderSettingsRail() {
    return state.activeTrainer === "cross" ? (
      <CrossSettings settings={state.cross.settings} onChange={updateCrossSettingsPatch} />
    ) : (
      <AlgorithmSettings
        settings={state.algorithms.settings}
        onChange={updateAlgorithmSettingsPatch}
        onEditSubset={openSubsetEditor}
      />
    );
  }

  return (
    <section className="grid h-full min-h-0 grid-rows-[56px_1fr_64px] bg-[#0a0a0b] text-zinc-100 md:grid-cols-[264px_1fr_296px] md:grid-rows-[56px_1fr]">
      <div className="col-span-full">
        <TrainingHeader activeTrainer={state.activeTrainer} onTrainerChange={setActiveTrainer} />
      </div>

      <TrainingSidebar
        state={state}
        activeTrainer={state.activeTrainer}
        className="hidden md:col-start-1 md:row-start-2 md:flex md:border-r"
      />

      <main className="min-h-0 min-w-0 md:col-start-2 md:row-start-2">
        {state.activeTrainer === "cross" ? (
          <CrossTrainer settings={state.cross.settings} onRate={recordRatedCrossAttempt} />
        ) : (
          <AlgorithmTrainer
            settings={state.algorithms.settings}
            historyByCase={state.algorithms.historyByCase}
            onRecordTime={recordAlgorithmCaseTime}
          />
        )}
      </main>

      <aside className="hidden overflow-y-auto border-l border-white/[0.07] md:col-start-3 md:row-start-2 md:block">
        {renderSettingsRail()}
      </aside>

      <TrainingMobileNav active={activeMobilePanel} onSelect={setActiveMobilePanel} />

      <Sheet
        modal={false}
        open={activeMobilePanel === "history"}
        onOpenChange={(open) => {
          if (!open) {
            setActiveMobilePanel(null);
          }
        }}
      >
        <SheetContent
          side="left"
          className="w-[min(320px,88vw)] overflow-hidden border-white/[0.07] bg-[#0a0a0b] p-0"
        >
          <SheetTitle className="sr-only">Training history</SheetTitle>
          <SheetDescription className="sr-only">
            Training history for the active trainer.
          </SheetDescription>
          <TrainingSidebar state={state} activeTrainer={state.activeTrainer} className="h-full" />
        </SheetContent>
      </Sheet>

      <Sheet
        modal={false}
        open={activeMobilePanel === "settings"}
        onOpenChange={(open) => {
          if (!open) {
            setActiveMobilePanel(null);
          }
        }}
      >
        <SheetContent
          side="right"
          className="w-[min(320px,88vw)] overflow-hidden border-white/[0.07] bg-[#0a0a0b] p-0"
        >
          <SheetTitle className="sr-only">Training settings</SheetTitle>
          <SheetDescription className="sr-only">
            Training settings for the active trainer.
          </SheetDescription>
          {renderSettingsRail()}
        </SheetContent>
      </Sheet>

      <SubsetEditor
        open={editingSubsetSetId !== null}
        set={editingAlgorithmSet}
        selectedIds={state.algorithms.settings.subsets[editingAlgorithmSet.id] ?? []}
        onCancel={() => setEditingSubsetSetId(null)}
        onSave={saveAlgorithmSubset}
      />
    </section>
  );
}
