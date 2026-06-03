import type { HighlightUiClasses } from "./types";

/** Generic pick-mode page rules (cursor, iframe hit-test, fill tint). */
export function buildGenericHighlightPageCss(classes: HighlightUiClasses): string {
  return `
.${classes.highlightTarget} {
  cursor: crosshair !important;
}
iframe {
  pointer-events: none !important;
  cursor: crosshair !important;
}
iframe.${classes.highlightFill} {
  /* Approximate highlight fill over varied iframe content (not exact rgba). */
  filter: sepia(0.65) saturate(11) hue-rotate(342deg) brightness(0.88) !important;
}
`;
}

export function ensurePageHighlightStyles(config: {
  styleId: string;
  pageCss: string;
}): void {
  if (document.getElementById(config.styleId)) return;
  const style = document.createElement("style");
  style.id = config.styleId;
  style.textContent = config.pageCss;
  document.documentElement.appendChild(style);
}

export function removePageHighlightStyles(styleId: string): void {
  document.getElementById(styleId)?.remove();
}
