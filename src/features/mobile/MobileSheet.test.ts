import { describe, expect, test } from "vite-plus/test";
import mobileSheetSource from "./MobileSheet.vue?raw";

describe("MobileSheet", () => {
  test("uses Vue drawer markup without a redundant top close button", () => {
    expect(mobileSheetSource).toContain('data-slot="drawer"');
    expect(mobileSheetSource).toContain('data-slot="drawer-content"');
    expect(mobileSheetSource).toContain('data-slot="drawer-description"');
    expect(mobileSheetSource).not.toContain("DrawerClose");
    expect(mobileSheetSource).not.toContain(">x<");
  });

  test("does not force drawer content to scroll by default", () => {
    expect(mobileSheetSource).not.toContain("overflow-y-auto");
    expect(mobileSheetSource).toContain("overflow-hidden");
  });

  test("keeps mobile drawers controlled by the bottom nav state", () => {
    expect(mobileSheetSource).toContain("active === sheetId");
    expect(mobileSheetSource).toContain("@click=\"emit('close')\"");
  });
});
