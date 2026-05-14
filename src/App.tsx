import { ChangeEvent, KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { ActionsMenu } from "./components/ActionsMenu";
import { BrandMark } from "./components/BrandMark";
import { Button } from "./components/Button";
import { SessionsPanel } from "./components/SessionsPanel";
import { SolvesPanel } from "./components/SolvesPanel";
import { StatCard } from "./components/StatCard";
import { TimerDisplay } from "./components/TimerDisplay";
import { averageOf, bestOf, meanOf } from "./format";
import { generateScramble } from "./scramble";
import { createInitialData, createSession, createSolve, exportCsv, exportJson, importTimerData, loadData, saveData } from "./storage";
import type { EventId, Penalty, Session, TimerData } from "./types";

type TimerState = "idle" | "holding" | "ready" | "running";

const HOLD_MS = 450;

export function App() {
  const [data, setData] = useState<TimerData>(() => loadData());
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [startAt, setStartAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [scramble, setScramble] = useState("Generating scramble...");
  const [message, setMessage] = useState("");
  const holdTimeout = useRef<number | null>(null);
  const timerFrame = useRef<number | null>(null);
  const importInput = useRef<HTMLInputElement | null>(null);

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
    void requestScramble(activeSession.eventId);
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
      setMessage("");
      setTimerState("holding");
      holdTimeout.current = window.setTimeout(() => setTimerState("ready"), HOLD_MS);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) || event.code !== "Space") return;
      event.preventDefault();

      if (holdTimeout.current) {
        window.clearTimeout(holdTimeout.current);
        holdTimeout.current = null;
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
  }, [scramble, timerState, activeSession.id, activeSession.eventId, startAt]);

  function startTimer() {
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

  async function requestScramble(eventId: EventId) {
    setScramble("Generating scramble...");
    setScramble(await generateScramble(eventId));
  }

  function updateSession(sessionId: string, patch: Partial<Session>) {
    setData((current) => ({
      ...current,
      sessions: current.sessions.map((session) => (session.id === sessionId ? { ...session, ...patch } : session)),
    }));
  }

  function setActiveSession(sessionId: string) {
    const nextSession = data.sessions.find((session) => session.id === sessionId);
    if (!nextSession) return;
    setData((current) => ({ ...current, activeSessionId: sessionId }));
    void requestScramble(nextSession.eventId);
    setTimerState("idle");
  }

  function addSession() {
    const session = createSession(`Session ${data.sessions.length + 1}`, activeSession.eventId);
    setData((current) => ({
      ...current,
      activeSessionId: session.id,
      sessions: [...current.sessions, session],
    }));
    void requestScramble(session.eventId);
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
    void requestScramble(nextSessions.find((session) => session.id === nextActive)?.eventId ?? "333");
  }

  function changeActiveEvent(eventId: EventId) {
    updateSession(activeSession.id, { eventId });
    void requestScramble(eventId);
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
    void requestScramble(fresh.sessions[0].eventId);
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importTimerData(file);
      setData(imported);
      const active = imported.sessions.find((session) => session.id === imported.activeSessionId) ?? imported.sessions[0];
      void requestScramble(active.eventId);
      setMessage("Import complete.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import failed.");
    } finally {
      event.target.value = "";
    }
  }

  const statusText = {
    idle: "Hold space",
    holding: "Keep holding",
    ready: "Release to start",
    running: "Press any key to stop",
  }[timerState];

  return (
    <main className="grid h-dvh w-full grid-cols-[minmax(0,1fr)_390px] overflow-hidden bg-[#090d13] bg-[radial-gradient(circle_at_30%_15%,rgba(70,114,190,0.14),transparent_36%)] max-[960px]:grid-cols-1 max-[960px]:grid-rows-[minmax(0,1fr)_minmax(260px,44dvh)]">
      <section
        className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto_auto] gap-4 overflow-hidden p-5 max-[960px]:p-3.5"
        aria-label="Timer"
      >
        <div className="flex min-h-[42px] items-center justify-between gap-4 max-[680px]:flex-col max-[680px]:items-stretch">
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
          scramble={scramble}
          scrambleActions={
            <ActionsMenu label="Scramble actions">
              <Button fullWidth type="button" onClick={() => void requestScramble(activeSession.eventId)} disabled={timerState === "running"}>
                New scramble
              </Button>
              <Button fullWidth type="button" onClick={() => void navigator.clipboard?.writeText(scramble)}>
                Copy scramble
              </Button>
            </ActionsMenu>
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
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;
}
