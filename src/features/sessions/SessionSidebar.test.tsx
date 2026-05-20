import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vite-plus/test";
import { SessionSidebar } from "./SessionSidebar";

describe("SessionSidebar", () => {
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
