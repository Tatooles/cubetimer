import { useEffect, useMemo, useState } from "react";
import type { AlgorithmCase, AlgorithmSet } from "./algorithmCatalog";

type SubsetEditorProps = {
  open: boolean;
  set: AlgorithmSet;
  selectedIds: string[];
  onCancel: () => void;
  onSave: (selectedIds: string[]) => void;
};

function groupedCases(cases: AlgorithmCase[]): Array<[string, AlgorithmCase[]]> {
  const groups = new Map<string, AlgorithmCase[]>();

  for (const algorithmCase of cases) {
    const group = groups.get(algorithmCase.group) ?? [];
    group.push(algorithmCase);
    groups.set(algorithmCase.group, group);
  }

  return Array.from(groups.entries());
}

export function SubsetEditor({ open, set, selectedIds, onCancel, onSave }: SubsetEditorProps) {
  const [draftIds, setDraftIds] = useState<Set<string>>(() => new Set(selectedIds));
  const groups = useMemo(() => groupedCases(set.cases), [set.cases]);

  useEffect(() => {
    if (open) {
      setDraftIds(new Set(selectedIds));
    }
  }, [open, selectedIds]);

  if (!open) {
    return null;
  }

  function toggleCase(caseId: string) {
    setDraftIds((current) => {
      const next = new Set(current);
      if (next.has(caseId)) {
        next.delete(caseId);
      } else {
        next.add(caseId);
      }
      return next;
    });
  }

  function save() {
    onSave(
      set.cases
        .filter((algorithmCase) => draftIds.has(algorithmCase.id))
        .map((caseItem) => caseItem.id),
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 px-3 py-3 md:items-center">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Edit algorithm subset"
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-md border border-white/[0.08] bg-[#0a0a0b] shadow-2xl shadow-black/70"
      >
        <header className="border-b border-white/[0.07] px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Edit subset</h2>
              <p className="mt-1 text-xs text-zinc-600">
                {draftIds.size} of {set.cases.length} {set.name} cases selected.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDraftIds(new Set(set.cases.map((caseItem) => caseItem.id)))}
                className="rounded-md border border-white/[0.07] px-3 py-2 text-xs font-medium text-zinc-300 hover:border-white/15"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => setDraftIds(new Set())}
                className="rounded-md border border-white/[0.07] px-3 py-2 text-xs font-medium text-zinc-300 hover:border-white/15"
              >
                Select none
              </button>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <div className="space-y-4">
            {groups.map(([group, cases]) => (
              <section key={group}>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
                  {group}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {cases.map((algorithmCase) => (
                    <label
                      key={algorithmCase.id}
                      className="flex cursor-pointer items-start gap-3 rounded-md border border-white/[0.07] bg-white/[0.02] p-3 hover:border-white/15"
                    >
                      <input
                        type="checkbox"
                        checked={draftIds.has(algorithmCase.id)}
                        onChange={() => toggleCase(algorithmCase.id)}
                        className="mt-1"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-zinc-200">
                          {algorithmCase.name}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-zinc-600">
                          {algorithmCase.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-white/[0.07] px-4 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-white/[0.07] px-3 py-2 text-xs font-medium text-zinc-300 hover:border-white/15"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            className="rounded-md border border-white/[0.07] bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-950 hover:bg-white"
          >
            Done
          </button>
        </footer>
      </section>
    </div>
  );
}
