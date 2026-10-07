import assert from "node:assert/strict";
import { test } from "node:test";
import { docsPage, stableVersion } from "./sources.ts";

test("stable minor and major releases pass, in every title shape we follow", () => {
  assert.equal(stableVersion("19.3.0 (September 9, 2026)"), "19.3.0");
  assert.equal(stableVersion("2026-09-22, Version 26.10.0 (Current), @someone"), "26.10.0");
  assert.equal(stableVersion("Bun v1.4"), "1.4.0");
  assert.equal(stableVersion("@qwik.dev/core@2.0.0"), "2.0.0");
  assert.equal(stableVersion("Biome CLI v2.6.0"), "2.6.0");
});

test("patches and pre-releases are dropped", () => {
  assert.equal(stableVersion("19.2.8 (July 21st, 2026)"), undefined);
  assert.equal(stableVersion("v16.5.0-canary.1"), undefined);
  assert.equal(stableVersion("v1.0.0-rc.4"), undefined);
  assert.equal(stableVersion("8.12-m02-int: Explain a test"), undefined);
  assert.equal(stableVersion("@qwik.dev/core@2.0.0-rc.2"), undefined);
  assert.equal(stableVersion("consolidation-step-7-green"), undefined);
});

test("docs files map to page paths", () => {
  assert.equal(docsPage("react/useTransition.md"), "react/useTransition");
  assert.equal(docsPage("04-functions/after.mdx"), "functions/after");
  assert.equal(docsPage("03-file-conventions/01-metadata/opengraph-image.mdx"), "file-conventions/metadata/opengraph-image");
});
