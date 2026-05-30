/**
 * Smoke: pick-copy cache layer contracts and logic.
 * Run: node scripts/smoke-cache.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");

// ---------------------------------------------------------------------------
// Logic mirrors (no browser APIs)
// ---------------------------------------------------------------------------

/** Mirrors pick-copy-cache-storage.ts: writePickCopyCacheToStorage */
function entriesToRecord(entries) {
  const record = {};
  for (const { key, value } of entries) {
    record[key] = value;
  }
  return record;
}

/** Mirrors pick-copy-cache-storage.ts: getPickCopyTextFromStorage */
function getTextFromRecord(record, formatId) {
  if (!record) return undefined;
  if (formatId === "markdownFile") return record.markdown;
  return record[formatId];
}

// writePickCopyCacheToStorage: entries become a flat record
{
  const entries = [
    { key: "styles", value: "color: red" },
    { key: "selector", value: "#foo" },
    { key: "markdown", value: "# Hello" },
  ];
  const record = entriesToRecord(entries);
  assert.equal(record.styles, "color: red");
  assert.equal(record.selector, "#foo");
  assert.equal(record.markdown, "# Hello");
  assert.equal(Object.keys(record).length, 3);
}

// getPickCopyTextFromStorage: normal format
{
  const record = { text: "hello", styles: "color: red", markdown: "# Hi" };
  assert.equal(getTextFromRecord(record, "text"), "hello");
  assert.equal(getTextFromRecord(record, "styles"), "color: red");
}

// getPickCopyTextFromStorage: markdownFile → markdown
{
  const record = { markdown: "# Hi" };
  assert.equal(getTextFromRecord(record, "markdownFile"), "# Hi");
  assert.equal(getTextFromRecord(record, "markdown"), "# Hi");
}

// getPickCopyTextFromStorage: missing key → undefined
{
  const record = { markdown: "# Hi" };
  assert.equal(getTextFromRecord(record, "selector"), undefined);
}

// getPickCopyTextFromStorage: missing record → undefined
{
  assert.equal(getTextFromRecord(undefined, "text"), undefined);
  assert.equal(getTextFromRecord(undefined, "markdownFile"), undefined);
}

// snapshotPickCopyCache: always snapshots all formats; markdown + markdownFile dedup.
{
  const formatIds = ["markdown", "markdownFile"];
  const entries = [];
  let markdownText;
  for (const formatId of formatIds) {
    if (formatId === "markdown" || formatId === "markdownFile") {
      if (markdownText === undefined) {
        markdownText = "# Hello";
        entries.push({ key: "markdown", value: markdownText });
      }
      continue;
    }
    entries.push({ key: formatId, value: "x" });
  }
  assert.equal(entries.length, 1);
  assert.equal(entries[0].key, "markdown");
}

// ---------------------------------------------------------------------------
// Source contracts
// ---------------------------------------------------------------------------

const messagesSrc = readFileSync(join(src, "messages.ts"), "utf8");
// message types
assert.match(messagesSrc, /GET_PICK_COPY_TEXT/,
  "BgToContent must contain GET_PICK_COPY_TEXT fallback");
assert.doesNotMatch(messagesSrc, /CLEAR_PICK_COPY_CACHE/,
  "BgToContent must not contain CLEAR_PICK_COPY_CACHE");
assert.match(messagesSrc, /GetPickCopyTextResponse/);
// panel response type still present
assert.match(messagesSrc, /CopyPickedFormatPanelResponse/);

const contentSrc = readFileSync(join(src, "content.ts"), "utf8");
// lifecycle and clear removed
assert.doesNotMatch(contentSrc, /bindPickCopyCacheLifecycle/,
  "content.ts must not call bindPickCopyCacheLifecycle");
assert.doesNotMatch(contentSrc, /clearPickCopyCache[^S]/,
  "content.ts must not call clearPickCopyCache");
