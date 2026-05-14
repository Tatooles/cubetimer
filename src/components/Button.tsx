import type { ComponentPropsWithoutRef } from "react";
import { classNames } from "./classNames";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  active?: boolean;
  danger?: boolean;
  fullWidth?: boolean;
};

export function Button({ active = false, className, danger = false, fullWidth = false, ...props }: ButtonProps) {
  return (
    <button
      className={classNames(
        "min-h-[34px] cursor-pointer rounded-[7px] border border-[#293345] bg-[#121923] px-3 text-[#e5ecf5]",
        "hover:not-disabled:border-[#6ea8fe] hover:not-disabled:text-white disabled:cursor-not-allowed disabled:opacity-45",
        active && "border-[#6ea8fe] bg-[#132036]",
        danger && "border-red-900 text-red-200",
        fullWidth && "w-full justify-start",
        className,
      )}
      {...props}
    />
  );
}
