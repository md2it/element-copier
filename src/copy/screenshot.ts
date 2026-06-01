import { isDerivativeFormatNoiseNode } from "../../../lib/src/copy/cleanup/sanitize";
import { domToCanvas, type Options } from "modern-screenshot";
import type { CopyFormatId } from "../formats/definitions";

export type ImageCopyFormatId = Extract<CopyFormatId, "png" | "jpeg">;

const IMAGE_FORMATS = new Set<CopyFormatId>(["png", "jpeg"]);
const TRANSPARENT_CANVAS_FALLBACK = "rgba(0, 0, 0, 0)";

/**
 * Transparent 1x1 PNG. modern-screenshot returns this for resources it cannot
 * fetch (e.g. cross-origin images without CORS), so a failed embed degrades to
 * a blank pixel instead of rejecting with an uncaught "Failed to fetch".
 *
 * The library applies this by default, but passing a partial `fetch` option
 * clobbers its `fetch` defaults via its `...options` spread, so we must set it
 * explicitly to keep the safe behaviour.
 */
const FETCH_PLACEHOLDER_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

type ScreenshotBackground = {
  color: string | null;
  background: string | null;
  backgroundImage: string | null;
};

export type ScreenshotBackgroundSnapshot = readonly ScreenshotBackground[];

function cssAlphaIsZero(alpha: string): boolean {
  const value = alpha.trim();
  if (value.endsWith("%")) {
    return Number.parseFloat(value) === 0;
  }
  return Number.parseFloat(value) === 0;
}

function isTransparentBackground(color: string): boolean {
  const normalized = color.trim().toLowerCase();
  if (!normalized || normalized === "transparent") return true;

  const slashAlpha = normalized.match(/\/\s*([^)]+)\)$/);
  if (slashAlpha) {
    return cssAlphaIsZero(slashAlpha[1]);
  }

  const rgbaAlpha = normalized.match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([^)]+)\)$/);
  return rgbaAlpha ? cssAlphaIsZero(rgbaAlpha[1]) : false;
}

function isEmptyBackgroundImage(backgroundImage: string): boolean {
  const normalized = backgroundImage.trim().toLowerCase();
  return !normalized || normalized === "none";
}

function getComputedStyleSnapshotProperty(
  computedStyles: string,
  property: string,
): string {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`(?:^|\\n)${escaped}:\\s*([^;]+);`, "i").exec(computedStyles);
  return match?.[1]?.trim() ?? "";
}

function getBackgroundFromComputedStyleSnapshot(
  computedStyles: string | undefined,
): ScreenshotBackground | null {
  if (!computedStyles) return null;

  const backgroundColor = getComputedStyleSnapshotProperty(
    computedStyles,
    "background-color",
  );
  const backgroundImage = getComputedStyleSnapshotProperty(
    computedStyles,
    "background-image",
  );
  const background = getComputedStyleSnapshotProperty(computedStyles, "background");
  const color = isTransparentBackground(backgroundColor) ? null : backgroundColor;
  const visibleBackgroundImage = isEmptyBackgroundImage(backgroundImage)
    ? null
    : backgroundImage;
  const visibleBackground = visibleBackgroundImage ? background || null : null;

  if (!color && !visibleBackground && !visibleBackgroundImage) return null;
  return { color, background: visibleBackground, backgroundImage: visibleBackgroundImage };
}

function getParentElement(element: Element): Element | null {
  if (element.parentElement) return element.parentElement;
  const root = element.getRootNode();
  return root instanceof ShadowRoot ? root.host : null;
}

function getElementBackground(element: Element): ScreenshotBackground | null {
  const view = element.ownerDocument.defaultView;
  if (!view) return null;

  const styles = view.getComputedStyle(element);
  const color = isTransparentBackground(styles.backgroundColor)
    ? null
    : styles.backgroundColor;
  const background = isEmptyBackgroundImage(styles.backgroundImage)
    ? null
    : styles.background;
  const backgroundImage = isEmptyBackgroundImage(styles.backgroundImage)
    ? null
    : styles.backgroundImage;

  if (!color && !background && !backgroundImage) return null;
  return { color, background, backgroundImage };
}

export function createScreenshotBackgroundSnapshot(
  element: Element,
  computedStylesSnapshot?: string,
): ScreenshotBackgroundSnapshot {
  const backgrounds: ScreenshotBackground[] = [];
  const targetBackground = getBackgroundFromComputedStyleSnapshot(computedStylesSnapshot);
  if (targetBackground) {
    backgrounds.push(targetBackground);
  }

  let current: Element | null = element;
  while (current) {
    const background = getElementBackground(current);
    if (background) backgrounds.push(background);
    current = getParentElement(current);
  }

  const { body, documentElement } = element.ownerDocument;
  for (const fallbackElement of [body, documentElement]) {
    if (!fallbackElement) continue;
    const background = getElementBackground(fallbackElement);
    if (background) backgrounds.push(background);
  }

  return backgrounds;
}

