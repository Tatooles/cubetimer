import { describe, expect, test } from "vite-plus/test";
import appSource from "../../App.vue?raw";

describe("mobile session sheet", () => {
  test("uses controlled ShadCN Vue sheet markup with accessible title and description", () => {
    expect(appSource).toContain('from "@/components/ui/sheet"');
    expect(appSource).toContain("<Sheet");
    expect(appSource).toContain("<SheetTitle");
    expect(appSource).toContain("<SheetDescription");
    expect(appSource).toContain("activeSheet === 'session'");
  });
});
