import { getElementAccessiblePlain } from "./accessible-text";
import { wrapClipboardHtml } from "./html-wrap";
import { enhanceInlineLists } from "./lists";
import { enhanceClipboardTables } from "./tables";

function buildPlainTextClipboardHtml(doc: Document, plain: string): string {
  const wrapper = doc.createElement("div");
  wrapper.style.whiteSpace = "pre-wrap";
  wrapper.textContent = plain;
  return wrapClipboardHtml(wrapper.outerHTML);
}

export function extractHtmlFromPreparedContainer(element: Element, container: Element): string {
  enhanceInlineLists(element, container);
  enhanceClipboardTables(container);
  return wrapClipboardHtml(container.innerHTML.trim());
}

/** Ensure non-empty html for cache (accessible fallback when fragment is empty). */
export function finalizeFormattedHtml(element: Element, html: string): string {
  const resultHtml = html.trim();
  if (resultHtml) return resultHtml;

  const plain = getElementAccessiblePlain(element);
  if (!plain) return "";

  return buildPlainTextClipboardHtml(element.ownerDocument, plain);
}
