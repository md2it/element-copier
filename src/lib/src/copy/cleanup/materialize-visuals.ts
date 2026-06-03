import { DEFAULT_IMAGE_ALT, sanitizeMarkdownAltText } from "../markdown/sanitize-alt";
import { resolveMaterializedImageSrc } from "./image-src";

export interface MaterializeVisualsOptions {
  /** Skip materializing inline (typically data:) src values when this returns false. */
  shouldMaterializeInlineSrc?: (src: string) => boolean;
}

function keepInlineSrc(src: string, shouldMaterializeInlineSrc?: (src: string) => boolean): boolean {
  return shouldMaterializeInlineSrc?.(src) ?? true;
}

const BACKGROUND_URL_RE = /url\(\s*(['"]?)(.*?)\1\s*\)/i;
const MAX_DECORATIVE_UI_SVG_PX = 48;
const SVG_RASTER_SIDE_CAP_PX = 256;

function visualAlt(element: Element): string {
  return (
    element.getAttribute("aria-label")?.trim()
    || element.getAttribute("title")?.trim()
    || element.querySelector(":scope > title")?.textContent?.trim()
    || element.getAttribute("alt")?.trim()
    || ""
  );
}

function resolveImgAlt(element: Element): string {
  return sanitizeMarkdownAltText(visualAlt(element) || DEFAULT_IMAGE_ALT);
}

function parseFirstBackgroundUrl(backgroundImage: string): string | null {
  if (!backgroundImage || backgroundImage === "none" || !backgroundImage.includes("url(")) {
    return null;
  }
  const match = backgroundImage.match(BACKGROUND_URL_RE);
  return match?.[2]?.trim() || null;
}

function parseSvgLength(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseViewBoxPair(svg: SVGElement): { width?: number; height?: number } {
  const raw = svg.getAttribute("viewBox")?.trim().split(/\s+/);
  if (!raw || raw.length < 4) return {};
  const width = Number.parseFloat(raw[2]);
  const height = Number.parseFloat(raw[3]);
  return {
    width: Number.isFinite(width) && width > 0 ? width : undefined,
    height: Number.isFinite(height) && height > 0 ? height : undefined,
  };
}

function parseCssLength(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  return parseSvgLength(value);
}

/** max(display size, viewBox) per axis — UI vs content classification. */
function svgEffectiveAxisSizes(svg: SVGElement): { width?: number; height?: number } {
  const viewBox = parseViewBoxPair(svg);
  let displayW: number | undefined;
  let displayH: number | undefined;
  const view = svg.ownerDocument.defaultView;
  if (view) {
    const rect = svg.getBoundingClientRect();
    if (rect.width > 0) displayW = rect.width;
    if (rect.height > 0) displayH = rect.height;
  }
  if (displayW == null) displayW = parseSvgLength(svg.getAttribute("width"));
  if (displayH == null) displayH = parseSvgLength(svg.getAttribute("height"));

  const width = Math.max(displayW ?? 0, viewBox.width ?? 0) || undefined;
  const height = Math.max(displayH ?? 0, viewBox.height ?? 0) || undefined;
  return { width, height };
}

function svgDisplayDimensions(svg: SVGElement): { width?: number; height?: number } {
  const view = svg.ownerDocument.defaultView;
  if (view) {
    const rect = svg.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const explicitWidth = parseSvgLength(svg.getAttribute("width"));
      const explicitHeight = parseSvgLength(svg.getAttribute("height"));
      const isSuspiciouslyLargeUiIcon =
        !explicitWidth
        && !explicitHeight
        && (rect.width > SVG_RASTER_SIDE_CAP_PX || rect.height > SVG_RASTER_SIDE_CAP_PX)
        && isDecorativeSvg(svg)
        && isUiDecorativeSvgContext(svg)
        && !isSvgPrimaryContentMedia(svg);
      if (isSuspiciouslyLargeUiIcon) {
        const side = Math.min(MAX_DECORATIVE_UI_SVG_PX, SVG_RASTER_SIDE_CAP_PX);
        return { width: side, height: side };
      }
      return { width: rect.width, height: rect.height };
    }

    const style = view.getComputedStyle(svg);
    const styleWidth = parseCssLength(style.width);
    const styleHeight = parseCssLength(style.height);
    if (styleWidth || styleHeight) {
      const attrWidth = parseSvgLength(svg.getAttribute("width"));
      const attrHeight = parseSvgLength(svg.getAttribute("height"));
      const width = styleWidth ?? attrWidth;
      const height = styleHeight ?? attrHeight;
      if (width && height) {
        return {
          width: Math.min(width, SVG_RASTER_SIDE_CAP_PX),
          height: Math.min(height, SVG_RASTER_SIDE_CAP_PX),
        };
      }
    }

    let ancestorWidth: number | undefined;
    let ancestorHeight: number | undefined;
    for (let ancestor = svg.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const ancestorRect = ancestor.getBoundingClientRect();
      if (!ancestorWidth && ancestorRect.width > 0) ancestorWidth = ancestorRect.width;
      if (!ancestorHeight && ancestorRect.height > 0) ancestorHeight = ancestorRect.height;
      if (ancestorWidth && ancestorHeight) break;
    }
    if (ancestorWidth || ancestorHeight) {
      const attrWidth = parseSvgLength(svg.getAttribute("width"));
      const attrHeight = parseSvgLength(svg.getAttribute("height"));
      const width = ancestorWidth ?? attrWidth;
      const height = ancestorHeight ?? attrHeight;
      if (width && height) {
        return {
          width: Math.min(width, SVG_RASTER_SIDE_CAP_PX),
          height: Math.min(height, SVG_RASTER_SIDE_CAP_PX),
        };
      }
    }

    const attrWidth = parseSvgLength(svg.getAttribute("width"));
    const attrHeight = parseSvgLength(svg.getAttribute("height"));
    if (attrWidth && attrHeight) {
      return {
        width: Math.min(attrWidth, SVG_RASTER_SIDE_CAP_PX),
        height: Math.min(attrHeight, SVG_RASTER_SIDE_CAP_PX),
      };
    }
  }

  const fallbackSide = 24;
  return { width: fallbackSide, height: fallbackSide };
}

function svgAccessibleName(svg: SVGElement): string {
  const labelledBy = svg.getAttribute("aria-labelledby")?.trim();
  if (labelledBy) {
    const doc = svg.ownerDocument;
    const name = labelledBy
      .split(/\s+/)
      .map((id) => doc.getElementById(id)?.textContent?.trim() ?? "")
      .filter(Boolean)
      .join(" ");
    if (name) return name;
  }
  return (
    svg.getAttribute("aria-label")?.trim()
    || svg.querySelector(":scope > title")?.textContent?.trim()
    || svg.textContent?.trim()
    || ""
  );
}

function hasAriaHiddenAncestor(svg: SVGElement): boolean {
  for (let el = svg.parentElement; el; el = el.parentElement) {
    if (el.getAttribute("aria-hidden") === "true") return true;
  }
  return false;
}

function isDecorativeSvg(svg: SVGElement): boolean {
  const ariaHidden =
    svg.getAttribute("aria-hidden") === "true" || hasAriaHiddenAncestor(svg);
  const role = svg.getAttribute("role")?.toLowerCase();
  if (!ariaHidden && role !== "presentation" && role !== "none") return false;
  return !svgAccessibleName(svg);
}

function findUiControl(svg: SVGElement): Element | null {
  let el: Element | null = svg;
  while (el) {
    const tag = el.tagName.toLowerCase();
    if (tag === "button" || tag === "a" || tag === "summary") return el;
    if (el.getAttribute("role")?.toLowerCase() === "button") return el;
    el = el.parentElement;
  }
  return null;
}

function hasMeaningfulContentOutsideSvg(control: Element, svg: SVGElement): boolean {
  for (const node of control.childNodes) {
    if (node === svg) continue;
    if (node instanceof Element && node.contains(svg)) continue;
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent?.trim()) return true;
      continue;
    }
    if (node instanceof Element) {
      if (node.tagName === "IMG" && node.getAttribute("alt")?.trim()) return true;
      if ((node.textContent ?? "").trim()) return true;
    }
  }
  return false;
}

function isUiDecorativeSvgContext(svg: SVGElement): boolean {
  const control = findUiControl(svg);
  if (!control) return false;
  const tag = control.tagName.toLowerCase();
  if (tag === "button") return true;
  if (control.getAttribute("role")?.toLowerCase() === "button") return true;
  if (tag === "summary") return true;
  if (tag === "a") return !hasMeaningfulContentOutsideSvg(control, svg);
  return false;
}

function isSmallDecorativeUiSvg(sourceSvg: SVGElement): boolean {
  const { width, height } = svgEffectiveAxisSizes(sourceSvg);
  if (width == null || height == null) return false;
  return width <= MAX_DECORATIVE_UI_SVG_PX && height <= MAX_DECORATIVE_UI_SVG_PX;
}

/** Large viewBox ⇒ content (e.g. logo at 24×24 display), not a UI chrome icon. */
function hasLargeContentViewBox(sourceSvg: SVGElement): boolean {
  const { width, height } = parseViewBoxPair(sourceSvg);
  return (width ?? 0) > MAX_DECORATIVE_UI_SVG_PX || (height ?? 0) > MAX_DECORATIVE_UI_SVG_PX;
}

/** Alt for rasterized SVG: parent control label for large-viewBox logos in icon-only links. */
function resolveSvgRasterAlt(sourceSvg: SVGElement): string {
  const direct = visualAlt(sourceSvg);
  if (direct) return sanitizeMarkdownAltText(direct);
  if (!isSmallDecorativeUiSvg(sourceSvg)) {
    const label = findUiControl(sourceSvg)?.getAttribute("aria-label")?.trim();
    if (label) return sanitizeMarkdownAltText(label);
  }
  return DEFAULT_IMAGE_ALT;
}

function isSvgPrimaryContentMedia(svg: SVGElement): boolean {
  for (let container = svg.parentElement; container; container = container.parentElement) {
    const tag = container.tagName.toLowerCase();
    if (tag !== "figure" && tag !== "picture" && tag !== "article") continue;
    if (tag === "figure" || tag === "picture") {
      const media = container.querySelectorAll("svg, img, picture, video");
      if (media.length === 1 && media[0] === svg) return true;
      if (svg.parentElement === container) return true;
    }
    if (tag === "article" && svg.parentElement === container) {
      const { width, height } = svgEffectiveAxisSizes(svg);
      if ((width ?? 0) > MAX_DECORATIVE_UI_SVG_PX || (height ?? 0) > MAX_DECORATIVE_UI_SVG_PX) {
        return true;
      }
    }
  }
  return false;
}

function shouldRemoveDecorativeUiSvg(sourceSvg: SVGElement): boolean {
  if (hasLargeContentViewBox(sourceSvg)) return false;
  if (!isDecorativeSvg(sourceSvg)) return false;
  if (!isUiDecorativeSvgContext(sourceSvg)) return false;
  if (!isSmallDecorativeUiSvg(sourceSvg)) return false;
  if (isSvgPrimaryContentMedia(sourceSvg)) return false;
  return true;
}

function isControlEmptyAfterSvgRemoval(control: Element): boolean {
  if (control.getAttribute("aria-label")?.trim()) return false;
  if (control.getAttribute("title")?.trim()) return false;
  for (const node of control.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent?.trim()) return false;
      continue;
    }
    if (node instanceof Element) return false;
  }
  return true;
}

