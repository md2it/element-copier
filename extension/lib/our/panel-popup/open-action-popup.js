import { ext } from "../api.js";
import { panelPagePath } from "./page-path.js";

function openPanelInActionPopup(config, panelTab, target, fallbackOpenInTab, extraParams) {
  const { tabId, windowId } = target;
  const popup = panelPagePath(
    config.pageHtml,
    panelTab,
    extraParams,
    config.tabQueryParam
  );
  const setPopupDetails = tabId !== void 0 ? { tabId, popup } : { popup };
  const clearPopupDetails = tabId !== void 0 ? { tabId, popup: "" } : { popup: "" };
  void (async () => {
    await ext.action.setPopup(setPopupDetails);
    try {
      const openPopup = ext.action.openPopup;
      if (!openPopup) throw new Error("action.openPopup unavailable");
      await openPopup({ windowId });
    } catch (err) {
      console.debug(`[${config.logLabel}] openPopup panel failed, using tab:`, err);
      await fallbackOpenInTab(panelTab);
    } finally {
      await ext.action.setPopup(clearPopupDetails);
    }
  })();
}

export { openPanelInActionPopup };
