import { useEffect, useMemo, useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../shared/components/Select";
import { Tabs, TabsList, TabsTrigger } from "../../shared/components/Tabs";
import type { PuzzleEvent } from "../sessions/types";
import { PUZZLE_EVENTS } from "./eventMap";

type EventSelectorProps = {
  eventId: PuzzleEvent;
  disabled?: boolean;
  mode: "tabs" | "select";
  onEventChange: (eventId: PuzzleEvent) => void;
};

const MIN_TAB_WIDTH = 74;
const MORE_WIDTH = 104;
const OVERFLOW_TAB_VALUE = "__event_overflow__";

function eventChangeHandler(onEventChange: (eventId: PuzzleEvent) => void) {
  return (value: string) => onEventChange(value as PuzzleEvent);
}

export function EventSelector({
  eventId,
  disabled = false,
  mode,
  onEventChange,
}: EventSelectorProps) {
  if (mode === "select") {
    return (
      <Select value={eventId} disabled={disabled} onValueChange={eventChangeHandler(onEventChange)}>
        <SelectTrigger className="event-select-trigger event-select-toolbar-trigger h-9 min-w-20 justify-center rounded-md border-transparent bg-transparent px-2.5 font-mono text-sm text-zinc-300 shadow-none hover:border-white/[0.07] hover:bg-white/[0.03] hover:text-zinc-100 focus:border-white/10 focus:bg-white/[0.04] focus:ring-1 focus:ring-white/10 sm:min-w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PUZZLE_EVENTS.map((event) => (
            <SelectItem key={event.id} value={event.id} className="font-mono text-xs">
              {event.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return <AdaptiveEventTabs eventId={eventId} disabled={disabled} onEventChange={onEventChange} />;
}

function AdaptiveEventTabs({ eventId, disabled, onEventChange }: Omit<EventSelectorProps, "mode">) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(4);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    function fit(width: number) {
      const maxWithoutOverflow = Math.floor(width / MIN_TAB_WIDTH);
      if (maxWithoutOverflow >= PUZZLE_EVENTS.length) {
        setVisibleCount(PUZZLE_EVENTS.length);
        return;
      }

      setVisibleCount(Math.max(1, Math.floor((width - MORE_WIDTH) / MIN_TAB_WIDTH)));
    }

    const fitContainer = () => fit(container.clientWidth);

    fitContainer();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", fitContainer);
      return () => window.removeEventListener("resize", fitContainer);
    }

    const observer = new ResizeObserver((entries) => {
      fit(entries[0]?.contentRect.width ?? container.clientWidth);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const visibleEvents = useMemo(() => PUZZLE_EVENTS.slice(0, visibleCount), [visibleCount]);
  const overflowEvents = useMemo(() => PUZZLE_EVENTS.slice(visibleCount), [visibleCount]);
  const activeOverflow = overflowEvents.some((event) => event.id === eventId);

  return (
    <div ref={containerRef} className="event-tabs-wrap min-w-0 flex-1">
      <div className="flex h-14 w-full min-w-0 items-stretch">
        <Tabs
          value={activeOverflow ? OVERFLOW_TAB_VALUE : eventId}
          onValueChange={eventChangeHandler(onEventChange)}
          className="w-full"
        >
          <TabsList className="event-tabs-list event-tabs-strip flex w-full">
            {visibleEvents.map((event) => (
              <TabsTrigger
                key={event.id}
                value={event.id}
                disabled={disabled}
                className="event-tabs-trigger font-mono"
              >
                {event.label}
              </TabsTrigger>
            ))}
            {overflowEvents.length > 0 ? (
              <Select
                value={activeOverflow ? eventId : ""}
                disabled={disabled}
                onValueChange={eventChangeHandler(onEventChange)}
              >
                <SelectTrigger
                  value={activeOverflow ? OVERFLOW_TAB_VALUE : undefined}
                  className={`event-more-trigger relative h-full w-auto min-w-20 justify-center rounded-none border-0 bg-transparent px-4 font-mono text-sm shadow-none hover:bg-transparent hover:text-zinc-200 focus:border-transparent focus:ring-0 focus:ring-offset-0 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 ${
                    activeOverflow ? "text-indigo-200 after:bg-indigo-300" : "text-zinc-500"
                  }`}
                >
                  <SelectValue placeholder="more" />
                </SelectTrigger>
                <SelectContent>
                  {overflowEvents.map((event) => (
                    <SelectItem key={event.id} value={event.id} className="font-mono text-xs">
                      {event.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
