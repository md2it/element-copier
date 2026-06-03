import { isFormattedTextCacheStorable } from "../lib/src/copy/formatted-text/index";
import { CLIPBOARD_COPY_FORMATS, type CopyFormatId } from "../formats/definitions";
import type { EnabledFormatsMap } from "../settings/format-settings";
import { extractElementCopyText } from "./extract";

async function isFormatExtractEmpty(element: Element, formatId: CopyFormatId): Promise<boolean> {
  const text = await extractElementCopyText(element, formatId);
  if (formatId === "text") {
    return !isFormattedTextCacheStorable(text, element.ownerDocument);
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
  if (enabledFormats.markdown) return "markdown";
  return CLIPBOARD_COPY_FORMATS.find((format) => enabledFormats[format.id])?.id ?? null;
}

/** Walk up to parent when the picked element has nothing to copy for the active format. */
export async function resolveCopyElement(
  element: Element,
  enabledFormats: EnabledFormatsMap,
  defaultFormatId: CopyFormatId | null,
): Promise<Element> {
  const checkFormat = pickCheckFormat(enabledFormats, defaultFormatId);
  if (!checkFormat) return element;

  let current: Element | null = element;
  while (current) {
    if (!(await isFormatExtractEmpty(current, checkFormat))) {
      return current;
    }
    if (current.tagName === "HTML") break;
    current = current.parentElement;
  }

  return element;
}
