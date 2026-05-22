import { formatSolveTime } from "../timer/timerFormat";
import type { Solve } from "./types";

type SolveDetailModalProps = {
  solve: Solve | null;
  onClose: () => void;
  onPenalty: (solveId: string, penalty: Solve["penalty"]) => void;
  onComment: (solveId: string, comment: string) => void;
  onDelete: (solveId: string) => void;
};

export function SolveDetailModal({
  solve,
  onClose,
  onPenalty,
  onComment,
  onDelete,
}: SolveDetailModalProps) {
  if (!solve) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <section
        className="w-full max-w-[480px] rounded-xl border border-white/10 bg-zinc-950 p-5 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
          Solve detail
        </h2>
        <div className="mt-3 font-mono text-5xl font-light text-zinc-100">
          {formatSolveTime(solve.ms, solve.penalty)}
        </div>
        <div className="mt-2 font-mono text-xs text-zinc-500">
          {new Date(solve.timestamp).toLocaleString()}
        </div>
        <p className="mt-4 rounded-md bg-black p-3 font-mono text-xs leading-relaxed text-zinc-300">
          {solve.scramble}
        </p>
        <textarea
          defaultValue={solve.comment ?? ""}
          onBlur={(event) => onComment(solve.id, event.target.value)}
          placeholder="Notes"
          className="mt-4 min-h-20 w-full rounded-md border border-white/10 bg-black p-3 text-sm text-zinc-100 outline-none focus:border-indigo-400"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onPenalty(solve.id, "OK")}
            className={`modal-button ${solve.penalty === "OK" ? "modal-button-on" : ""}`}
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => onPenalty(solve.id, solve.penalty === "+2" ? "OK" : "+2")}
            className={`modal-button ${solve.penalty === "+2" ? "modal-button-on" : ""}`}
          >
            +2
          </button>
          <button
            type="button"
            onClick={() => onPenalty(solve.id, solve.penalty === "DNF" ? "OK" : "DNF")}
            className={`modal-button ${solve.penalty === "DNF" ? "modal-button-on" : ""}`}
          >
            DNF
          </button>
          <button
            type="button"
            onClick={() => onDelete(solve.id)}
            className="modal-button text-red-300"
          >
            Delete
          </button>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-semibold text-black"
          >
            Close
          </button>
        </div>
      </section>
    </div>
  );
}
