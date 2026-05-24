import { describe, expect, test } from "vite-plus/test";
import sheetSource from "./Sheet.tsx?raw";

describe("Sheet", () => {
  test("does not inject a top-right close button into every sheet", () => {
    expect(sheetSource).not.toContain("XIcon");
    expect(sheetSource).not.toContain("SheetPrimitive.Close className");
    expect(sheetSource).not.toContain('<span className="sr-only">Close</span>');
  });
});
