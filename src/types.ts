export type EventId =
  | "333"
  | "222"
  | "444"
  | "555"
  | "666"
  | "777"
  | "333oh"
  | "333bf"
  | "pyram"
  | "skewb"
  | "minx"
  | "sq1"
  | "clock";

export type Penalty = "none" | "+2" | "DNF";

export type Solve = {
  id: string;
  sessionId: string;
  eventId: EventId;
  timeMs: number;
  penalty: Penalty;
  scramble: string;
  createdAt: string;
  note?: string;
};

export type Session = {
  id: string;
  name: string;
  eventId: EventId;
  createdAt: string;
};

export type TimerData = {
  version: 1;
  activeSessionId: string;
  sessions: Session[];
  solves: Solve[];
};