function removeDecorativeUiSvg(sourceSvg: SVGElement, cloneSvg: SVGElement): void {
  if (!shouldRemoveDecorativeUiSvg(sourceSvg)) return;
  const control = findUiControl(cloneSvg);
  cloneSvg.remove();
  if (control?.parentNode && isControlEmptyAfterSvgRemoval(control)) {
    control.remove();
  }
}

function isSvgTagName(tagName: string): boolean {
  return tagName.toLowerCase() === "svg";
}

function applyImgDimensions(img: HTMLImageElement, width?: number, height?: number): void {
  if (width) img.setAttribute("width", String(Math.round(width)));
  if (height) img.setAttribute("height", String(Math.round(height)));
}

function resolveCurrentColorInSvgClone(sourceRoot: SVGElement, cloneRoot: SVGElement): void {
  const view = sourceRoot.ownerDocument.defaultView;
  if (!view) return;

  const sourceNodes = [sourceRoot, ...sourceRoot.querySelectorAll("*")];
  const cloneNodes = [cloneRoot, ...cloneRoot.querySelectorAll("*")];
  for (let i = 0; i < sourceNodes.length && i < cloneNodes.length; i++) {
    const src = sourceNodes[i];
    const dst = cloneNodes[i];
    if (!(dst instanceof SVGElement)) continue;
    for (const attr of ["fill", "stroke"] as const) {
      const rawAttr = dst.getAttribute(attr)?.trim();
      const rawStyle = dst.getAttribute("style") ?? "";
      const styleNeedsResolve = new RegExp(`${attr}\\s*:\\s*(?:currentcolor|var\\(--)`, "i").test(rawStyle);
      const needsResolve =
        styleNeedsResolve || (rawAttr ? /currentcolor/i.test(rawAttr) || /var\(--/i.test(rawAttr) : false);
      if (!needsResolve) continue;

      const style = view.getComputedStyle(src);
      const computedPaint = style.getPropertyValue(attr).trim();
      if (computedPaint && !/var\(--/i.test(computedPaint)) {
        dst.setAttribute(attr, computedPaint);
        continue;
      }

      if (rawAttr && /currentcolor/i.test(rawAttr)) {
        const color = style.color.trim();
        if (color) dst.setAttribute(attr, color);
      }
    }
  }
}

function prepareSvgCloneForRasterize(sourceSvg: SVGElement): SVGElement | null {
  const clone = sourceSvg.cloneNode(true) as SVGElement;
  if (!clone.getAttribute("xmlns")) {
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }
  resolveCurrentColorInSvgClone(sourceSvg, clone);
  const { width, height } = svgDisplayDimensions(sourceSvg);
  if (width && !clone.getAttribute("width")) clone.setAttribute("width", String(width));
  if (height && !clone.getAttribute("height")) clone.setAttribute("height", String(height));
  return clone;
}

/** Rasterize live SVG → data:image/png;base64,... (not data:image/svg+xml). */
async function rasterizeSvgToPngDataUrl(sourceSvg: SVGElement): Promise<string | null> {
  const doc = sourceSvg.ownerDocument;
  const view = doc.defaultView;
  if (!view) return null;

  const clone = prepareSvgCloneForRasterize(sourceSvg);
  if (!clone) return null;
  const serialized = new XMLSerializer().serializeToString(clone);
  if (!serialized) return null;

  const { width, height } = svgDisplayDimensions(sourceSvg);
  if (!width || !height) return null;

  const canvas = doc.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const mount = doc.body ?? doc.documentElement;
  if (!mount) return null;

  const img = doc.createElement("img");
  img.setAttribute("aria-hidden", "true");
  img.style.cssText =
    "position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none";
  mount.appendChild(img);

  const objectUrl = URL.createObjectURL(
    new Blob([serialized], { type: "image/svg+xml;charset=utf-8" }),
  );
  try {
    img.src = objectUrl;
    if (typeof img.decode === "function") {
      await img.decode();
    } else {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("svg raster load failed"));
      });
    }
    if (!img.naturalWidth || !img.naturalHeight) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");
    return dataUrl.startsWith("data:image/png") ? dataUrl : null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
    img.remove();
  }
}

