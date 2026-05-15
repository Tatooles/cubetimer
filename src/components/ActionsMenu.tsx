import type { ReactNode } from "react";
import { classNames } from "./classNames";

type ActionsMenuProps = {
  label: string;
  wide?: boolean;
  children: ReactNode;
};

export function ActionsMenu({ children, label, wide = false }: ActionsMenuProps) {
  return (
    <details className="relative">
      <summary
        className="grid size-[34px] cursor-pointer list-none place-items-center rounded-[7px] border border-[#293345] text-[#cbd5e1] select-none hover:border-[#6ea8fe] hover:text-white"
        aria-label={label}
      >
        ...
      </summary>
      <div
        className={classNames(
          "absolute top-[calc(100%+6px)] right-0 z-20 grid w-[180px] gap-1.5 rounded-lg border border-[#293345] bg-[#151d29] p-2 shadow-[0_14px_42px_rgba(0,0,0,0.42)]",
          wide && "w-[210px]",
        )}
      >
        {children}
      </div>
    </details>
  );
}
