import { ext } from "../api";
import type { BlockedNoticeConfig, BlockedNoticePayload } from "./types";

/** Opens the blocked-page notice popup (or tab fallback) with a pre-filled session payload. */
export async function showBlockedNotice(
  tabId: number,
  config: BlockedNoticeConfig,
  payload: BlockedNoticePayload,
  windowId?: number,
): Promise<void> {
  const { popupHtml, sessionKey, logLabel } = config;

  void ext.storage.session.set({
    [sessionKey]: { ...payload, tabId },
  });

  const noticeUrl = ext.runtime.getURL(popupHtml);
  let winId = windowId;

  if (winId === undefined) {
    try {
      const tab = await ext.tabs.get(tabId);
      winId = tab.windowId;
    } catch {
      /* tab may be gone */
    }
  }

  try {
    await ext.action.setPopup({ tabId, popup: popupHtml });
    const openPopup = (
      ext.action as typeof ext.action & {
        openPopup?: (details: { windowId: number }) => Promise<void>;
      }
    ).openPopup;
    if (openPopup && winId !== undefined) {
      await openPopup({ windowId: winId });
      return;
    }
    throw new Error("action.openPopup unavailable");
  } catch (err) {
    console.warn(`[${logLabel}] openPopup notice failed, using tab:`, err);
    try {
      await ext.tabs.create({
        url: `${noticeUrl}?mode=tab`,
        active: true,
      });
    } catch (err2) {
      console.error(`[${logLabel}] blocked notice tab failed:`, err2);
    }
  } finally {
    await ext.action.setPopup({ tabId, popup: "" });
  }
}
