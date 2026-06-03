const PRESERVE_WHITESPACE_TAGS = new Set(["PRE", "CODE", "TEXTAREA"]);

function isInsidePreserveWhitespaceElement(node: Text): boolean {
  let el = node.parentElement;
  while (el) {
    if (PRESERVE_WHITESPACE_TAGS.has(el.tagName)) return true;
    el = el.parentElement;
  }
  return false;
}

/** Collapse runs of whitespace in text nodes so inline markup (e.g. links) turndowns cleanly. */
export function normalizeClipboardWhitespace(root: Element): void {
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const text = node as Text;
    if (!isInsidePreserveWhitespaceElement(text) && text.nodeValue) {
      text.nodeValue = text.nodeValue.replace(/\s+/g, " ");
    }
    node = walker.nextNode();
  }
}
