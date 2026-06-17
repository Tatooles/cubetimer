import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "../../shared/components/Sheet";
import { loadTrainingState, saveTrainingState } from "./trainingStore";
import { TrainingHeader } from "./TrainingHeader";
import { TrainingMobileNav, type TrainingMobilePanel } from "./TrainingMobileNav";
import { TrainingSidebar } from "./TrainingSidebar";
import type { TrainingMode, TrainingState } from "./types";

function trainerLabel(trainer: TrainingMode): string {
  return trainer === "cross" ? "Cross trainer" : "Algorithm trainer";
}

function SettingsPlaceholder({ state }: { state: TrainingState }) {
  return (
    <section className="h-full overflow-y-auto border-white/[0.07] px-5 py-4">
      <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
        Settings
      </div>
      <div className="rounded-md border border-white/[0.07] bg-white/[0.02] p-3 text-sm text-zinc-500">
        {state.activeTrainer === "cross"
          ? `${state.cross.settings.color} cross, ${state.cross.settings.moveTarget} move target`
          : `${state.algorithms.settings.activeSetId} ${state.algorithms.settings.mode}`}
      </div>
    </section>
  );
}

export function TrainingPage() {
  const [state, setState] = useState<TrainingState>(() => loadTrainingState());
  const [activeMobilePanel, setActiveMobilePanel] = useState<TrainingMobilePanel>(null);

  useEffect(() => {
    saveTrainingState(state);
  }, [state]);

  function setActiveTrainer(activeTrainer: TrainingMode) {
    setActiveMobilePanel(null);
    setState((current) => ({ ...current, activeTrainer }));
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
        <div className="flex h-full items-center justify-center px-4">
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-200">{trainerLabel(state.activeTrainer)}</p>
            <p className="mt-2 text-xs text-zinc-600">Trainer workspace placeholder</p>
          </div>
        </div>
      </main>

      <aside className="hidden overflow-y-auto border-l border-white/[0.07] md:col-start-3 md:row-start-2 md:block">
        <SettingsPlaceholder state={state} />
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
          <SettingsPlaceholder state={state} />
        </SheetContent>
      </Sheet>
    </section>
  );
}
