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
        onNext={() => {}}
        onCopy={() => {}}
      />,
    );

    expect(html).toContain('aria-label="Copy scramble"');
    expect(html).toContain("scramble-copy-target");
    expect(html).not.toContain(">Copy</button>");
  });

  test("keeps event selection out of the scramble bar", () => {
    const html = renderToStaticMarkup(
      <ScrambleBar
        eventId="333"
        scramble="R U R'"
        isLoading={false}
        error={null}
        onNext={() => {}}
        onCopy={() => {}}
      />,
    );

    expect(html).not.toContain('data-slot="select-trigger"');
    expect(html).not.toContain("event-select-trigger");
  });

  test("disables next control while locked", () => {
    const html = renderToStaticMarkup(
      <ScrambleBar
        eventId="333"
        scramble="R U R'"
        isLoading={false}
        error={null}
        disabled
        onNext={() => {}}
        onCopy={() => {}}
      />,
    );

    expect(html).toContain('<button type="button" disabled=""');
    expect(html).toContain(">Next</button>");
  });
});
