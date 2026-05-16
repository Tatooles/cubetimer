import type { ComponentPropsWithoutRef } from "react";
import { classNames } from "./classNames";

export function FieldLabel({ className, ...props }: ComponentPropsWithoutRef<"label">) {
  return (
    <label
      className={classNames("text-[0.72rem] font-bold text-[#8d99aa] uppercase", className)}
      {...props}
    />
  );
}

export function TextInput({ className, ...props }: ComponentPropsWithoutRef<"input">) {
  return (
    <input
      className={classNames(
        "min-h-[38px] w-full rounded-[7px] border border-[#293345] bg-[#121923] px-2.5 text-[#e5ecf5]",
        className,
      )}
      {...props}
    />
  );
}

export function SelectInput({ className, ...props }: ComponentPropsWithoutRef<"select">) {
  return (
    <select
      className={classNames(
        "min-h-[38px] w-full rounded-[7px] border border-[#293345] bg-[#121923] px-2.5 text-[#e5ecf5]",
        className,
      )}
      {...props}
    />
  );
}
