import type { PuzzleEvent } from "../sessions/types";
import { PUZZLE_EVENTS, puzzleEventLabel } from "./eventMap";

type ScrambleBarProps = {
  eventId: PuzzleEvent;
  scramble: string;
  isLoading: boolean;
  error: string | null;
  onEventChange: (eventId: PuzzleEvent) => void;
  onNext: () => void;
  onCopy: () => void;
};

export function ScrambleBar({
  eventId,
  scramble,
  isLoading,
  error,
  onEventChange,
  onNext,
  onCopy,
}: ScrambleBarProps) {
  const moves = scramble.split(/\s+/).filter(Boolean).length;

  return (
    <section className="border-b border-white/[0.07] px-4 py-4 text-center md:px-6 md:py-5">
      <div className="mx-auto mb-3 flex max-w-3xl items-center justify-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
        <span>{puzzleEventLabel(eventId)} / WCA</span>
        <span className="h-1 w-1 rounded-full bg-indigo-400" />
        <span>{isLoading ? "Loading" : `${moves} moves`}</span>
      </div>
      <p className="mx-auto max-w-4xl whitespace-pre-wrap text-balance font-mono text-base leading-relaxed tracking-normal text-zinc-100 md:text-[22px]">
        {scramble}
      </p>
      {error ? <p className="mt-2 text-xs text-amber-300">{error}</p> : null}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <select
          value={eventId}
          onChange={(event) => onEventChange(event.target.value as PuzzleEvent)}
          className="rounded-md border border-white/10 bg-black px-2.5 py-1.5 font-mono text-xs text-zinc-200 outline-none focus:border-indigo-400"
        >
          {PUZZLE_EVENTS.map((event) => (
            <option key={event.id} value={event.id}>
              {event.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={onNext} className="scramble-action">
          Next
        </button>
        <button type="button" onClick={onCopy} className="scramble-action">
          Copy
        </button>
      </div>
    </section>
  );
}
