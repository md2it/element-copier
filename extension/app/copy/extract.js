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

function formatAttributeValue(value) {
  return JSON.stringify(value);
}

function getQaAttributes(element) {
  return [...element.attributes]
    .filter(({ name }) => /^(?:name|role|type|aria-[\w-]+|data-[\w-]+)$/i.test(name))
    .map(({ name, value }) => `${name}=${formatAttributeValue(value)}`)
    .join("; ");
}

function toLocalIsoTimestamp(date = new Date()) {
  const pad = (number) => String(number).padStart(2, "0");
  const offsetMinutes = -date.getTimezoneOffset();
  const offsetSign = offsetMinutes >= 0 ? "+" : "-";
  const offsetHours = pad(Math.floor(Math.abs(offsetMinutes) / 60));
  const offsetRemainder = pad(Math.abs(offsetMinutes) % 60);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    + `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    + `${offsetSign}${offsetHours}:${offsetRemainder}`;
}

function getBrowserNameAndVersion(userAgent) {
  const matchers = [
    [/(?:Edg|EdgA|EdgiOS)\/(\d+)/, "Edge"],
    [/Firefox\/(\d+)/, "Firefox"],
    [/FxiOS\/(\d+)/, "Firefox"],
    [/OPR\/(\d+)/, "Opera"],
    [/Chrome\/(\d+)/, "Chrome"],
    [/CriOS\/(\d+)/, "Chrome"],
    [/Version\/(\d+).*Safari\//, "Safari"]
  ];
  for (const [pattern, name] of matchers) {
    const match = userAgent.match(pattern);
    if (match) return `${name} ${match[1]}`;
  }
  return "Unknown browser";
}

function getBrowserEngine(userAgent) {
  if (/(?:iPhone|iPad|iPod)/.test(userAgent)) return "WebKit";
  if (/Firefox\//.test(userAgent) || /FxiOS\//.test(userAgent)) return "Gecko";
  if (/Chrome\//.test(userAgent) || /CriOS\//.test(userAgent) || /Edg\//.test(userAgent) || /OPR\//.test(userAgent)) return "Blink";
  if (/AppleWebKit\//.test(userAgent)) return "WebKit";
  return "Unknown engine";
}

function getOperatingSystem(userAgent, platform = "") {
  const mac = userAgent.match(/Mac OS X ([\d_]+)/);
  if (mac) return `macOS ${mac[1].replaceAll("_", ".")}`;
  const windows = userAgent.match(/Windows NT ([\d.]+)/);
  if (windows) return `Windows ${windows[1]}`;
  const android = userAgent.match(/Android ([\d.]+)/);
  if (android) return `Android ${android[1]}`;
  const ios = userAgent.match(/(?:iPhone|CPU) OS ([\d_]+)/);
  if (ios) return `iOS ${ios[1].replaceAll("_", ".")}`;
  if (/Linux/.test(platform) || /Linux/.test(userAgent)) return "Linux";
  return platform || "Unknown OS";
}

function getQaEnvironment(element) {
  const view = element.ownerDocument.defaultView;
  const navigator2 = view?.navigator;
  const userAgent = navigator2?.userAgent || "";
  return [
    getBrowserNameAndVersion(userAgent),
    getBrowserEngine(userAgent),
    getOperatingSystem(userAgent, navigator2?.platform)
  ].join(" / ");
}

function getQaDetails(element) {
  const attributes = getQaAttributes(element) || "none";
  return [
    "THE ELEMENT:",
    `- Page: ${element.ownerDocument.location?.href || ""}`,
    `- Element: ${formatTagIdClassLabel(element)}`,
    `- Selector: ${getCssSelector(element)}`,
    `- Attributes: ${attributes}`,
    `- Timestamp: ${toLocalIsoTimestamp()}`,
    `- Environment: ${getQaEnvironment(element)}`
  ].join("\n");
}

async function extractElementCopyText(element, format, inlineImages = "all") {
  switch (format) {
    case "outerHTML":
    case "htmlFile":
      return getOuterHtml(element);
    case "tagIdClass":
      return formatTagIdClassLabel(element);
    case "qaDetails":
      return getQaDetails(element);
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

export { extractElementCopyText, getDocumentBaseHref, getElementMarkdown, getFormattedTextHtml, getOuterHtml, getPrepareOptions, getQaDetails };
