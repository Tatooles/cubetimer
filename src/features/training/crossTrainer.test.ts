import { describe, expect, test } from "vite-plus/test";
import { generateCrossScramble, mockCrossSolution, toggleCrossFlag } from "./crossTrainer";
import type { CrossAttempt, CrossSettings } from "./types";

const settings: CrossSettings = {
  colors: ["white"],
  moveTarget: 6,
  xcross: false,
  shortScramble: false,
};

function tokens(scramble: string): string[] {
  return scramble.split(" ");
}

function face(token: string): string {
  return token[0]!;
}

function axis(token: string): "x" | "y" | "z" {
  if (face(token) === "L" || face(token) === "R") {
    return "x";
  }
  if (face(token) === "U" || face(token) === "D") {
    return "y";
  }
  return "z";
}

function attempt(overrides: Partial<CrossAttempt>): CrossAttempt {
  return {
    id: "cross-1",
    scramble: "R U R'",
    solution: ["D", "L'"],
    moveCount: 2,
    rating: "good",
    flagged: false,
    xcross: false,
    timestamp: 1,
    ...overrides,
  };
}

describe("cross trainer helpers", () => {
  test("generates short and long scrambles with expected token counts", () => {
    expect(tokens(generateCrossScramble({ short: true }))).toHaveLength(15);
    expect(tokens(generateCrossScramble({ short: false }))).toHaveLength(20);
  });

  test("generated scrambles avoid immediately repeating same or opposite faces", () => {
    const scramble = tokens(generateCrossScramble({ short: false }));

    for (let index = 1; index < scramble.length; index += 1) {
      expect(axis(scramble[index]!)).not.toBe(axis(scramble[index - 1]!));
    }
  });

  test("returns deterministic mocked solutions for the same scramble and settings", () => {
    const first = mockCrossSolution("R U R' F2 D L2", settings);
    const second = mockCrossSolution("R U R' F2 D L2", settings);

    expect(second).toEqual(first);
  });

  test("returns cross solution moves in the 4 to 8 move training range", () => {
    const solution = mockCrossSolution("R U R' F2 D L2", settings);

    expect(solution.cross.moves.length).toBeGreaterThanOrEqual(3);
    expect(solution.cross.moves.length).toBeLessThanOrEqual(7);
    expect(solution.cross.solution).toBe(solution.cross.moves.join(" "));
  });

  test("chooses a mocked cross solution from the selected cross colors", () => {
    const solution = mockCrossSolution("R U R' F2 D L2", {
      ...settings,
      colors: ["white", "yellow", "blue"],
    });

    expect(["white", "yellow", "blue"]).toContain(solution.cross.color);
    expect(solution.settings.colors).toEqual(["white", "yellow", "blue"]);
  });

  test("includes XCross metadata and keeps XCross length at least cross length", () => {
    const solution = mockCrossSolution("R U R' F2 D L2", { ...settings, xcross: true });

    expect(solution.xcross).toBeDefined();
    expect(solution.xcross?.moves.length).toBeGreaterThanOrEqual(solution.cross.moves.length);
    expect(solution.xcross?.slot).toMatch(/[FRBL]/);
  });

  test("toggles matching attempts without mutating the original history", () => {
    const matching = attempt({ id: "cross-1", scramble: "R U R'", flagged: false });
    const other = attempt({ id: "cross-2", scramble: "F R U", flagged: true });
    const secondMatching = attempt({ id: "cross-3", scramble: "R U R'", flagged: true });
    const history = [matching, other, secondMatching];

    const next = toggleCrossFlag(history, "R U R'");

    expect(next).toEqual([
      { ...matching, flagged: true },
      other,
      { ...secondMatching, flagged: false },
    ]);
    expect(history).toEqual([matching, other, secondMatching]);
    expect(next).not.toBe(history);
    expect(next[0]).not.toBe(matching);
    expect(next[1]).toBe(other);
    expect(next[2]).not.toBe(secondMatching);
  });
});
