/**
 * Smoke: md2it logo survives full prepareElementForCopy (materialize + link normalize).
 * Run: node scripts/smoke-md2it-logo.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const libRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogRoot = join(libRoot, "..");
const require = createRequire(import.meta.url);
const esbuild = require(join(libRoot, "node_modules/esbuild"));
const { JSDOM } = require(join(libRoot, "node_modules/jsdom"));
const { PNG } = require(join(libRoot, "node_modules/pngjs"));

const tempDir = mkdtempSync(join(tmpdir(), "ec-md2it-logo-smoke-"));
const cleanupOut = join(tempDir, "cleanup.mjs");
const markdownOut = join(tempDir, "markdown.mjs");

const html = readFileSync(
  join(catalogRoot, "element-copier/SPEC/copied-www-md2it-com-html.html"),
  "utf8",
);
const dom = new JSDOM(html, { url: "https://www.md2it.com/en/", pretendToBeVisual: true });
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
  entryPoints: [join(libRoot, "src/copy/cleanup/index.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: cleanupOut,
});
await esbuild.build({
  entryPoints: [join(libRoot, "src/copy/markdown/index.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: markdownOut,
});

const { prepareElementForCopy } = await import(pathToFileURL(cleanupOut).href);
const { elementToMarkdown } = await import(pathToFileURL(markdownOut).href);

function countDarkPixels(pngBuffer) {
  const png = PNG.sync.read(pngBuffer);
  let dark = 0;
  for (let i = 0; i < png.data.length; i += 4) {
    if (png.data[i + 3] > 0 && png.data[i] + png.data[i + 1] + png.data[i + 2] < 700) {
      dark++;
    }
  }
  return dark;
}

async function assertLogoPngInBrowser() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    ({ chromium } = await import(join(catalogRoot, "element-deleter/node_modules/playwright/index.mjs")));
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { url: "https://www.md2it.com/en/" });

  const bundle = readFileSync(cleanupOut, "utf8");
  const result = await page.evaluate(async ({ bundleCode, baseHref }) => {
    const blob = new Blob([bundleCode], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const mod = await import(url);
    URL.revokeObjectURL(url);
    const prepared = await mod.prepareElementForCopy(document.body, { baseHref });
    const img = prepared.querySelector("a.logo img");
    if (!img) return { error: "no logo img" };
    const src = img.getAttribute("src") ?? "";
    const prefix = "data:image/png;base64,";
    if (!src.startsWith(prefix)) return { error: "not png data url", src: src.slice(0, 40) };
    return { b64len: src.length - prefix.length, b64: src.slice(prefix.length) };
  }, { bundleCode: bundle, baseHref: "https://www.md2it.com/en/" });

  await browser.close();

  assert.ok(!result.error, result.error ?? "browser raster failed");
  assert.ok(result.b64len > 500, `expected non-trivial PNG base64, got ${result.b64len}`);
  const pngBuffer = Buffer.from(result.b64, "base64");
  assert.ok(pngBuffer.length > 400, `expected PNG bytes > 400, got ${pngBuffer.length}`);
  const dark = countDarkPixels(pngBuffer);
  assert.ok(dark > 100, `expected non-empty logo raster, dark pixels=${dark}`);
}

try {
  const body = dom.window.document.body;
  const prepared = await prepareElementForCopy(body, { baseHref: "https://www.md2it.com/en/" });
  const logo = prepared.querySelector("a.logo");
  assert.ok(logo, "logo link missing");

  const img = logo.querySelector("img");
  assert.ok(img, "logo img missing after full cleanup");
  assert.match(img.getAttribute("alt") ?? "", /MD2IT/i);
  assert.match(img.getAttribute("src") ?? "", /^data:image\/png/i);
  assert.doesNotMatch(logo.innerHTML, /<svg/i);

  const md = elementToMarkdown(prepared);
  assert.match(md, /!\[MD2IT\]\(data:image\/png/i);
  assert.match(md, /\[!\[MD2IT\]\(data:image\/png[^\]]*\)\]\(https:\/\/www\.md2it\.com\/en\/\)/i);

  await assertLogoPngInBrowser();

  const textLinkWithIcon = await prepareElementForCopy(
    dom.window.document.createElement("div"),
  );
  textLinkWithIcon.innerHTML =
    '<a href="/en">English <img src="x.png" alt="chevron" width="16" height="16"></a>';
  const { normalizeClipboardLinks } = await import(pathToFileURL(cleanupOut).href);
  normalizeClipboardLinks(textLinkWithIcon);
  assert.equal(textLinkWithIcon.querySelector("a")?.textContent?.trim(), "English");
  assert.doesNotMatch(textLinkWithIcon.innerHTML, /<img/i);

  const { hrefToDomainShorthand } = await import(pathToFileURL(cleanupOut).href);
  const longDataUrl = `data:image/png;base64,${"A".repeat(5000)}`;
  assert.equal(hrefToDomainShorthand(longDataUrl), longDataUrl);
  assert.equal(hrefToDomainShorthand(longDataUrl).length, longDataUrl.length);
  assert.equal(hrefToDomainShorthand("mailto:contact@md2it.com"), "contact@md2it.com");
  assert.equal(hrefToDomainShorthand("tel:+1234567890"), "+1234567890");
  assert.equal(hrefToDomainShorthand("tg://resolve?domain=username"), "resolve?domain=username");
  assert.equal(hrefToDomainShorthand("https://example.com/path"), "example.com/...");
  assert.equal(hrefToDomainShorthand("javascript:void(0)"), "/...");

  const mdFull = elementToMarkdown(
    await prepareElementForCopy(body, { baseHref: "https://www.md2it.com/en/" }),
  );
  assert.match(mdFull, /\[contact@md2it\.com\]\(mailto:contact@md2it\.com\)/);
  assert.doesNotMatch(mdFull, /\[\/\.\.\.\]\(mailto:/);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

console.log("smoke md2it-logo ok");
