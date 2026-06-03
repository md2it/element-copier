import {
  copyFormattedTextToClipboard,
  parseFormattedTextCache,
} from "../lib/src/copy/formatted-text/index";
import { isImageCopyFormat } from "../copy/screenshot";
import type { CopyFormatId } from "../formats/definitions";
import { dataUrlToBlob } from "./download";

type ClipboardItemWithSupports = {
  supports?: (type: string) => boolean;
};

/**
 * The button label promises a concrete image format (PNG/JPEG), so the
 * clipboard write must use that exact MIME type. `ClipboardItem.supports` is
 * the spec-defined way to learn which types the browser can put on the
 * clipboard; Chrome currently rejects `image/jpeg` on write. When the type is
 * unsupported we fail explicitly instead of silently substituting PNG.
 */
function clipboardCanWriteType(mimeType: string): boolean {
  if (typeof ClipboardItem === "undefined") return false;
  const supports = (ClipboardItem as unknown as ClipboardItemWithSupports)
    .supports;
  if (typeof supports !== "function") return true;
  try {
    return supports.call(ClipboardItem, mimeType);
  } catch {
    return true;
  }
}

function copyTextToClipboardFallback(text: string): boolean {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;";
    const root = document.documentElement ?? document.body;
    if (!root) return false;
    root.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    textarea.remove();
    return ok;
  } catch {
    return false;
  }
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  return copyTextToClipboardFallback(text);
}

async function copyImageToClipboard(
  formatId: CopyFormatId,
  dataUrl: string,
): Promise<boolean> {
  if (!isImageCopyFormat(formatId)) return false;
  const blob = dataUrlToBlob(dataUrl);
  if (!blob) return false;

  const mimeType =
    blob.type || (formatId === "jpeg" ? "image/jpeg" : "image/png");

  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    return false;
  }
  if (!clipboardCanWriteType(mimeType)) return false;

  try {
    await navigator.clipboard.write([new ClipboardItem({ [mimeType]: blob })]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Whether the clipboard can accept this format as the exact MIME the COPIED
 * button promises. Image formats are constrained by `ClipboardItem.supports`
 * (Chrome rejects `image/jpeg` on write), so the button must be disabled
 * up-front instead of showing success for a copy that can never land. Non-image
 * formats write text/HTML, which is universally supported.
 */
export function canCopyFormatToClipboard(formatId: CopyFormatId): boolean {
  if (!isImageCopyFormat(formatId)) return true;
  const mimeType = formatId === "jpeg" ? "image/jpeg" : "image/png";
  return clipboardCanWriteType(mimeType);
}

export async function copyToClipboardForFormat(
  formatId: string,
  cached: string,
): Promise<boolean> {
  if (formatId === "text") {
    const payload = parseFormattedTextCache(cached);
    if (!payload) return false;
    return copyFormattedTextToClipboard(payload);
  }
  if (isImageCopyFormat(formatId as CopyFormatId)) {
    return copyImageToClipboard(formatId as CopyFormatId, cached);
  }
  return copyTextToClipboard(cached);
}
