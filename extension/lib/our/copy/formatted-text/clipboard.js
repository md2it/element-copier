import { derivePlainFromClipboardHtml } from "./plain.js";

function copyFormattedTextLegacy(html, plain) {
  const doc = document;
  const root2 = doc.documentElement ?? doc.body;
  if (!root2) return false;
  const onCopy = (event) => {
    event.preventDefault();
    event.clipboardData?.setData("text/plain", plain);
    event.clipboardData?.setData("text/html", html);
  };
  doc.addEventListener("copy", onCopy);
  const container = doc.createElement("div");
  container.setAttribute("contenteditable", "true");
  container.textContent = plain;
  container.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;";
  root2.appendChild(container);
  const range = doc.createRange();
  range.selectNodeContents(container);
  const selection = doc.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  let ok = false;
  try {
    ok = doc.execCommand("copy");
  } catch {
    ok = false;
  }
  selection?.removeAllRanges();
  container.remove();
  doc.removeEventListener("copy", onCopy);
  return ok;
}

async function copyFormattedTextToClipboard(payload) {
  const { html } = payload;
  if (!html) return false;
  const plain = derivePlainFromClipboardHtml(html, document).trim();
  if (!plain) return false;
  // Clipboard API is unavailable in content scripts on insecure (http:) pages.
  if (globalThis.isSecureContext === false) {
    return copyFormattedTextLegacy(html, plain);
  }
  try {
    if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
      const items = {
        // Promise-wrapped blobs: required by older Firefox ClipboardItem implementations.
        "text/plain": Promise.resolve(new Blob([plain], { type: "text/plain" })),
        "text/html": Promise.resolve(new Blob([html], { type: "text/html" }))
      };
      await navigator.clipboard.write([new ClipboardItem(items)]);
      return true;
    }
  } catch {
  }
  return copyFormattedTextLegacy(html, plain);
}

export { copyFormattedTextLegacy, copyFormattedTextToClipboard };