function getEffectiveBackground(
  element: Element,
  backgroundSnapshot?: ScreenshotBackgroundSnapshot,
): ScreenshotBackground {
  for (const background of backgroundSnapshot ?? []) {
    if (background.color || background.background || background.backgroundImage) {
      return background;
    }
  }

  let current: Element | null = element;
  while (current) {
    const background = getElementBackground(current);
    if (background) return background;
    current = getParentElement(current);
  }

  const { body, documentElement } = element.ownerDocument;
  for (const fallbackElement of [body, documentElement]) {
    if (!fallbackElement) continue;
    const background = getElementBackground(fallbackElement);
    if (background) return background;
  }

  return { color: null, background: null, backgroundImage: null };
}

function resolveJpegCompositeFillColor(
  backgroundSnapshot?: ScreenshotBackgroundSnapshot,
): string | null {
  for (const background of backgroundSnapshot ?? []) {
    if (background.color) return background.color;
    if (background.background || background.backgroundImage) {
      // Background is already materialized into the rendered canvas; avoid
      // forcing white and keep NOTE semantics for non-color backgrounds.
      return null;
    }
  }
  return "#ffffff";
}

function getRenderOptions(
  element: Element,
  backgroundSnapshot?: ScreenshotBackgroundSnapshot,
): Options {
  const background = getEffectiveBackground(element, backgroundSnapshot);
  const style: Partial<CSSStyleDeclaration> = {};
  if (background.background) {
    style.background = background.background;
  }
  if (background.backgroundImage) {
    style.backgroundImage = background.backgroundImage;
  }
  if (background.background || background.backgroundImage) {
    style.backgroundColor = background.color ?? TRANSPARENT_CANVAS_FALLBACK;
  }

  return {
    backgroundColor: background.color,
    fetch: {
      requestInit: { cache: "force-cache" },
      placeholderImage: FETCH_PLACEHOLDER_IMAGE,
    },
    filter: (node) => !isDerivativeFormatNoiseNode(node),
    style: Object.keys(style).length > 0 ? style : null,
  };
}

export function isImageCopyFormat(formatId: CopyFormatId): formatId is ImageCopyFormatId {
  return IMAGE_FORMATS.has(formatId);
}

function createCanvasFromSource(source: HTMLCanvasElement): HTMLCanvasElement {
  const doc = source.ownerDocument;
  const canvas = doc.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  return canvas;
}

function encodePng(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/png");
}

function encodeJpeg(
  renderedCanvas: HTMLCanvasElement,
  backgroundSnapshot?: ScreenshotBackgroundSnapshot,
): string {
  const jpegCanvas = createCanvasFromSource(renderedCanvas);
  const context = jpegCanvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to get 2d context for JPEG composition");
  }
  const fillColor = resolveJpegCompositeFillColor(backgroundSnapshot);
  if (fillColor) {
    context.fillStyle = fillColor;
    context.fillRect(0, 0, jpegCanvas.width, jpegCanvas.height);
  }
  context.drawImage(renderedCanvas, 0, 0);
  return jpegCanvas.toDataURL("image/jpeg", 0.92);
}

export async function captureElementImages(
  element: Element,
  formats: readonly ImageCopyFormatId[],
  backgroundSnapshot?: ScreenshotBackgroundSnapshot,
): Promise<Partial<Record<ImageCopyFormatId, string>>> {
  const requested = new Set(formats);
  if (requested.size === 0) return {};

  const renderedCanvas = await domToCanvas(
    element,
    getRenderOptions(element, backgroundSnapshot),
  );
  const result: Partial<Record<ImageCopyFormatId, string>> = {};

  if (requested.has("png")) {
    result.png = encodePng(renderedCanvas);
  }
  if (requested.has("jpeg")) {
    result.jpeg = encodeJpeg(renderedCanvas, backgroundSnapshot);
  }
  return result;
}

export async function captureElementImage(
  element: Element,
  formatId: ImageCopyFormatId,
  backgroundSnapshot?: ScreenshotBackgroundSnapshot,
): Promise<string> {
  const images = await captureElementImages(element, [formatId], backgroundSnapshot);
  const image = images[formatId];
  if (!image) {
    throw new Error(`Failed to capture image format: ${formatId}`);
  }
  return image;
}
