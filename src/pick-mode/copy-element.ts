/** Plain text for clipboard until format settings exist (SPEC: raw/text later). */
export function getElementCopyText(element: Element): string {
  const text = (element.textContent ?? "").trim();
  if (text.length > 0) return text;
  return element.outerHTML;
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

export async function copyElementToClipboard(element: Element): Promise<boolean> {
  return copyTextToClipboard(getElementCopyText(element));
}
