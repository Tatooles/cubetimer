import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Histogram } from "./features/analytics/Histogram";
import { ProgressChart } from "./features/analytics/ProgressChart";
import { MobileNav, type MobileSheetId } from "./features/mobile/MobileNav";
import { MobileSheet } from "./features/mobile/MobileSheet";
import { ScrambleBar } from "./features/scrambles/ScrambleBar";
import { ScrambleDraw } from "./features/scrambles/ScrambleDraw";
import { generateScramble } from "./features/scrambles/scrambleService";
import { SettingsPanel } from "./features/settings/SettingsPanel";
import { SolveDetailModal } from "./features/sessions/SolveDetailModal";
import { SessionSidebar } from "./features/sessions/SessionSidebar";
import { downloadCsv, solvesToCsv } from "./features/sessions/csvExport";
import {
  APP_STORAGE_KEY,
  activeSession,
  createSolve,
  defaultAppState,
  sanitizeState,
} from "./features/sessions/sessionStore";
import { sessionStats } from "./features/sessions/solveStats";
import type {
  AppState,
  Penalty,
  PuzzleEvent,
  Solve,
  TimerSettings,
} from "./features/sessions/types";
import { TimerSurface } from "./features/timer/TimerSurface";
import { formatSolveTime } from "./features/timer/timerFormat";
import { useTimerController } from "./features/timer/useTimerController";
import { readJson, writeJson } from "./shared/storage/localStorageStore";

function updateSolveInState(state: AppState, solveId: string, patch: Partial<Solve>): AppState {
  return {
    ...state,
    sessions: state.sessions.map((session) => ({
      ...session,
      solves: session.solves.map((solve) =>
        solve.id === solveId ? { ...solve, ...patch } : solve,
      ),
    })),
  };
}

function deleteSolveInState(state: AppState, solveId: string): AppState {
  return {
    ...state,
    sessions: state.sessions.map((session) => ({
      ...session,
      solves: session.solves.filter((solve) => solve.id !== solveId),
    })),
  };
}

function Module({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-white/[0.07] px-6 py-4">
      <div className="mb-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
        <span>{title}</span>
      </div>
      {children}
    </section>
  );
}

