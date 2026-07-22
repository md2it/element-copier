import { PANEL_CSS } from "./panel-css.js";
import { CopierPanelWindow } from "./window.js";
import { PANEL_POPUP_HOST_ATTR, PANEL_POPUP_ROOT_ID } from "./constants.js";
import { bindPanelSessionPort, notifyPanelClosed } from "./lifecycle.js";
import { bindPanelThemeSync } from "./panel-theme.js";
import { getLocale } from "../storage.js";
import { mountPanelShadowHost } from "../../lib/our/panel-shell/shadow-host.js";

var activePopupWindow = null;

async function mountPanelSurface(initialTab, { hostStyle, surface }) {
    let locale = "en";
    let closeNotified = false;
    const { host, shadow } = mountPanelShadowHost({
      rootId: PANEL_POPUP_ROOT_ID,
      hostClassName: "ec-panel-popup",
      hostAttr: PANEL_POPUP_HOST_ATTR,
      hostStyle,
      cssContent: PANEL_CSS
    });
    locale = await getLocale();
    let panelWindow = null;
    const notifyClosedOnce = () => {
      if (closeNotified) return;
      closeNotified = true;
      notifyPanelClosed();
    };
    const clearActivePopupWindow = () => {
      if (panelWindow && activePopupWindow === panelWindow) {
        activePopupWindow = null;
      }
    };
    panelWindow = new CopierPanelWindow({
      shadow,
      surface,
      onClose: () => {
        clearActivePopupWindow();
        notifyClosedOnce();
        window.close();
      },
      getLocale: () => locale,
      setLocale: (next2) => {
        locale = next2;
      },
      onAfterTabRender: void 0
    });
    if (surface === "popup") {
      activePopupWindow = panelWindow;
    }
    bindPanelThemeSync();
    await panelWindow.openPanel(initialTab);
    bindPanelSessionPort();
    window.addEventListener(
      "pagehide",
      () => {
        clearActivePopupWindow();
        notifyClosedOnce();
      },
      { once: true }
    );
  }

async function showMountedPopupTab(tab) {
  if (!activePopupWindow || !activePopupWindow.isOpen()) {
    return false;
  }
  await activePopupWindow.showTab(tab);
  return true;
}

export { activePopupWindow, mountPanelSurface, showMountedPopupTab };
