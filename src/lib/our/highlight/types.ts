export type HighlightUiClasses = {
  highlightTarget: string;
  highlightFill: string;
  highlightFrame: string;
  elementLabel: string;
};

export type ElementHighlightHost = {
  shadow: ShadowRoot;
  isOurNode: (node: Node | null) => boolean;
  getElementLabelEnabled: () => boolean;
  formatElementLabel: (target: Element) => string;
  hostAttr: string;
  classes: HighlightUiClasses;
};

export type HighlightRenderOptions = {
  /** Previous target when switching with frame transition. */
  animateFrom: Element | null;
  /** Abort transition if the logical target changed (e.g. pointer moved). */
  isStillTarget?: (target: Element) => boolean;
};

export type HighlightPageStyleConfig = {
  styleId: string;
  pageCss: string;
};
