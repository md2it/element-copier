import { tableElementToPlain } from "./tables.js";

var FRAGMENT_START = "<!--StartFragment-->";

var FRAGMENT_END = "<!--EndFragment-->";

var OFFSCREEN_MOUNT_STYLE = "position:fixed;left:-9999px;top:0;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;";

function extractClipboardHtmlFragment(html) {
  const start = html.indexOf(FRAGMENT_START);
  if (start < 0) return html;
  const contentStart = start + FRAGMENT_START.length;
  const end = html.indexOf(FRAGMENT_END, contentStart);
  if (end < 0) return html.slice(contentStart);
  return html.slice(contentStart, end);
}

function normalizeDerivedPlain(text) {
  return text.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function readPlainFromHtmlTree(root2, doc) {
  if (root2.isConnected) {
    return root2.innerText;
  }
  const mountParent = doc.body ?? doc.documentElement;
  if (!mountParent) {
    return root2.textContent ?? "";
  }
  root2.style.cssText = OFFSCREEN_MOUNT_STYLE;
  mountParent.appendChild(root2);
  try {
    return root2.innerText;
  } finally {
    root2.remove();
    root2.removeAttribute("style");
  }
}

function collectImgAltPlain(container) {
  const parts = [];
  for (const img of Array.from(container.querySelectorAll("img[alt]"))) {
    const alt = img.getAttribute("alt")?.trim();
    if (alt) parts.push(alt);
  }
  return parts.join("\n");
}

/** Parse clipboard/page HTML into a container in `doc` without assigning innerHTML. */
function clipboardHtmlToContainer(html, doc) {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const container = doc.createElement("div");
  for (const node of Array.from(parsed.body.childNodes)) {
    container.appendChild(doc.importNode(node, true));
  }
  return container;
}

function hasNonWhitespaceTextInClipboardHtml(html, doc) {
  const fragment = extractClipboardHtmlFragment(html).trim();
  if (!fragment) return false;
  const container = clipboardHtmlToContainer(fragment, doc);
  const walker = doc.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if ((node.textContent ?? "").trim()) return true;
    node = walker.nextNode();
  }
  if (container.querySelector("img[src]")) return true;
  return false;
}

function derivePlainFromClipboardHtml(html, doc) {
  const fragment = extractClipboardHtmlFragment(html).trim();
  if (!fragment) return "";
  const container = clipboardHtmlToContainer(fragment, doc);
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

export { FRAGMENT_END, FRAGMENT_START, OFFSCREEN_MOUNT_STYLE, collectImgAltPlain, derivePlainFromClipboardHtml, extractClipboardHtmlFragment, hasNonWhitespaceTextInClipboardHtml, normalizeDerivedPlain, readPlainFromHtmlTree };
