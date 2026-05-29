import { createElementCopyCache } from "../../../lib/src/element-copy";
import { COPY_FORMATS, type CopyFormatId } from "../formats/definitions";
import type { EnabledFormatsMap } from "../settings/format-settings";
import { ELEMENT_COPY_INJECTED_CLASS_NAMES } from "../element-copy/injected-classes";

const extractOptions = {
  injectedClassNames: ELEMENT_COPY_INJECTED_CLASS_NAMES,
};

const cache = createElementCopyCache();

/** Sync snapshot of enabled formats; call only after pick-mode deactivate. */
export function snapshotPickCopyCache(
  element: Element,
  enabledFormats: EnabledFormatsMap,
): void {
  const formatIds = COPY_FORMATS.filter((format) => enabledFormats[format.id]).map(
    (format) => format.id,
  );
  cache.snapshot(element, formatIds, extractOptions);
}

export function getCachedCopyText(formatId: CopyFormatId): string | undefined {
  return cache.get(formatId);
}

export function hasPickCopyCache(): boolean {
  return cache.has();
}

export function clearPickCopyCache(): void {
  cache.clear();
}
