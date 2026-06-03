import type { HighlightUiClasses } from "./types";

export function createHighlightUiClasses(prefix: string): HighlightUiClasses {
  return {
    highlightTarget: `${prefix}-highlight`,
    highlightFill: `${prefix}-highlight-fill`,
    highlightFrame: `${prefix}-highlight-frame`,
    elementLabel: `${prefix}-element-label`,
  };
}
