import { ChangeEvent, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { BrandMark } from "./components/BrandMark";
import { Button } from "./components/Button";
import { SessionsPanel } from "./components/SessionsPanel";
import { SolvesPanel } from "./components/SolvesPanel";
import { StatCard } from "./components/StatCard";
import { TimerDisplay } from "./components/TimerDisplay";
import { averageOf, bestOf, meanOf } from "./format";
import {
  appendScrambleHistory,
  generateScramble,
  nextScrambleHistory,
  previousScrambleHistory,
  shouldShowScrambleLoading,
  type ScrambleHistory,
} from "./scramble";
import { createInitialData, createSession, createSolve, exportCsv, exportJson, importTimerData, loadData, saveData } from "./storage";
import type { EventId, Penalty, Session, TimerData } from "./types";

type TimerState = "idle" | "holding" | "ready" | "running";
type ScrambleState = "loading" | "ready" | "error";

const HOLD_MS = 450;
const SCRAMBLE_LOADING_TEXT = "Generating scramble...";
const SCRAMBLE_ERROR_TEXT = "Unable to generate scramble.";

export function App() {
  const [data, setData] = useState<TimerData>(() => loadData());
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [startAt, setStartAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [scramble, setScramble] = useState(SCRAMBLE_LOADING_TEXT);
  const [scrambleState, setScrambleState] = useState<ScrambleState>("loading");
  const [scrambleHistory, setScrambleHistory] = useState<ScrambleHistory>({ entries: [], index: -1 });
  const [message, setMessage] = useState("");
  const holdTimeout = useRef<number | null>(null);
  const activePointerId = useRef<number | null>(null);
  const timerFrame = useRef<number | null>(null);
  const importInput = useRef<HTMLInputElement | null>(null);
  const didRequestInitialScramble = useRef(false);

  const activeSession = data.sessions.find((session) => session.id === data.activeSessionId) ?? data.sessions[0];
  const sessionSolves = useMemo(
    () =>
      data.solves
        .filter((solve) => solve.sessionId === activeSession.id)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [activeSession.id, data.solves],
  );

  useEffect(() => saveData(data), [data]);

  useEffect(() => {
    if (didRequestInitialScramble.current) return;
    didRequestInitialScramble.current = true;
    void requestScramble(activeSession.eventId, true);
  }, []);

  useEffect(() => {
    if (timerState !== "running") return;

    const tick = () => {
      setElapsed(performance.now() - startAt);
      timerFrame.current = requestAnimationFrame(tick);
    };

    timerFrame.current = requestAnimationFrame(tick);
    return () => {
      if (timerFrame.current) cancelAnimationFrame(timerFrame.current);
    };
  }, [startAt, timerState]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;

      if (timerState === "running") {
        event.preventDefault();
        stopTimer();
        return;
      }

      if (event.code !== "Space" || event.repeat || timerState !== "idle") return;
      event.preventDefault();
      beginHold();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) || event.code !== "Space") return;
      event.preventDefault();

      if (holdTimeout.current) {
        clearHoldTimeout();
      }

      if (timerState === "ready") startTimer();
      if (timerState === "holding") setTimerState("idle");
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    window.addEventListener("keyup", onKeyUp, { capture: true });

    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true });
      window.removeEventListener("keyup", onKeyUp, { capture: true });
    };
  }, [scramble, scrambleState, timerState, activeSession.id, activeSession.eventId, startAt]);

  function startTimer() {
    if (scrambleState !== "ready") {
      setTimerState("idle");
      setMessage("Generate a scramble before starting.");
      return;
    }

    const now = performance.now();
    setStartAt(now);
    setElapsed(0);
    setTimerState("running");
  }

  function stopTimer() {
    const finalTime = Math.round(performance.now() - startAt);
    const solve = createSolve({
      sessionId: activeSession.id,
      eventId: activeSession.eventId,
      timeMs: finalTime,
      penalty: "none",
      scramble,
    });

    setData((current) => ({ ...current, solves: [solve, ...current.solves] }));
    void requestScramble(activeSession.eventId);
    setElapsed(finalTime);
    setTimerState("idle");
  }

  function beginHold() {
    clearHoldTimeout();
    setMessage("");
    setTimerState("holding");
    holdTimeout.current = window.setTimeout(() => setTimerState("ready"), HOLD_MS);
  }

  function clearHoldTimeout() {
    if (!holdTimeout.current) return;
    window.clearTimeout(holdTimeout.current);
    holdTimeout.current = null;
  }

  function releaseHold() {
    clearHoldTimeout();
    if (timerState === "ready") startTimer();
    if (timerState === "holding") setTimerState("idle");
  }

  function cancelHold() {
    clearHoldTimeout();
    if (timerState === "holding" || timerState === "ready") setTimerState("idle");
  }

  async function requestScramble(eventId: EventId, resetHistory = false) {
    if (shouldShowScrambleLoading(scrambleHistory, resetHistory)) setScramble(SCRAMBLE_LOADING_TEXT);
    setScrambleState("loading");

    try {
      const nextScramble = await generateScramble(eventId);
      setScramble(nextScramble);
      setScrambleState("ready");
      setMessage("");
      setScrambleHistory((current) =>
        appendScrambleHistory(resetHistory ? { entries: [], index: -1 } : current, nextScramble),
      );
    } catch (error) {
      setScramble(SCRAMBLE_ERROR_TEXT);
      setScrambleState("error");
      setMessage(error instanceof Error ? error.message : "Scramble generation failed.");
      if (resetHistory) setScrambleHistory({ entries: [], index: -1 });
    }
  }

  function showPreviousScramble() {
    const nextHistory = previousScrambleHistory(scrambleHistory);
    const nextScramble = nextHistory.entries[nextHistory.index];
    if (!nextScramble) return;
    setScrambleHistory(nextHistory);
    setScramble(nextScramble);
    setScrambleState("ready");
  }

  function showNextScramble() {
    if (scrambleHistory.index < scrambleHistory.entries.length - 1) {
      const nextHistory = nextScrambleHistory(scrambleHistory);
      const nextScramble = nextHistory.entries[nextHistory.index];
      if (!nextScramble) return;
      setScrambleHistory(nextHistory);
      setScramble(nextScramble);
      setScrambleState("ready");
      return;
    }

    void requestScramble(activeSession.eventId);
  }

  function updateSession(sessionId: string, patch: Partial<Session>) {
    setData((current) => ({
      ...current,
      sessions: current.sessions.map((session) => (session.id === sessionId ? { ...session, ...patch } : session)),
    }));
  }

  function setActiveSession(sessionId: string) {
    if (sessionId === activeSession.id) return;
    const nextSession = data.sessions.find((session) => session.id === sessionId);
    if (!nextSession) return;
    setData((current) => ({ ...current, activeSessionId: sessionId }));
    void requestScramble(nextSession.eventId, true);
    setTimerState("idle");
  }

  function addSession() {
    const session = createSession(`Session ${data.sessions.length + 1}`, activeSession.eventId);
    setData((current) => ({
      ...current,
      activeSessionId: session.id,
      sessions: [...current.sessions, session],
    }));
    void requestScramble(session.eventId, true);
  }

  function deleteSession(sessionId: string) {
    if (data.sessions.length === 1) return;
    const nextSessions = data.sessions.filter((session) => session.id !== sessionId);
    const nextActive = data.activeSessionId === sessionId ? nextSessions[0].id : data.activeSessionId;

    setData((current) => ({
      ...current,
      activeSessionId: nextActive,
      sessions: nextSessions,
      solves: current.solves.filter((solve) => solve.sessionId !== sessionId),
    }));
    void requestScramble(nextSessions.find((session) => session.id === nextActive)?.eventId ?? "333", true);
  }

  function changeActiveEvent(eventId: EventId) {
    updateSession(activeSession.id, { eventId });
    void requestScramble(eventId, true);
  }

  function updatePenalty(solveId: string, penalty: Penalty) {
    setData((current) => ({
      ...current,
      solves: current.solves.map((solve) => (solve.id === solveId ? { ...solve, penalty } : solve)),
    }));
  }

  function deleteSolve(solveId: string) {
    setData((current) => ({ ...current, solves: current.solves.filter((solve) => solve.id !== solveId) }));
  }

  function resetAll() {
    if (!confirm("Reset all sessions and solves on this device?")) return;
    const fresh = createInitialData();
    setData(fresh);
    void requestScramble(fresh.sessions[0].eventId, true);
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importTimerData(file);
      setData(imported);
      const active = imported.sessions.find((session) => session.id === imported.activeSessionId) ?? imported.sessions[0];
      await requestScramble(active.eventId, true);
      setMessage("Import complete.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import failed.");
    } finally {
      event.target.value = "";
    }
  }

  const statusText = {
    idle: "Hold space or screen",
    holding: "Keep holding",
    ready: "Release to start",
    running: "Press any key or tap to stop",
  }[timerState];
  const canShowPreviousScramble = timerState !== "running" && scrambleHistory.index > 0;
  const canShowNextScramble = timerState !== "running";

  return (
    <main className="grid h-dvh w-full grid-cols-[minmax(0,1fr)_390px] overflow-hidden bg-[#090d13] bg-[radial-gradient(circle_at_30%_15%,rgba(70,114,190,0.14),transparent_36%)] max-[960px]:grid-cols-1 max-[960px]:grid-rows-[minmax(0,58dvh)_minmax(260px,42dvh)]">
      <section
        className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto_auto] gap-4 overflow-hidden p-5 max-[960px]:p-3.5 max-[680px]:gap-2"
        aria-label="Timer"
      >
        <div className="flex min-h-[42px] items-center justify-between gap-4 max-[680px]:min-h-[86px] max-[680px]:flex-col max-[680px]:items-stretch max-[680px]:justify-start">
          <BrandMark eventId={activeSession.eventId} />
          <div className="flex items-center gap-2 max-[680px]:flex-wrap">
            <Button type="button" onClick={() => exportJson(data)}>
              JSON
            </Button>
            <Button type="button" onClick={() => exportCsv(sessionSolves)}>
              CSV
            </Button>
            <Button type="button" onClick={() => importInput.current?.click()}>
              Import
            </Button>
            <input ref={importInput} className="hidden" type="file" accept="application/json,.json" onChange={handleImport} />
          </div>
        </div>

        <TimerDisplay
          elapsed={elapsed}
          onKeyDown={handleTimerPanelKey}
          onPointerCancel={handleTimerPointerCancel}
          onPointerDown={handleTimerPointerDown}
          onPointerUp={handleTimerPointerUp}
          scramble={scramble}
          scrambleActions={
            <div className="flex flex-wrap gap-2" aria-label="Scramble actions">
              <Button type="button" className="min-w-22" onClick={showPreviousScramble} disabled={!canShowPreviousScramble}>
                Previous
              </Button>
              <Button type="button" className="min-w-22" onClick={showNextScramble} disabled={!canShowNextScramble}>
                Next
              </Button>
              <Button type="button" className="min-w-22" onClick={() => void navigator.clipboard?.writeText(scramble)}>
                Copy
              </Button>
            </div>
          }
          statusText={statusText}
          timerState={timerState}
        />

        <div className="grid grid-cols-5 gap-2 max-[680px]:gap-1.5">
          <StatCard label="Solves" value={String(sessionSolves.length)} />
          <StatCard label="Best" value={bestOf(sessionSolves)} />
          <StatCard label="Mean" value={meanOf(sessionSolves)} />
          <StatCard label="Ao5" value={averageOf(sessionSolves, 5)} />
          <StatCard label="Ao12" value={averageOf(sessionSolves, 12)} />
        </div>
        {message ? <p className="text-[#8d99aa]">{message}</p> : null}
      </section>

      <aside
        className="grid h-dvh min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-3.5 overflow-hidden border-l border-[#1d2633] bg-[#0d131b] p-4 max-[960px]:h-auto max-[960px]:overflow-auto max-[960px]:border-t max-[960px]:border-l-0"
        aria-label="Sessions and solves"
      >
        <SessionsPanel
          activeSession={activeSession}
          sessions={data.sessions}
          onAddSession={addSession}
          onChangeEvent={changeActiveEvent}
          onDeleteSession={() => deleteSession(activeSession.id)}
          onRenameSession={(name) => updateSession(activeSession.id, { name })}
          onResetAll={resetAll}
          onSelectSession={setActiveSession}
        />
        <SolvesPanel solves={sessionSolves} onDeleteSolve={deleteSolve} onUpdatePenalty={updatePenalty} />
      </aside>
    </main>
  );

  function handleTimerPanelKey(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" && timerState !== "running") {
      void requestScramble(activeSession.eventId);
    }
  }

  function handleTimerPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isTimerPointer(event)) return;

    event.preventDefault();
    event.currentTarget.focus();

    if (timerState === "running") {
      stopTimer();
      return;
    }

    if (isInteractiveTarget(event.target)) return;
    if (timerState !== "idle") return;
    activePointerId.current = event.pointerId;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    beginHold();
  }

  function handleTimerPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (activePointerId.current !== event.pointerId) return;
    event.preventDefault();
    activePointerId.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    releaseHold();
  }

  function handleTimerPointerCancel(event: ReactPointerEvent<HTMLDivElement>) {
    if (activePointerId.current !== event.pointerId) return;
    activePointerId.current = null;
    cancelHold();
  }
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.closest("button, input, select, textarea, summary, a") !== null || target.isContentEditable;
}

function isTimerPointer(event: ReactPointerEvent<HTMLElement>): boolean {
  return event.isPrimary && (event.pointerType === "touch" || event.pointerType === "pen");
}