// snapshot must be awaited
assert.match(contentSrc, /await snapshotPickCopyCache\(element, getCachedInlineImagesMode\(\)\)/,
  "snapshotPickCopyCache must be awaited without enabledFormats in content.ts");
// no message handlers for removed types
assert.match(contentSrc, /GET_PICK_COPY_TEXT/);
assert.match(contentSrc, /getCachedCopyText\(message\.formatId\)/);
assert.doesNotMatch(contentSrc, /CLEAR_PICK_COPY_CACHE/);

const backgroundSrc = readFileSync(join(src, "background.ts"), "utf8");
// old tab-proxy helpers removed
assert.doesNotMatch(backgroundSrc, /clearPickCopyCacheOnTab/,
  "background.ts must not contain clearPickCopyCacheOnTab");
assert.doesNotMatch(backgroundSrc, /CLEAR_PICK_COPY_CACHE/,
  "background.ts must not send CLEAR_PICK_COPY_CACHE");
// reads cache from storage, falls back to content script
assert.match(backgroundSrc, /getPickCopyTextForPanel/);
assert.match(backgroundSrc, /getPickCopyTextFromStorage/);
assert.match(backgroundSrc, /GET_PICK_COPY_TEXT/);

const panelBodySrc = readFileSync(join(src, "panel-popup/panel-body.ts"), "utf8");
assert.match(panelBodySrc, /hasPickCopyCacheInStorage/,
  "COPIED page must check cache presence, not only lastCopiedFormat");

const fetchSrc = readFileSync(join(src, "panel-popup/fetch-picked-format.ts"), "utf8");
assert.match(fetchSrc, /payload\.text === undefined/,
  "fetch must treat empty string as valid cached text");

const storageSrc = readFileSync(
  join(src, "pick-mode/pick-copy-cache-storage.ts"), "utf8",
);
assert.match(storageSrc, /writePickCopyCacheToStorage/);
assert.match(storageSrc, /readPickCopyCacheFromStorage/);
assert.match(storageSrc, /clearPickCopyCacheStorage/);
assert.match(storageSrc, /hasPickCopyCacheInStorage/);
assert.match(storageSrc, /writePickCopyCacheIndex/);
assert.match(storageSrc, /pickCopyCacheFormats/);
assert.doesNotMatch(storageSrc, /ext\.storage\.session/,
  "pick-copy-cache-storage must not use session storage (content script writes cache)");
assert.match(storageSrc, /markdownFile/,
  "storage must handle markdownFile");
assert.match(storageSrc, /record\.markdown/,
  "storage must remap markdownFile → record.markdown");

const cacheSrc = readFileSync(
  join(src, "pick-mode/pick-copy-cache.ts"), "utf8",
);
assert.match(cacheSrc, /COPY_FORMATS\.map\(\(format\) => format\.id\)/,
  "snapshotPickCopyCache must cache all formats");
assert.doesNotMatch(cacheSrc, /enabledFormats/,
  "snapshotPickCopyCache must not filter by enabledFormats");
assert.match(cacheSrc, /async function snapshotPickCopyCache/,
  "snapshotPickCopyCache must be async");
assert.match(cacheSrc, /await clearPickCopyCacheStorage/);
assert.match(cacheSrc, /writePickCopyCacheIndex/);
assert.match(cacheSrc, /writePickCopyCacheToStorage/);
assert.match(cacheSrc, /clearPickCopyCacheStorage/);
assert.doesNotMatch(cacheSrc, /export.*clearPickCopyCache[^S]/,
  "clearPickCopyCache must not be exported");

const pickIndexSrc = readFileSync(join(src, "pick-mode/index.ts"), "utf8");
assert.doesNotMatch(pickIndexSrc, /bindPickCopyCacheLifecycle/);
assert.doesNotMatch(pickIndexSrc, /clearPickCopyCache/);
assert.match(pickIndexSrc, /getPickCopyTextFromStorage/);
assert.match(pickIndexSrc, /getCachedCopyText/);
assert.match(pickIndexSrc, /snapshotPickCopyCache/);

console.log("smoke-cache: ok");
