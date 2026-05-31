import {
  openPanelInActionPopup as openLibPanelInActionPopup,
  panelPagePath,
  type PanelPageOpenTarget,
} from "../../../lib/src/panel-popup";
import { hasPickCopyCachePresentSync } from "../pick-mode/pick-copy-cache-storage";
import { openPanelInTab } from "../panel-tab";
import { PANEL_PAGE_CONFIG, type PanelPopupTab } from "./constants";
import { rememberPanelTargetTab } from "./panel-target-tab";
import { markPanelSessionOpened } from "./panel-session";

export type { PanelPageOpenTarget as PanelPopupOpenTarget };

export function panelPopupPath(panelTab: PanelPopupTab): string {
  return panelPagePath(PANEL_PAGE_CONFIG.pageHtml, panelTab);
}

/** Keep async chain short — user gesture from toolbar click expires after long await. */
export function openPanelInActionPopup(
  panelTab: PanelPopupTab,
  target: PanelPageOpenTarget,
): void {
  markPanelSessionOpened();
  if (target.tabId !== undefined) {
    void rememberPanelTargetTab(target.tabId);
  }
  openLibPanelInActionPopup(
    PANEL_PAGE_CONFIG,
    panelTab,
    target,
    openPanelInTab,
  );
}

export function openPanelFromSender(
  panelTab: PanelPopupTab,
  senderTab: chrome.tabs.Tab | undefined,
): void {
  openPanelInActionPopup(panelTab, {
    tabId: senderTab?.id,
    windowId: senderTab?.windowId,
  });
}

/** Toolbar click while inactive — opens popup in the same user-gesture turn. */
export function openStartPanelFromToolbar(senderTab: chrome.tabs.Tab | undefined): void {
  const tab: PanelPopupTab = hasPickCopyCachePresentSync() ? "copied" : "start";
  openPanelFromSender(tab, senderTab);
}

/** After a successful page pick + copy — opened from background on content message. */
export function openCopiedPanelFromCopy(senderTab: chrome.tabs.Tab | undefined): void {
  openPanelFromSender("copied", senderTab);
}
