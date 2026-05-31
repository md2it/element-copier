import {
  copyFormattedTextToClipboard,
  parseFormattedTextCache,
} from "../../../lib/src/copy/formatted-text/index";
import { isImageCopyFormat } from "../copy/screenshot";
import type { CopyFormatId } from "../formats/definitions";
import { dataUrlToBlob, mimeTypeForFormat } from "./download";

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

  const mimeType = mimeTypeForFormat(formatId);
  try {
    if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
      await navigator.clipboard.write([
        new ClipboardItem({ [mimeType]: blob }),
      ]);
      return true;
    }
  } catch {
    /* fall through */
  }
  return false;
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
