import { mountPanelShadowHost } from "../lib/src/panel-shell";
import type { Locale } from "../i18n";
import { getLocale } from "../storage";
import {
  PANEL_POPUP_HOST_ATTR,
  PANEL_POPUP_ROOT_ID,
  type PanelPopupTab,
} from "./constants";
import { fitActionPopupToHost } from "./fit-popup-height";
import { bindPanelSessionPort, notifyPanelClosed } from "./lifecycle";
import { bindPanelThemeSync } from "./panel-theme";
import { CopierPanelWindow } from "./window";

export type PanelMountSurface = {
  hostStyle: string;
  surface?: "popup";
};

let activePopupWindow: CopierPanelWindow | null = null;

export async function mountPanelSurface(
  initialTab: PanelPopupTab,
  { hostStyle, surface }: PanelMountSurface,
): Promise<void> {
  let locale: Locale = "en";
  let closeNotified = false;

  const { host, shadow } = mountPanelShadowHost({
    rootId: PANEL_POPUP_ROOT_ID,
    hostClassName: "ec-panel-popup",
    hostAttr: PANEL_POPUP_HOST_ATTR,
    hostStyle,
    cssContent: process.env.PANEL_CSS_CONTENT ?? "",
  });

  locale = await getLocale();
  let panelWindow: CopierPanelWindow | null = null;

  const notifyClosedOnce = (): void => {
    if (closeNotified) return;
    closeNotified = true;
    notifyPanelClosed();
  };

  const clearActivePopupWindow = (): void => {
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
    setLocale: (next) => {
      locale = next;
    },
    onAfterTabRender:
      surface === "popup"
        ? () => fitActionPopupToHost(host, locale)
        : undefined,
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
    { once: true },
  );
}

export async function showMountedPopupTab(tab: PanelPopupTab): Promise<boolean> {
  if (!activePopupWindow || !activePopupWindow.isOpen()) {
    return false;
  }
  await activePopupWindow.showTab(tab);
  return true;
}