function createImageElement(
  doc: Document,
  src: string,
  alt: string,
  width?: number,
  height?: number,
): HTMLImageElement {
  const img = doc.createElement("img");
  img.src = src;
  img.alt = alt;
  applyImgDimensions(img, width, height);
  return img;
}

async function svgElementToImg(
  sourceSvg: SVGElement,
  shouldMaterializeInlineSrc?: (src: string) => boolean,
): Promise<HTMLImageElement | null> {
  if (!keepInlineSrc("data:", shouldMaterializeInlineSrc)) return null;
  const dataUrl = await rasterizeSvgToPngDataUrl(sourceSvg);
  if (!dataUrl) return null;
  if (!keepInlineSrc(dataUrl, shouldMaterializeInlineSrc)) return null;
  const { width, height } = svgDisplayDimensions(sourceSvg);
  return createImageElement(sourceSvg.ownerDocument, dataUrl, resolveSvgRasterAlt(sourceSvg), width, height);
}

function prependBackgroundImage(
  source: Element,
  target: ParentNode,
  shouldMaterializeInlineSrc?: (src: string) => boolean,
): void {
  const view = source.ownerDocument.defaultView;
  if (!view) return;

  const url = parseFirstBackgroundUrl(view.getComputedStyle(source).backgroundImage);
  if (!url) return;

  const doc = source.ownerDocument;
  const src = resolveMaterializedImageSrc(url, doc);
  if (!src || !keepInlineSrc(src, shouldMaterializeInlineSrc)) return;

  const img = createImageElement(doc, src, resolveImgAlt(source));
  const first = target.firstChild;
  if (first) {
    target.insertBefore(img, first);
  } else {
    target.appendChild(img);
  }
}

