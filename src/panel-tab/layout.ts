import { applyPanelTabPageLayout as applyLibPanelTabPageLayout } from "../lib/src/panel-tab";
import { PANEL_TAB_PAGE_CLASS } from "./constants";

export function applyPanelTabPageLayout(): void {
  applyLibPanelTabPageLayout(PANEL_TAB_PAGE_CLASS);
}
