import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vite-plus/test";
import { ScrambleBar } from "./ScrambleBar";

describe("ScrambleBar", () => {
  test("uses the scramble text as the copy control", () => {
    const html = renderToStaticMarkup(
      <ScrambleBar
        eventId="333"
        scramble="R U R'"
        isLoading={false}
        error={null}
        onEventChange={() => {}}
        onNext={() => {}}
        onCopy={() => {}}
      />,
    );

    expect(html).toContain('aria-label="Copy scramble"');
    expect(html).toContain("scramble-copy-target");
    expect(html).not.toContain(">Copy</button>");
  });

  test("disables event and next controls while locked", () => {
    const html = renderToStaticMarkup(
      <ScrambleBar
        eventId="333"
        scramble="R U R'"
        isLoading={false}
        error={null}
        disabled
        onEventChange={() => {}}
        onNext={() => {}}
        onCopy={() => {}}
      />,
    );

    expect(html).toContain('<select disabled=""');
    expect(html).toContain('<button type="button" disabled=""');
    expect(html).toContain(">Next</button>");
  });
});
