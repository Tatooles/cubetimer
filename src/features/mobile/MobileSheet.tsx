import type { ReactNode } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "../../shared/components/Drawer";
import type { MobileSheetId } from "./MobileNav";

type MobileSheetProps = {
  active: MobileSheetId;
  title: string;
  sheetId: Exclude<MobileSheetId, null>;
  children: ReactNode;
  onClose: () => void;
};

export function MobileSheet({ active, title, sheetId, children, onClose }: MobileSheetProps) {
  return (
    <Drawer
      open={active === sheetId}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription className="sr-only">{title} panel</DrawerDescription>
        </DrawerHeader>
        {children}
      </DrawerContent>
    </Drawer>
  );
}
