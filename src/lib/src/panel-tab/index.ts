/** Query flag: panel opens as a full browser tab (not action popup). */
export const PANEL_TAB_MODE_PARAM = "mode";
export const PANEL_TAB_MODE_VALUE = "tab";

export function isPanelTabMode(
  modeParam = PANEL_TAB_MODE_PARAM,
  modeValue = PANEL_TAB_MODE_VALUE,
  search: string = location.search,
): boolean {
  return new URLSearchParams(search).get(modeParam) === modeValue;
}

/** Document-level tab layout (centered card on gray page). */
export function applyPanelTabPageLayout(pageClass: string): void {
  document.documentElement.classList.add(pageClass);
}

export function panelTabPath(
  pageHtml: string,
  panelTab: string,
  modeParam = PANEL_TAB_MODE_PARAM,
  modeValue = PANEL_TAB_MODE_VALUE,
  tabQueryParam = "tab",
): string {
  const params = new URLSearchParams({
    [tabQueryParam]: panelTab,
    [modeParam]: modeValue,
  });
  return `${pageHtml}?${params.toString()}`;
}

import { ext } from "../api";

export async function openPanelPageInTab(
  panelTabPathValue: string,
  logLabel: string,
): Promise<void> {
  try {
    await ext.tabs.create({
      url: ext.runtime.getURL(panelTabPathValue),
      active: true,
    });
  } catch (err) {
    console.error(`[${logLabel}] panel tab failed:`, err);
  }
}
