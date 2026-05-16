import { formatSolveTime } from "../timer/timerFormat";
import { rollingStats } from "./solveStats";
import type { Solve } from "./types";

type SolveListProps = {
  solves: Solve[];
  onOpen: (solve: Solve) => void;
  onPenalty: (solveId: string, penalty: Solve["penalty"]) => void;
  onDelete: (solveId: string) => void;
};

export function SolveList({ solves, onOpen, onPenalty, onDelete }: SolveListProps) {
  const series = rollingStats(solves);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto pb-3">
      {[...solves].reverse().map((solve) => {
        const index = solves.findIndex((candidate) => candidate.id === solve.id);
        const ao5 = series.ao5[index];
        const ao12 = series.ao12[index];
        return (
          <button
            key={solve.id}
            type="button"
            onClick={() => onOpen(solve)}
            className="group grid w-full grid-cols-[2.25rem_1fr_3.5rem_3.5rem] items-center px-5 py-1.5 text-left font-mono text-xs transition hover:bg-zinc-950 md:px-6"
          >
            <span className="text-zinc-700">{index + 1}</span>
            <span
              className={
                solve.penalty === "DNF" ? "font-medium text-red-400" : "font-medium text-zinc-100"
              }
            >
              {formatSolveTime(solve.ms, solve.penalty)}
            </span>
            <span className="text-right text-[11px] text-zinc-500">
              {ao5 == null ? "-" : Number.isFinite(ao5) ? formatSolveTime(ao5) : "DNF"}
            </span>
            <span className="text-right text-[11px] text-zinc-500">
              {ao12 == null ? "-" : Number.isFinite(ao12) ? formatSolveTime(ao12) : "DNF"}
            </span>
            <span className="col-span-4 mt-1 hidden gap-1 group-hover:flex">
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  onPenalty(solve.id, solve.penalty === "+2" ? "OK" : "+2");
                }}
                className="rounded border border-white/10 px-2 py-0.5 text-[10px] text-zinc-500 hover:text-zinc-100"
              >
                +2
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  onPenalty(solve.id, solve.penalty === "DNF" ? "OK" : "DNF");
                }}
                className="rounded border border-white/10 px-2 py-0.5 text-[10px] text-zinc-500 hover:text-zinc-100"
              >
                DNF
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(solve.id);
                }}
                className="rounded border border-white/10 px-2 py-0.5 text-[10px] text-red-400"
              >
                Delete
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
