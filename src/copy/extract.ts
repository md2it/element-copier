import { cloneElementForClipboard } from "../../../lib/src/copy/formatted-text/clone";
import {
  getFormattedText,
  serializeFormattedTextCache,
} from "../../../lib/src/copy/formatted-text/index";
import { getCssSelector } from "../../../lib/src/copy/selector";
import { getJsPath } from "../../../lib/src/copy/js-path";
import { getElementComputedStyles } from "../../../lib/src/copy/styles-computed";
import { getElementStyles } from "../../../lib/src/copy/styles";
import { getFullXPath, getXPath } from "../../../lib/src/copy/xpath";

export function getOuterHtml(element: Element): string {
  if (!element.shadowRoot) {
    return element.outerHTML;
  }

  const clone = element.cloneNode(false) as Element;
  const contents = cloneElementForClipboard(element);
  while (contents.firstChild) {
    clone.appendChild(contents.firstChild);
  }

  const wrapper = element.ownerDocument.createElement("div");
  wrapper.appendChild(clone);
  return wrapper.innerHTML;
}

export function extractElementCopyText(element: Element, format: string): string {
  switch (format) {
    case "outerHTML":
      return getOuterHtml(element);
    case "selector":
      return getCssSelector(element);
    case "jsPath":
      return getJsPath(element);
    case "computedStyles":
      return getElementComputedStyles(element);
    case "styles":
      return getElementStyles(element);
    case "xpath":
      return getXPath(element);
    case "fullXPath":
      return getFullXPath(element);
    case "text":
      return serializeFormattedTextCache(getFormattedText(element));
    default:
      return "";
  }
}
