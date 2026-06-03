import { tableElementToPlain } from "./tables";

const FRAGMENT_START = "<!--StartFragment-->";
const FRAGMENT_END = "<!--EndFragment-->";

const OFFSCREEN_MOUNT_STYLE =
  "position:fixed;left:-9999px;top:0;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;";

export function extractClipboardHtmlFragment(html: string): string {
  const start = html.indexOf(FRAGMENT_START);
  if (start < 0) return html;

  const contentStart = start + FRAGMENT_START.length;
  const end = html.indexOf(FRAGMENT_END, contentStart);
  if (end < 0) return html.slice(contentStart);

  return html.slice(contentStart, end);
}

function normalizeDerivedPlain(text: string): string {
  return text.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** innerText needs layout; a detached fragment has no block line breaks. */
function readPlainFromHtmlTree(root: HTMLElement, doc: Document): string {
  if (root.isConnected) {
    return root.innerText;
  }

  const mountParent = doc.body ?? doc.documentElement;
  if (!mountParent) {
    return root.textContent ?? "";
  }

  root.style.cssText = OFFSCREEN_MOUNT_STYLE;
  mountParent.appendChild(root);
  try {
    return root.innerText;
  } finally {
    root.remove();
    root.removeAttribute("style");
  }
}

function collectImgAltPlain(container: HTMLElement): string {
  const parts: string[] = [];
  for (const img of Array.from(container.querySelectorAll("img[alt]"))) {
    const alt = img.getAttribute("alt")?.trim();
    if (alt) parts.push(alt);
  }
  return parts.join("\n");
}

/** True when clipboard HTML fragment contains copyable text or materialized images. */
export function hasNonWhitespaceTextInClipboardHtml(html: string, doc: Document): boolean {
  const fragment = extractClipboardHtmlFragment(html).trim();
  if (!fragment) return false;

  const container = doc.createElement("div");
  container.innerHTML = fragment;

  const walker = doc.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if ((node.textContent ?? "").trim()) return true;
    node = walker.nextNode();
  }

  if (container.querySelector("img[src]")) return true;
  return false;
}

/** Derive text/plain from cached text/html (single source of truth). */
export function derivePlainFromClipboardHtml(html: string, doc: Document): string {
  const fragment = extractClipboardHtmlFragment(html).trim();
  if (!fragment) return "";

  const container = doc.createElement("div");
  container.innerHTML = fragment;

  const table = container.querySelector(":scope > table");
  if (table && container.children.length === 1) {
    const tsv = tableElementToPlain(table);
    if (tsv) return tsv;
  }

  const plain = readPlainFromHtmlTree(container, doc);
  if (plain.trim()) return normalizeDerivedPlain(plain);

  const fromAlts = collectImgAltPlain(container);
  if (fromAlts.trim()) return normalizeDerivedPlain(fromAlts);

  return "";
}
