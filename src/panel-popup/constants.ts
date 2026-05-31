import type { PanelPageConfig } from "../../../lib/src/panel-popup";

/** Extension page loaded under the toolbar action popup (not a content-script overlay). */
export const PANEL_POPUP_PAGE = "panel-popup-page.html";

export const PANEL_POPUP_ROOT_ID = "element-copier-root";
export const PANEL_POPUP_HOST_ATTR = "data-element-copier-ui";

export const PANEL_POPUP_SESSION_TAB_KEY = "panelPopupTab";

/** Long-lived port from panel page → background; disconnect means panel closed. */
export const PANEL_SESSION_PORT_NAME = "element-copier-panel-session";

export const PANEL_POPUP_DISMISS_DELAY_MS = 1000;
/** Fallback when COPIED download row cannot be measured. */
export const PANEL_POPUP_WIDTH_FALLBACK_PX = 380;

export function panelPopupHostStyle(widthPx: number): string {
  return `display:block;width:${widthPx}px;min-height:0;height:auto;position:relative;pointer-events:auto;`;
}

export type PanelMenuTab =
  | "start"
  | "copied"
  | "settings"
  | "shortcuts"
  | "language"
  | "about";

export type PanelTransientTab = "loading";

export const PANEL_MENU_TABS: readonly PanelMenuTab[] = [
  "start",
  "copied",
  "settings",
  "shortcuts",
  "language",
  "about",
];

export type PanelPopupTab = PanelMenuTab | PanelTransientTab;

export const PANEL_POPUP_TABS: readonly PanelPopupTab[] = [...PANEL_MENU_TABS, "loading"];

export const PANEL_PAGE_CONFIG: PanelPageConfig = {
  pageHtml: PANEL_POPUP_PAGE,
  sessionTabKey: PANEL_POPUP_SESSION_TAB_KEY,
  logLabel: "Element Copier",
};
