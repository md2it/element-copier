import type { AllElementsOutlineConfig } from "./types";

const DEFAULT_WIDTH_PX = 1;
const DEFAULT_OFFSET_PX = -1;

function assertRgba(value: string, label: string): void {
  const trimmed = value.trim();
  if (!/^rgba\s*\(/i.test(trimmed)) {
    throw new Error(`${label} must be an rgba(...) color, got: ${value}`);
  }
}

/** Outline on every element (`*`); does not touch DOM nodes. */
export function buildAllElementsOutlineCss(
  config: AllElementsOutlineConfig,
): string {
  assertRgba(config.rgba, "rgba");
  const width = config.widthPx ?? DEFAULT_WIDTH_PX;
  const offset = config.offsetPx ?? DEFAULT_OFFSET_PX;
  const outlineStyle = config.outlineStyle ?? "solid";
  const color = config.rgba.trim();

  return `
* {
  outline-width: ${width}px !important;
  outline-style: ${outlineStyle} !important;
  outline-color: ${color} !important;
  outline-offset: ${offset}px !important;
}
`.trim();
}
