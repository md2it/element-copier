/**
 * Smoke: remove noscript/HTML comments before derivative formats only.
 * Run: node scripts/smoke-derivative-format-noise.mjs
 */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const libRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const esbuild = require(join(libRoot, "node_modules/esbuild"));
const { JSDOM } = require(join(libRoot, "node_modules/jsdom"));

const cleanupIndexSrc = readFileSync(join(libRoot, "src/copy/cleanup/index.ts"), "utf8");
const screenshotSrc = readFileSync(
  join(libRoot, "../element-copier/src/copy/screenshot.ts"),
  "utf8",
);

assert.match(cleanupIndexSrc, /removeNoscriptAndComments\(container\)/);
assert.match(screenshotSrc, /isDerivativeFormatNoiseNode/);
assert.match(screenshotSrc, /filter:\s*\(node\)\s*=>\s*!isDerivativeFormatNoiseNode\(node\)/);

const tempDir = mkdtempSync(join(tmpdir(), "ec-noise-smoke-"));
const outfile = join(tempDir, "sanitize.mjs");

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
globalThis.Node = dom.window.Node;
globalThis.NodeFilter = dom.window.NodeFilter;
globalThis.Element = dom.window.Element;

await esbuild.build({
  entryPoints: [join(libRoot, "src/copy/cleanup/sanitize.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile,
});

const { removeNoscriptAndComments, isDerivativeFormatNoiseNode } = await import(
  pathToFileURL(outfile).href
);

try {
  const root = dom.window.document.createElement("div");
  root.innerHTML = '<p>ok</p><!-- secret --><noscript>fallback</noscript>';
  removeNoscriptAndComments(root);
  assert.equal(root.querySelector("noscript"), null);
  assert.match(root.innerHTML, /<p>ok<\/p>/);
  assert.doesNotMatch(root.innerHTML, /secret/);
  assert.doesNotMatch(root.innerHTML, /fallback/);

  const comment = dom.window.document.createComment("x");
  assert.equal(isDerivativeFormatNoiseNode(comment), true);
  const noscript = dom.window.document.createElement("noscript");
  assert.equal(isDerivativeFormatNoiseNode(noscript), true);
  const paragraph = dom.window.document.createElement("p");
  assert.equal(isDerivativeFormatNoiseNode(paragraph), false);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

console.log("smoke derivative-format-noise ok");
