import { formatSolveTime, rollingAverageAt } from "../format";
import type { Penalty, Solve } from "../types";
import { ActionsMenu } from "./ActionsMenu";
import { Button } from "./Button";

type SolvesPanelProps = {
  solves: Solve[];
  onDeleteSolve: (solveId: string) => void;
  onUpdatePenalty: (solveId: string, penalty: Penalty) => void;
};

export function SolvesPanel({ onDeleteSolve, onUpdatePenalty, solves }: SolvesPanelProps) {
  return (
    <section className="grid min-h-0 gap-[9px]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[0.96rem] text-slate-50">Solves</h2>
        <span className="text-[#8d99aa]" aria-label="Solve count">
          {solves.length}
        </span>
      </div>

      <div className="grid min-h-0 gap-2 overflow-auto pr-[3px]">
        {solves.length === 0 ? (
          <p className="text-[#8d99aa]">No solves in this session yet.</p>
        ) : (
          solves.map((solve, index) => (
            <SolveRow
              index={solves.length - index}
              key={solve.id}
              onDelete={() => onDeleteSolve(solve.id)}
              onUpdatePenalty={(penalty) => onUpdatePenalty(solve.id, penalty)}
              rollingAo12={rollingAverageAt(solves, index, 12)}
              rollingAo5={rollingAverageAt(solves, index, 5)}
              solve={solve}
            />
          ))
        )}
      </div>
    </section>
  );
}

type SolveRowProps = {
  index: number;
  onDelete: () => void;
  onUpdatePenalty: (penalty: Penalty) => void;
  rollingAo12: string;
  rollingAo5: string;
  solve: Solve;
};

function SolveRow({
  index,
  onDelete,
  onUpdatePenalty,
  rollingAo12,
  rollingAo5,
  solve,
}: SolveRowProps) {
  return (
    <article className="relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2.5 rounded-lg border border-[#1d2633] bg-[#101720] p-[11px]">
      <div>
        <span className="text-[0.72rem] font-bold text-[#8d99aa] uppercase">{index}</span>
        <strong className="ml-2 inline-block text-[1.24rem] text-slate-50 tabular-nums">
          {formatSolveTime(solve.timeMs, solve.penalty)}
        </strong>
        <dl className="mt-2 grid grid-cols-2 gap-2">
          <RollingStat label="ao5" value={rollingAo5} />
          <RollingStat label="ao12" value={rollingAo12} />
        </dl>
      </div>

      <ActionsMenu label={`Actions for solve ${index}`} wide>
        <Button fullWidth type="button" onClick={() => onUpdatePenalty("none")}>
          OK
        </Button>
        <Button fullWidth type="button" onClick={() => onUpdatePenalty("+2")}>
          +2
        </Button>
        <Button fullWidth type="button" onClick={() => onUpdatePenalty("DNF")}>
          DNF
        </Button>
        <div className="max-h-[86px] overflow-auto rounded-md bg-[#0c1118] p-2 font-mono text-[0.74rem] leading-[1.45] text-[#aab6c7]">
          {solve.scramble}
        </div>
        <Button danger fullWidth type="button" onClick={onDelete}>
          Delete
        </Button>
      </ActionsMenu>
    </article>
  );
}

function RollingStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.72rem] font-bold text-[#8d99aa] uppercase">{label}</dt>
      <dd className="mt-0.5 text-[0.9rem] text-slate-300 tabular-nums">{value}</dd>
    </div>
  );
}
