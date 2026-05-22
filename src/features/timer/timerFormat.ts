import type { Penalty } from "../sessions/types";

export function formatTimerTime(ms: number): string {
  const truncatedMs = Math.floor(Math.max(0, ms) / 10) * 10;
  const seconds = truncatedMs / 1000;
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds - minutes * 60;
    return `${minutes}:${remainder.toFixed(2).padStart(5, "0")}`;
  }

  return seconds.toFixed(2);
}

export function formatSolveTime(ms: number | null, penalty: Penalty = "OK"): string {
  if (penalty === "DNF") {
    return "DNF";
  }

  if (ms == null || Number.isNaN(ms)) {
    return "-";
  }

  const effectiveMs = penalty === "+2" ? ms + 2000 : ms;
  return `${formatTimerTime(effectiveMs)}${penalty === "+2" ? "+" : ""}`;
}
