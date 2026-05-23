import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vite-plus/test";
import { EventSelector } from "./EventSelector";

describe("EventSelector", () => {
  test("renders desktop event selection as tabs with overflow select", () => {
    const html = renderToStaticMarkup(
      <EventSelector eventId="555" mode="tabs" onEventChange={() => {}} />,
    );

    expect(html).toContain('data-slot="tabs-list"');
    expect(html).toContain('data-slot="tabs-trigger"');
    expect(html).toContain("event-more-trigger");
    expect(html).toContain("more");
    expect(html).toContain("5x5");
  });

  test("uses a flush underline tab treatment on desktop", () => {
    const html = renderToStaticMarkup(
      <EventSelector eventId="333" mode="tabs" onEventChange={() => {}} />,
    );

    expect(html).toContain("event-tabs-strip");
    expect(html).toContain("event-tabs-divider");
    expect(html).toContain("data-[state=active]:after:bg-indigo-300");
    expect(html).not.toContain("rounded-lg border border-white/10 bg-zinc-950/75 p-1");
  });

  test("lets the more trigger fill the remaining timer-column width", () => {
    const html = renderToStaticMarkup(
      <EventSelector eventId="333" mode="tabs" onEventChange={() => {}} />,
    );

    expect(html).toContain("event-tabs-list event-tabs-strip flex w-full");
    expect(html).toContain("event-more-trigger");
    expect(html).toContain("flex-1");
  });

  test("keeps more visually neutral when the selected event is in overflow", () => {
    const html = renderToStaticMarkup(
      <EventSelector eventId="666" mode="tabs" onEventChange={() => {}} />,
    );
    const moreTriggerClass = html.match(/class="([^"]*event-more-trigger[^"]*)"/)?.[1] ?? "";

    expect(moreTriggerClass).not.toContain("event-more-active");
    expect(moreTriggerClass).not.toContain("after:bg-indigo-300");
    expect(moreTriggerClass).toContain("text-zinc-500");
    expect(moreTriggerClass).toContain("focus:ring-0");
    expect(html).toContain('value="__event_overflow__"');
  });

  test("renders mobile event selection as a select", () => {
    const html = renderToStaticMarkup(
      <EventSelector eventId="333" mode="select" onEventChange={() => {}} />,
    );
    const triggerClass = html.match(/class="([^"]*event-select-trigger[^"]*)"/)?.[1] ?? "";

    expect(html).toContain('data-slot="select-trigger"');
    expect(html).toContain("event-select-trigger");
    expect(triggerClass).toContain("event-select-toolbar-trigger");
    expect(triggerClass).toContain("border-transparent");
    expect(triggerClass).toContain("bg-transparent");
    expect(triggerClass).toContain("shadow-none");
    expect(html).not.toContain('data-slot="tabs-list"');
  });
});
