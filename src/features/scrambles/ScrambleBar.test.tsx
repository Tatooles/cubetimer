import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vite-plus/test";
import { ScrambleBar } from "./ScrambleBar";

describe("ScrambleBar", () => {
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
