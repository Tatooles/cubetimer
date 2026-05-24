import { describe, expect, test } from "vite-plus/test";
import config from "./vite.config";

describe("Vite module preload configuration", () => {
  test("does not inject browser preloads into JavaScript-hosted dynamic imports", () => {
    const modulePreload = config.build?.modulePreload;
    if (!modulePreload || modulePreload === true) {
      throw new Error("Expected modulePreload options");
    }

    expect(modulePreload.resolveDependencies).toBeTypeOf("function");
    expect(
      modulePreload.resolveDependencies?.(
        "inside-Q56GLXG4-DJwqhhXq.js",
        ["assets/preload-helper-D4M6sveU.js"],
        {
          hostId: "/assets/inside-Q56GLXG4-DJwqhhXq.js",
          hostType: "js",
        },
      ),
    ).toEqual([]);
  });

  test("keeps browser preloads for HTML-hosted dynamic imports", () => {
    const modulePreload = config.build?.modulePreload;
    if (!modulePreload || modulePreload === true) {
      throw new Error("Expected modulePreload options");
    }

    const deps = ["assets/index-DYyByxgN.js", "assets/index-C-6CZSVK.css"];
    expect(
      modulePreload.resolveDependencies?.("index.html", deps, {
        hostId: "/index.html",
        hostType: "html",
      }),
    ).toBe(deps);
  });
});
