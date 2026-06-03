import { extractElementCopyText } from "../copy";
import {
  captureElementImages,
  createScreenshotBackgroundSnapshot,
  type ImageCopyFormatId,
  isImageCopyFormat,
} from "../copy/screenshot";
import { createStringCache } from "../element-copy";
import { type CopyFormatId } from "../formats/definitions";
import { DEFAULT_INLINE_IMAGES_MODE, type InlineImageMode } from "../settings/inline-images";
import { getCachedEnabledFormats } from "../settings/format-settings-cache";
import {
  clearPickCopyCacheStorage,
  isPickCopyCacheValueStorable,
  writePickCopyCacheIndex,
  writePickCopyMetaToStorage,
  writePickCopyCacheToStorage,
} from "./pick-copy-cache-storage";

const SNAPSHOT_PERF_LOCAL_STORAGE_KEY = "ec:perf:snapshot";

function nowMs(doc: Document): number {
  const view = doc.defaultView;
  const perfNow = view?.performance?.now;
  return typeof perfNow === "function" && view
    ? perfNow.call(view.performance)
    : Date.now();
}

function isSnapshotPerfEnabled(doc: Document): boolean {
  try {
    return doc.defaultView?.localStorage?.getItem(SNAPSHOT_PERF_LOCAL_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function formatMs(ms: number): string {
  return `${ms.toFixed(1)}ms`;
}

function tryPushCacheEntry(
  entries: { key: CopyFormatId; value: string }[],
  key: CopyFormatId,
  value: string,
  doc: Document,
): void {
  if (isPickCopyCacheValueStorable(key, value, doc)) {
    entries.push({ key, value });
  }
}

/** Snapshot processing order per SPEC/fr-processing.md (line order, not UI order). */
const SNAPSHOT_CACHE_FORMAT_IDS: readonly CopyFormatId[] = [
  "url",
  "outerHTML",
  "computedStyles",
  "selector",
  "jsPath",
  "xpath",
  "fullXPath",
  "styles",
  "text",
  "markdown",
  "png",
  "jpeg",
];

const cache = createStringCache<CopyFormatId>();

/** Sync snapshot of all copy formats; call only after pick-mode deactivate. */
export async function snapshotPickCopyCache(
  element: Element,
  inlineImages: InlineImageMode = DEFAULT_INLINE_IMAGES_MODE,
): Promise<void> {
  cache.clear();
  try {
    await clearPickCopyCacheStorage();
  } catch (error) {
    console.warn("[Element Copier] pick copy cache storage clear failed:", error);
  }

  const enabledFormats = getCachedEnabledFormats();
  const entries: { key: CopyFormatId; value: string }[] = [];
  const doc = element.ownerDocument;
  const perfEnabled = isSnapshotPerfEnabled(doc);
  const snapshotStartedAt = perfEnabled ? nowMs(doc) : 0;
  let extractTimeMs = 0;
  let imageTimeMs = 0;
  let storageTimeMs = 0;
  let imageRenderCount = 0;
  let markdownText: string | undefined;
  let outerHtmlText: string | undefined;
  const needsImageSnapshot = enabledFormats.png || enabledFormats.jpeg;
  let screenshotBackground: ReturnType<typeof createScreenshotBackgroundSnapshot> | undefined;
  let cachedImages: Partial<Record<ImageCopyFormatId, string>> | undefined;

  async function ensureScreenshotBackground(): Promise<void> {
    if (!needsImageSnapshot || screenshotBackground) return;
    const computedStylesText = await extractElementCopyText(
      element,
      "computedStyles",
      inlineImages,
    );
    screenshotBackground = createScreenshotBackgroundSnapshot(element, computedStylesText);
  }

  for (const formatId of SNAPSHOT_CACHE_FORMAT_IDS) {
    if (formatId !== "url" && !enabledFormats[formatId]) continue;
    if (formatId === "markdown" || formatId === "markdownFile") {
      if (markdownText === undefined) {
        markdownText = await extractElementCopyText(element, "markdown", inlineImages);
        tryPushCacheEntry(entries, "markdown", markdownText, doc);
      }
      continue;
    }
    if (formatId === "outerHTML" || formatId === "htmlFile") {
      if (outerHtmlText === undefined) {
        outerHtmlText = await extractElementCopyText(element, "outerHTML", inlineImages);
        tryPushCacheEntry(entries, "outerHTML", outerHtmlText, doc);
      }
      continue;
    }
    if (formatId === "computedStyles") {
      const extractStartedAt = perfEnabled ? nowMs(doc) : 0;
      const computedStylesText = await extractElementCopyText(
        element,
        "computedStyles",
        inlineImages,
      );
      if (perfEnabled) {
        extractTimeMs += nowMs(doc) - extractStartedAt;
      }
      tryPushCacheEntry(entries, formatId, computedStylesText, doc);
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
      try {
        if (!cachedImages) {
          const imageFormats: ImageCopyFormatId[] = [];
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
          tryPushCacheEntry(entries, formatId, capturedImage, doc);
        }
      } catch (error) {
        console.warn("[Element Copier] image snapshot failed:", formatId, error);
      }
      continue;
    }
    const extractStartedAt = perfEnabled ? nowMs(doc) : 0;
    const extracted = await extractElementCopyText(element, formatId, inlineImages);
    if (perfEnabled) {
      extractTimeMs += nowMs(doc) - extractStartedAt;
    }
    tryPushCacheEntry(
      entries,
      formatId,
      extracted,
      doc,
    );
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
      hostname,
    });
    await writePickCopyCacheToStorage(entries, doc);
    if (perfEnabled) {
      storageTimeMs += nowMs(doc) - storageStartedAt;
    }
  } catch (error) {
    console.warn("[Element Copier] pick copy cache storage write failed:", error);
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
          enabledJpeg: Boolean(enabledFormats.jpeg),
        },
      );
    }
  }
}

export function getCachedCopyText(formatId: CopyFormatId): string | undefined {
  if (formatId === "markdownFile") {
    return cache.get("markdown");
  }
  if (formatId === "htmlFile") {
    return cache.get("outerHTML");
  }
  return cache.get(formatId);
}
