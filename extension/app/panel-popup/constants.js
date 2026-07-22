var PANEL_POPUP_PAGE = "panel-popup-page.html";

var PANEL_POPUP_ROOT_ID = "element-copier-root";

var PANEL_POPUP_HOST_ATTR = "data-element-copier-ui";

var PANEL_POPUP_SESSION_TAB_KEY = "panelPopupTab";

var PANEL_SESSION_PORT_NAME = "element-copier-panel-session";

var PANEL_POPUP_WIDTH_PX = 500;

var PANEL_POPUP_HEIGHT_PX = 600;

function panelPopupHostStyle() {
  return `display:block;width:${PANEL_POPUP_WIDTH_PX}px;min-height:0;height:${PANEL_POPUP_HEIGHT_PX}px;position:relative;pointer-events:auto;`;
}

var PANEL_MENU_TABS = [
  "start",
  "copied",
  "settings",
  "shortcuts",
  "about"
];

var PANEL_POPUP_TABS = [...PANEL_MENU_TABS, "loading"];

var PANEL_PAGE_CONFIG = {
  pageHtml: PANEL_POPUP_PAGE,
  sessionTabKey: PANEL_POPUP_SESSION_TAB_KEY,
  logLabel: "Element Copier"
};

export { PANEL_MENU_TABS, PANEL_PAGE_CONFIG, PANEL_POPUP_HEIGHT_PX, PANEL_POPUP_HOST_ATTR, PANEL_POPUP_PAGE, PANEL_POPUP_ROOT_ID, PANEL_POPUP_SESSION_TAB_KEY, PANEL_POPUP_TABS, PANEL_POPUP_WIDTH_PX, PANEL_SESSION_PORT_NAME, panelPopupHostStyle };
