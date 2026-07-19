import { ext } from "../api.js";

async function showBlockedNotice(tabId, config, payload, windowId) {
  const { popupHtml, sessionKey, logLabel } = config;
  void ext.storage.session.set({
    [sessionKey]: { ...payload, tabId }
  });
  const noticeUrl = ext.runtime.getURL(popupHtml);
  let winId = windowId;
  if (winId === void 0) {
    try {
      const tab = await ext.tabs.get(tabId);
      winId = tab.windowId;
    } catch {
    }
  }
  try {
    await ext.action.setPopup({ tabId, popup: popupHtml });
    const openPopup = ext.action.openPopup;
    if (openPopup && winId !== void 0) {
      await openPopup({ windowId: winId });
      return;
    }
    throw new Error("action.openPopup unavailable");
  } catch (err) {
    console.debug(`[${logLabel}] openPopup notice failed, using tab:`, err);
    try {
      await ext.tabs.create({
        url: `${noticeUrl}?mode=tab`,
        active: true
      });
    } catch (err2) {
      console.error(`[${logLabel}] blocked notice tab failed:`, err2);
    }
  } finally {
    await ext.action.setPopup({ tabId, popup: "" });
  }
}

export { showBlockedNotice };
