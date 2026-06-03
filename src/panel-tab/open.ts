import {
  openPanelPageInTab,
  panelTabPath as libPanelTabPath,
} from "../lib/src/panel-tab";
import { PANEL_PAGE_CONFIG, type PanelPopupTab } from "../panel-popup/constants";

export function panelTabPath(panelTab: PanelPopupTab): string {
  return libPanelTabPath(PANEL_PAGE_CONFIG.pageHtml, panelTab);
}

export async function openPanelInTab(panelTab: PanelPopupTab): Promise<void> {
  await openPanelPageInTab(panelTabPath(panelTab), PANEL_PAGE_CONFIG.logLabel);
}
