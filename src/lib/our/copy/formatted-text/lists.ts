import { INLINE_LIST_SEPARATOR, LIST_TAGS } from "./constants";
import { isInlineLikeDisplay } from "./style-utils";

export function collectListsInDocumentOrder(root: Element): Element[] {
  const lists: Element[] = [];
  if (LIST_TAGS.has(root.tagName)) {
    lists.push(root);
  }
  lists.push(...root.querySelectorAll("ul, ol"));
  return lists;
}

function isInlineLikeList(list: Element, boundary: Element): boolean {
  if (isInlineLikeDisplay(getComputedStyle(list).display)) {
    return true;
  }

  for (let parent = list.parentElement; parent && parent !== boundary; parent = parent.parentElement) {
    if (isInlineLikeDisplay(getComputedStyle(parent).display)) {
      return true;
    }
  }

  const firstItem = list.querySelector(":scope > li");
  if (firstItem && getComputedStyle(firstItem).display !== "list-item") {
    return true;
  }

  return false;
}

/** Replace ul/ol with inline spans so paste targets treat content as a text line. */
function flattenInlineList(list: Element): void {
  const doc = list.ownerDocument;
  const items = [...list.querySelectorAll(":scope > li")];
  const span = doc.createElement("span");

  for (let i = 0; i < items.length; i++) {
    if (i > 0) {
      span.appendChild(doc.createTextNode(INLINE_LIST_SEPARATOR));
    }
    const item = items[i];
    while (item.firstChild) {
      span.appendChild(item.firstChild);
    }
  }

  list.replaceWith(span);
}

export function enhanceInlineLists(originalRoot: Element, clonedRoot: Element): void {
  const originalLists = collectListsInDocumentOrder(originalRoot);
  const clonedLists = collectListsInDocumentOrder(clonedRoot);
  const count = Math.min(originalLists.length, clonedLists.length);

  for (let i = count - 1; i >= 0; i--) {
    if (isInlineLikeList(originalLists[i], originalRoot)) {
      flattenInlineList(clonedLists[i]);
    }
  }
}
