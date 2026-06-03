import {
  buildGenericHighlightPageCss,
  createHighlightUiClasses,
} from "../lib/src/highlight";

export const HIGHLIGHT_STYLE_ID = "element-copier-highlight-style";

export const HIGHLIGHT_UI = createHighlightUiClasses("ec");

const HIGHLIGHT_PAGE_CSS = buildGenericHighlightPageCss(HIGHLIGHT_UI);

export const COPIER_HIGHLIGHT_PAGE_STYLE = {
  styleId: HIGHLIGHT_STYLE_ID,
  pageCss: HIGHLIGHT_PAGE_CSS,
} as const;
