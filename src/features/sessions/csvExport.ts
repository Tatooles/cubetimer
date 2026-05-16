import { formatSolveTime } from "../timer/timerFormat";
import type { Solve } from "./types";

function csvCell(value: string | number, quoteString = false): string {
  const raw = String(value);
  if (!quoteString && !/[",\n\r]/.test(raw)) {
    return raw;
  }

  return `"${raw.replaceAll('"', '""')}"`;
}

export function solvesToCsv(solves: Solve[]): string {
  const rows = [["solve", "time", "penalty", "event", "scramble", "comment", "timestamp"]];
  solves.forEach((solve, index) => {
    rows.push([
      String(index + 1),
      formatSolveTime(solve.ms, solve.penalty).replace("+", ""),
      solve.penalty,
      solve.eventId,
      solve.scramble,
      solve.comment ?? "",
      new Date(solve.timestamp).toISOString(),
    ]);
  });

  return `${rows
    .map((row, rowIndex) =>
      row
        .map((cell, cellIndex) =>
          csvCell(cell, rowIndex > 0 && (cellIndex === 4 || cellIndex === 5)),
        )
        .join(","),
    )
    .join("\n")}\n`;
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
