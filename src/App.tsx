import { ChangeEvent, KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { EVENTS, getEvent } from "./events";
import { averageOf, bestOf, formatSolveTime, formatTime, meanOf, rollingAverageAt } from "./format";
import { generateScramble } from "./scramble";
import { createInitialData, createSession, createSolve, exportCsv, exportJson, importTimerData, loadData, saveData } from "./storage";
import type { EventId, Penalty, Session, Solve, TimerData } from "./types";

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
    <main className="app-shell">
      <section className="timer-panel" aria-label="Timer">
        <div className="topbar">
          <div className="brand">
            <span className="cube-mark" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
            <div>
              <h1>CubeTimer</h1>
              <p>{getEvent(activeSession.eventId).name}</p>
            </div>
          </div>
          <div className="topbar-actions">
            <button type="button" onClick={() => exportJson(data)}>
              JSON
            </button>
            <button type="button" onClick={() => exportCsv(sessionSolves)}>
              CSV
            </button>
            <button type="button" onClick={() => importInput.current?.click()}>
              Import
            </button>
            <input ref={importInput} className="hidden" type="file" accept="application/json,.json" onChange={handleImport} />
          </div>
        </div>

        <div className={`timer-display ${timerState}`} tabIndex={0} onKeyDown={(event) => handleTimerPanelKey(event)}>
          <div className="scramble-row">
            <p aria-label="Current scramble">{scramble}</p>
            <details className="menu">
              <summary aria-label="Scramble actions">...</summary>
              <div className="menu-panel">
                <button type="button" onClick={() => void requestScramble(activeSession.eventId)} disabled={timerState === "running"}>
                  New scramble
                </button>
                <button type="button" onClick={() => void navigator.clipboard?.writeText(scramble)}>
                  Copy scramble
                </button>
              </div>
            </details>
          </div>
          <div className="time-readout">{formatTime(timerState === "running" ? elapsed : elapsed)}</div>
          <div className="timer-status">{statusText}</div>
        </div>

        <div className="stats-grid">
          <Stat label="Solves" value={String(sessionSolves.length)} />
          <Stat label="Best" value={bestOf(sessionSolves)} />
          <Stat label="Mean" value={meanOf(sessionSolves)} />
          <Stat label="Ao5" value={averageOf(sessionSolves, 5)} />
          <Stat label="Ao12" value={averageOf(sessionSolves, 12)} />
        </div>
        {message ? <p className="message">{message}</p> : null}
      </section>

      <aside className="side-panel" aria-label="Sessions and solves">
        <section className="control-section">
          <div className="section-heading">
            <h2>Sessions</h2>
            <button type="button" onClick={addSession}>
              Add
            </button>
          </div>
          <div className="sessions-grid">
            {data.sessions.map((session) => (
              <button
                className={`session-button ${session.id === activeSession.id ? "active" : ""}`}
                type="button"
                key={session.id}
                onClick={() => setActiveSession(session.id)}
              >
                <span>{session.name}</span>
                <small>{getEvent(session.eventId).shortName}</small>
              </button>
            ))}
          </div>
          <label className="field-label" htmlFor="session-name">
            Session name
          </label>
          <input
            id="session-name"
            value={activeSession.name}
            onChange={(event) => updateSession(activeSession.id, { name: event.target.value })}
          />
          <label className="field-label" htmlFor="event">
            Event
          </label>
          <select id="event" value={activeSession.eventId} onChange={(event) => changeActiveEvent(event.target.value as EventId)}>
            {EVENTS.map((event) => (
              <option value={event.id} key={event.id}>
                {event.name}
              </option>
            ))}
          </select>
          <div className="danger-row">
            <button type="button" onClick={() => deleteSession(activeSession.id)} disabled={data.sessions.length === 1}>
              Delete session
            </button>
            <button type="button" onClick={resetAll}>
              Reset all
            </button>
          </div>
        </section>

        <section className="control-section solves-section">
          <div className="section-heading">
            <h2>Solves</h2>
            <span>{sessionSolves.length}</span>
          </div>
          <div className="solves-list">
            {sessionSolves.length === 0 ? (
              <p className="empty-state">No solves in this session yet.</p>
            ) : (
              sessionSolves.map((solve, index) => (
                <article className="solve-row" key={solve.id}>
                  <div>
                    <span className="solve-index">{sessionSolves.length - index}</span>
                    <strong>{formatSolveTime(solve.timeMs, solve.penalty)}</strong>
                    <dl className="rolling-stats">
                      <div>
                        <dt>ao5</dt>
                        <dd>{rollingAverageAt(sessionSolves, index, 5)}</dd>
                      </div>
                      <div>
                        <dt>ao12</dt>
                        <dd>{rollingAverageAt(sessionSolves, index, 12)}</dd>
                      </div>
                    </dl>
                  </div>
                  <details className="menu solve-menu">
                    <summary aria-label={`Actions for solve ${sessionSolves.length - index}`}>...</summary>
                    <div className="menu-panel">
                      <button type="button" onClick={() => updatePenalty(solve.id, "none")}>
                        OK
                      </button>
                      <button type="button" onClick={() => updatePenalty(solve.id, "+2")}>
                        +2
                      </button>
                      <button type="button" onClick={() => updatePenalty(solve.id, "DNF")}>
                        DNF
                      </button>
                      <div className="scramble-preview">{solve.scramble}</div>
                      <button type="button" className="danger-button" onClick={() => deleteSolve(solve.id)}>
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
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;
}
