import { Brain, Crosshair } from "lucide-react";
import type { TrainingMode } from "./types";

type TrainingHeaderProps = {
  activeTrainer: TrainingMode;
  onTrainerChange: (trainer: TrainingMode) => void;
  className?: string;
  compact?: boolean;
};

const TRAINERS: Array<{ value: TrainingMode; label: string; icon: typeof Crosshair }> = [
  { value: "cross", label: "Cross", icon: Crosshair },
  { value: "algorithms", label: "Algorithms", icon: Brain },
];

export function TrainingModeSwitch({
  activeTrainer,
  onTrainerChange,
  className = "",
  compact = false,
}: TrainingHeaderProps) {
  return (
    <div
      aria-label="Training mode"
      className={`inline-flex min-w-0 shrink-0 rounded-md border border-white/10 bg-black p-0.5 ${className}`}
    >
      {TRAINERS.map((trainer) => {
        const Icon = trainer.icon;
        const selected = trainer.value === activeTrainer;
        const label = compact && trainer.value === "algorithms" ? "Algs" : trainer.label;

        return (
          <button
            key={trainer.value}
            type="button"
            onClick={() => onTrainerChange(trainer.value)}
            className={`inline-flex h-8 items-center rounded text-xs font-medium transition ${
              selected ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-200"
            } ${compact ? "gap-1 px-1.5" : "gap-1.5 px-2.5"}`}
          >
            {compact ? null : <Icon aria-hidden="true" size={14} strokeWidth={2} />}
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
