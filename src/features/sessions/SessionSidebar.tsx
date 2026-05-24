import { Fragment } from "react";
import type { ComponentProps } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../shared/components/Select";
import { formatSolveTime } from "../timer/timerFormat";
import { SolveList } from "./SolveList";
import { sessionStats } from "./solveStats";
import type { Session, Solve, StatKey } from "./types";

type SessionSidebarProps = {
  sessions: Session[];
  activeSessionId: string;
  disabled?: boolean;
  className?: string;
  onSessionChange: (sessionId: string) => void;
  onNewSession: () => void;
  onClear: () => void;
  onExport: () => void;
  onOpenSolve: (solve: Solve) => void;
  onPenalty: (solveId: string, penalty: Solve["penalty"]) => void;
  onDelete: (solveId: string) => void;
};

const STAT_KEYS: StatKey[] = ["single", "ao5", "ao12", "ao50", "ao100"];
const NEW_SESSION_VALUE = "__new_session__";

export function SessionSidebar({
  sessions,
  activeSessionId,
  disabled = false,
  className,
  onSessionChange,
  onNewSession,
  onClear,
  onExport,
  onOpenSolve,
  onPenalty,
  onDelete,
}: SessionSidebarProps) {
  const activeSession = sessions.find((session) => session.id === activeSessionId) ?? sessions[0];
  const stats = sessionStats(activeSession.solves);

  return (
    <aside
      className={classNames("flex min-h-0 flex-col border-white/[0.07] bg-[#0a0a0b]", className)}
    >
      <div className="border-b border-white/[0.07] px-5 py-4 md:px-6">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
          Session
        </div>
        <Select
          value={activeSessionId}
          disabled={disabled}
          onValueChange={(value) => {
            if (value === NEW_SESSION_VALUE) {
              onNewSession();
              return;
            }

            onSessionChange(value);
          }}
        >
          <SelectTrigger className="session-select-trigger w-full border-white/15 bg-zinc-900/80 text-sm font-semibold shadow-[inset_0_1px_0_rgb(255_255_255_/_4%),0_0_0_1px_rgb(0_0_0_/_35%)] hover:border-white/25 hover:bg-zinc-800/70">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sessions.map((session) => (
              <SelectItem key={session.id} value={session.id}>
                {session.name}
              </SelectItem>
            ))}
            <SelectItem value={NEW_SESSION_VALUE}>+ New session...</SelectItem>
          </SelectContent>
        </Select>
        <div className="mt-2 flex gap-4 font-mono text-[11px] text-zinc-600">
          <span>
            <b className="text-zinc-300">{stats.count}</b> solves
          </span>
          <span>
            mean{" "}
            <b className="text-zinc-300">
              {stats.mean == null ? "-" : formatSolveTime(stats.mean)}
            </b>
          </span>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-1 border-b border-white/[0.07] px-5 py-4 font-mono text-xs md:px-6">
        <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-700">Avg</span>
        <span className="text-right text-[10px] uppercase tracking-[0.16em] text-zinc-700">
          Now
        </span>
        <span className="text-right text-[10px] uppercase tracking-[0.16em] text-zinc-700">
          Best
        </span>
        {STAT_KEYS.map((key) => (
          <Fragment key={key}>
            <span key={`${key}-k`} className="text-zinc-500">
              {key}
            </span>
            <span key={`${key}-c`} className="text-right text-zinc-100">
              {stats.current[key] == null
                ? "-"
                : Number.isFinite(stats.current[key])
                  ? formatSolveTime(stats.current[key])
                  : "DNF"}
            </span>
            <span key={`${key}-b`} className="text-right text-indigo-300">
              {stats.best[key] == null ? "-" : formatSolveTime(stats.best[key])}
            </span>
          </Fragment>
        ))}
      </div>
      <div className="grid grid-cols-[2.25rem_1fr_3.5rem_3.5rem] px-5 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-700 md:px-6">
        <span>#</span>
        <span>Time</span>
        <span className="text-right">ao5</span>
        <span className="text-right">ao12</span>
      </div>
      <SolveList
        solves={activeSession.solves}
        onOpen={onOpenSolve}
        onPenalty={onPenalty}
        onDelete={onDelete}
      />
      <div className="flex gap-2 border-t border-white/[0.07] px-5 py-3 md:px-6">
        <button type="button" disabled={disabled} onClick={onNewSession} className="sidebar-button">
          New
        </button>
        <button type="button" onClick={onExport} className="sidebar-button">
          Export
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onClear}
          className="sidebar-button text-red-300"
        >
          Clear
        </button>
      </div>
    </aside>
  );
}

function classNames(
  ...values: Array<ComponentProps<"aside">["className"] | false | null | undefined>
) {
  return values.filter(Boolean).join(" ");
}
