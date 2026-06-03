import { OMIT_TAGS } from "./constants";

/** Nodes stripped before Text, Markdown, Image (PNG/JPEG), not DevTools formats. */
export function isDerivativeFormatNoiseNode(node: Node): boolean {
  if (node.nodeType === Node.COMMENT_NODE) return true;
  return node instanceof Element && node.tagName === "NOSCRIPT";
}

/** Remove `<noscript>` and HTML comments before derivative copy/download formats. */
export function removeNoscriptAndComments(root: ParentNode): void {
  const ownerDocument = root.ownerDocument;
  if (!ownerDocument) return;

  const walker = ownerDocument.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT,
  );
  const toRemove: Node[] = [];
  let node = walker.nextNode();
  while (node) {
    if (isDerivativeFormatNoiseNode(node)) {
      toRemove.push(node);
    }
    node = walker.nextNode();
  }
  for (const node of toRemove) {
    node.parentNode?.removeChild(node);
  }
}

export function sanitizeClipboardHtml(root: Element): void {
  const doc = root.ownerDocument;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  const toRemove: Element[] = [];

  let node = walker.currentNode as Element | null;
  while (node) {
    if (OMIT_TAGS.has(node.tagName) || node.tagName === "SVG") {
      toRemove.push(node);
    } else {
      for (const attr of [...node.attributes]) {
        const name = attr.name.toLowerCase();
        if (name.startsWith("on") || name === "contenteditable") {
          node.removeAttribute(attr.name);
        }
      }
    }
    node = walker.nextNode() as Element | null;
  }

  for (const el of toRemove) {
    el.remove();
  }
}

export function pruneHiddenEmptyTableRows(root: Element): void {
  for (const row of root.querySelectorAll("tr")) {
    const style = row.getAttribute("style") ?? "";
    if (!/display\s*:\s*none/i.test(style)) continue;
    if ((row.textContent ?? "").trim()) continue;
    row.remove();
  }
}
