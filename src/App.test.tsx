import { describe, expect, test } from "vite-plus/test";
import appSource from "./App.tsx?raw";

describe("App keyboard listeners", () => {
  test("does not depend on the unstable timer result object", () => {
    expect(appSource).not.toContain(", timer,");
  });
});
