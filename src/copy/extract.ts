import {
  cloneElementForClipboard,
  prepareElementForCopy,
} from "../lib/our/copy/cleanup/index";
import {
  extractHtmlFromPreparedContainer,
  finalizeFormattedHtml,
  serializeFormattedTextCache,
} from "../lib/our/copy/formatted-text/index";
import { getCssSelector } from "../lib/our/copy/selector";
import { getJsPath } from "../lib/our/copy/js-path";
import { getElementComputedStyles } from "../lib/our/copy/styles-computed";
import { getElementStyles } from "../lib/our/copy/styles";
import { elementToMarkdown } from "../lib/vendor/turndown/index";
import { getFullXPath, getXPath } from "../lib/our/copy/xpath";
import type { InlineImageMode } from "../lib/our/copy/cleanup/index";

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

async function getFormattedTextHtml(element: Element, inlineImages: InlineImageMode): Promise<string> {
  const container = await prepareElementForCopy(
    element,
    getPrepareOptions(element, inlineImages, true),
  );
  const html = extractHtmlFromPreparedContainer(element, container);
  return finalizeFormattedHtml(element, html);
}

async function getElementMarkdown(element: Element, inlineImages: InlineImageMode): Promise<string> {
  const prepared = await prepareElementForCopy(
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

export async function extractElementCopyText(
  element: Element,
  format: string,
  inlineImages: InlineImageMode = "all",
): Promise<string> {
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
        html: await getFormattedTextHtml(element, inlineImages),
      });
    case "markdown":
    case "markdownFile":
      return await getElementMarkdown(element, inlineImages);
    case "url":
      return element.ownerDocument.location?.href || "";
    default:
      return "";
  }
}
