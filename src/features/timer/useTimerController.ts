import { useCallback, useEffect, useRef, useState } from "react";

export type TimerStage = "idle" | "holding" | "ready" | "running";

export type TimerSnapshot = {
  stage: TimerStage;
  elapsedMs: number;
};

export function useTimerController(
  onSolve: (ms: number) => void,
  holdMs = 350,
): TimerSnapshot & {
  press: () => void;
  release: () => void;
  stop: () => void;
} {
  const [snapshot, setSnapshot] = useState<TimerSnapshot>({ stage: "idle", elapsedMs: 0 });
  const stageRef = useRef<TimerStage>("idle");
  const holdTimerRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  const setStage = useCallback((stage: TimerStage, elapsedMs = 0) => {
    stageRef.current = stage;
    setSnapshot({ stage, elapsedMs });
  }, []);

  const clearTimers = useCallback(() => {
    if (holdTimerRef.current != null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (frameRef.current != null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    if (stageRef.current !== "running") {
      return;
    }

    setSnapshot({ stage: "running", elapsedMs: performance.now() - startRef.current });
    frameRef.current = window.requestAnimationFrame(tick);
  }, []);

  const stop = useCallback(() => {
    if (stageRef.current !== "running") {
      return;
    }

    const elapsedMs = performance.now() - startRef.current;
    clearTimers();
    setStage("idle", 0);
    onSolve(Math.max(1, Math.round(elapsedMs)));
  }, [clearTimers, onSolve, setStage]);

  const press = useCallback(() => {
    if (stageRef.current === "running") {
      stop();
      return;
    }

    if (stageRef.current !== "idle") {
      return;
    }

    setStage("holding", 0);
    holdTimerRef.current = window.setTimeout(() => setStage("ready", 0), holdMs);
  }, [holdMs, setStage, stop]);

  const release = useCallback(() => {
    if (stageRef.current === "ready") {
      clearTimers();
      startRef.current = performance.now();
      setStage("running", 0);
      frameRef.current = window.requestAnimationFrame(tick);
      return;
    }

    if (stageRef.current === "holding") {
      clearTimers();
      setStage("idle", 0);
    }
  }, [clearTimers, setStage, tick]);

  useEffect(() => clearTimers, [clearTimers]);

  return {
    ...snapshot,
    press,
    release,
    stop,
  };
}
