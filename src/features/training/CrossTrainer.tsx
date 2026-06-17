import { useMemo, useState } from "react";
import { ScrambleDraw } from "../scrambles/ScrambleDraw";
import { generateCrossScramble, mockCrossSolution, type CrossSolution } from "./crossTrainer";
import type { CrossRating, CrossSettings } from "./types";

type CrossTrainerProps = {
  settings: CrossSettings;
  onRate: (attempt: {
    scramble: string;
    solution: string[];
    moveCount: number;
    rating: CrossRating;
    flagged: boolean;
    xcross: boolean;
  }) => void;
};

function newScramble(short: boolean): string {
  return generateCrossScramble({ short });
}

function visibleMoves(solution: CrossSolution): string[] {
  return solution.xcross?.moves ?? solution.cross.moves;
}

export function CrossTrainer({ settings, onRate }: CrossTrainerProps) {
  const [scramble, setScramble] = useState(() => newScramble(settings.shortScramble));
  const [flagged, setFlagged] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const [revealCount, setRevealCount] = useState(0);
  const solution = useMemo(() => mockCrossSolution(scramble, settings), [scramble, settings]);
  const moves = visibleMoves(solution);
  const revealedCount =
    settings.revealMode === "all" && revealCount > 0 ? moves.length : revealCount;
  const shownMoves = moves.slice(0, revealedCount);

  function advance() {
    setScramble(newScramble(settings.shortScramble));
    setFlagged(false);
    setInspecting(false);
    setRevealCount(0);
  }

  function revealNext() {
    setRevealCount((current) =>
      settings.revealMode === "all" ? moves.length : Math.min(moves.length, current + 1),
    );
  }

  function revealAll() {
    setRevealCount(moves.length);
  }

  function rate(rating: CrossRating) {
    onRate({
      scramble,
      solution: moves,
      moveCount: moves.length,
      rating,
      flagged,
      xcross: Boolean(solution.xcross),
    });
    advance();
  }

  function copyScramble() {
    void globalThis.navigator?.clipboard?.writeText(scramble);
  }

  return (
    <section className="h-full min-h-0 overflow-y-auto px-4 py-4 md:px-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-xs font-medium text-zinc-200">
            Cross trainer
          </span>
          <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-xs text-zinc-300">
            {settings.color} cross
          </span>
          <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-xs text-zinc-300">
            {settings.moveTarget} move target
          </span>
          {settings.xcross ? (
            <span className="rounded-full border border-indigo-300/25 bg-indigo-400/10 px-3 py-1 text-xs text-indigo-200">
              XCross
            </span>
          ) : null}
        </div>

        <div className="rounded-md border border-white/[0.07] bg-white/[0.02] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
                Scramble
              </div>
              {inspecting ? (
                <div className="mt-1 text-xs font-medium text-amber-200">15s inspection active</div>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={advance}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.07] px-3 py-2 text-xs font-medium text-zinc-300 hover:border-white/15"
              >
                Next
              </button>
              <button
                type="button"
                onClick={() => setFlagged((current) => !current)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium ${
                  flagged
                    ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
                    : "border-white/[0.07] text-zinc-300 hover:border-white/15"
                }`}
              >
                {flagged ? "Flagged" : "Flag"}
              </button>
              <button
                type="button"
                onClick={copyScramble}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.07] px-3 py-2 text-xs font-medium text-zinc-300 hover:border-white/15"
              >
                Copy
              </button>
              <button
                type="button"
                onClick={() => setInspecting((current) => !current)}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.07] px-3 py-2 text-xs font-medium text-zinc-300 hover:border-white/15"
              >
                Inspect
              </button>
            </div>
          </div>

          <p className="font-mono text-lg leading-relaxed text-zinc-100 md:text-xl">{scramble}</p>
          <div className="mt-4">
            <ScrambleDraw eventId="333" scramble={scramble} />
          </div>
        </div>

        <div className="rounded-md border border-white/[0.07] bg-white/[0.02] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
                Solution
              </div>
              <div className="mt-1 text-sm text-zinc-400">
                {solution.xcross ? "XCross" : "Cross"} · {moves.length} moves
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={revealNext}
                className="rounded-md border border-white/[0.07] px-3 py-2 text-xs font-medium text-zinc-300 hover:border-white/15"
              >
                Reveal next move
              </button>
              <button
                type="button"
                onClick={revealAll}
                className="rounded-md border border-white/[0.07] px-3 py-2 text-xs font-medium text-zinc-300 hover:border-white/15"
              >
                Reveal all
              </button>
            </div>
          </div>

          <div className="flex min-h-12 flex-wrap gap-2">
            {shownMoves.length > 0 ? (
              shownMoves.map((move, index) => (
                <span
                  key={`${move}-${index}`}
                  className="rounded-md border border-white/[0.07] bg-black px-3 py-2 font-mono text-sm text-zinc-100"
                >
                  {move}
                </span>
              ))
            ) : (
              <span className="py-2 text-sm text-zinc-600">Reveal the solution when ready.</span>
            )}
          </div>
        </div>

        <div className="rounded-md border border-white/[0.07] bg-white/[0.02] p-4">
          <div className="mb-3 text-sm font-medium text-zinc-200">How did that go?</div>
          <div className="grid grid-cols-3 gap-2">
            {(["good", "okay", "missed"] as CrossRating[]).map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => rate(rating)}
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-white/[0.07] px-3 py-2 text-sm font-medium capitalize text-zinc-200 hover:border-white/15 hover:bg-white/[0.03]"
              >
                {rating.charAt(0).toUpperCase() + rating.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
