/**
 * Smoke: text/plain is derived from cached text/html (Wikipedia-style mixed child nodes).
 * Run: node scripts/smoke-formatted-text-plain.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const libRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const extractSrc = readFileSync(join(libRoot, "src/copy/formatted-text/extract.ts"), "utf8");
const cacheSrc = readFileSync(join(libRoot, "src/copy/formatted-text/cache.ts"), "utf8");
const plainSrc = readFileSync(join(libRoot, "src/copy/formatted-text/plain.ts"), "utf8");
const copierExtractSrc = readFileSync(
  join(libRoot, "../element-copier/src/copy/extract.ts"),
  "utf8",
);

assert.doesNotMatch(extractSrc, /extractPlainFromPreparedContainer/);
assert.doesNotMatch(copierExtractSrc, /extractPlainFromPreparedContainer/);
assert.doesNotMatch(copierExtractSrc, /tryExtractPlainFromTable/);
assert.match(copierExtractSrc, /getFormattedTextHtml/);
assert.match(cacheSrc, /typeof \(parsed as FormattedText\)\.html === "string"/);
assert.doesNotMatch(cacheSrc, /\.plain === "string"/);
assert.match(cacheSrc, /isFormattedTextCacheStorable/);
assert.match(cacheSrc, /hasNonWhitespaceTextInClipboardHtml/);
assert.doesNotMatch(
  cacheSrc,
  /derivePlainFromClipboardHtml[\s\S]*isFormattedTextCacheStorable|isFormattedTextCacheStorable[\s\S]*derivePlainFromClipboardHtml/,
);
assert.match(plainSrc, /hasNonWhitespaceTextInClipboardHtml/);
assert.match(plainSrc, /readPlainFromHtmlTree/);
assert.match(plainSrc, /innerText/);
assert.match(plainSrc, /normalizeDerivedPlain/);
assert.doesNotMatch(plainSrc, /range\.toString/);

console.log("smoke formatted-text plain ok");
