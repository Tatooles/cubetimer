import type { EventId, Session, Solve, TimerData } from "./types";

const STORAGE_KEY = "cubetimer:data";

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createSession(name: string, eventId: EventId): Session {
  return {
    id: createId(),
    name,
    eventId,
    createdAt: new Date().toISOString(),
  };
}

export function createSolve(input: Omit<Solve, "id" | "createdAt">): Solve {
  return {
    id: createId(),
    createdAt: new Date().toISOString(),
    ...input,
  };
}

export function createInitialData(): TimerData {
  const session = createSession("Main session", "333");
  return {
    version: 1,
    activeSessionId: session.id,
    sessions: [session],
    solves: [],
  };
}

export function loadData(): TimerData {
  const fallback = createInitialData();
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return fallback;

  try {
    const parsed = JSON.parse(stored) as TimerData;
    if (!Array.isArray(parsed.sessions) || parsed.sessions.length === 0 || !Array.isArray(parsed.solves)) {
      return fallback;
    }

    return {
      version: 1,
      activeSessionId: parsed.sessions.some((session) => session.id === parsed.activeSessionId)
        ? parsed.activeSessionId
        : parsed.sessions[0].id,
      sessions: parsed.sessions,
      solves: parsed.solves,
    };
  } catch {
    return fallback;
  }
}

export function saveData(data: TimerData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function exportJson(data: TimerData): void {
  downloadFile(`cubetimer-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), "application/json");
}

export function exportCsv(solves: Solve[]): void {
  const headers = ["date", "event", "time_ms", "penalty", "scramble", "note"];
  const rows = solves.map((solve) =>
    [solve.createdAt, solve.eventId, solve.timeMs, solve.penalty, solve.scramble, solve.note ?? ""]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(","),
  );
  downloadFile(`cubetimer-solves-${new Date().toISOString().slice(0, 10)}.csv`, [headers.join(","), ...rows].join("\n"), "text/csv");
}

function downloadFile(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function importTimerData(file: File): Promise<TimerData> {
  const text = await file.text();
  const parsed = JSON.parse(text) as TimerData;

  if (parsed.version !== 1 || !Array.isArray(parsed.sessions) || !Array.isArray(parsed.solves) || parsed.sessions.length === 0) {
    throw new Error("This file is not a valid CubeTimer export.");
  }

  return {
    version: 1,
    activeSessionId: parsed.sessions.some((session) => session.id === parsed.activeSessionId)
      ? parsed.activeSessionId
      : parsed.sessions[0].id,
    sessions: parsed.sessions,
    solves: parsed.solves,
  };
}
