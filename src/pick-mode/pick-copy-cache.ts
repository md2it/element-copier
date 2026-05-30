import { extractElementCopyText } from "../copy";
import { createStringCache } from "../element-copy";
import { COPY_FORMATS, type CopyFormatId } from "../formats/definitions";
import { DEFAULT_INLINE_IMAGES_MODE, type InlineImageMode } from "../settings/inline-images";
import {
  clearPickCopyCacheStorage,
  writePickCopyCacheIndex,
  writePickCopyCacheToStorage,
} from "./pick-copy-cache-storage";

const cache = createStringCache<CopyFormatId>();

/** Sync snapshot of all copy formats; call only after pick-mode deactivate. */
export async function snapshotPickCopyCache(
  element: Element,
  inlineImages: InlineImageMode = DEFAULT_INLINE_IMAGES_MODE,
): Promise<void> {
  const formatIds = COPY_FORMATS.map((format) => format.id);
  const entries: { key: CopyFormatId; value: string }[] = [];
  let markdownText: string | undefined;

  for (const formatId of formatIds) {
    if (formatId === "markdown" || formatId === "markdownFile") {
      if (markdownText === undefined) {
        markdownText = extractElementCopyText(element, "markdown", inlineImages);
        entries.push({ key: "markdown", value: markdownText });
      }
      continue;
    }
    entries.push({
      key: formatId,
      value: extractElementCopyText(element, formatId, inlineImages),
    });
  }

  cache.snapshot(entries);

  try {
    await clearPickCopyCacheStorage();
    await writePickCopyCacheIndex(entries.map((entry) => entry.key));
    if (entries.length === 0) {
      return;
    }
    await writePickCopyCacheToStorage(entries);
  } catch (error) {
    console.warn("[Element Copier] pick copy cache storage write failed:", error);
  }
}

export function getCachedCopyText(formatId: CopyFormatId): string | undefined {
  if (formatId === "markdownFile") {
    return cache.get("markdown");
  }
  return cache.get(formatId);
}

