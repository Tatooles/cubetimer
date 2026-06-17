import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrambleDraw } from "../scrambles/ScrambleDraw";
import { formatSolveTime, formatTimerTime } from "../timer/timerFormat";
import { useTimerController } from "../timer/useTimerController";
import { ALGORITHM_SETS, type AlgorithmCase } from "./algorithmCatalog";
import { algorithmStats, casesForMode, invertAlgorithm } from "./algorithmTrainer";
import type { AlgorithmSettings, AlgorithmTime } from "./types";

type AlgorithmTrainerProps = {
  settings: AlgorithmSettings;
  historyByCase: Record<string, AlgorithmTime[]>;
  onRecordTime: (setId: AlgorithmSettings["activeSetId"], caseId: string, ms: number) => void;
  shortcutsDisabled?: boolean;
};

function activeCases(settings: AlgorithmSettings) {
  const set =
    ALGORITHM_SETS.find((candidate) => candidate.id === settings.activeSetId) ?? ALGORITHM_SETS[0]!;
  const subsetIds = settings.subsets[set.id] ?? [];
  const cases =
    settings.mode === "subset" && subsetIds.length === 0
      ? casesForMode(set, settings.mode, ["__empty_subset__"])
      : casesForMode(set, settings.mode, subsetIds);

  return { set, cases };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/[0.07] bg-white/[0.02] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
        {label}
      </div>
      <div className="mt-1 font-mono text-lg text-zinc-100">{value}</div>
    </div>
  );
}

function shouldIgnoreGlobalShortcut(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.closest('[data-global-shortcuts="ignore"]')) {
    return true;
  }

  if (target.isContentEditable) {
    return true;
  }

  return ["BUTTON", "INPUT", "SELECT", "TEXTAREA"].includes(target.tagName);
}

export function AlgorithmTrainer({
  settings,
  historyByCase,
  onRecordTime,
  shortcutsDisabled = false,
}: AlgorithmTrainerProps) {
  const trainerRef = useRef<HTMLElement | null>(null);
  const activeRunCaseRef = useRef<{
    setId: AlgorithmSettings["activeSetId"];
    caseId: string;
  } | null>(null);
  const { set, cases } = useMemo(() => activeCases(settings), [settings]);
  const [caseIndexBySet, setCaseIndexBySet] = useState<Record<string, number>>({});
  const activeIndex = Math.min(caseIndexBySet[set.id] ?? 0, Math.max(cases.length - 1, 0));
  const currentCase: AlgorithmCase | undefined = cases[activeIndex];

  const timer = useTimerController((ms) => {
    const solvedCase = activeRunCaseRef.current;
    activeRunCaseRef.current = null;

    if (solvedCase) {
      onRecordTime(solvedCase.setId, solvedCase.caseId, ms);
    }
  }, 350);

  const pressTimer = useCallback(() => {
    if (timer.stage !== "running" && currentCase) {
      activeRunCaseRef.current = { setId: set.id, caseId: currentCase.id };
    }
    timer.press();
  }, [currentCase, set.id, timer]);

  useEffect(() => {
    setCaseIndexBySet((current) => {
      const currentIndex = current[set.id] ?? 0;
      if (currentIndex < cases.length) {
        return current;
      }
      return { ...current, [set.id]: 0 };
    });
  }, [cases.length, set.id]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.code === "Space" &&
        !event.repeat &&
        !shortcutsDisabled &&
        !shouldIgnoreGlobalShortcut(event.target) &&
        (!document.activeElement ||
          document.activeElement === document.body ||
          trainerRef.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        pressTimer();
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      if (
        event.code === "Space" &&
        !shortcutsDisabled &&
        !shouldIgnoreGlobalShortcut(event.target) &&
        (!document.activeElement ||
          document.activeElement === document.body ||
          trainerRef.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        timer.release();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [pressTimer, shortcutsDisabled, timer]);

  function nextCase() {
    if (cases.length === 0) {
      return;
    }
    setCaseIndexBySet((current) => ({
      ...current,
      [set.id]: ((current[set.id] ?? 0) + 1) % cases.length,
    }));
  }

  if (!currentCase) {
    return (
      <section
        ref={trainerRef}
        className="flex h-full min-h-0 items-center justify-center px-4 py-4"
      >
        <div className="max-w-md rounded-md border border-white/[0.07] bg-white/[0.02] p-5 text-center">
          <div className="text-sm font-medium text-zinc-200">Choose at least one case</div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-600">
            Your current subset for {set.name} is empty. Open settings and add cases to continue.
          </p>
        </div>
      </section>
    );
  }

  const setup = invertAlgorithm(currentCase.algorithm);
  const stats = algorithmStats(historyByCase[currentCase.id] ?? []);
  const eventId = set.id === "CLL2" ? "222" : "333";

  return (
    <section ref={trainerRef} className="h-full min-h-0 overflow-y-auto px-4 py-4 md:px-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-xs font-medium text-zinc-200">
            Algorithm trainer
          </span>
          <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-xs text-zinc-300">
            {set.name}
          </span>
          <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-xs text-zinc-300">
            {settings.mode === "drill" ? "Drill" : "Subset"}
          </span>
        </div>

        <div
          data-testid="algorithm-current-case"
          className="rounded-md border border-white/[0.07] bg-white/[0.02] p-4"
        >
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
                {currentCase.group}
              </div>
              <h2 className="mt-1 text-xl font-semibold text-zinc-100">{currentCase.name}</h2>
              <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                {currentCase.description}
              </p>
            </div>
            <button
              type="button"
              onClick={nextCase}
              className="rounded-md border border-white/[0.07] px-3 py-2 text-xs font-medium text-zinc-300 hover:border-white/15"
            >
              Next case
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="space-y-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
                  Algorithm
                </div>
                <p className="mt-2 font-mono text-lg leading-relaxed text-zinc-100">
                  {currentCase.algorithm}
                </p>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
                  Setup
                </div>
                <p className="mt-2 font-mono text-sm leading-relaxed text-zinc-300">{setup}</p>
              </div>
            </div>
            <ScrambleDraw eventId={eventId} scramble={setup} />
          </div>
        </div>

        <button
          type="button"
          data-testid="algorithm-timer-surface"
          onPointerDown={pressTimer}
          onPointerUp={timer.release}
          onPointerLeave={timer.stage === "running" ? undefined : timer.release}
          className="rounded-md border border-white/[0.07] bg-black px-4 py-8 text-center outline-none transition hover:border-white/15"
        >
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-600">
            Hold space
          </div>
          <div className="mt-2 font-mono text-5xl text-zinc-100">
            {formatTimerTime(timer.elapsedMs)}
          </div>
          <div className="mt-2 text-xs text-zinc-600">
            {timer.stage === "ready"
              ? "Release to start"
              : timer.stage === "running"
                ? "Tap or press space to stop"
                : "Hold, release, then stop after executing"}
          </div>
        </button>

        <div className="grid gap-2 sm:grid-cols-4">
          <Stat label="Last" value={formatSolveTime(stats.lastMs)} />
          <Stat label="Best" value={formatSolveTime(stats.bestMs)} />
          <Stat label="Average" value={formatSolveTime(stats.averageMs)} />
          <Stat label="Count" value={stats.count.toString()} />
        </div>
      </div>
    </section>
  );
}
