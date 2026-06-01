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
  if (formatId === "htmlFile") return record.outerHTML;
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

// getPickCopyTextFromStorage: htmlFile → outerHTML
{
  const record = { outerHTML: "<div>hi</div>" };
  assert.equal(getTextFromRecord(record, "htmlFile"), "<div>hi</div>");
  assert.equal(getTextFromRecord(record, "outerHTML"), "<div>hi</div>");
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

const FRAGMENT_START = "<!--StartFragment-->";
const FRAGMENT_END = "<!--EndFragment-->";

function extractClipboardHtmlFragment(html) {
  const start = html.indexOf(FRAGMENT_START);
  if (start < 0) return html;
  const contentStart = start + FRAGMENT_START.length;
  const end = html.indexOf(FRAGMENT_END, contentStart);
  if (end < 0) return html.slice(contentStart);
  return html.slice(contentStart, end);
}

/** Smoke mirror: text between tags (matches DOM text-node walk for typical fragments). */
function hasNonWhitespaceTextInClipboardHtml(html) {
  const fragment = extractClipboardHtmlFragment(html).trim();
  if (!fragment) return false;
  const text = fragment.replace(/<[^>]+>/g, "");
  return text.trim() !== "";
}

/** Mirrors lib formatted-text/cache.ts: isFormattedTextCacheStorable */
function isFormattedTextCacheStorable(serialized, doc) {
  try {
    const parsed = JSON.parse(serialized);
    if (typeof parsed !== "object" || parsed === null || typeof parsed.html !== "string") {
      return false;
    }
    if (!parsed.html.trim()) return false;
    if (!doc) return false;
    return hasNonWhitespaceTextInClipboardHtml(parsed.html);
  } catch {
    return false;
  }
}

/** Mirrors pick-copy-cache-storage.ts: isPickCopyCacheValueStorable */
function isPickCopyCacheValueStorable(formatId, value, doc) {
  if (formatId === "text") {
    return isFormattedTextCacheStorable(value, doc);
  }
  return value.trim() !== "";
}

function entriesToStorableRecord(entries, doc) {
  const record = {};
  for (const { key, value } of entries) {
    if (!isPickCopyCacheValueStorable(key, value, doc)) continue;
    record[key] = value;
  }
  return record;
}

// isPickCopyCacheValueStorable: blank strings skipped
{
  assert.equal(isPickCopyCacheValueStorable("markdown", ""), false);
  assert.equal(isPickCopyCacheValueStorable("markdown", "   "), false);
  assert.equal(isPickCopyCacheValueStorable("markdown", "# Hi"), true);
}

// isPickCopyCacheValueStorable: text uses html inside serialized cache
{
  const wrap = (fragment) =>
    `<html><head><meta charset="utf-8"></head><body>${FRAGMENT_START}${fragment}${FRAGMENT_END}</body></html>`;
  const doc = {};

  assert.equal(isPickCopyCacheValueStorable("text", "{}"), false);
  assert.equal(isPickCopyCacheValueStorable("text", "   "), false);
  assert.equal(
    isPickCopyCacheValueStorable("text", JSON.stringify({ html: "", plain: "" })),
    false,
  );
  assert.equal(
    isPickCopyCacheValueStorable("text", JSON.stringify({ html: "   ", plain: "   " })),
    false,
  );
  assert.equal(
    isPickCopyCacheValueStorable(
      "text",
      JSON.stringify({ html: wrap("<p>x</p>") }),
      doc,
    ),
    true,
  );
  // Icon-only tablist: aria-label on tabs, no text nodes → not storable
  const tablist =
    '<div role="tablist"><div role="tab" aria-label="Calendar"><div></div><div style="background-image:url(x)"></div></div><div role="tab" aria-label="Keep"><div></div></div></div>';
  assert.equal(
    isPickCopyCacheValueStorable("text", JSON.stringify({ html: wrap(tablist) }), doc),
    false,
  );
}

// writePickCopyCacheToStorage: empty entries do not create keys
{
  const record = entriesToStorableRecord([
    { key: "markdown", value: "" },
    { key: "selector", value: "#foo" },
  ]);
  assert.equal(record.markdown, undefined);
  assert.equal(record.selector, "#foo");
}

/** Mirrors pick-copy-cache-storage.ts: isPickCopyFormatAvailable */
function resolvePickCopyCacheStorageKey(formatId) {
  if (formatId === "markdownFile") return "markdown";
  if (formatId === "htmlFile") return "outerHTML";
  return formatId;
}

function isPickCopyFormatAvailable(formatId, record, doc) {
  if (!record) return false;
  const value = record[resolvePickCopyCacheStorageKey(formatId)];
  if (value === undefined) return false;
  if (formatId === "text") {
    return isFormattedTextCacheStorable(value, doc);
  }
  return true;
}

// snapshotPickCopyCache: outerHTML + htmlFile dedup.
{
  const formatIds = ["outerHTML", "htmlFile"];
  const entries = [];
  let outerHtmlText;
  for (const formatId of formatIds) {
    if (formatId === "outerHTML" || formatId === "htmlFile") {
      if (outerHtmlText === undefined) {
        outerHtmlText = "<div>hi</div>";
        entries.push({ key: "outerHTML", value: outerHtmlText });
      }
      continue;
    }
    entries.push({ key: formatId, value: "x" });
  }
  assert.equal(entries.length, 1);
  assert.equal(entries[0].key, "outerHTML");
}

// isPickCopyFormatAvailable: derived htmlFile uses outerHTML key
{
  assert.equal(isPickCopyFormatAvailable("htmlFile", { outerHTML: "<div></div>" }), true);
  assert.equal(isPickCopyFormatAvailable("htmlFile", { markdown: "# Hi" }), false);
}

// isPickCopyFormatAvailable: derived markdownFile uses markdown key
{
  assert.equal(isPickCopyFormatAvailable("markdownFile", { markdown: "# Hi" }), true);
  assert.equal(isPickCopyFormatAvailable("markdownFile", { selector: "#x" }), false);
  assert.equal(isPickCopyFormatAvailable("markdown", { markdown: "# Hi" }), true);
}

// isPickCopyFormatAvailable: text key with icon-only html is unavailable
{
  const wrap = (fragment) =>
    `<html><head><meta charset="utf-8"></head><body>${FRAGMENT_START}${fragment}${FRAGMENT_END}</body></html>`;
  const tablist =
    '<div role="tablist"><div role="tab" aria-label="Calendar"><div></div></div></div>';
  const serialized = JSON.stringify({ html: wrap(tablist) });
  assert.equal(
    isPickCopyFormatAvailable("text", { text: serialized }, {}),
    false,
  );
  assert.equal(
    isPickCopyFormatAvailable(
      "text",
      { text: JSON.stringify({ html: wrap("<p>hi</p>") }) },
      {},
    ),
    true,
  );
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
assert.match(panelBodySrc, /readPickCopyCacheFromStorage/);
assert.match(panelBodySrc, /pickCopyCacheRecord/);
assert.match(panelBodySrc, /shouldShowCopiedPanelStatus/,
  "COPIED page must hide subtitle/selection on revisit until a new action");
assert.match(backgroundSrc, /markCopiedPanelShowStatus/);
assert.match(backgroundSrc, /clearCopiedPanelShowStatus/);

const formatUiSrc = readFileSync(join(src, "formats/format-ui.ts"), "utf8");
assert.match(formatUiSrc, /isPickCopyFormatAvailable/);
assert.match(formatUiSrc, /isPickCopyFormatAvailable\([\s\S]*document/);
assert.match(formatUiSrc, /pickCopyCacheRecord/);
assert.match(formatUiSrc, /ec-format-action-btn--unavailable/);

const fetchSrc = readFileSync(join(src, "panel-popup/fetch-picked-format.ts"), "utf8");
assert.match(fetchSrc, /payload\.text === undefined/,
  "fetch must treat empty string as valid cached text");

const storageSrc = readFileSync(
  join(src, "pick-mode/pick-copy-cache-storage.ts"), "utf8",
);
assert.match(storageSrc, /isPickCopyCacheValueStorable/);
assert.match(storageSrc, /isFormattedTextCacheStorable/);
assert.match(storageSrc, /isPickCopyFormatAvailable/);
assert.match(storageSrc, /resolvePickCopyCacheStorageKey/);
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
assert.match(storageSrc, /htmlFile/,
  "storage must handle htmlFile");
assert.match(storageSrc, /resolvePickCopyCacheStorageKey/,
  "storage must remap markdownFile via resolvePickCopyCacheStorageKey");

const cacheSrc = readFileSync(
  join(src, "pick-mode/pick-copy-cache.ts"), "utf8",
);
assert.match(cacheSrc, /COPY_FORMATS\.map\(\(format\) => format\.id\)/,
  "snapshotPickCopyCache must iterate all formats");
assert.match(cacheSrc, /isPickCopyCacheValueStorable/);
assert.match(cacheSrc, /ownerDocument/);
assert.match(cacheSrc, /tryPushCacheEntry/);
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
