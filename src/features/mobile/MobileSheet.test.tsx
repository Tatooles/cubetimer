import { describe, expect, test } from "vite-plus/test";
import drawerSource from "../../shared/components/Drawer.tsx?raw";
import mobileSheetSource from "./MobileSheet.tsx?raw";

describe("MobileSheet", () => {
  test("uses the shared drawer primitive instead of hand-rolled fixed markup", () => {
    expect(mobileSheetSource).toContain("Drawer");
    expect(mobileSheetSource).toContain("DrawerContent");
    expect(drawerSource).toContain("DrawerOverlay");
    expect(mobileSheetSource).toContain("DrawerDescription");
    expect(mobileSheetSource).not.toContain('aria-label="Close sheet"');
    expect(mobileSheetSource).not.toContain("fixed inset-x-0 top-0 bottom-16");
  });

  test("does not render a redundant top close button", () => {
    expect(mobileSheetSource).not.toContain("DrawerClose");
    expect(mobileSheetSource).not.toContain(">x<");
  });

  test("does not force drawer content to scroll by default", () => {
    expect(drawerSource).not.toContain("overflow-y-auto");
    expect(drawerSource).toContain("overflow-hidden");
  });

  test("keeps mobile drawers non-modal so bottom nav can switch panels in one tap", () => {
    expect(mobileSheetSource).toContain("modal={false}");
  });
});
