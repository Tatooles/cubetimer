import { describe, expect, test } from "vite-plus/test";
import mobileNavSource from "./MobileNav.tsx?raw";

describe("MobileNav", () => {
  test("stays interactive above non-modal drawer state", () => {
    expect(mobileNavSource).toContain("pointer-events-auto");
    expect(mobileNavSource).toContain("relative z-50");
  });
});
