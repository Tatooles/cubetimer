import type { Penalty, Solve } from "./types";

export function displayedTimeMs(solve: Solve): number | null {
  if (solve.penalty === "DNF") return null;
  return solve.timeMs + (solve.penalty === "+2" ? 2000 : 0);
}

export function formatTime(ms: number | null): string {
  if (ms === null) return "DNF";

  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);

  if (minutes > 0) {
    return `${minutes}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
  }

  return `${seconds}.${String(centiseconds).padStart(2, "0")}`;
}

export function formatSolveTime(timeMs: number, penalty: Penalty): string {
  if (penalty === "DNF") return "DNF";
  return `${formatTime(timeMs + (penalty === "+2" ? 2000 : 0))}${penalty === "+2" ? "+" : ""}`;
}

export function averageOf(solves: Solve[], count: number): string {
  const recent = solves.slice(0, count);
  if (recent.length < count) return "-";

  const values = recent.map(displayedTimeMs);
  if (values.filter((value) => value === null).length > 1) return "DNF";

  const sortable = values.map((value) => value ?? Number.POSITIVE_INFINITY).sort((a, b) => a - b);
  const trimmed = sortable.slice(1, -1);
  if (trimmed.some((value) => value === Number.POSITIVE_INFINITY)) return "DNF";

  return formatTime(Math.round(trimmed.reduce((sum, value) => sum + value, 0) / trimmed.length));
}

export function rollingAverageAt(solves: Solve[], index: number, count: number): string {
  return averageOf(solves.slice(index, index + count), count);
}

export function meanOf(solves: Solve[]): string {
  const values = solves.map(displayedTimeMs).filter((value): value is number => value !== null);
  if (values.length === 0) return "-";
  return formatTime(Math.round(values.reduce((sum, value) => sum + value, 0) / values.length));
}

export function bestOf(solves: Solve[]): string {
  const values = solves.map(displayedTimeMs).filter((value): value is number => value !== null);
  if (values.length === 0) return "-";
  return formatTime(Math.min(...values));
}
