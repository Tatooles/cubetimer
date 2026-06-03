import { onUnmounted, readonly, ref } from "vue";

export type TimerStage = "idle" | "holding" | "ready" | "running";

export type TimerSnapshot = {
  stage: TimerStage;
  elapsedMs: number;
};

export function stoppedTimerSnapshot(elapsedMs: number): TimerSnapshot {
  return { stage: "idle", elapsedMs };
}

export function useTimerController(onSolve: (ms: number) => void, holdMs = 350) {
  const stage = ref<TimerStage>("idle");
  const elapsedMs = ref(0);
  let holdTimer: number | null = null;
  let frame: number | null = null;
  let start = 0;

  function setStage(nextStage: TimerStage, nextElapsedMs = 0) {
    stage.value = nextStage;
    elapsedMs.value = nextElapsedMs;
  }

  function clearTimers() {
    if (holdTimer != null) {
      window.clearTimeout(holdTimer);
      holdTimer = null;
    }

    if (frame != null) {
      window.cancelAnimationFrame(frame);
      frame = null;
    }
  }

  function tick() {
    if (stage.value !== "running") {
      return;
    }

    elapsedMs.value = performance.now() - start;
    frame = window.requestAnimationFrame(tick);
  }

  function stop() {
    if (stage.value !== "running") {
      return;
    }

    const nextElapsedMs = performance.now() - start;
    const stoppedSnapshot = stoppedTimerSnapshot(nextElapsedMs);
    clearTimers();
    setStage(stoppedSnapshot.stage, stoppedSnapshot.elapsedMs);
    onSolve(Math.max(1, Math.round(nextElapsedMs)));
  }

  function press() {
    if (stage.value === "running") {
      stop();
      return;
    }

    if (stage.value !== "idle") {
      return;
    }

    setStage("holding", 0);
    holdTimer = window.setTimeout(() => setStage("ready", 0), holdMs);
  }

  function release() {
    if (stage.value === "ready") {
      clearTimers();
      start = performance.now();
      setStage("running", 0);
      frame = window.requestAnimationFrame(tick);
      return;
    }

    if (stage.value === "holding") {
      clearTimers();
      setStage("idle", 0);
    }
  }

  onUnmounted(clearTimers);

  return {
    stage: readonly(stage),
    elapsedMs: readonly(elapsedMs),
    press,
    release,
    stop,
  };
}
