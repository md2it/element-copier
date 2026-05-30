import { parseFormattedTextCache } from "../../../lib/src/copy/formatted-text/index";
import { COPY_FORMATS, type CopyFormatId } from "../formats/definitions";
import type { EnabledFormatsMap } from "../settings/format-settings";
import { extractElementCopyText } from "./extract";

function isFormatExtractEmpty(element: Element, formatId: CopyFormatId): boolean {
  const text = extractElementCopyText(element, formatId);
  if (formatId === "text") {
    const payload = parseFormattedTextCache(text);
    return !payload?.plain?.trim() && !payload?.html?.trim();
  }
  return text.trim() === "";
}

function pickCheckFormat(
  enabledFormats: EnabledFormatsMap,
  defaultFormatId: CopyFormatId | null,
): CopyFormatId | null {
  if (defaultFormatId !== null && enabledFormats[defaultFormatId]) {
    return defaultFormatId;
  }
  if (enabledFormats.text) return "text";
  return COPY_FORMATS.find((format) => enabledFormats[format.id])?.id ?? null;
}

/** Walk up to parent when the picked element has nothing to copy for the active format. */
export function resolveCopyElement(
  element: Element,
  enabledFormats: EnabledFormatsMap,
  defaultFormatId: CopyFormatId | null,
): Element {
  const checkFormat = pickCheckFormat(enabledFormats, defaultFormatId);
  if (!checkFormat) return element;

  let current: Element | null = element;
  while (current) {
    if (!isFormatExtractEmpty(current, checkFormat)) {
      return current;
    }
    if (current.tagName === "HTML") break;
    current = current.parentElement;
  }

  return element;
}