function App() {
  const [state, setState] = useState<AppState>(() =>
    sanitizeState(readJson(APP_STORAGE_KEY, defaultAppState())),
  );
  const [scrambleError, setScrambleError] = useState<string | null>(null);
  const [scrambleLoading, setScrambleLoading] = useState(false);
  const [selectedSolveId, setSelectedSolveId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState<MobileSheetId>(null);

  const session = activeSession(state);
  const stats = useMemo(() => sessionStats(session.solves), [session.solves]);
  const selectedSolve = useMemo(
    () => session.solves.find((solve) => solve.id === selectedSolveId) ?? null,
    [selectedSolveId, session.solves],
  );

  useEffect(() => {
    writeJson(APP_STORAGE_KEY, state);
  }, [state]);

  const requestScramble = useCallback(async (eventId: PuzzleEvent) => {
    setScrambleLoading(true);
    const result = await generateScramble(eventId);
    setScrambleLoading(false);
    setScrambleError(result.error ?? null);
    setState((current) => {
      if (result.error && current.currentScramble) {
        return current;
      }

      return { ...current, currentScramble: result.scramble };
    });
  }, []);

  const recordSolve = useCallback(
    (ms: number) => {
      setState((current) => {
        const solve = createSolve(ms, current.eventId, current.currentScramble);
        return {
          ...current,
          sessions: current.sessions.map((candidate) =>
            candidate.id === current.selectedSessionId
              ? { ...candidate, solves: [...candidate.solves, solve] }
              : candidate,
          ),
        };
      });
      void requestScramble(state.eventId);
    },
    [requestScramble, state.eventId],
  );

  const timer = useTimerController(recordSolve);

  const setEvent = useCallback(
    (eventId: PuzzleEvent) => {
      setState((current) => ({ ...current, eventId }));
      void requestScramble(eventId);
    },
    [requestScramble],
  );

  const toggleLastPenalty = useCallback((penalty: Penalty) => {
    setState((current) => {
      const currentSession = activeSession(current);
      const last = currentSession.solves[currentSession.solves.length - 1];
      if (!last) {
        return current;
      }

      const nextPenalty = last.penalty === penalty ? "OK" : penalty;
      return updateSolveInState(current, last.id, { penalty: nextPenalty });
    });
  }, []);

  const updatePenalty = useCallback((solveId: string, penalty: Penalty) => {
    setState((current) => updateSolveInState(current, solveId, { penalty }));
  }, []);

  const deleteSolve = useCallback((solveId: string) => {
    setState((current) => deleteSolveInState(current, solveId));
    setSelectedSolveId(null);
  }, []);

  const updateComment = useCallback((solveId: string, comment: string) => {
    setState((current) => updateSolveInState(current, solveId, { comment }));
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, select")) {
        return;
      }

      if (event.key === "Escape") {
        setActiveSheet(null);
        setSettingsOpen(false);
        setShortcutsOpen(false);
        setSelectedSolveId(null);
        return;
      }

      if (timer.stage === "running") {
        event.preventDefault();
        timer.stop();
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        if (!event.repeat) {
          timer.press();
        }
      } else if (event.key === "n" || event.key === "N") {
        void requestScramble(state.eventId);
      } else if (event.key === "+" || event.key === "=") {
        toggleLastPenalty("+2");
      } else if (event.key === "d" || event.key === "D") {
        toggleLastPenalty("DNF");
      } else if (event.key === "?") {
        setShortcutsOpen(true);
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      if (event.code === "Space") {
        event.preventDefault();
        timer.release();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [requestScramble, state.eventId, timer, toggleLastPenalty]);

  const bests = useMemo(
    () =>
      (["single", "ao5", "ao12", "ao50", "ao100"] as const).map((key) => ({
        label: key,
        value: stats.best[key] == null ? "-" : formatSolveTime(stats.best[key]),
      })),
    [stats.best],
  );

  function createSession() {
    const name = window.prompt("Session name", "New session");
    if (!name) {
      return;
    }

    const id = `session-${Date.now()}`;
    setState((current) => ({
      ...current,
      selectedSessionId: id,
      sessions: [...current.sessions, { id, name, solves: [] }],
    }));
  }

  function clearSession() {
    if (!window.confirm("Clear all solves in this session?")) {
      return;
    }

    setState((current) => ({
      ...current,
      sessions: current.sessions.map((candidate) =>
        candidate.id === current.selectedSessionId ? { ...candidate, solves: [] } : candidate,
      ),
    }));
  }

  function exportSession() {
    downloadCsv(
      `${session.name.toLowerCase().replaceAll(/\s+/g, "-")}.csv`,
      solvesToCsv(session.solves),
    );
  }

  function setSettings(settings: TimerSettings) {
    setState((current) => ({ ...current, settings }));
  }

  const densityClass =
    state.settings.density === "compact"
      ? "md:grid-cols-[264px_1fr_296px]"
      : "md:grid-cols-[296px_1fr_332px]";

  return (
    <div className="min-h-svh bg-[#0a0a0b] text-zinc-100">
      <div
        className={`grid h-svh grid-rows-[56px_1fr_64px] overflow-hidden md:grid-rows-[56px_1fr] ${densityClass}`}
      >
        <header className="col-span-full flex items-center gap-3 border-b border-white/[0.07] px-4 md:px-6">
          <div className="flex items-center gap-2 font-mono text-sm font-semibold">
            <span className="grid h-[18px] w-[18px] grid-cols-2 gap-px rounded bg-zinc-100 p-px">
              <span className="rounded-[1px] bg-indigo-400" />
              <span className="rounded-[1px] bg-black" />
              <span className="rounded-[1px] bg-black" />
              <span className="rounded-[1px] bg-black" />
            </span>
            <span>
              cube<span className="text-zinc-600">timer</span>
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button type="button" onClick={() => setShortcutsOpen(true)} className="topbar-button">
              ?
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen((open) => !open)}
              className="topbar-button"
            >
              set
            </button>
          </div>
        </header>

        <SessionSidebar
          sessions={state.sessions}
          activeSessionId={state.selectedSessionId}
          mobileOpen={activeSheet === "session"}
          onSessionChange={(sessionId) =>
            setState((current) => ({ ...current, selectedSessionId: sessionId }))
          }
          onNewSession={createSession}
          onClear={clearSession}
          onExport={exportSession}
          onOpenSolve={(solve) => setSelectedSolveId(solve.id)}
          onPenalty={updatePenalty}
          onDelete={deleteSolve}
        />

        <main className="min-w-0 overflow-hidden md:col-start-2">
          <div className="flex h-full flex-col">
            <ScrambleBar
              eventId={state.eventId}
              scramble={state.currentScramble}
              isLoading={scrambleLoading}
              error={scrambleError}
              onEventChange={setEvent}
              onNext={() => void requestScramble(state.eventId)}
              onCopy={() => void navigator.clipboard?.writeText(state.currentScramble)}
            />
            <TimerSurface
              stage={timer.stage}
              elapsedMs={timer.elapsedMs}
              bests={bests}
              onPress={timer.press}
              onRelease={timer.release}
            />
          </div>
        </main>

        <aside className="hidden overflow-y-auto border-l border-white/[0.07] md:col-start-3 md:flex md:flex-col">
          {state.settings.showGraph ? (
            <Module title="Progress">
              <ProgressChart solves={session.solves} />
              <div className="mt-2 flex gap-3 font-mono text-[10px] text-zinc-600">
                <span>single</span>
                <span className="text-red-300">ao5</span>
                <span className="text-indigo-300">ao12</span>
              </div>
            </Module>
          ) : null}
          {state.settings.showDraw ? (
            <Module title="Scramble draw">
              <ScrambleDraw eventId={state.eventId} scramble={state.currentScramble} />
            </Module>
          ) : null}
          {state.settings.showHistogram ? (
            <Module title="Histogram">
              <Histogram solves={session.solves} />
            </Module>
          ) : null}
        </aside>

        <MobileNav
          active={activeSheet}
          disabled={{
            graph: !state.settings.showGraph,
            draw: !state.settings.showDraw,
            histogram: !state.settings.showHistogram,
          }}
          onSelect={setActiveSheet}
        />
      </div>

      {activeSheet === "session" ? (
        <button
          type="button"
          aria-label="Close session"
          className="fixed inset-x-0 top-0 bottom-16 z-20 bg-black/45 md:hidden"
          onClick={() => setActiveSheet(null)}
        />
      ) : null}
      <MobileSheet
        active={activeSheet}
        sheetId="graph"
        title="Progress"
        onClose={() => setActiveSheet(null)}
      >
        <ProgressChart solves={session.solves} />
      </MobileSheet>
      <MobileSheet
        active={activeSheet}
        sheetId="draw"
        title="Scramble draw"
        onClose={() => setActiveSheet(null)}
      >
        <ScrambleDraw eventId={state.eventId} scramble={state.currentScramble} />
      </MobileSheet>
      <MobileSheet
        active={activeSheet}
        sheetId="histogram"
        title="Histogram"
        onClose={() => setActiveSheet(null)}
      >
        <Histogram solves={session.solves} />
      </MobileSheet>
      <MobileSheet
        active={activeSheet}
        sheetId="settings"
        title="Settings"
        onClose={() => setActiveSheet(null)}
      >
        <SettingsPanel settings={state.settings} onChange={setSettings} />
      </MobileSheet>

      {settingsOpen ? (
        <SettingsPanel
          settings={state.settings}
          onChange={setSettings}
          floating
          onClose={() => setSettingsOpen(false)}
        />
      ) : null}
      {shortcutsOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onMouseDown={() => setShortcutsOpen(false)}
        >
          <section
            className="min-w-80 rounded-xl border border-white/10 bg-zinc-950 p-5"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
              Keyboard shortcuts
            </h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 text-sm text-zinc-500">
              <dt className="font-mono text-zinc-200">Space</dt>
              <dd>Hold, release, stop</dd>
              <dt className="font-mono text-zinc-200">N</dt>
              <dd>Next scramble</dd>
              <dt className="font-mono text-zinc-200">+ / =</dt>
              <dd>Toggle +2 on last solve</dd>
              <dt className="font-mono text-zinc-200">D</dt>
              <dd>Toggle DNF on last solve</dd>
              <dt className="font-mono text-zinc-200">Esc</dt>
              <dd>Close panels</dd>
            </dl>
          </section>
        </div>
      ) : null}
      <SolveDetailModal
        solve={selectedSolve}
        onClose={() => setSelectedSolveId(null)}
        onPenalty={updatePenalty}
        onComment={updateComment}
        onDelete={deleteSolve}
      />
    </div>
  );
}

export default App;
