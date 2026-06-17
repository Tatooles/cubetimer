import type { CrossAttempt, CrossSettings } from "./types";

type TurnFace = "U" | "D" | "L" | "R" | "F" | "B";
type TurnAxis = "x" | "y" | "z";

type CrossLine = {
  moves: string[];
  solution: string;
  moveCount: number;
};

export type CrossSolution = {
  scramble: string;
  settings: Pick<CrossSettings, "color" | "moveTarget" | "xcross">;
  cross: CrossLine & {
    color: CrossSettings["color"];
  };
  xcross?: CrossLine & {
    slot: "FR" | "FL" | "BR" | "BL";
    pair: string;
  };
  summary: {
    mode: "cross" | "xcross";
    targetMoves: number;
    generatedAt: "mock";
  };
};

const FACES: TurnFace[] = ["U", "D", "L", "R", "F", "B"];
const SUFFIXES = ["", "'", "2"];
const SOLUTION_FACES: TurnFace[] = ["D", "L", "R", "F", "B", "U"];
const XCROSS_SLOTS: Array<NonNullable<CrossSolution["xcross"]>["slot"]> = ["FR", "FL", "BR", "BL"];

function axisForFace(face: TurnFace): TurnAxis {
  if (face === "L" || face === "R") {
    return "x";
  }
  if (face === "U" || face === "D") {
    return "y";
  }
  return "z";
}

function hashText(value: string): number {
  let hash = 2_166_136_261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return hash >>> 0;
}

function createSeededRandom(seed: number): () => number {
  let state = seed || 1;

  return () => {
    state = Math.imul(state ^ (state >>> 15), 1 | state);
    state ^= state + Math.imul(state ^ (state >>> 7), 61 | state);
    return ((state ^ (state >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function pick<T>(values: T[], random: () => number): T {
  return values[Math.floor(random() * values.length)]!;
}

function generateMoves(length: number, random: () => number, faces = FACES): string[] {
  const moves: string[] = [];
  let previousAxis: TurnAxis | null = null;

  while (moves.length < length) {
    const availableFaces = faces.filter((face) => axisForFace(face) !== previousAxis);
    const face = pick(availableFaces, random);
    moves.push(`${face}${pick(SUFFIXES, random)}`);
    previousAxis = axisForFace(face);
  }

  return moves;
}

export function generateCrossScramble({ short }: { short: boolean }): string {
  return generateMoves(short ? 15 : 20, Math.random).join(" ");
}

export function mockCrossSolution(scramble: string, settings: CrossSettings): CrossSolution {
  const seed = hashText(
    `${scramble}|${settings.color}|${settings.moveTarget}|${settings.xcross}|${settings.revealMode}`,
  );
  const random = createSeededRandom(seed);
  const crossLength = 4 + Math.floor(random() * 5);
  const crossMoves = generateMoves(crossLength, random, SOLUTION_FACES);
  const solution: CrossSolution = {
    scramble,
    settings: {
      color: settings.color,
      moveTarget: settings.moveTarget,
      xcross: settings.xcross,
    },
    cross: {
      color: settings.color,
      moves: crossMoves,
      solution: crossMoves.join(" "),
      moveCount: crossMoves.length,
    },
    summary: {
      mode: settings.xcross ? "xcross" : "cross",
      targetMoves: settings.moveTarget,
      generatedAt: "mock",
    },
  };

  if (settings.xcross) {
    const extraLength = Math.floor(random() * 3);
    const xcrossMoves = [...crossMoves, ...generateMoves(extraLength, random, SOLUTION_FACES)];

    solution.xcross = {
      moves: xcrossMoves,
      solution: xcrossMoves.join(" "),
      moveCount: xcrossMoves.length,
      slot: pick(XCROSS_SLOTS, random),
      pair: `mock-pair-${1 + Math.floor(random() * 4)}`,
    };
  }

  return solution;
}

export function toggleCrossFlag(history: CrossAttempt[], scramble: string): CrossAttempt[] {
  return history.map((attempt) =>
    attempt.scramble === scramble ? { ...attempt, flagged: !attempt.flagged } : attempt,
  );
}