/** Apply inline (data:/blob:) vs URL (absolute src) policy to existing <img> in the clone. */
function normalizeClonedImages(container: Element): void {
  const doc = container.ownerDocument;
  for (const img of Array.from(container.querySelectorAll("img[src]"))) {
    const raw = img.getAttribute("src");
    if (!raw) continue;
    const resolved = resolveMaterializedImageSrc(raw, doc);
    if (resolved) img.setAttribute("src", resolved);
  }
}

async function walkPairContents(
  sourceParent: Element,
  cloneParent: ParentNode,
  shouldMaterializeInlineSrc?: (src: string) => boolean,
): Promise<void> {
  let cloneCursor = cloneParent.firstChild;

  for (const sourceChild of Array.from(sourceParent.childNodes)) {
    if (sourceChild.nodeType === Node.TEXT_NODE) {
      while (cloneCursor?.nodeType === Node.TEXT_NODE) {
        cloneCursor = cloneCursor.nextSibling;
      }
      continue;
    }

    if (!(sourceChild instanceof Element)) continue;

    while (cloneCursor && cloneCursor.nodeType !== Node.ELEMENT_NODE) {
      cloneCursor = cloneCursor.nextSibling;
    }
    if (!(cloneCursor instanceof Element)) break;

    if (cloneCursor.tagName !== sourceChild.tagName) {
      cloneCursor = cloneCursor.nextSibling;
      continue;
    }

    if (isSvgTagName(sourceChild.tagName) && isSvgTagName(cloneCursor.tagName)) {
      const nextClone = cloneCursor.nextSibling;
      removeDecorativeUiSvg(sourceChild as SVGElement, cloneCursor as SVGElement);
      if (cloneCursor.isConnected) {
        const img = await svgElementToImg(sourceChild as SVGElement, shouldMaterializeInlineSrc);
        if (img) {
          cloneCursor.replaceWith(img);
        } else {
          await walkPairElement(sourceChild, cloneCursor, shouldMaterializeInlineSrc);
        }
      }
      cloneCursor = nextClone;
      continue;
    }

    await walkPairElement(sourceChild, cloneCursor, shouldMaterializeInlineSrc);
    cloneCursor = cloneCursor.nextSibling;
  }
}

