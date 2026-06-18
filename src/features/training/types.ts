export type TrainingMode = "cross" | "algorithms";
export type CrossColor = "white" | "yellow" | "green" | "blue" | "red" | "orange";
export type CrossRating = "good" | "okay" | "missed";
export type AlgorithmSetId = "OLL" | "PLL" | "COLL" | "ZBLL" | "LSLL" | "CLL2" | "PLL4";
export type AlgorithmMode = "drill" | "subset";

export type CrossSettings = {
  colors: CrossColor[];
  moveTarget: number;
  xcross: boolean;
  shortScramble: boolean;
};

export type CrossAttempt = {
  id: string;
  scramble: string;
  solution: string[];
  moveCount: number;
  rating: CrossRating;
  flagged: boolean;
  xcross: boolean;
  timestamp: number;
};

export type AlgorithmTime = {
  setId: AlgorithmSetId;
  caseId: string;
  ms: number;
  timestamp: number;
};

export type AlgorithmSettings = {
  activeSetId: AlgorithmSetId;
  mode: AlgorithmMode;
  subsets: Record<AlgorithmSetId, string[]>;
};

export type TrainingState = {
  activeTrainer: TrainingMode;
  cross: {
    settings: CrossSettings;
    history: CrossAttempt[];
  };
  algorithms: {
    settings: AlgorithmSettings;
    historyByCase: Record<string, AlgorithmTime[]>;
  };
};
