import type { AllElementsFillConfig } from "./types";

/** Fixed 12 depth levels, 5-color cycle — deterministic fill overlay.
 *  Hue 150–250 (cyan–blue), S=H/3%, L=50%, alpha=0.18; avoids clash with element highlight red (#b91c1c, H≈0°).
 *
 *  Text color `#e0e0e0` on depth-1 `*` only — inherited by all nested depths (no per-depth color rules).
 *
 *  Nested semi-transparent backgrounds used to stack (child over parent content-box) and muddy hues.
 *  Per depth: full fill on leaves (`:not` implied — no element children); parents (`:has(> *)`) use the same
 *  color with `background-clip: padding-box` so tint stays in padding, not under descendants. */
export const ALL_ELEMENTS_FILL_CSS = `* { background-color: hsl(150 50% 50% / 0.18) !important; color: #012292 !important; }
*:has(> *) { background-color: hsl(150 50% 50% / 0.18) !important; background-clip: padding-box !important; }
* * { background-color: hsl(175 58.33% 50% / 0.18) !important; }
* *:has(> *) { background-color: hsl(175 58.33% 50% / 0.18) !important; background-clip: padding-box !important; }
* * * { background-color: hsl(200 66.67% 50% / 0.18) !important; }
* * *:has(> *) { background-color: hsl(200 66.67% 50% / 0.18) !important; background-clip: padding-box !important; }
* * * * { background-color: hsl(225 75% 50% / 0.18) !important; }
* * * *:has(> *) { background-color: hsl(225 75% 50% / 0.18) !important; background-clip: padding-box !important; }
* * * * * { background-color: hsl(250 83.33% 50% / 0.18) !important; }
* * * * *:has(> *) { background-color: hsl(250 83.33% 50% / 0.18) !important; background-clip: padding-box !important; }
* * * * * * { background-color: hsl(150 50% 50% / 0.18) !important; }
* * * * * *:has(> *) { background-color: hsl(150 50% 50% / 0.18) !important; background-clip: padding-box !important; }
* * * * * * * { background-color: hsl(175 58.33% 50% / 0.18) !important; }
* * * * * * *:has(> *) { background-color: hsl(175 58.33% 50% / 0.18) !important; background-clip: padding-box !important; }
* * * * * * * * { background-color: hsl(200 66.67% 50% / 0.18) !important; }
* * * * * * * *:has(> *) { background-color: hsl(200 66.67% 50% / 0.18) !important; background-clip: padding-box !important; }
* * * * * * * * * { background-color: hsl(225 75% 50% / 0.18) !important; }
* * * * * * * * *:has(> *) { background-color: hsl(225 75% 50% / 0.18) !important; background-clip: padding-box !important; }
* * * * * * * * * * { background-color: hsl(250 83.33% 50% / 0.18) !important; }
* * * * * * * * * *:has(> *) { background-color: hsl(250 83.33% 50% / 0.18) !important; background-clip: padding-box !important; }
* * * * * * * * * * * { background-color: hsl(150 50% 50% / 0.18) !important; }
* * * * * * * * * * *:has(> *) { background-color: hsl(150 50% 50% / 0.18) !important; background-clip: padding-box !important; }
* * * * * * * * * * * * { background-color: hsl(175 58.33% 50% / 0.18) !important; }
* * * * * * * * * * * *:has(> *) { background-color: hsl(175 58.33% 50% / 0.18) !important; background-clip: padding-box !important; }`;

export function buildAllElementsFillCss(_config: AllElementsFillConfig): string {
  return ALL_ELEMENTS_FILL_CSS;
}
