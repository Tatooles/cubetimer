import { ChangeEvent, KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { EVENTS, getEvent } from "./events";
import { averageOf, bestOf, formatSolveTime, formatTime, meanOf, rollingAverageAt } from "./format";
import { generateScramble } from "./scramble";
import { createInitialData, createSession, createSolve, exportCsv, exportJson, importTimerData, loadData, saveData } from "./storage";
import type { EventId, Penalty, Session, Solve, TimerData } from "./types";

type TimerState = "idle" | "holding" | "ready" | "running";

const HOLD_MS = 450;

const buttonClass =
  "min-h-[34px] cursor-pointer rounded-[7px] border border-[#293345] bg-[#121923] px-3 text-[#e5ecf5] hover:not-disabled:border-[#6ea8fe] hover:not-disabled:text-white disabled:cursor-not-allowed disabled:opacity-45";
const fieldClass = "min-h-[38px] w-full rounded-[7px] border border-[#293345] bg-[#121923] px-2.5 text-[#e5ecf5]";
const labelClass = "text-[0.72rem] font-bold text-[#8d99aa] uppercase";
const menuSummaryClass =
  "grid size-[34px] cursor-pointer list-none place-items-center rounded-[7px] border border-[#293345] text-[#cbd5e1] select-none hover:border-[#6ea8fe] hover:text-white";
const menuPanelClass =
  "absolute top-[calc(100%+6px)] right-0 z-20 grid w-[180px] gap-1.5 rounded-lg border border-[#293345] bg-[#151d29] p-2 shadow-[0_14px_42px_rgba(0,0,0,0.42)]";

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
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid flex-none grid-cols-2 gap-[3px]" aria-hidden="true">
              <span className="size-3.5 rounded-[3px] bg-rose-600" />
              <span className="size-3.5 rounded-[3px] bg-blue-500" />
              <span className="size-3.5 rounded-[3px] bg-green-500" />
              <span className="size-3.5 rounded-[3px] bg-amber-500" />
            </span>
            <div>
              <h1 className="text-[1.04rem] leading-[1.1] text-slate-50">CubeTimer</h1>
              <p className="text-[0.86rem] text-[#8d99aa]">{getEvent(activeSession.eventId).name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 max-[680px]:flex-wrap">
            <button className={buttonClass} type="button" onClick={() => exportJson(data)}>
              JSON
            </button>
            <button className={buttonClass} type="button" onClick={() => exportCsv(sessionSolves)}>
              CSV
            </button>
            <button className={buttonClass} type="button" onClick={() => importInput.current?.click()}>
              Import
            </button>
            <input ref={importInput} className="hidden" type="file" accept="application/json,.json" onChange={handleImport} />
          </div>
        </div>

        <div className={timerDisplayClass(timerState)} tabIndex={0} onKeyDown={(event) => handleTimerPanelKey(event)}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <p className="font-mono text-[clamp(0.9rem,1.35vw,1.08rem)] leading-[1.55] break-anywhere text-slate-300" aria-label="Current scramble">
              {scramble}
            </p>
            <details className="relative">
              <summary className={menuSummaryClass} aria-label="Scramble actions">
                ...
              </summary>
              <div className={menuPanelClass}>
                <button className={`${buttonClass} w-full justify-start`} type="button" onClick={() => void requestScramble(activeSession.eventId)} disabled={timerState === "running"}>
                  New scramble
                </button>
                <button className={`${buttonClass} w-full justify-start`} type="button" onClick={() => void navigator.clipboard?.writeText(scramble)}>
                  Copy scramble
                </button>
              </div>
            </details>
          </div>
          <div className="self-center text-center text-[clamp(5rem,16vw,13rem)] leading-[0.94] font-[740] tracking-normal text-slate-50 tabular-nums max-[680px]:text-[clamp(3.2rem,18vw,6rem)]">
            {formatTime(timerState === "running" ? elapsed : elapsed)}
          </div>
          <div className="text-center text-[0.96rem] leading-[1.2] font-[650] text-[#8d99aa]">{statusText}</div>
        </div>

        <div className="grid grid-cols-5 gap-2 max-[680px]:gap-1.5">
          <Stat label="Solves" value={String(sessionSolves.length)} />
          <Stat label="Best" value={bestOf(sessionSolves)} />
          <Stat label="Mean" value={meanOf(sessionSolves)} />
          <Stat label="Ao5" value={averageOf(sessionSolves, 5)} />
          <Stat label="Ao12" value={averageOf(sessionSolves, 12)} />
        </div>
        {message ? <p className="text-[#8d99aa]">{message}</p> : null}
      </section>

      <aside
        className="grid h-dvh min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-3.5 overflow-hidden border-l border-[#1d2633] bg-[#0d131b] p-4 max-[960px]:h-auto max-[960px]:overflow-auto max-[960px]:border-t max-[960px]:border-l-0"
        aria-label="Sessions and solves"
      >
        <section className="grid min-h-0 gap-[9px]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[0.96rem] text-slate-50">Sessions</h2>
            <button className={buttonClass} type="button" onClick={addSession}>
              Add
            </button>
          </div>
          <div className="mb-0.5 grid grid-cols-2 gap-2 overflow-visible pr-0.5 max-[680px]:grid-cols-1">
            {data.sessions.map((session) => (
              <button
                className={`${buttonClass} grid min-h-[42px] min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center justify-between gap-2 text-left leading-none ${
                  session.id === activeSession.id ? "border-[#6ea8fe] bg-[#132036]" : ""
                }`}
                type="button"
                key={session.id}
                onClick={() => setActiveSession(session.id)}
              >
                <span className="min-w-0 translate-y-0.5 overflow-hidden leading-[1.1] text-ellipsis whitespace-nowrap">
                  {session.name}
                </span>
                <small className="translate-y-0.5 leading-[1.1] text-[#8d99aa]">{getEvent(session.eventId).shortName}</small>
              </button>
            ))}
          </div>
          <label className={labelClass} htmlFor="session-name">
            Session name
          </label>
          <input
            className={fieldClass}
            id="session-name"
            value={activeSession.name}
            onChange={(event) => updateSession(activeSession.id, { name: event.target.value })}
          />
          <label className={labelClass} htmlFor="event">
            Event
          </label>
          <select className={fieldClass} id="event" value={activeSession.eventId} onChange={(event) => changeActiveEvent(event.target.value as EventId)}>
            {EVENTS.map((event) => (
              <option value={event.id} key={event.id}>
                {event.name}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 max-[680px]:flex-wrap">
            <button className={buttonClass} type="button" onClick={() => deleteSession(activeSession.id)} disabled={data.sessions.length === 1}>
              Delete session
            </button>
            <button className={buttonClass} type="button" onClick={resetAll}>
              Reset all
            </button>
          </div>
        </section>

        <section className="grid min-h-0 gap-[9px]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[0.96rem] text-slate-50">Solves</h2>
            <span className="text-[#8d99aa]">{sessionSolves.length}</span>
          </div>
          <div className="grid min-h-0 gap-2 overflow-auto pr-[3px]">
            {sessionSolves.length === 0 ? (
              <p className="text-[#8d99aa]">No solves in this session yet.</p>
            ) : (
              sessionSolves.map((solve, index) => (
                <article
                  className="relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2.5 rounded-lg border border-[#1d2633] bg-[#101720] p-[11px]"
                  key={solve.id}
                >
                  <div>
                    <span className={labelClass}>{sessionSolves.length - index}</span>
                    <strong className="ml-2 inline-block text-[1.24rem] text-slate-50 tabular-nums">
                      {formatSolveTime(solve.timeMs, solve.penalty)}
                    </strong>
                    <dl className="mt-2 grid grid-cols-2 gap-2">
                      <div className="min-w-0">
                        <dt className={labelClass}>ao5</dt>
                        <dd className="mt-0.5 text-[0.9rem] text-slate-300 tabular-nums">{rollingAverageAt(sessionSolves, index, 5)}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className={labelClass}>ao12</dt>
                        <dd className="mt-0.5 text-[0.9rem] text-slate-300 tabular-nums">{rollingAverageAt(sessionSolves, index, 12)}</dd>
                      </div>
                    </dl>
                  </div>
                  <details className="relative">
                    <summary className={menuSummaryClass} aria-label={`Actions for solve ${sessionSolves.length - index}`}>
                      ...
                    </summary>
                    <div className={`${menuPanelClass} w-[210px]`}>
                      <button className={`${buttonClass} w-full justify-start`} type="button" onClick={() => updatePenalty(solve.id, "none")}>
                        OK
                      </button>
                      <button className={`${buttonClass} w-full justify-start`} type="button" onClick={() => updatePenalty(solve.id, "+2")}>
                        +2
                      </button>
                      <button className={`${buttonClass} w-full justify-start`} type="button" onClick={() => updatePenalty(solve.id, "DNF")}>
                        DNF
                      </button>
                      <div className="max-h-[86px] overflow-auto rounded-md bg-[#0c1118] p-2 font-mono text-[0.74rem] leading-[1.45] text-[#aab6c7]">
                        {solve.scramble}
                      </div>
                      <button className={`${buttonClass} w-full justify-start border-red-900 text-red-200`} type="button" onClick={() => deleteSolve(solve.id)}>
                        Delete
                      </button>
                    </div>
                  </details>
                </article>
              ))
            )}
          </div>
        </section>
      </aside>
    </main>
  );

  function handleTimerPanelKey(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" && timerState !== "running") {
      void requestScramble(activeSession.eventId);
    }
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-16 rounded-lg border border-[#1d2633] bg-[#0f151e] px-3 py-2.5 max-[680px]:min-h-[50px] max-[680px]:p-[7px]">
      <span className="text-[0.72rem] font-bold text-[#8d99aa] uppercase max-[680px]:text-[0.62rem]">{label}</span>
      <strong className="mt-[5px] block text-[1.14rem] text-slate-50 tabular-nums max-[680px]:text-[0.95rem]">{value}</strong>
    </div>
  );
}

function timerDisplayClass(timerState: TimerState): string {
  const base =
    "grid min-h-0 grid-rows-[minmax(72px,auto)_minmax(120px,1fr)_auto] items-center rounded-lg border p-[18px_22px_24px] outline-none max-[680px]:p-3.5";

  if (timerState === "holding") return `${base} border-amber-500 bg-[#0c1118]`;
  if (timerState === "ready") return `${base} border-green-500 bg-[#0b1711]`;
  if (timerState === "running") return `${base} border-[#6ea8fe] bg-[#0c1118]`;
  return `${base} border-transparent bg-[#0c1118]`;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;
}
