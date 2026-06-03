import {
  getPanelPageUrl,
  isPanelPage,
  resolvePanelPageInitialTab as resolveLibPanelPageInitialTab,
} from "../lib/our/panel-popup";
import { hasPickCopyCacheInStorage } from "../pick-mode/pick-copy-cache-storage";
import { isPanelTabMode } from "../panel-tab";
import {
  PANEL_PAGE_CONFIG,
  PANEL_POPUP_PAGE,
  PANEL_POPUP_TABS,
  type PanelPopupTab,
} from "./constants";
import { mountPanelPopup } from "./mount";

export function getPanelPopupPageUrl(): string {
  return getPanelPageUrl(PANEL_POPUP_PAGE);
}

export function isPanelPopupPage(href: string): boolean {
  return isPanelPage(href, PANEL_POPUP_PAGE);
}

export async function resolvePanelPageInitialTab(): Promise<PanelPopupTab> {
  const tab = await resolveLibPanelPageInitialTab({
    sessionTabKey: PANEL_PAGE_CONFIG.sessionTabKey,
    defaultTab: "start",
    validTabs: PANEL_POPUP_TABS,
  });
  if (tab !== "start") return tab;
  return (await hasPickCopyCacheInStorage()) ? "copied" : "start";
}

/** Mount START UI when `panel-popup-page.html` is the action popup document. */
export async function bootstrapPanelPopupPageIfNeeded(): Promise<void> {
  if (!isPanelPopupPage(location.href)) return;
  if (isPanelTabMode()) return;

  const tab = await resolvePanelPageInitialTab();
  await mountPanelPopup(tab);
}
