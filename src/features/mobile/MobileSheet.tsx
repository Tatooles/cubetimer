import type { ReactNode } from "react";
import type { MobileSheetId } from "./MobileNav";

type MobileSheetProps = {
  active: MobileSheetId;
  title: string;
  sheetId: Exclude<MobileSheetId, null>;
  children: ReactNode;
  onClose: () => void;
};

export function MobileSheet({ active, title, sheetId, children, onClose }: MobileSheetProps) {
  if (active !== sheetId) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close sheet"
        className="fixed inset-x-0 top-0 bottom-16 z-20 bg-black/45 md:hidden"
        onClick={onClose}
      />
      <section className="fixed inset-x-0 bottom-16 z-30 max-h-[72vh] overflow-y-auto rounded-t-[22px] border-t border-white/10 bg-zinc-950 px-5 pb-6 pt-5 shadow-2xl shadow-black/80 md:hidden">
        <div className="absolute left-1/2 top-2 h-1 w-9 -translate-x-1/2 rounded-full bg-white/20" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="text-sm text-zinc-500">
            x
          </button>
        </div>
        {children}
      </section>
    </>
  );
}
