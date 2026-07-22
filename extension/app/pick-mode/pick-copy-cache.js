import { DEFAULT_INLINE_IMAGES_MODE } from "../settings/inline-images.js";
import { captureElementImages, createScreenshotBackgroundSnapshot, isImageCopyFormat } from "../copy/screenshot.js";
import { clearPickCopyCacheStorage, isPickCopyCacheValueStorable, resolvePickCopyCacheStorageKey, writePickCopyCacheIndex, writePickCopyCacheToStorage, writePickCopyMetaToStorage } from "./pick-copy-cache-storage.js";
import { createStringCache } from "../element-copy/cache.js";
import { extractElementCopyText } from "../copy/extract.js";
import { getCachedEnabledFormats } from "../settings/format-settings-cache.js";
import { DEVTOOLS_FORMAT_IDS } from "../settings/format-settings.js";

var SNAPSHOT_PERF_LOCAL_STORAGE_KEY = "ec:perf:snapshot";

function nowMs(doc) {
  const view = doc.defaultView;
  const perfNow = view?.performance?.now;
  return typeof perfNow === "function" && view ? perfNow.call(view.performance) : Date.now();
}

function isSnapshotPerfEnabled(doc) {
  try {
    return doc.defaultView?.localStorage?.getItem(SNAPSHOT_PERF_LOCAL_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function formatMs(ms) {
  return `${ms.toFixed(1)}ms`;
}

function tryPushCacheEntry(entries, key, value, doc) {
  if (isPickCopyCacheValueStorable(key, value, doc)) {
    entries.push({ key, value });
    return true;
  }
  return false;
}

var SNAPSHOT_CACHE_FORMAT_IDS = [
  "url",
  "outerHTML",
  "tagIdClass",
  "computedStyles",
  "selector",
  "jsPath",
  "xpath",
  "fullXPath",
  "styles",
  "qaDetails",
  "text",
  "markdown",
  "png",
  "jpeg"
];

var cache = createStringCache();

function snapshotFormatFor(formatId) {
  const key = resolvePickCopyCacheStorageKey(formatId);
  if (key === "markdown" || key === "outerHTML") return key;
  return SNAPSHOT_CACHE_FORMAT_IDS.includes(key) ? key : null;
}

function prioritizeSnapshotFormats(priorityFormatId) {
  const priority = priorityFormatId ? snapshotFormatFor(priorityFormatId) : null;
  if (!priority) return SNAPSHOT_CACHE_FORMAT_IDS;
  return [
    priority,
    ...SNAPSHOT_CACHE_FORMAT_IDS.filter((formatId) => formatId !== priority)
  ];
}

async function snapshotPickCopyCache(element, inlineImages = DEFAULT_INLINE_IMAGES_MODE, options = {}) {
  cache.clear();
  try {
    await clearPickCopyCacheStorage();
  } catch (error) {
    console.debug("[Element Copier] pick copy cache storage clear failed:", error);
  }
  const enabledFormats = getCachedEnabledFormats();
  const entries = [];
  const doc = element.ownerDocument;
  const perfEnabled = isSnapshotPerfEnabled(doc);
  const snapshotStartedAt = perfEnabled ? nowMs(doc) : 0;
  let extractTimeMs = 0;
  let imageTimeMs = 0;
  let storageTimeMs = 0;
  let imageRenderCount = 0;
  let markdownText;
  let outerHtmlText;
  const needsImageSnapshot = enabledFormats.png || enabledFormats.jpeg;
  let screenshotBackground;
  let cachedImages;
  async function cacheEntry(key, value) {
    if (!tryPushCacheEntry(entries, key, value, doc)) return;
    await options.onCacheEntry?.(key, value);
  }
  async function ensureScreenshotBackground() {
    if (!needsImageSnapshot || screenshotBackground) return;
    const computedStylesText = await extractElementCopyText(
      element,
      "computedStyles",
      inlineImages
    );
    screenshotBackground = createScreenshotBackgroundSnapshot(element, computedStylesText);
  }
  for (const formatId of prioritizeSnapshotFormats(options.priorityFormatId)) {
    try {
      // Developer tools visibility must not affect values used by a default action.
      if (formatId !== "url" && !enabledFormats[formatId] && !DEVTOOLS_FORMAT_IDS.includes(formatId)) continue;
      if (formatId === "markdown" || formatId === "markdownFile") {
        if (markdownText === void 0) {
          markdownText = await extractElementCopyText(element, "markdown", inlineImages);
          await cacheEntry("markdown", markdownText);
        }
        continue;
      }
      if (formatId === "outerHTML" || formatId === "htmlFile") {
        if (outerHtmlText === void 0) {
          outerHtmlText = await extractElementCopyText(element, "outerHTML", inlineImages);
          await cacheEntry("outerHTML", outerHtmlText);
        }
        continue;
      }
      if (formatId === "computedStyles") {
        const extractStartedAt2 = perfEnabled ? nowMs(doc) : 0;
        const computedStylesText = await extractElementCopyText(
          element,
          "computedStyles",
          inlineImages
        );
        if (perfEnabled) {
          extractTimeMs += nowMs(doc) - extractStartedAt2;
        }
        await cacheEntry(formatId, computedStylesText);
        if (needsImageSnapshot) {
          screenshotBackground = createScreenshotBackgroundSnapshot(element, computedStylesText);
        }
        continue;
      }
      if (isImageCopyFormat(formatId)) {
        if (!screenshotBackground) {
          await ensureScreenshotBackground();
        }
        if (!screenshotBackground) continue;
        if (!cachedImages) {
          const imageFormats = [];
          if (enabledFormats.png) imageFormats.push("png");
          if (enabledFormats.jpeg) imageFormats.push("jpeg");
          const imageStartedAt = perfEnabled ? nowMs(doc) : 0;
          cachedImages = await captureElementImages(element, imageFormats, screenshotBackground);
          if (perfEnabled) {
            imageTimeMs += nowMs(doc) - imageStartedAt;
            imageRenderCount += 1;
          }
        }
        const capturedImage = cachedImages[formatId];
        if (capturedImage) {
          await cacheEntry(formatId, capturedImage);
        }
        continue;
      }
      const extractStartedAt = perfEnabled ? nowMs(doc) : 0;
      const extracted = await extractElementCopyText(element, formatId, inlineImages);
      if (perfEnabled) {
        extractTimeMs += nowMs(doc) - extractStartedAt;
      }
      await cacheEntry(formatId, extracted);
    } catch (error) {
      console.debug("[Element Copier] format snapshot failed:", formatId, error);
    }
  }
  cache.snapshot(entries);
  try {
    const storageStartedAt = perfEnabled ? nowMs(doc) : 0;
    await writePickCopyCacheIndex(entries.map((entry) => entry.key));
    if (entries.length === 0) {
      if (perfEnabled) {
        storageTimeMs += nowMs(doc) - storageStartedAt;
      }
      return;
    }
    const hostname = doc.location?.hostname?.trim() || "unknown";
    await writePickCopyMetaToStorage({
      tagName: element.tagName.toLowerCase(),
      hostname
    });
    await writePickCopyCacheToStorage(entries, doc);
    if (perfEnabled) {
      storageTimeMs += nowMs(doc) - storageStartedAt;
    }
  } catch (error) {
    console.debug("[Element Copier] pick copy cache storage write failed:", error);
  } finally {
    if (perfEnabled) {
      const totalMs = nowMs(doc) - snapshotStartedAt;
      console.info(
        "[Element Copier][perf] snapshot",
        {
          total: formatMs(totalMs),
          extract: formatMs(extractTimeMs),
          images: formatMs(imageTimeMs),
          storage: formatMs(storageTimeMs),
          imageRenders: imageRenderCount,
          cachedEntries: entries.length,
          enabledPng: Boolean(enabledFormats.png),
          enabledJpeg: Boolean(enabledFormats.jpeg)
        }
      );
    }
  }
}

function getCachedCopyText(formatId) {
  if (formatId === "markdownFile") {
    return cache.get("markdown");
  }
  if (formatId === "htmlFile") {
    return cache.get("outerHTML");
  }
  return cache.get(formatId);
}

export { SNAPSHOT_CACHE_FORMAT_IDS, SNAPSHOT_PERF_LOCAL_STORAGE_KEY, cache, formatMs, getCachedCopyText, isSnapshotPerfEnabled, nowMs, snapshotPickCopyCache, tryPushCacheEntry };
