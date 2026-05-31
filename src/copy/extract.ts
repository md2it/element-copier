import {
  cloneElementForClipboard,
  prepareElementForCopy,
} from "../../../lib/src/copy/cleanup/index";
import {
  extractHtmlFromPreparedContainer,
  finalizeFormattedHtml,
  serializeFormattedTextCache,
} from "../../../lib/src/copy/formatted-text/index";
import { getCssSelector } from "../../../lib/src/copy/selector";
import { getJsPath } from "../../../lib/src/copy/js-path";
import { getElementComputedStyles } from "../../../lib/src/copy/styles-computed";
import { getElementStyles } from "../../../lib/src/copy/styles";
import { elementToMarkdown } from "../../../lib/src/copy/markdown/index";
import { getFullXPath, getXPath } from "../../../lib/src/copy/xpath";
import type { InlineImageMode } from "../../../lib/src/copy/cleanup/index";

function getDocumentBaseHref(element: Element): string {
  return element.ownerDocument.baseURI || element.ownerDocument.location?.href || "";
}

function getPrepareOptions(
  element: Element,
  inlineImages: InlineImageMode,
  pruneHiddenTableRows = false,
) {
  return {
    ...(pruneHiddenTableRows ? { pruneHiddenTableRows: true as const } : {}),
    baseHref: getDocumentBaseHref(element),
    inlineImages,
  };
}

function getFormattedTextHtml(element: Element, inlineImages: InlineImageMode): string {
  const container = prepareElementForCopy(
    element,
    getPrepareOptions(element, inlineImages, true),
  );
  const html = extractHtmlFromPreparedContainer(element, container);
  return finalizeFormattedHtml(element, html);
}

function getElementMarkdown(element: Element, inlineImages: InlineImageMode): string {
  const prepared = prepareElementForCopy(
    element,
    getPrepareOptions(element, inlineImages, true),
  );
  return elementToMarkdown(prepared);
}

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

export function extractElementCopyText(
  element: Element,
  format: string,
  inlineImages: InlineImageMode = "all",
): string {
  switch (format) {
    case "outerHTML":
    case "htmlFile":
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
      return serializeFormattedTextCache({
        html: getFormattedTextHtml(element, inlineImages),
      });
    case "markdown":
    case "markdownFile":
      return getElementMarkdown(element, inlineImages);
    case "url":
      return element.ownerDocument.location?.href || "";
    default:
      return "";
  }
}
