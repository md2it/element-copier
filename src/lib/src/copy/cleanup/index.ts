import { cloneElementForClipboard } from "./clone";
import {
  applyInlineImagePolicy,
  shouldMaterializeInlineDataUrl,
  type InlineImageMode,
} from "./inline-images";
import { materializeVisualsInContainer } from "./materialize-visuals";
import { absolutizeClipboardLinks, normalizeClipboardLinks } from "./links";
import {
  pruneHiddenEmptyTableRows,
  removeNoscriptAndComments,
  sanitizeClipboardHtml,
} from "./sanitize";
import { normalizeClipboardWhitespace } from "./whitespace";

export { cloneElementForClipboard } from "./clone";
export {
  isInlineImageSrc,
  resolveMaterializedImageSrc,
} from "./image-src";
export { materializeVisualsInContainer, type MaterializeVisualsOptions } from "./materialize-visuals";
export {
  applyInlineImagePolicy,
  shouldMaterializeInlineDataUrl,
  type InlineImageMode,
} from "./inline-images";
export { absolutizeClipboardLinks, hrefToDomainShorthand, normalizeClipboardLinks } from "./links";
export {
  isDerivativeFormatNoiseNode,
  pruneHiddenEmptyTableRows,
  removeNoscriptAndComments,
  sanitizeClipboardHtml,
} from "./sanitize";
export { normalizeClipboardWhitespace } from "./whitespace";

export interface PrepareElementOptions {
  pruneHiddenTableRows?: boolean;
  /** Document base URL for resolving relative href/src attributes. */
  baseHref?: string;
  /** Inline (data:) image handling; defaults to "all" (keep everything). */
  inlineImages?: InlineImageMode;
}

/** Clone element into a container, sanitize, and optionally prune hidden table rows. */
export async function prepareElementForCopy(
  element: Element,
  options?: PrepareElementOptions,
): Promise<HTMLDivElement> {
  const doc = element.ownerDocument;
  const container = doc.createElement("div");
  container.appendChild(cloneElementForClipboard(element));
  removeNoscriptAndComments(container);
  const inlineImages = options?.inlineImages ?? "all";
  applyInlineImagePolicy(container, inlineImages);
  await materializeVisualsInContainer(element, container, {
    ...(inlineImages === "all"
      ? {}
      : { shouldMaterializeInlineSrc: (src) => shouldMaterializeInlineDataUrl(src, inlineImages) }),
  });
  sanitizeClipboardHtml(container);
  applyInlineImagePolicy(container, inlineImages);
  normalizeClipboardWhitespace(container);
  if (options?.baseHref) {
    absolutizeClipboardLinks(container, options.baseHref);
  }
  normalizeClipboardLinks(container, options?.baseHref);
  if (options?.pruneHiddenTableRows) {
    pruneHiddenEmptyTableRows(container);
  }
  return container;
}
