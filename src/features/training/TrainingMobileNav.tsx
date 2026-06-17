import { History, SlidersHorizontal } from "lucide-react";

export type TrainingMobilePanel = "history" | "settings" | null;

type TrainingMobileNavProps = {
  active: TrainingMobilePanel;
  onSelect: (panel: TrainingMobilePanel) => void;
};

const PANELS: Array<{
  id: Exclude<TrainingMobilePanel, null>;
  label: string;
  icon: typeof History;
}> = [
  { id: "history", label: "History", icon: History },
  { id: "settings", label: "Settings", icon: SlidersHorizontal },
];

export function TrainingMobileNav({ active, onSelect }: TrainingMobileNavProps) {
  return (
    <nav className="border-t border-white/[0.07] bg-[#0a0a0b] md:hidden" aria-label="Training">
      <div className="grid h-16 grid-cols-2">
        {PANELS.map((panel) => {
          const Icon = panel.icon;
          const selected = panel.id === active;

          return (
            <button
              key={panel.id}
              type="button"
              onClick={() => onSelect(selected ? null : panel.id)}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${
                selected ? "text-indigo-200" : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              <Icon aria-hidden="true" size={18} strokeWidth={2} />
              <span>{panel.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
