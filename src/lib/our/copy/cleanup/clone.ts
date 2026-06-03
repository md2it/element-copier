import { LIST_TAGS, OMIT_TAGS } from "./constants";

function isDomLeafElement(element: Element): boolean {
  return element.childNodes.length === 0;
}

function cloneChildNodesForClipboard(parent: ParentNode): DocumentFragment {
  const doc = parent.ownerDocument ?? document;
  const fragment = doc.createDocumentFragment();
  for (const child of parent.childNodes) {
    fragment.appendChild(cloneNodeForClipboard(child));
  }
  return fragment;
}

function cloneNodeForClipboard(node: Node): Node {
  if (!(node instanceof Element)) {
    return node.cloneNode(true);
  }

  if (OMIT_TAGS.has(node.tagName)) {
    return node.ownerDocument.createDocumentFragment();
  }

  if (node.shadowRoot) {
    const clone = node.cloneNode(false);
    clone.appendChild(cloneChildNodesForClipboard(node));
    clone.appendChild(cloneChildNodesForClipboard(node.shadowRoot));
    return clone;
  }

  const clone = node.cloneNode(false);
  for (const child of node.childNodes) {
    clone.appendChild(cloneNodeForClipboard(child));
  }
  return clone;
}

function cloneShadowAwareContents(element: Element): DocumentFragment {
  const doc = element.ownerDocument;
  const fragment = doc.createDocumentFragment();
  fragment.appendChild(cloneChildNodesForClipboard(element));
  fragment.appendChild(cloneChildNodesForClipboard(element.shadowRoot!));
  return fragment;
}

export function cloneElementForClipboard(element: Element): Node {
  // selectNodeContents(<table>) clones only caption/thead/tbody — paste targets lose table semantics.
  // selectNodeContents(<ul>/<ol>) clones only <li> nodes — paste targets lose list semantics.
  if (element.tagName === "TABLE" || LIST_TAGS.has(element.tagName)) {
    return cloneNodeForClipboard(element);
  }

  if (element.shadowRoot) {
    return cloneShadowAwareContents(element);
  }

  // DOM leaves (<img>, <br>, empty void nodes) — copy the element itself, not its contents.
  if (isDomLeafElement(element) && !OMIT_TAGS.has(element.tagName)) {
    return cloneNodeForClipboard(element);
  }

  return cloneChildNodesForClipboard(element);
}
