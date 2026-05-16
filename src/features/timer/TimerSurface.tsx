import { formatTimerTime } from "./timerFormat";
import type { TimerStage } from "./useTimerController";

type TimerSurfaceProps = {
  stage: TimerStage;
  elapsedMs: number;
  bests: Array<{ label: string; value: string }>;
  onPress: () => void;
  onRelease: () => void;
};

const STAGE_CLASS: Record<TimerStage, string> = {
  idle: "text-zinc-100",
  holding: "text-red-400",
  ready: "text-emerald-300",
  running: "text-zinc-50",
};

function splitTime(value: string): { main: string; decimal: string } {
  const index = value.lastIndexOf(".");
  if (index === -1) {
    return { main: value, decimal: "" };
  }

  return { main: value.slice(0, index), decimal: value.slice(index) };
}

export function TimerSurface({ stage, elapsedMs, bests, onPress, onRelease }: TimerSurfaceProps) {
  const time = splitTime(formatTimerTime(elapsedMs));

  return (
    <section
      className={`relative flex flex-1 cursor-pointer select-none flex-col items-center justify-center overflow-hidden transition ${
        stage === "holding" ? "bg-red-500/5" : stage === "ready" ? "bg-emerald-500/5" : ""
      }`}
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest("button")) {
          return;
        }
        onPress();
      }}
      onPointerUp={onRelease}
      onPointerCancel={onRelease}
    >
      <div
        className={`font-mono text-[clamp(5rem,15vw,12rem)] font-light leading-none tracking-normal tabular-nums transition ${STAGE_CLASS[stage]}`}
      >
        {time.main}
        <span className="text-zinc-500">{time.decimal}</span>
      </div>
      <div
        className={`mt-8 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-700 transition ${
          stage === "idle" ? "opacity-100" : "opacity-0"
        }`}
      >
        <kbd className="rounded border border-white/10 px-2 py-1 font-mono normal-case tracking-normal text-zinc-500">
          Space
        </kbd>
        Hold to start
      </div>
      <div
        className={`absolute bottom-7 left-1/2 hidden -translate-x-1/2 gap-7 font-mono text-xs transition md:flex ${
          stage === "idle" ? "opacity-100" : "opacity-0"
        }`}
      >
        {bests.map((best) => (
          <div key={best.label} className="flex flex-col items-center gap-1">
            <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-700">
              {best.label}
            </span>
            <span className="text-sm font-medium text-zinc-200">{best.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
