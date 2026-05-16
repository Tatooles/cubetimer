import { cube3x3x3 } from "cubing/puzzles";
import { experimentalSolve3x3x3IgnoringCenters } from "cubing/search";
import { KPattern, type KPatternData } from "cubing/kpuzzle";

const LSLL_EDGE_POSITIONS = [0, 1, 2, 3, 8] as const;
const LSLL_CORNER_POSITIONS = [0, 1, 2, 3, 4] as const;

const SOLVED_CENTERS = {
  pieces: [0, 1, 2, 3, 4, 5],
  orientation: [0, 0, 0, 0, 0, 0],
  orientationMod: [1, 1, 1, 1, 1, 1],
};

export async function generate333LSLLScramble(): Promise<string> {
  const kpuzzle = await cube3x3x3.kpuzzle();

  for (let attempt = 0; attempt < 20; attempt++) {
    const pattern = new KPattern(kpuzzle, randomLSLLPatternData());
    const scramble = normalizeHalfTurns((await experimentalSolve3x3x3IgnoringCenters(pattern)).invert().toString());
    if (scramble.split(" ").filter(Boolean).length > 3) return scramble;
  }

  throw new Error("Unable to generate a last slot + last layer scramble.");
}

function normalizeHalfTurns(scramble: string): string {
  return scramble.replaceAll("2'", "2");
}

export function randomLSLLPatternData(): KPatternData {
  const edges = {
    pieces: Array.from({ length: 12 }, (_, index) => index),
    orientation: Array.from({ length: 12 }, () => 0),
  };
  const corners = {
    pieces: Array.from({ length: 8 }, (_, index) => index),
    orientation: Array.from({ length: 8 }, () => 0),
  };

  do {
    applyRandomPermutation(edges.pieces, LSLL_EDGE_POSITIONS);
    applyRandomPermutation(corners.pieces, LSLL_CORNER_POSITIONS);
  } while (permutationParity(edges.pieces) !== permutationParity(corners.pieces));

  applyRandomOrientations(edges.orientation, LSLL_EDGE_POSITIONS, 2);
  applyRandomOrientations(corners.orientation, LSLL_CORNER_POSITIONS, 3);

  return {
    EDGES: edges,
    CORNERS: corners,
    CENTERS: SOLVED_CENTERS,
  };
}

function applyRandomPermutation(pieces: number[], positions: readonly number[]): void {
  const shuffledPieces = shuffle(positions.map((position) => pieces[position]));
  positions.forEach((position, index) => {
    pieces[position] = shuffledPieces[index];
  });
}

function applyRandomOrientations(orientations: number[], positions: readonly number[], orientationCount: number): void {
  let sum = 0;
  for (let index = 0; index < positions.length - 1; index++) {
    const orientation = randomInt(orientationCount);
    orientations[positions[index]] = orientation;
    sum += orientation;
  }

  orientations[positions[positions.length - 1]] = (orientationCount - (sum % orientationCount)) % orientationCount;
}

function shuffle<T>(items: readonly T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = randomInt(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function randomInt(exclusiveMax: number): number {
  return Math.floor(Math.random() * exclusiveMax);
}

function permutationParity(pieces: readonly number[]): 0 | 1 {
  let inversions = 0;
  for (let left = 0; left < pieces.length; left++) {
    for (let right = left + 1; right < pieces.length; right++) {
      if (pieces[left] > pieces[right]) inversions++;
    }
  }
  return inversions % 2 === 0 ? 0 : 1;
}
