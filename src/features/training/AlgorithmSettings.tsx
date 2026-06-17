import { ALGORITHM_SETS } from "./algorithmCatalog";
import type {
  AlgorithmMode,
  AlgorithmSetId,
  AlgorithmSettings as AlgorithmSettingsValue,
} from "./types";

type AlgorithmSettingsProps = {
  settings: AlgorithmSettingsValue;
  onChange: (patch: Partial<Pick<AlgorithmSettingsValue, "activeSetId" | "mode">>) => void;
  onEditSubset: () => void;
};

const MODES: Array<{ value: AlgorithmMode; label: string }> = [
  { value: "drill", label: "Drill" },
  { value: "subset", label: "Subset" },
];

export function AlgorithmSettings({ settings, onChange, onEditSubset }: AlgorithmSettingsProps) {
  const activeSet =
    ALGORITHM_SETS.find((set) => set.id === settings.activeSetId) ?? ALGORITHM_SETS[0]!;
  const subsetCount = settings.subsets[activeSet.id]?.length ?? 0;

  return (
    <section className="h-full overflow-y-auto border-white/[0.07] px-5 py-4">
      <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
        Settings
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="text-xs font-medium text-zinc-400">Algorithm set</span>
          <select
            value={activeSet.id}
            onChange={(event) => onChange({ activeSetId: event.target.value as AlgorithmSetId })}
            className="mt-2 h-10 w-full rounded-md border border-white/[0.07] bg-black px-3 text-sm text-zinc-100 outline-none focus:border-white/20"
          >
            {ALGORITHM_SETS.map((set) => (
              <option key={set.id} value={set.id}>
                {set.name}
              </option>
            ))}
          </select>
        </label>

        <div>
          <div className="mb-2 text-xs font-medium text-zinc-400">Practice mode</div>
          <div className="grid grid-cols-2 rounded-md border border-white/10 bg-black p-0.5">
            {MODES.map((mode) => {
              const selected = mode.value === settings.mode;

              return (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => onChange({ mode: mode.value })}
                  className={`h-9 rounded text-xs font-medium transition ${
                    selected ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-200"
                  }`}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-md border border-white/[0.07] bg-white/[0.02] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-zinc-200">Subset</div>
              <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                {subsetCount} selected from {activeSet.caseCount} {activeSet.name} cases.
              </p>
            </div>
            <button
              type="button"
              onClick={onEditSubset}
              className="shrink-0 rounded-md border border-white/[0.07] px-3 py-2 text-xs font-medium text-zinc-300 hover:border-white/15"
            >
              Edit subset
            </button>
          </div>
        </div>

        <div className="rounded-md border border-white/[0.07] bg-white/[0.02] p-3">
          <div className="text-sm font-medium text-zinc-200">{activeSet.name}</div>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600">{activeSet.description}</p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-700">
            {activeSet.id} · {activeSet.group}
          </p>
        </div>
      </div>
    </section>
  );
}
