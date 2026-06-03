import { describe, expect, test } from "vite-plus/test";
import selectorSource from "./EventSelector.vue?raw";

describe("EventSelector", () => {
  test("renders desktop event selection as tabs with overflow select", () => {
    expect(selectorSource).toContain('from "@/components/ui/select"');
    expect(selectorSource).toContain('from "@/components/ui/tabs"');
    expect(selectorSource).toContain("<TabsList");
    expect(selectorSource).toContain("<TabsTrigger");
    expect(selectorSource).toContain("event-more-trigger");
    expect(selectorSource).toContain("more");
    expect(selectorSource).toContain("overflowEvents");
  });

  test("uses a borderless underline tab treatment on desktop", () => {
    expect(selectorSource).toContain("event-tabs-strip");
    expect(selectorSource).toContain("after:bg-indigo-300");
    expect(selectorSource).not.toContain("event-tabs-divider");
    expect(selectorSource).not.toContain("border-r border-white/[0.07]");
    expect(selectorSource).not.toContain("rounded-lg border border-white/10 bg-zinc-950/75 p-1");
  });

  test("keeps the more trigger content-width in the timer column", () => {
    const moreTriggerClass = selectorSource.match(/'([^']*event-more-trigger[^']*)'/)?.[1] ?? "";

    expect(selectorSource).toContain("event-tabs-list event-tabs-strip");
    expect(moreTriggerClass).toContain("w-auto");
    expect(moreTriggerClass).toContain("min-w-20");
    expect(moreTriggerClass).not.toContain("flex-1");
  });

  test("underlines more like an active tab when the selected event is in overflow", () => {
    expect(selectorSource).toContain("activeOverflow ? 'text-indigo-200 after:bg-indigo-300'");
    expect(selectorSource).toContain("focus:ring-0");
    expect(selectorSource).toContain("__event_overflow__");
  });

  test("renders mobile event selection as a select", () => {
    expect(selectorSource).toContain("mode === 'select'");
    expect(selectorSource).toContain("<SelectTrigger");
    expect(selectorSource).toContain("event-select-trigger");
    expect(selectorSource).toContain("event-select-toolbar-trigger");
    expect(selectorSource).toContain("border-transparent");
    expect(selectorSource).toContain("bg-transparent");
    expect(selectorSource).toContain("shadow-none");
  });
});
