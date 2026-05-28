import { mountPanelShadowHost } from "../../../lib/src/panel-shell";
import type { Locale } from "../i18n";
import { getLocale } from "../storage";
import {
  PANEL_POPUP_HOST_ATTR,
  PANEL_POPUP_ROOT_ID,
  type PanelPopupTab,
} from "./constants";
import { fitActionPopupToHost } from "./fit-popup-height";
import { notifyPanelClosed } from "./lifecycle";
import { CopierPanelWindow } from "./window";

export type PanelMountSurface = {
  hostStyle: string;
  surface?: "popup";
};

export async function mountPanelSurface(
  initialTab: PanelPopupTab,
  { hostStyle, surface }: PanelMountSurface,
): Promise<void> {
  let locale: Locale = "en";

  const { host, shadow } = mountPanelShadowHost({
    rootId: PANEL_POPUP_ROOT_ID,
    hostClassName: "ec-panel-popup",
    hostAttr: PANEL_POPUP_HOST_ATTR,
    hostStyle,
    cssContent: process.env.PANEL_CSS_CONTENT ?? "",
  });

  locale = await getLocale();

  const panelWindow = new CopierPanelWindow({
    shadow,
    surface,
    onClose: () => window.close(),
    getLocale: () => locale,
  });

  panelWindow.openPanel(initialTab);
  window.addEventListener(
    "pagehide",
    () => {
      notifyPanelClosed();
    },
    { once: true },
  );
  if (surface === "popup") {
    fitActionPopupToHost(host, locale);
  }
}
