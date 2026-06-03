/**
 * Smoke: inline-image policy runs before materialization (skip rasterize on remove-all).
 * Run: node scripts/smoke-inline-images-policy.mjs
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const libRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const esbuild = require(join(libRoot, "node_modules/esbuild"));
const { JSDOM } = require(join(libRoot, "node_modules/jsdom"));

const tempDir = mkdtempSync(join(tmpdir(), "ec-inline-images-smoke-"));
const outfile = join(tempDir, "cleanup.mjs");

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  pretendToBeVisual: true,
});
globalThis.Node = dom.window.Node;
globalThis.NodeFilter = dom.window.NodeFilter;
globalThis.Element = dom.window.Element;
globalThis.SVGElement = dom.window.SVGElement;
globalThis.XMLSerializer = dom.window.XMLSerializer;

let rasterizeCalls = 0;
dom.window.HTMLImageElement.prototype.decode = async function decode() {
  rasterizeCalls += 1;
  Object.defineProperty(this, "naturalWidth", { value: 200, configurable: true });
  Object.defineProperty(this, "naturalHeight", { value: 200, configurable: true });
};

dom.window.HTMLCanvasElement.prototype.getContext = function getContext() {
  return { drawImage() {} };
};
dom.window.HTMLCanvasElement.prototype.toDataURL = function toDataURL(type) {
  return type === "image/png" ? "data:image/png;base64,smoke" : "";
};

await esbuild.build({
  entryPoints: [join(libRoot, "src/copy/cleanup/index.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile,
});

const { prepareElementForCopy } = await import(pathToFileURL(outfile).href);

async function runPrepare(html, inlineImages) {
  rasterizeCalls = 0;
  const doc = dom.window.document;
  const wrap = doc.createElement("div");
  wrap.innerHTML = html;
  const source = wrap.firstElementChild;
  const prepared = await prepareElementForCopy(source, { inlineImages });
  return { html: prepared.innerHTML, rasterizeCalls };
}

try {
  const largeDataUrl = `data:image/png;base64,${"x".repeat(3000)}`;
  const smallDataUrl = `data:image/png;base64,${"x".repeat(100)}`;

  const existingImg = await runPrepare(`<img src="${largeDataUrl}" alt="x">`, "remove-large");
  assert.doesNotMatch(existingImg.html, /data:image/);
  assert.equal(existingImg.rasterizeCalls, 0);

  const removeSmallSmall = await runPrepare(`<img src="${smallDataUrl}" alt="x">`, "remove-small");
  assert.doesNotMatch(removeSmallSmall.html, /data:image/);
  assert.equal(removeSmallSmall.rasterizeCalls, 0);

  const removeSmallLarge = await runPrepare(`<img src="${largeDataUrl}" alt="x">`, "remove-small");
  assert.match(removeSmallLarge.html, /data:image/);
  assert.equal(removeSmallLarge.rasterizeCalls, 0);

  const contentSvg =
    '<figure><svg viewBox="0 0 200 200" width="200" height="200"><circle cx="100" cy="100" r="80"/></svg></figure>';
  const removeAll = await runPrepare(contentSvg, "remove-all");
  assert.doesNotMatch(removeAll.html, /data:image/);
  assert.equal(removeAll.rasterizeCalls, 0);
  assert.match(removeAll.html, /<svg/i);

  const keepAll = await runPrepare(contentSvg, "all");
  assert.match(keepAll.html, /data:image\/png/);
  assert.ok(keepAll.rasterizeCalls > 0);

  console.log("smoke-inline-images-policy: ok");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
