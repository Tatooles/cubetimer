import { randomScrambleForEvent } from "cubing/scramble";
import { getEvent } from "./events";
import type { EventId } from "./types";

const SUFFIXES = ["", "'", "2"];

function choice<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function nxnScramble(size: number, length: number): string {
  const baseAxes = [
    ["R", "L"],
    ["U", "D"],
    ["F", "B"],
  ];
  const moves: string[] = [];
  let previousAxis = -1;

  for (let index = 0; index < length; index += 1) {
    let axis = randomInt(0, baseAxes.length - 1);
    while (axis === previousAxis) axis = randomInt(0, baseAxes.length - 1);
    previousAxis = axis;

    const face = choice(baseAxes[axis]);
    let prefix = "";
    let wide = "";

    if (size >= 4 && Math.random() < 0.35) {
      wide = "w";
      if (size >= 6 && Math.random() < 0.35) {
        prefix = String(randomInt(2, Math.min(3, size - 2)));
      }
    }

    moves.push(`${prefix}${face}${wide}${choice(SUFFIXES)}`);
  }

  return moves.join(" ");
}

function pyraminxScramble(length: number): string {
  const faces = ["U", "L", "R", "B"];
  const tips = ["u", "l", "r", "b"];
  const moves: string[] = [];
  let previous = "";

  for (let index = 0; index < length; index += 1) {
    let face = choice(faces);
    while (face === previous) face = choice(faces);
    previous = face;
    moves.push(`${face}${choice(["", "'"])}`);
  }

  tips.forEach((tip) => {
    if (Math.random() < 0.75) moves.push(`${tip}${choice(["", "'"])}`);
  });

  return moves.join(" ");
}

function simpleScramble(faces: string[], length: number, suffixes = SUFFIXES): string {
  const moves: string[] = [];
  let previous = "";

  for (let index = 0; index < length; index += 1) {
    let face = choice(faces);
    while (face === previous) face = choice(faces);
    previous = face;
    moves.push(`${face}${choice(suffixes)}`);
  }

  return moves.join(" ");
}

function megaminxScramble(): string {
  const rows: string[] = [];
  for (let row = 0; row < 7; row += 1) {
    const rowMoves: string[] = [];
    for (let move = 0; move < 5; move += 1) {
      rowMoves.push(`R${choice(["++", "--"])}`);
      rowMoves.push(`D${choice(["++", "--"])}`);
    }
    rowMoves.push(`U${choice(["", "'"])}`);
    rows.push(rowMoves.join(" "));
  }
  return rows.join(" / ");
}

function squareOneScramble(length: number): string {
  const moves: string[] = [];
  for (let index = 0; index < length; index += 1) {
    moves.push(`(${randomInt(-5, 6)},${randomInt(-5, 6)})`);
    if (index !== length - 1) moves.push("/");
  }
  return moves.join(" ");
}

function clockScramble(): string {
  const pins = ["UR", "DR", "DL", "UL", "U", "R", "D", "L", "ALL"];
  const turns = pins.map((pin) => `${pin}${randomInt(-5, 6)}`);
  return `${turns.join(" ")} y2 ${turns.slice(0, 4).map((turn) => `${turn}*`).join(" ")}`;
}

function generateFallbackScramble(eventId: EventId): string {
  const event = getEvent(eventId);

  if (event.kind === "nxn") return nxnScramble(event.size ?? 3, event.scrambleLength);
  if (event.kind === "pyraminx") return pyraminxScramble(event.scrambleLength);
  if (event.kind === "skewb") return simpleScramble(["R", "L", "U", "B"], event.scrambleLength, ["", "'"]);
  if (event.kind === "megaminx") return megaminxScramble();
  if (event.kind === "square1") return squareOneScramble(event.scrambleLength);
  return clockScramble();
}

export async function generateScramble(eventId: EventId): Promise<string> {
  try {
    return (await randomScrambleForEvent(eventId)).toString();
  } catch {
    return generateFallbackScramble(eventId);
  }
}
