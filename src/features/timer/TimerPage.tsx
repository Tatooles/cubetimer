import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Histogram } from "../analytics/Histogram";
import { ProgressChart } from "../analytics/ProgressChart";
import { MobileNav, type MobileSheetId } from "../mobile/MobileNav";
import { MobileSheet } from "../mobile/MobileSheet";
import { EventSelector } from "../scrambles/EventSelector";
import { ScrambleBar } from "../scrambles/ScrambleBar";
import { ScrambleDraw } from "../scrambles/ScrambleDraw";
import { generateScramble } from "../scrambles/scrambleService";
import { applyScrambleResult } from "../scrambles/scrambleState";
import { SettingsPanel } from "../settings/SettingsPanel";
import { SolveDetailModal } from "../sessions/SolveDetailModal";
import { SessionSidebar } from "../sessions/SessionSidebar";
import { downloadCsv, solvesToCsv } from "../sessions/csvExport";
import {
  APP_STORAGE_KEY,
  activeSession,
  createDemoAppState,
  defaultAppState,
  recordSolveInState,
  sanitizeState,
} from "../sessions/sessionStore";
import { sessionStats } from "../sessions/solveStats";
import type { AppState, Penalty, PuzzleEvent, Solve, TimerSettings } from "../sessions/types";
import { TimerSurface } from "./TimerSurface";
import { formatSolveTime } from "./timerFormat";
import { useTimerController } from "./useTimerController";
import { copyTextToClipboard } from "../../shared/clipboard/copyTextToClipboard";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "../../shared/components/Sheet";
import { readJson, writeJson } from "../../shared/storage/localStorageStore";
import { TrainingPage } from "../training/TrainingPage";

type AppSection = "timer" | "training";

type TimerPageProps = {
  activeSection?: AppSection;
  onSectionChange?: (section: AppSection) => void;
};

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

function initialAppState(): AppState {
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("demo") === "1") {
    return createDemoAppState();
  }

  return sanitizeState(readJson(APP_STORAGE_KEY, defaultAppState()));
}

