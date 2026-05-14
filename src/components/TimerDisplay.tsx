import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { formatTime } from "../format";
import { classNames } from "./classNames";

type TimerState = "idle" | "holding" | "ready" | "running";

type TimerDisplayProps = {
  elapsed: number;
  onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  scrambleActions: ReactNode;
  scramble: string;
  statusText: string;
  timerState: TimerState;
};

export function TimerDisplay({ elapsed, onKeyDown, scramble, scrambleActions, statusText, timerState }: TimerDisplayProps) {
  return (
    <div className={timerDisplayClass(timerState)} tabIndex={0} onKeyDown={onKeyDown}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <p className="font-mono text-[clamp(0.9rem,1.35vw,1.08rem)] leading-[1.55] break-anywhere text-slate-300" aria-label="Current scramble">
          {scramble}
        </p>
        {scrambleActions}
      </div>
      <div className="self-center text-center text-[clamp(5rem,16vw,13rem)] leading-[0.94] font-[740] tracking-normal text-slate-50 tabular-nums max-[680px]:text-[clamp(3.2rem,18vw,6rem)]">
        {formatTime(elapsed)}
      </div>
      <div className="text-center text-[0.96rem] leading-[1.2] font-[650] text-[#8d99aa]">{statusText}</div>
    </div>
  );
}

function timerDisplayClass(timerState: TimerState): string {
  return classNames(
    "grid min-h-0 grid-rows-[minmax(72px,auto)_minmax(120px,1fr)_auto] items-center rounded-lg border p-[18px_22px_24px] outline-none max-[680px]:p-3.5",
    timerState === "holding" && "border-amber-500 bg-[#0c1118]",
    timerState === "ready" && "border-green-500 bg-[#0b1711]",
    timerState === "running" && "border-[#6ea8fe] bg-[#0c1118]",
    timerState === "idle" && "border-transparent bg-[#0c1118]",
  );
}
