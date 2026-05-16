import { Fragment } from "react";
import { formatSolveTime } from "../timer/timerFormat";
import { SolveList } from "./SolveList";
import { sessionStats } from "./solveStats";
import type { Session, Solve, StatKey } from "./types";

type SessionSidebarProps = {
  sessions: Session[];
  activeSessionId: string;
  mobileOpen?: boolean;
  onSessionChange: (sessionId: string) => void;
  onNewSession: () => void;
  onClear: () => void;
  onExport: () => void;
  onOpenSolve: (solve: Solve) => void;
  onPenalty: (solveId: string, penalty: Solve["penalty"]) => void;
  onDelete: (solveId: string) => void;
};

const STAT_KEYS: StatKey[] = ["single", "ao5", "ao12", "ao50", "ao100"];

export function SessionSidebar({
  sessions,
  activeSessionId,
  mobileOpen = false,
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
      className={`z-30 flex min-h-0 flex-col border-white/[0.07] bg-[#0a0a0b] md:static md:translate-x-0 md:border-r ${
        mobileOpen
          ? "fixed inset-y-0 left-0 w-[min(360px,92vw)] translate-x-0 border-r shadow-2xl shadow-black/60"
          : "fixed inset-y-0 left-0 w-[min(360px,92vw)] -translate-x-full border-r transition md:w-auto"
      }`}
    >
      <div className="border-b border-white/[0.07] px-5 py-4 md:px-6">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
          Session
        </div>
        <select
          value={activeSessionId}
          onChange={(event) => onSessionChange(event.target.value)}
          className="w-full bg-transparent text-sm font-semibold text-zinc-100 outline-none"
        >
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.name}
            </option>
          ))}
        </select>
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
        <button type="button" onClick={onNewSession} className="sidebar-button">
          New
        </button>
        <button type="button" onClick={onExport} className="sidebar-button">
          Export
        </button>
        <button type="button" onClick={onClear} className="sidebar-button text-red-300">
          Clear
        </button>
      </div>
    </aside>
  );
}
