import { ext } from "../api";
import { panelPagePath } from "./page-path";
import type { PanelPageConfig, PanelPageOpenTarget } from "./types";

/** Keep async chain short — user gesture from context menu expires after long await. */
export function openPanelInActionPopup<T extends string>(
  config: PanelPageConfig,
  panelTab: T,
  target: PanelPageOpenTarget,
  fallbackOpenInTab: (panelTab: T) => Promise<void>,
  extraParams?: Record<string, string>,
): void {
  const { tabId, windowId } = target;
  const popup = panelPagePath(
    config.pageHtml,
    panelTab,
    extraParams,
    config.tabQueryParam,
  );
  const setPopupDetails =
    tabId !== undefined ? { tabId, popup } : { popup };
  const clearPopupDetails =
    tabId !== undefined ? { tabId, popup: "" } : { popup: "" };

  void (async () => {
    await ext.action.setPopup(setPopupDetails);
    try {
      const openPopup = (
        ext.action as typeof ext.action & {
          openPopup?: (details: { windowId: number }) => Promise<void>;
        }
      ).openPopup;
      if (!openPopup) throw new Error("action.openPopup unavailable");
      await openPopup({ windowId: windowId! });
    } catch (err) {
      console.warn(`[${config.logLabel}] openPopup panel failed, using tab:`, err);
      await fallbackOpenInTab(panelTab);
    } finally {
      await ext.action.setPopup(clearPopupDetails);
    }
  })();
}
