import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vite-plus/test";
import { SessionSidebar } from "./SessionSidebar";
import sidebarSource from "./SessionSidebar.tsx?raw";

describe("SessionSidebar", () => {
  test("includes a new session action in the session dropdown", () => {
    expect(sidebarSource).toContain("value={NEW_SESSION_VALUE}");
    expect(sidebarSource).toContain("+ New session...");
  });

  test("renders the session select with a shadcn select trigger", () => {
    const html = renderToStaticMarkup(
      <SessionSidebar
        sessions={[{ id: "main", name: "Main", solves: [] }]}
        activeSessionId="main"
        onSessionChange={() => {}}
        onNewSession={() => {}}
        onClear={() => {}}
        onExport={() => {}}
        onOpenSolve={() => {}}
        onPenalty={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(html).toContain('data-slot="select-trigger"');
    expect(html).toContain("session-select-trigger");
    expect(html).toContain("ChevronDown");
  });

  test("renders the session select with a visible field treatment", () => {
    const html = renderToStaticMarkup(
      <SessionSidebar
        sessions={[{ id: "main", name: "Main", solves: [] }]}
        activeSessionId="main"
        onSessionChange={() => {}}
        onNewSession={() => {}}
        onClear={() => {}}
        onExport={() => {}}
        onOpenSolve={() => {}}
        onPenalty={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(html).toContain("bg-zinc-900/80");
    expect(html).toContain("border-white/15");
  });

  test("disables session mutation controls while locked", () => {
    const html = renderToStaticMarkup(
      <SessionSidebar
        sessions={[
          { id: "main", name: "Main", solves: [] },
          { id: "practice", name: "Practice", solves: [] },
        ]}
        activeSessionId="main"
        disabled
        onSessionChange={() => {}}
        onNewSession={() => {}}
        onClear={() => {}}
        onExport={() => {}}
        onOpenSolve={() => {}}
        onPenalty={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(html).toContain('data-slot="select-trigger"');
    expect(html).toContain('disabled=""');
    expect(html).toContain('<button type="button" disabled=""');
    expect(html).toContain(">New</button>");
    expect(html).toContain(">Clear</button>");
  });
});
