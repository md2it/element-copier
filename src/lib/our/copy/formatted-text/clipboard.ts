import { derivePlainFromClipboardHtml } from "./plain";
import type { FormattedText } from "./types";

function copyFormattedTextLegacy(html: string, plain: string): boolean {
  const doc = document;
  const root = doc.documentElement ?? doc.body;
  if (!root) return false;

  const onCopy = (event: ClipboardEvent): void => {
    event.preventDefault();
    event.clipboardData?.setData("text/plain", plain);
    event.clipboardData?.setData("text/html", html);
  };

  doc.addEventListener("copy", onCopy);

  const container = doc.createElement("div");
  container.setAttribute("contenteditable", "true");
  container.textContent = plain;
  container.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;";
  root.appendChild(container);

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

/** Write formatted text to the clipboard (text/html + derived text/plain). */
export async function copyFormattedTextToClipboard(payload: FormattedText): Promise<boolean> {
  const { html } = payload;
  if (!html) return false;

  const plain = derivePlainFromClipboardHtml(html, document).trim();
  if (!plain) return false;

  try {
    if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
      const items: Record<string, Blob> = {
        "text/plain": new Blob([plain], { type: "text/plain" }),
        "text/html": new Blob([html], { type: "text/html" }),
      };
      await navigator.clipboard.write([new ClipboardItem(items)]);
      return true;
    }
  } catch {
    /* fall through to legacy copy */
  }

  return copyFormattedTextLegacy(html, plain);
}
