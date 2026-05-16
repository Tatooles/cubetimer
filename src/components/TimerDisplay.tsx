import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import { formatTime } from "../format";
import { classNames } from "./classNames";

type TimerState = "idle" | "holding" | "ready" | "running";

type TimerDisplayProps = {
  elapsed: number;
  onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  scrambleActions: ReactNode;
  scramble: string;
  statusText: string;
  timerState: TimerState;
};

export function TimerDisplay({
  elapsed,
  onKeyDown,
  onPointerCancel,
  onPointerDown,
  onPointerUp,
  scramble,
  scrambleActions,
  statusText,
  timerState,
}: TimerDisplayProps) {
  return (
    <div
      className={timerDisplayClass(timerState)}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerCancel={onPointerCancel}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <p
          className="font-mono text-[clamp(0.9rem,1.35vw,1.08rem)] leading-[1.55] break-anywhere text-slate-300 max-[680px]:text-[0.9rem] max-[680px]:leading-[1.35]"
          aria-label="Current scramble"
        >
          {scramble}
        </p>
        {scrambleActions}
      </div>
      <div className="self-center text-center text-[clamp(5rem,16vw,13rem)] leading-[0.94] font-[740] tracking-normal text-slate-50 tabular-nums max-[680px]:text-[clamp(2.8rem,16vw,4.4rem)]">
        {formatTime(elapsed)}
      </div>
      <div className="timer-status text-center text-[0.96rem] leading-[1.2] font-[650] text-[#8d99aa] max-[680px]:text-[0.86rem]">
        {statusText}
      </div>
    </div>
  );
}

function timerDisplayClass(timerState: TimerState): string {
  return classNames(
    "timer-display grid min-h-0 touch-none select-none grid-rows-[minmax(72px,auto)_minmax(120px,1fr)_auto] items-center rounded-lg border p-[18px_22px_24px] outline-none max-[680px]:grid-rows-[minmax(48px,auto)_minmax(70px,1fr)_auto] max-[680px]:p-3.5",
    timerState === "holding" && "border-amber-500 bg-[#0c1118]",
    timerState === "ready" && "border-green-500 bg-[#0b1711]",
    timerState === "running" && "border-[#6ea8fe] bg-[#0c1118]",
    timerState === "idle" && "border-transparent bg-[#0c1118]",
  );
}
