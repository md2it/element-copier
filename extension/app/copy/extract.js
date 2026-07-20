import { cloneElementForClipboard } from "../../lib/our/copy/cleanup/clone.js";
import { elementToMarkdown } from "../../lib/vendor/turndown/turndown.js";
import { extractHtmlFromPreparedContainer, finalizeFormattedHtml } from "../../lib/our/copy/formatted-text/extract.js";
import { getCssSelector } from "../../lib/our/copy/selector.js";
import { getElementComputedStyles } from "../../lib/our/copy/styles-computed.js";
import { getElementStyles } from "../../lib/our/copy/styles.js";
import { getFullXPath, getXPath } from "../../lib/our/copy/xpath.js";
import { getJsPath } from "../../lib/our/copy/js-path.js";
import { formatTagIdClassLabel } from "../pick-mode/element-label.js";
import { prepareElementForCopy } from "../../lib/our/copy/cleanup/index.js";
import { serializeFormattedTextCache } from "../../lib/our/copy/formatted-text/cache.js";

function getDocumentBaseHref(element) {
  return element.ownerDocument.baseURI || element.ownerDocument.location?.href || "";
}

function getPrepareOptions(element, inlineImages, pruneHiddenTableRows = false) {
  return {
    ...pruneHiddenTableRows ? { pruneHiddenTableRows: true } : {},
    baseHref: getDocumentBaseHref(element),
    inlineImages
  };
}

async function getFormattedTextHtml(element, inlineImages) {
  const container = await prepareElementForCopy(
    element,
    getPrepareOptions(element, inlineImages, true)
  );
  const html = extractHtmlFromPreparedContainer(element, container);
  return finalizeFormattedHtml(element, html);
}

async function getElementMarkdown(element, inlineImages) {
  const prepared = await prepareElementForCopy(
    element,
    getPrepareOptions(element, inlineImages, true)
  );
  return elementToMarkdown(prepared);
}

function getOuterHtml(element) {
  if (!element.shadowRoot) {
    return element.outerHTML;
  }
  const clone = element.cloneNode(false);
  const contents = cloneElementForClipboard(element);
  while (contents.firstChild) {
    clone.appendChild(contents.firstChild);
  }
  const wrapper = element.ownerDocument.createElement("div");
  wrapper.appendChild(clone);
  return wrapper.innerHTML;
}

async function extractElementCopyText(element, format, inlineImages = "all") {
  switch (format) {
    case "outerHTML":
    case "htmlFile":
      return getOuterHtml(element);
    case "tagIdClass":
      return formatTagIdClassLabel(element);
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
        html: await getFormattedTextHtml(element, inlineImages)
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

export { extractElementCopyText, getDocumentBaseHref, getElementMarkdown, getFormattedTextHtml, getOuterHtml, getPrepareOptions };
