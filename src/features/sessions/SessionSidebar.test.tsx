import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vite-plus/test";
import { SessionSidebar } from "./SessionSidebar";

describe("SessionSidebar", () => {
  test("includes a new session action in the session dropdown", () => {
    const html = renderToStaticMarkup(
      <SessionSidebar
        sessions={[
          { id: "main", name: "Main", solves: [] },
          { id: "practice", name: "Practice", solves: [] },
        ]}
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

    expect(html).toContain('value="__new_session__"');
    expect(html).toContain("+ New session...");
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

    expect(html).toContain('<select disabled=""');
    expect(html).toContain('<button type="button" disabled=""');
    expect(html).toContain(">New</button>");
    expect(html).toContain(">Clear</button>");
  });
});
