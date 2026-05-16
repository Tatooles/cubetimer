import { describe, expect, test } from "vite-plus/test";
import { scrambledCubeNet } from "./cubeNet";

describe("scramble cube net", () => {
  test("starts solved when no moves are applied", () => {
    const net = scrambledCubeNet("", 3);
    expect(new Set(net.U)).toEqual(new Set(["U"]));
    expect(new Set(net.F)).toEqual(new Set(["F"]));
  });

  test("applies face turns to visible stickers", () => {
    const net = scrambledCubeNet("R", 3);
    expect(new Set(net.U)).not.toEqual(new Set(["U"]));
    expect(new Set(net.R)).toEqual(new Set(["R"]));
  });
});
