import { describe, expect, test } from "vite-plus/test";
import solveListSource from "./SolveList.vue?raw";

describe("SolveList rendering", () => {
  test("does not scan all solves to derive each displayed index", () => {
    expect(solveListSource).not.toContain("findIndex");
  });
});
