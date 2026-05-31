import { extractElementCopyText } from "../copy";
import {
  captureElementImage,
  createScreenshotBackgroundSnapshot,
  isImageCopyFormat,
} from "../copy/screenshot";
import { createStringCache } from "../element-copy";
import { COPY_FORMATS, type CopyFormatId } from "../formats/definitions";
import { DEFAULT_INLINE_IMAGES_MODE, type InlineImageMode } from "../settings/inline-images";
import {
  clearPickCopyCacheStorage,
  isPickCopyCacheValueStorable,
  writePickCopyCacheIndex,
  writePickCopyMetaToStorage,
  writePickCopyCacheToStorage,
} from "./pick-copy-cache-storage";

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

  const formatIds = COPY_FORMATS.map((format) => format.id);
  const entries: { key: CopyFormatId; value: string }[] = [];
  const doc = element.ownerDocument;
  let markdownText: string | undefined;
  let outerHtmlText: string | undefined;
  const computedStylesText = extractElementCopyText(element, "computedStyles", inlineImages);
  const screenshotBackground = createScreenshotBackgroundSnapshot(element, computedStylesText);

  for (const formatId of formatIds) {
    if (formatId === "markdown" || formatId === "markdownFile") {
      if (markdownText === undefined) {
        markdownText = extractElementCopyText(element, "markdown", inlineImages);
        tryPushCacheEntry(entries, "markdown", markdownText, doc);
      }
      continue;
    }
    if (formatId === "outerHTML" || formatId === "htmlFile") {
      if (outerHtmlText === undefined) {
        outerHtmlText = extractElementCopyText(element, "outerHTML", inlineImages);
        tryPushCacheEntry(entries, "outerHTML", outerHtmlText, doc);
      }
      continue;
    }
    if (isImageCopyFormat(formatId)) {
      try {
        tryPushCacheEntry(
          entries,
          formatId,
          await captureElementImage(element, formatId, screenshotBackground),
          doc,
        );
      } catch (error) {
        console.warn("[Element Copier] image snapshot failed:", formatId, error);
      }
      continue;
    }
    if (formatId === "computedStyles") {
      tryPushCacheEntry(entries, formatId, computedStylesText, doc);
      continue;
    }
    tryPushCacheEntry(
      entries,
      formatId,
      extractElementCopyText(element, formatId, inlineImages),
      doc,
    );
  }

  cache.snapshot(entries);

  try {
    await writePickCopyCacheIndex(entries.map((entry) => entry.key));
    if (entries.length === 0) {
      return;
    }
    const hostname = doc.location?.hostname?.trim() || "unknown";
    await writePickCopyMetaToStorage({
      tagName: element.tagName.toLowerCase(),
      hostname,
    });
    await writePickCopyCacheToStorage(entries, doc);
  } catch (error) {
    console.warn("[Element Copier] pick copy cache storage write failed:", error);
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

