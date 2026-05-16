import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
  active?: boolean;
};

export function IconButton({
  label,
  children,
  active = false,
  className = "",
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-xs text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-100 ${active ? "bg-indigo-500/15 text-indigo-300" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