async function walkPairElement(
  source: Element,
  clone: Element,
  shouldMaterializeInlineSrc?: (src: string) => boolean,
): Promise<void> {
  prependBackgroundImage(source, clone, shouldMaterializeInlineSrc);
  await walkPairContents(source, clone, shouldMaterializeInlineSrc);
}

async function replaceRemainingSvgElementsWithImages(
  container: Element,
  shouldMaterializeInlineSrc?: (src: string) => boolean,
): Promise<void> {
  for (const svg of Array.from(container.querySelectorAll("svg"))) {
    const img = await svgElementToImg(svg, shouldMaterializeInlineSrc);
    if (img) svg.replaceWith(img);
  }
}

/**
 * Visuals → <img> when {@link MaterializeVisualsOptions.shouldMaterializeInlineSrc} allows:
 * - content SVG → <img src="data:image/png;base64,...">
 * - URL images (background url, relative/http img src) → <img src="absolute-url">
 */
export async function materializeVisualsInContainer(
  sourceRoot: Element,
  container: Element,
  options?: MaterializeVisualsOptions,
): Promise<void> {
  const shouldMaterializeInlineSrc = options?.shouldMaterializeInlineSrc;
  prependBackgroundImage(sourceRoot, container, shouldMaterializeInlineSrc);

  const singleRoot =
    container.children.length === 1
    && container.firstElementChild?.tagName === sourceRoot.tagName
      ? container.firstElementChild
      : null;

  if (singleRoot) {
    await walkPairElement(sourceRoot, singleRoot, shouldMaterializeInlineSrc);
  } else {
    await walkPairContents(sourceRoot, container, shouldMaterializeInlineSrc);
  }

  await replaceRemainingSvgElementsWithImages(container, shouldMaterializeInlineSrc);
  normalizeClonedImages(container);
}