export function TimerPage({ activeSection = "timer", onSectionChange }: TimerPageProps = {}) {
  const [state, setState] = useState<AppState>(initialAppState);
  const [scrambleError, setScrambleError] = useState<string | null>(null);
  const [scrambleLoading, setScrambleLoading] = useState(false);
  const [selectedSolveId, setSelectedSolveId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState<MobileSheetId>(null);
  const [scrambleCopied, setScrambleCopied] = useState(false);
  const scrambleRequestId = useRef(0);

  const session = activeSession(state);
  const stats = useMemo(() => sessionStats(session.solves), [session.solves]);
  const selectedSolve = useMemo(
    () => session.solves.find((solve) => solve.id === selectedSolveId) ?? null,
    [selectedSolveId, session.solves],
  );

  useEffect(() => {
    writeJson(APP_STORAGE_KEY, state);
  }, [state]);

  useEffect(() => {
    if (!scrambleCopied) {
      return;
    }

    const timeout = window.setTimeout(() => setScrambleCopied(false), 1_500);
    return () => window.clearTimeout(timeout);
  }, [scrambleCopied]);

  const requestScramble = useCallback(async (eventId: PuzzleEvent) => {
    const requestId = scrambleRequestId.current + 1;
    scrambleRequestId.current = requestId;

    setScrambleLoading(true);
    setScrambleError(null);
    const result = await generateScramble(eventId);

    if (requestId !== scrambleRequestId.current) {
      return;
    }

    setScrambleLoading(false);
    setScrambleError(result.error ?? null);
    setState((current) => applyScrambleResult(current, result));
  }, []);

  useEffect(() => {
    if (!state.currentScramble && !scrambleLoading && !scrambleError) {
      void requestScramble(state.eventId);
    }
  }, [requestScramble, scrambleError, scrambleLoading, state.currentScramble, state.eventId]);

  const recordSolve = useCallback(
    (ms: number) => {
      setState((current) => recordSolveInState(current, ms));
      if (state.currentScramble.trim()) {
        void requestScramble(state.eventId);
      }
    },
    [requestScramble, state.currentScramble, state.eventId],
  );

  const timer = useTimerController(recordSolve);
  const timerStage = timer.stage;
  const timerElapsedMs = timer.elapsedMs;
  const pressTimer = timer.press;
  const releaseTimer = timer.release;
  const stopTimer = timer.stop;
  const timerSectionActive = activeSection === "timer";
  const timerInputEnabled =
    timerSectionActive && state.currentScramble.trim().length > 0 && !scrambleLoading;
  const timerLocked = timerStage === "running";
  const sectionSwitchLocked = timerStage !== "idle";

  const handleSectionChange = useCallback(
    (section: AppSection) => {
      if (sectionSwitchLocked && section === "training") {
        return;
      }

      if (section === "training") {
        setActiveSheet(null);
        setSettingsOpen(false);
        setShortcutsOpen(false);
        setSelectedSolveId(null);
      }

      onSectionChange?.(section);
    },
    [onSectionChange, sectionSwitchLocked],
  );

  const setEvent = useCallback(
    (eventId: PuzzleEvent) => {
      if (timerLocked) {
        return;
      }

      setState((current) => ({ ...current, eventId }));
      void requestScramble(eventId);
    },
    [requestScramble, timerLocked],
  );

  const copyScramble = useCallback(async () => {
    const scramble = state.currentScramble.trim();
    if (!scramble) {
      return;
    }

    setScrambleCopied(await copyTextToClipboard(scramble));
  }, [state.currentScramble]);

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

      if (event.key === "Escape") {
        setActiveSheet(null);
        setSettingsOpen(false);
        setShortcutsOpen(false);
        setSelectedSolveId(null);
        return;
      }

      if (
        target.closest(
          "input, textarea, select, [contenteditable='true'], [data-global-shortcuts='ignore']",
        )
      ) {
        return;
      }

      if (!timerSectionActive) {
        return;
      }

      if (timerStage === "running") {
        event.preventDefault();
        stopTimer();
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        if (!event.repeat && timerInputEnabled) {
          pressTimer();
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
        if (!timerSectionActive) {
          return;
        }
        event.preventDefault();
        releaseTimer();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [
    pressTimer,
    releaseTimer,
    requestScramble,
    state.eventId,
    stopTimer,
    timerSectionActive,
    timerInputEnabled,
    timerStage,
    toggleLastPenalty,
  ]);

  const bests = useMemo(
    () =>
      (["single", "ao5", "ao12", "ao50", "ao100"] as const).map((key) => ({
        label: key,
        value: stats.best[key] == null ? "-" : formatSolveTime(stats.best[key]),
      })),
    [stats.best],
  );

  function createSession() {
    if (timerLocked) {
      return;
    }

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
    if (timerLocked) {
      return;
    }

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
  const headerDensityClass = densityClass;
  const contentRowsClass =
    activeSection === "training" ? "grid-rows-[56px_1fr]" : "grid-rows-[56px_1fr_64px]";

  return (
    <div className="min-h-svh bg-[#0a0a0b] text-zinc-100">
      <div
        data-testid="timer-page-grid"
        className={`grid h-svh ${contentRowsClass} overflow-hidden md:grid-rows-[56px_1fr] ${densityClass}`}
      >
        <header
          className={`col-span-full grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-white/[0.07] px-3 md:grid-cols-subgrid md:gap-0 md:px-0 ${headerDensityClass}`}
        >
          <div className="flex min-w-0 shrink-0 items-center gap-2 overflow-hidden md:col-start-1 md:row-start-1 md:gap-4 md:px-6">
            <div className="flex min-w-0 shrink-0 items-center gap-2 overflow-hidden font-mono text-sm font-semibold">
              <span className="grid h-4.5 w-4.5 grid-cols-2 gap-px rounded bg-zinc-100 p-px">
                <span className="rounded-[1px] bg-indigo-400" />
                <span className="rounded-[1px] bg-black" />
                <span className="rounded-[1px] bg-black" />
                <span className="rounded-[1px] bg-black" />
              </span>
              <span className="hidden md:inline">
                cube<span className="text-zinc-600">timer</span>
              </span>
            </div>
            {onSectionChange ? (
              <nav className="hidden shrink-0 rounded-md border border-white/[0.07] bg-black/30 p-0.5 md:flex">
                <button
                  type="button"
                  onClick={() => handleSectionChange("timer")}
                  className={`section-switch-button rounded px-2.5 py-1.5 ${activeSection === "timer" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-200"}`}
                >
                  Timer
                </button>
                <button
                  type="button"
                  onClick={() => handleSectionChange("training")}
                  disabled={sectionSwitchLocked}
                  className={`section-switch-button rounded px-2.5 py-1.5 ${activeSection === "training" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-200"} disabled:opacity-40 disabled:hover:text-zinc-500`}
                >
                  Training
                </button>
              </nav>
            ) : null}
            {onSectionChange ? (
              <nav className="flex shrink-0 rounded-md border border-white/[0.07] bg-black/30 p-0.5 md:hidden">
                <button
                  type="button"
                  onClick={() => handleSectionChange("timer")}
                  className={`section-switch-button rounded px-1.5 py-1 ${activeSection === "timer" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500"}`}
                >
                  Timer
                </button>
                <button
                  type="button"
                  onClick={() => handleSectionChange("training")}
                  disabled={sectionSwitchLocked}
                  className={`section-switch-button rounded px-1.5 py-1 ${activeSection === "training" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500"} disabled:opacity-40`}
                >
                  Training
                </button>
              </nav>
            ) : null}
          </div>
          <div className="min-w-0 justify-self-center md:hidden">
            <EventSelector
              eventId={state.eventId}
              disabled={timerLocked}
              mode="select"
              onEventChange={setEvent}
            />
          </div>
          <div className="hidden min-w-0 md:col-start-2 md:row-start-1 md:flex">
            <div className="w-full">
              <EventSelector
                eventId={state.eventId}
                disabled={timerLocked}
                mode="tabs"
                onEventChange={setEvent}
              />
            </div>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1 justify-self-end md:col-start-3 md:row-start-1 md:px-6">
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

        {activeSection === "timer" ? (
          <SessionSidebar
            sessions={state.sessions}
            activeSessionId={state.selectedSessionId}
            disabled={timerLocked}
            className="hidden md:col-start-1 md:flex md:border-r"
            onSessionChange={(sessionId) => {
              if (timerLocked) {
                return;
              }

              setState((current) => ({ ...current, selectedSessionId: sessionId }));
            }}
            onNewSession={createSession}
            onClear={clearSession}
            onExport={exportSession}
            onOpenSolve={(solve) => setSelectedSolveId(solve.id)}
            onPenalty={updatePenalty}
            onDelete={deleteSolve}
          />
        ) : null}

        <main
          className={`min-w-0 overflow-hidden ${
            activeSection === "training" ? "md:col-span-3" : "md:col-start-2"
          }`}
        >
          {activeSection === "training" ? (
            <TrainingPage />
          ) : (
            <div className="flex h-full flex-col">
              <ScrambleBar
                eventId={state.eventId}
                scramble={state.currentScramble}
                isLoading={scrambleLoading}
                error={scrambleError}
                copied={scrambleCopied}
                disabled={timerLocked}
                onNext={() => {
                  if (timerLocked) {
                    return;
                  }

                  void requestScramble(state.eventId);
                }}
                onCopy={() => void copyScramble()}
              />
              <TimerSurface
                stage={timerStage}
                elapsedMs={timerElapsedMs}
                bests={bests}
                onPress={timerInputEnabled ? pressTimer : undefined}
                onRelease={releaseTimer}
              />
            </div>
          )}
        </main>

        {activeSection === "timer" ? (
          <>
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
          </>
        ) : null}
      </div>

      {activeSection === "timer" ? (
        <>
          <Sheet
            modal={false}
            open={activeSheet === "session"}
            onOpenChange={(open) => {
              if (!open) {
                setActiveSheet(null);
              }
            }}
          >
            <SheetContent
              side="left"
              className="mobile-session-sheet w-[min(320px,88vw)] overflow-hidden border-white/[0.07] bg-[#0a0a0b] p-0"
            >
              <SheetTitle className="sr-only">Session</SheetTitle>
              <SheetDescription className="sr-only">
                Session stats, solve history, and session actions.
              </SheetDescription>
              <SessionSidebar
                sessions={state.sessions}
                activeSessionId={state.selectedSessionId}
                disabled={timerLocked}
                className="h-full"
                onSessionChange={(sessionId) => {
                  if (timerLocked) {
                    return;
                  }

                  setState((current) => ({ ...current, selectedSessionId: sessionId }));
                }}
                onNewSession={createSession}
                onClear={clearSession}
                onExport={exportSession}
                onOpenSolve={(solve) => setSelectedSolveId(solve.id)}
                onPenalty={updatePenalty}
                onDelete={deleteSolve}
              />
            </SheetContent>
          </Sheet>
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
        </>
      ) : null}

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
