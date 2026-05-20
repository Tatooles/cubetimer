export type PuzzleEvent =
  | "333"
  | "222"
  | "444"
  | "555"
  | "666"
  | "777"
  | "333oh"
  | "333bld"
  | "pyra"
  | "skewb"
  | "mega"
  | "sq1"
  | "clock";

export type Penalty = "OK" | "+2" | "DNF";

export type Solve = {
  id: string;
  ms: number;
  eventId: PuzzleEvent;
  scramble: string;
  timestamp: number;
  penalty: Penalty;
  comment?: string;
};

export type Session = {
  id: string;
  name: string;
  solves: Solve[];
};

export type Density = "comfortable" | "compact";

export type TimerSettings = {
  density: Density;
  showGraph: boolean;
  showHistogram: boolean;
  showDraw: boolean;
  inspection: boolean;
};

export type AppState = {
  eventId: PuzzleEvent;
  selectedSessionId: string;
  sessions: Session[];
  currentScramble: string;
  settings: TimerSettings;
};

export type StatKey = "single" | "ao5" | "ao12" | "ao50" | "ao100";

export type StatRecord = Record<StatKey, number | null>;

export type SessionStats = {
  current: StatRecord;
  best: StatRecord;
  count: number;
  mean: number | null;
};
