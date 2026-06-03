/**
 * Smoke: remove decorative UI SVGs before materialization.
 * Run: node scripts/smoke-decorative-ui-svg.mjs
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

const tempDir = mkdtempSync(join(tmpdir(), "ec-decorative-svg-smoke-"));
const outfile = join(tempDir, "materialize-visuals.mjs");

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  pretendToBeVisual: true,
});
globalThis.Node = dom.window.Node;
globalThis.NodeFilter = dom.window.NodeFilter;
globalThis.Element = dom.window.Element;
globalThis.SVGElement = dom.window.SVGElement;
globalThis.XMLSerializer = dom.window.XMLSerializer;

dom.window.HTMLImageElement.prototype.decode = async function decode() {
  Object.defineProperty(this, "naturalWidth", { value: 24, configurable: true });
  Object.defineProperty(this, "naturalHeight", { value: 24, configurable: true });
};

dom.window.HTMLCanvasElement.prototype.getContext = function getContext() {
  return { drawImage() {} };
};
dom.window.HTMLCanvasElement.prototype.toDataURL = function toDataURL(type) {
  return type === "image/png" ? "data:image/png;base64,smoke" : "";
};

await esbuild.build({
  entryPoints: [join(libRoot, "src/copy/cleanup/materialize-visuals.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile,
});

const { materializeVisualsInContainer } = await import(pathToFileURL(outfile).href);

function cloneHtml(source) {
  return source.cloneNode(true);
}

async function runCase(html) {
  const doc = dom.window.document;
  const wrap = doc.createElement("div");
  wrap.innerHTML = html;
  const source = wrap.firstElementChild;
  const container = doc.createElement("div");
  container.appendChild(cloneHtml(source));
  await materializeVisualsInContainer(source, container);
  return container.innerHTML;
}

function runCaseWithSourceMutator(html, mutateSource) {
  const doc = dom.window.document;
  const wrap = doc.createElement("div");
  wrap.innerHTML = html;
  const source = wrap.firstElementChild;
  mutateSource(source);
  const container = doc.createElement("div");
  container.appendChild(cloneHtml(source));
  return materializeVisualsInContainer(source, container).then(() => container.innerHTML);
}

try {
  const iconOnlyLink = await runCase(
    '<a href="/en"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg></a>',
  );
  assert.doesNotMatch(iconOnlyLink, /<svg|<img/i);
  assert.doesNotMatch(iconOnlyLink, /<a\b/i);

  const buttonWithText = await runCase(
    '<button type="button"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"><path d="M0 0"/></svg> Save</button>',
  );
  assert.doesNotMatch(buttonWithText, /<svg|<img/i);
  assert.match(buttonWithText, /Save/);

  const linkWithText = await runCase(
    '<a href="/en">English <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"><path d="M0 0"/></svg></a>',
  );
  assert.match(linkWithText, /English/);
  assert.match(linkWithText, /<img\b/i);

  const contentFigure = await runCase(
    '<figure><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0"/></svg></figure>',
  );
  assert.match(contentFigure, /<img\b/i);

  const namedSvg = await runCase(
    '<button type="button"><svg aria-hidden="true" aria-label="Close" width="16" height="16" viewBox="0 0 24 24"><path d="M0 0"/></svg></button>',
  );
  assert.match(namedSvg, /<img\b/i);

  const imgIcon = await runCase(
    '<button type="button"><img src="icon.png" alt="" width="16" height="16" aria-hidden="true"></button>',
  );
  assert.match(imgIcon, /<img\b/i);

  const largeViewBoxLogo = await runCase(
    '<a href="/"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 946 947"><path d="M0 0"/></svg></a>',
  );
  assert.match(largeViewBoxLogo, /<img\b/i);
  assert.doesNotMatch(largeViewBoxLogo, /data:image\/svg\+xml/i);
  assert.match(largeViewBoxLogo, /data:image\/png/i);

  const md2itLogo = await runCase(
    '<a class="logo" href="./" aria-label="MD2IT"><span class="logo__mark"><svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 946.295 947.014" width="24" height="24" fill="#000000"><path d="M0.294998 230.507V461.014H57.295"/></svg></span></a>',
  );
  assert.match(md2itLogo, /<img\b/i);
  assert.match(md2itLogo, /data:image\/png/i);
  assert.match(md2itLogo, /alt="MD2IT"/i);
  assert.doesNotMatch(md2itLogo, /<svg/i);

  const menuIconInLink = await runCase(
    '<a href="/menu"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0"/></svg></a>',
  );
  assert.doesNotMatch(menuIconInLink, /<svg|<img/i);
  assert.doesNotMatch(menuIconInLink, /<a\b/i);

  const summaryIcon = await runCase(
    '<details><summary>Language <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0"/></svg></summary><p>Body</p></details>',
  );
  assert.doesNotMatch(summaryIcon, /<svg/i);
  assert.match(summaryIcon, /Language/);

  const ancestorAriaHidden = await runCase(
    '<button type="button"><span aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24"><path d="M0 0"/></svg></span></button>',
  );
  assert.doesNotMatch(ancestorAriaHidden, /<svg|<img/i);

  const materialStyleIcon = await runCase(
    '<span style="display:inline-block;width:24px;height:24px;--icon-color:rgb(31,41,55)"><svg aria-hidden="true" role="img" viewBox="0 -960 960 960" style="width:24px;height:24px;fill:var(--icon-color)"><path d="M0 0h960v960H0z"/></svg></span>',
  );
  assert.match(materialStyleIcon, /<img\b/i);
  assert.match(materialStyleIcon, /\bwidth="24"/i);
  assert.match(materialStyleIcon, /\bheight="24"/i);
  assert.doesNotMatch(materialStyleIcon, /\bwidth="960"/i);
  assert.doesNotMatch(materialStyleIcon, /\bheight="960"/i);

  const materialStyleIconSuspiciousRect = await runCaseWithSourceMutator(
    '<div role="button" aria-label="Search by voice"><svg aria-hidden="true" viewBox="0 -960 960 960"><path d="M0 0h960v960H0z"/></svg></div>',
    (source) => {
      const svg = source.querySelector("svg");
      svg.getBoundingClientRect = () => ({
        x: 0,
        y: 0,
        width: 960,
        height: 960,
        top: 0,
        right: 960,
        bottom: 960,
        left: 0,
        toJSON: () => ({}),
      });
    },
  );
  assert.match(materialStyleIconSuspiciousRect, /<img\b/i);
  assert.doesNotMatch(materialStyleIconSuspiciousRect, /\bwidth="960"/i);
  assert.doesNotMatch(materialStyleIconSuspiciousRect, /\bheight="960"/i);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

console.log("smoke decorative-ui-svg ok");
