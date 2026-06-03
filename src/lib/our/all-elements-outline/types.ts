/** CSS color in `rgba(r, g, b, a)` form. */
export type AllElementsRgba = string;

export interface AllElementsOutlineConfig {
  /** Unique id for the injected <style> (per extension / feature). */
  styleId: string;
  rgba: AllElementsRgba;
  /** Outline width in px. Default 1. */
  widthPx?: number;
  /** Outline offset in px. Default -1. */
  offsetPx?: number;
  /** Outline style. Default solid. */
  outlineStyle?: "solid" | "dashed";
}
