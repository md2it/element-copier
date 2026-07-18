import { copyFormattedTextToClipboard } from "../../lib/our/copy/formatted-text/clipboard.js";
import { dataUrlToBlob } from "./download.js";
import { isImageCopyFormat } from "../copy/screenshot.js";
import { parseFormattedTextCache } from "../../lib/our/copy/formatted-text/cache.js";
import { ext } from "../../lib/our/api.js";

function isFirefoxExtensionRuntime() {
  try {
    return String(ext.runtime.getURL("/")).startsWith("moz-extension:");
  } catch {
    return /Firefox\//.test(String(globalThis.navigator?.userAgent || ""));
  }
}

function clipboardCanWriteType(mimeType) {
  if (typeof ClipboardItem === "undefined") return false;
  const supports = ClipboardItem.supports;
  if (typeof supports !== "function") return true;
  try {
    return supports.call(ClipboardItem, mimeType);
  } catch {
    return true;
  }
}

function toClipboardItemValue(value) {
  // Firefox historically required Promise-wrapped blobs for ClipboardItem.
  return value instanceof Promise ? value : Promise.resolve(value);
}

function copyTextToClipboardFallback(text) {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;";
    const root2 = document.documentElement ?? document.body;
    if (!root2) return false;
    root2.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    textarea.remove();
    return ok;
  } catch {
    return false;
  }
}

async function copyTextToClipboard(text) {
  if (!text) return false;
  // Clipboard API is unavailable in content scripts on insecure (http:) pages.
  // Prefer execCommand there; clipboardWrite also allows it after async gaps (pick flow).
  if (globalThis.isSecureContext === false) {
    return copyTextToClipboardFallback(text);
  }
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
  }
  return copyTextToClipboardFallback(text);
}

async function copyImageToClipboard(formatId, dataUrl) {
  if (!isImageCopyFormat(formatId)) return false;
  const blob = dataUrlToBlob(dataUrl);
  if (!blob) return false;
  const mimeType = blob.type || (formatId === "jpeg" ? "image/jpeg" : "image/png");
  if (isFirefoxExtensionRuntime()) {
    try {
      const response = await ext.runtime.sendMessage({
        type: "COPY_IMAGE_TO_CLIPBOARD",
        formatId,
        dataUrl
      });
      if (response?.ok === true) return true;
    } catch {
    }
  }
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    return false;
  }
  if (!clipboardCanWriteType(mimeType)) return false;
  try {
    await navigator.clipboard.write([
      new ClipboardItem({ [mimeType]: toClipboardItemValue(blob) })
    ]);
    return true;
  } catch {
    return false;
  }
}

function canCopyFormatToClipboard(formatId) {
  if (!isImageCopyFormat(formatId)) return true;
  if (isFirefoxExtensionRuntime()) return true;
  const mimeType = formatId === "jpeg" ? "image/jpeg" : "image/png";
  return clipboardCanWriteType(mimeType);
}

async function copyToClipboardForFormat(formatId, cached) {
  if (formatId === "text") {
    const payload = parseFormattedTextCache(cached);
    if (!payload) return false;
    return copyFormattedTextToClipboard(payload);
  }
  if (isImageCopyFormat(formatId)) {
    return copyImageToClipboard(formatId, cached);
  }
  return copyTextToClipboard(cached);
}

export {
  canCopyFormatToClipboard,
  clipboardCanWriteType,
  copyImageToClipboard,
  isFirefoxExtensionRuntime,
  copyTextToClipboard,
  copyTextToClipboardFallback,
  copyToClipboardForFormat
};
