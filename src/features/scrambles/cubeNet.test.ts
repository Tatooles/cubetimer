import { describe, expect, test } from "vite-plus/test";
import { scrambledCubeNet, type CubeNet } from "./cubeNet";

function faceStrings(net: CubeNet): Record<keyof CubeNet, string> {
  return {
    U: net.U.join(""),
    R: net.R.join(""),
    F: net.F.join(""),
    D: net.D.join(""),
    L: net.L.join(""),
    B: net.B.join(""),
  };
}

describe("scramble cube net", () => {
  test("starts solved when no moves are applied", () => {
    const net = scrambledCubeNet("", 3);
    expect(new Set(net.U)).toEqual(new Set(["U"]));
    expect(new Set(net.F)).toEqual(new Set(["F"]));
  });

  test.each([
    [
      "3x3 R",
      3,
      "R",
      {
        U: "UUFUUFUUF",
        R: "RRRRRRRRR",
        F: "FFDFFDFFD",
        D: "DDBDDBDDB",
        L: "LLLLLLLLL",
        B: "UBBUBBUBB",
      },
    ],
    [
      "3x3 U",
      3,
      "U",
      {
        U: "UUUUUUUUU",
        R: "BBBRRRRRR",
        F: "RRRFFFFFF",
        D: "DDDDDDDDD",
        L: "FFFLLLLLL",
        B: "LLLBBBBBB",
      },
    ],
    [
      "3x3 F",
      3,
      "F",
      {
        U: "UUUUUULLL",
        R: "URRURRURR",
        F: "FFFFFFFFF",
        D: "RRRDDDDDD",
        L: "LLDLLDLLD",
        B: "BBBBBBBBB",
      },
    ],
    [
      "3x3 trigger",
      3,
      "R U R' U'",
      {
        U: "UULUUFUUF",
        R: "RRUBRRURR",
        F: "FFDFFUFFF",
        D: "DDRDDDDDD",
        L: "BLLLLLLLL",
        B: "BRRBBBBBB",
      },
    ],
    [
      "3x3 suffix-heavy",
      3,
      "R2 F U' L D2 B'",
      {
        U: "DLLBULRUL",
        R: "FFBURDUDL",
        F: "DLDUFFFBR",
        D: "UDBUDFBRF",
        L: "RLFRLBLRR",
        B: "DDBRBBUFU",
      },
    ],
    ["2x2 R", 2, "R", { U: "UFUF", R: "RRRR", F: "FDFD", D: "DBDB", L: "LLLL", B: "UBUB" }],
    [
      "2x2 trigger",
      2,
      "R U R' U'",
      { U: "ULUF", R: "RUUR", F: "FDFF", D: "DRDD", L: "BLLL", B: "BRBB" },
    ],
    [
      "2x2 suffix-heavy",
      2,
      "R2 F U' L D2 B'",
      { U: "DLRL", R: "FBUL", F: "DDFR", D: "UBBF", L: "RFLR", B: "DBUU" },
    ],
  ] satisfies Array<[string, 2 | 3, string, Record<keyof CubeNet, string>]>)(
    "matches csTimer for %s",
    (_name, size, scramble, expected) => {
      expect(faceStrings(scrambledCubeNet(scramble, size))).toEqual(expected);
    },
  );

  test("applies 3x3 wide moves to centers for BLD scrambles", () => {
    const net = scrambledCubeNet("Rw", 3);

    expect(net.B[4]).toBe("U");
    expect(net.F[4]).toBe("D");
  });

  test("applies whole-cube rotations for BLD scrambles", () => {
    expect(faceStrings(scrambledCubeNet("x", 3))).toEqual(
      faceStrings(scrambledCubeNet("Rw L'", 3)),
    );
  });
});
