import { Brain, Crosshair } from "lucide-react";
import type { TrainingMode } from "./types";

type TrainingHeaderProps = {
  activeTrainer: TrainingMode;
  onTrainerChange: (trainer: TrainingMode) => void;
};

const TRAINERS: Array<{ value: TrainingMode; label: string; icon: typeof Crosshair }> = [
  { value: "cross", label: "Cross", icon: Crosshair },
  { value: "algorithms", label: "Algorithms", icon: Brain },
];

export function TrainingHeader({ activeTrainer, onTrainerChange }: TrainingHeaderProps) {
  return (
    <header className="flex min-h-14 items-center justify-between gap-4 border-b border-white/[0.07] px-4 md:px-6">
      <div className="min-w-0">
        <h1 className="text-sm font-semibold text-zinc-100">Training</h1>
        <p className="mt-0.5 text-xs text-zinc-600">Practice shell</p>
      </div>
      <div
        aria-label="Training mode"
        className="inline-flex shrink-0 rounded-md border border-white/10 bg-black p-0.5"
      >
        {TRAINERS.map((trainer) => {
          const Icon = trainer.icon;
          const selected = trainer.value === activeTrainer;

          return (
            <button
              key={trainer.value}
              type="button"
              onClick={() => onTrainerChange(trainer.value)}
              className={`inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition ${
                selected ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              <Icon aria-hidden="true" size={14} strokeWidth={2} />
              <span>{trainer.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
