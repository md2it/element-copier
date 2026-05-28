import { ext } from "./api";
import { COPIER_ACTIVE_COLOR } from "./brand";
import {
  bootstrapToolbarIcons,
  getTabActiveState,
  onContentActiveChanged,
  registerExtensionIconStateListeners,
  setTabActiveState,
  syncIconForTab,
} from "./extension-icon-state";
import {
  registerBackgroundHotkeys,
  shouldSuppressToolbarClickAfterHotkeyCommand,
} from "./hotkeys";
import {
  registerPrefixHintBadgeListeners,
  registerPrefixHintOperabilityListeners,
} from "../../lib/src/hotkeys";
import type { BgToContent, ContentActivationResponse, ContentToBg } from "./messages";
import {
  canOperateOnTab,
  getRestrictedNoticeDismissMs,
  isBlockedNoticeDismissedMessage,
  refreshRestrictedNoticeCache,
  showRestrictedNotice,
} from "./page-operability";
import {
  openCopiedPanelFromCopy,
  openPanelFromSender,
  openStartPanelFromToolbar,
  PANEL_POPUP_PAGE,
  type PanelPopupTab,
} from "./panel-popup";
import { readPanelTargetTabId } from "./panel-popup/panel-target-tab";
import { ensureLocaleInStorage } from "./storage";
import { showWelcome, stopWelcomePinWatcher, watchWelcomePinStatus } from "./welcome";

const TOGGLE_DEBOUNCE_MS = 80;
/** Pick UI runs in the top document only (content_scripts use all_frames). */
const MAIN_FRAME_ID = 0;

/** Sync pre-check: skip START popup so blocked-notice keeps the toolbar user gesture. */
function isLikelyNonOperableTabUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const { protocol } = new URL(url);
    return (
      protocol === "chrome:" ||
      protocol === "chrome-extension:" ||
      protocol === "moz-extension:" ||
      protocol === "edge:" ||
      protocol === "about:" ||
      protocol === "devtools:"
    );
  } catch {
    return false;
  }
}
let lastToggleTabId: number | undefined;
let lastToggleAt = 0;

const BADGE_TEXT_COLOR = "#ffffff";
const BADGE_PREFIX_BACKGROUND_COLOR = "#ffffff";
const BADGE_PREFIX_TEXT_COLOR = COPIER_ACTIVE_COLOR;
const BADGE_SELECTION_BACKGROUND_COLOR = COPIER_ACTIVE_COLOR;
const BADGE_COPIED_BACKGROUND_COLOR = "#008000";
const BADGE_BLOCKED_BACKGROUND_COLOR = "#d3d3d3";
const BADGE_BLOCKED_TEXT_COLOR = "#4a4a4a";
const BADGE_SELECTION_TEXT = "◉";
const BADGE_COPIED_TEXT = "✓";
const BADGE_BLOCKED_TEXT = "✕";

/**
 * Badge state priority (lib/PROJECTS.md):
 * 1) prefix letter (lib prefix badge; we only suppress/restore)
 * 2) cannot operate on page => ✕ (while blocked notice is shown)
 * 3) running => ✓
 * 4) off => no badge
 */

const tabBlockedBadge = new Map<number, boolean>();
const tabPrefixBadgeShown = new Map<number, boolean>();
const tabCopiedBadge = new Map<number, boolean>();
const blockedBadgeClearTimers = new Map<number, ReturnType<typeof setTimeout>>();

function clearBlockedBadgeTimer(tabId: number): void {
  const timer = blockedBadgeClearTimers.get(tabId);
  if (timer === undefined) return;
  clearTimeout(timer);
  blockedBadgeClearTimers.delete(tabId);
}

function clearBlockedBadgeState(tabId: number): void {
  clearBlockedBadgeTimer(tabId);
  tabBlockedBadge.set(tabId, false);
}

function onBlockedNoticeDismissed(tabId: number): void {
  if (!tabBlockedBadge.get(tabId)) return;
  clearBlockedBadgeState(tabId);
  void syncToolbarBadge(tabId);
}

function scheduleClearBlockedBadge(tabId: number, dismissMs: number): void {
  clearBlockedBadgeTimer(tabId);
  blockedBadgeClearTimers.set(
    tabId,
    setTimeout(() => {
      blockedBadgeClearTimers.delete(tabId);
      if (!tabBlockedBadge.get(tabId)) return;
      clearBlockedBadgeState(tabId);
      void syncToolbarBadge(tabId);
    }, dismissMs),
  );
}

async function showBlockedPageFeedback(
  tabId: number,
  windowId?: number,
  reason?: string,
): Promise<void> {
  console.warn("[Element Copier] page blocked:", reason ?? "unknown", tabId);
  tabBlockedBadge.set(tabId, true);
  await syncToolbarBadge(tabId);
  const dismissMs = await getRestrictedNoticeDismissMs();
  await showRestrictedNotice(tabId, windowId);
  scheduleClearBlockedBadge(tabId, dismissMs);
}

async function setToolbarBadge(
  tabId: number,
  text: string,
  backgroundColor = BADGE_SELECTION_BACKGROUND_COLOR,
  textColor = BADGE_TEXT_COLOR,
): Promise<void> {
  try {
    if (text) {
      await ext.action.setBadgeBackgroundColor({ tabId, color: backgroundColor });
      const setBadgeTextColor = (
        ext.action as typeof ext.action & {
          setBadgeTextColor?: (details: { tabId: number; color: string }) => Promise<void>;
        }
      ).setBadgeTextColor;
      await setBadgeTextColor?.({ tabId, color: textColor });
    }
    await ext.action.setBadgeText({ tabId, text });
  } catch (err) {
    console.warn("[Element Copier] setBadgeText failed:", err);
  }
}

async function syncToolbarBadge(tabId: number): Promise<void> {
  if (tabPrefixBadgeShown.get(tabId)) return;

  if (tabBlockedBadge.get(tabId)) {
    await setToolbarBadge(
      tabId,
      BADGE_BLOCKED_TEXT,
      BADGE_BLOCKED_BACKGROUND_COLOR,
      BADGE_BLOCKED_TEXT_COLOR,
    );
    return;
  }

  if (getTabActiveState(tabId)) {
    await setToolbarBadge(tabId, BADGE_SELECTION_TEXT, BADGE_SELECTION_BACKGROUND_COLOR);
    return;
  }

  if (tabCopiedBadge.get(tabId)) {
    await setToolbarBadge(tabId, BADGE_COPIED_TEXT, BADGE_COPIED_BACKGROUND_COLOR);
    return;
  }

  await setToolbarBadge(tabId, "");
}

async function injectContent(tabId: number, frameId?: number): Promise<boolean> {
  try {
    const target =
      frameId === undefined ? { tabId } : { tabId, frameIds: [frameId] };
    await ext.scripting.executeScript({
      target,
      files: ["content.js"],
    });
    return true;
  } catch (err) {
    console.warn("[Element Copier] injectContent failed:", err);
    return false;
  }
}

function isActivationSuccess(
  message: BgToContent,
  response: unknown,
): boolean {
  if (message.type === "SET_ACTIVE" && message.active) {
    return (response as ContentActivationResponse | undefined)?.ok === true;
  }
  return true;
}

async function sendToTab(
  tabId: number,
  message: BgToContent,
  frameId?: number,
): Promise<boolean> {
  try {
    const response =
      frameId === undefined
        ? await ext.tabs.sendMessage(tabId, message)
        : await ext.tabs.sendMessage(tabId, message, { frameId });
    return isActivationSuccess(message, response);
  } catch (err) {
    console.warn("[Element Copier] sendToTab failed:", err);
    return false;
  }
}

async function sendWithInject(
  tabId: number,
  message: BgToContent,
  frameId?: number,
): Promise<boolean> {
  if (await sendToTab(tabId, message, frameId)) return true;
  if (!(await injectContent(tabId, frameId))) return false;
  return sendToTab(tabId, message, frameId);
}

async function setTabActive(
  tabId: number,
  active: boolean,
  windowId?: number,
): Promise<void> {
  if (active && !(await canOperateOnTab(tabId))) {
    setTabActiveState(tabId, false);
    await syncIconForTab(tabId);
    await showBlockedPageFeedback(tabId, windowId, "canOperateOnTab:setTabActive");
    return;
  }

  const reached = active
    ? await sendWithInject(tabId, { type: "SET_ACTIVE", active: true }, MAIN_FRAME_ID)
    : await sendToTab(tabId, { type: "SET_ACTIVE", active: false }, MAIN_FRAME_ID);

  if (active && !reached) {
    setTabActiveState(tabId, false);
    await syncIconForTab(tabId);
    await sendToTab(tabId, { type: "SET_ACTIVE", active: false }, MAIN_FRAME_ID);
    console.warn(
      "[Element Copier] pick mode activation failed on tab",
      tabId,
      windowId ?? "",
    );
    await showBlockedPageFeedback(tabId, windowId, "setTabActive:activationFailed");
    return;
  }

  if (active && reached) {
    clearBlockedBadgeState(tabId);
  }

  if (!active) {
    clearBlockedBadgeState(tabId);
  }

  await syncToolbarBadge(tabId);
}

async function deactivateTab(tabId: number, windowId?: number): Promise<void> {
  if (!getTabActiveState(tabId)) return;

  setTabActiveState(tabId, false);
  clearBlockedBadgeState(tabId);
  tabCopiedBadge.set(tabId, false);
  await syncIconForTab(tabId);
  await syncToolbarBadge(tabId);
  await setTabActive(tabId, false, windowId);
}

async function activateTab(tabId: number, windowId?: number): Promise<void> {
  if (getTabActiveState(tabId)) {
    await setTabActive(tabId, true, windowId);
    return;
  }

  if (!(await canOperateOnTab(tabId))) {
    setTabActiveState(tabId, false);
    await syncIconForTab(tabId);
    await showBlockedPageFeedback(tabId, windowId, "canOperateOnTab:activateTab");
    return;
  }

  setTabActiveState(tabId, true);
  clearBlockedBadgeState(tabId);
  tabCopiedBadge.set(tabId, false);
  await syncIconForTab(tabId);
  await syncToolbarBadge(tabId);
  await setTabActive(tabId, true, windowId);
}

function isExtensionPanelSenderUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.includes(PANEL_POPUP_PAGE) || url.includes("welcome.html");
}

async function resolvePickModeTabId(
  sender: chrome.runtime.MessageSender,
): Promise<number | undefined> {
  const senderUrl = sender.tab?.url;
  if (sender.tab?.id !== undefined && !isExtensionPanelSenderUrl(senderUrl)) {
    return sender.tab.id;
  }

  const remembered = await readPanelTargetTabId();
  if (remembered !== undefined) return remembered;

  const tab = await getActiveCommandTab();
  return tab?.id;
}

function isPickModeMenuTab(
  tab: PanelPopupTab,
): tab is "settings" | "history" | "shortcuts" | "language" | "about" {
  return (
    tab === "settings" ||
    tab === "history" ||
    tab === "shortcuts" ||
    tab === "language" ||
    tab === "about"
  );
}

async function syncPickModeForPanelTab(
  tab: PanelPopupTab,
  sender: chrome.runtime.MessageSender,
): Promise<void> {
  const tabId = await resolvePickModeTabId(sender);
  if (tabId === undefined) return;

  if (tab === "start") {
    await activateTab(tabId, sender.tab?.windowId);
    return;
  }

  if (isPickModeMenuTab(tab)) {
    await deactivateTab(tabId, sender.tab?.windowId);
  }
}

async function toggleTab(
  tabId: number,
  windowId?: number,
  tabUrl?: string,
): Promise<void> {
  const now = Date.now();
  if (tabId === lastToggleTabId && now - lastToggleAt < TOGGLE_DEBOUNCE_MS) {
    return;
  }
  lastToggleTabId = tabId;
  lastToggleAt = now;

  const next = !getTabActiveState(tabId);
  if (!next) {
    setTabActiveState(tabId, false);
    clearBlockedBadgeState(tabId);
    tabCopiedBadge.set(tabId, false);
    await syncIconForTab(tabId);
    await syncToolbarBadge(tabId);
    await setTabActive(tabId, false, windowId);
    return;
  }

  const skipStartPanelForBlockedUrl =
    tabUrl !== undefined && isLikelyNonOperableTabUrl(tabUrl);
  if (!skipStartPanelForBlockedUrl) {
    // Sync before first await — action.openPopup needs the toolbar user gesture.
    openStartPanelFromToolbar({ id: tabId, windowId } as chrome.tabs.Tab);
  }

  await activateTab(tabId, windowId);
}

function getActiveCommandTab(): Promise<chrome.tabs.Tab | undefined> {
  return new Promise((resolve) => {
    ext.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.id !== undefined) {
        resolve(tab);
        return;
      }
      ext.tabs.query({ active: true, currentWindow: true }, (fallback) => {
        resolve(fallback[0]);
      });
    });
  });
}

ext.action.onClicked.addListener((tab) => {
  if (tab.id === undefined) return;
  if (shouldSuppressToolbarClickAfterHotkeyCommand()) {
    console.log("[Element Copier] toolbar click suppressed (after _execute_action)");
    return;
  }
  console.log("[Element Copier] toolbar click → toggleTab", tab.id);
  void toggleTab(tab.id, tab.windowId, tab.url);
});

registerBackgroundHotkeys({
  getActiveCommandTab,
  toggleTab,
});

registerPrefixHintOperabilityListeners({
  canOperateOnTab,
  onBlockedOnTab: (tabId, windowId) =>
    showBlockedPageFeedback(tabId, windowId, "prefixHint"),
});

ext.runtime.onMessage.addListener(
  (message: ContentToBg | unknown, sender): boolean | void => {
    if (isBlockedNoticeDismissedMessage(message)) {
      onBlockedNoticeDismissed(message.tabId);
      return;
    }
    const contentMessage = message as ContentToBg;
    if (contentMessage.type === "ACTIVE_CHANGED" && sender.tab?.id !== undefined) {
      const tabId = sender.tab.id;
      onContentActiveChanged(tabId, contentMessage.active);
      if (!contentMessage.active) {
        clearBlockedBadgeState(tabId);
      }
      void syncToolbarBadge(tabId);
    }
    if (contentMessage.type === "OPEN_PANEL") {
      if (contentMessage.tab === "copied") {
        if (sender.tab?.id !== undefined) {
          tabCopiedBadge.set(sender.tab.id, true);
          void syncToolbarBadge(sender.tab.id);
        }
        openCopiedPanelFromCopy(sender.tab);
        return;
      }
      void (async () => {
        await syncPickModeForPanelTab(contentMessage.tab, sender);
        openPanelFromSender(contentMessage.tab, sender.tab);
      })();
    }
    if (contentMessage.type === "PANEL_TAB_CHANGED") {
      void (async () => {
        const tabId = await resolvePickModeTabId(sender);
        if (tabId !== undefined) {
          tabCopiedBadge.set(tabId, contentMessage.tab === "copied");
          await syncToolbarBadge(tabId);
        }
        await syncPickModeForPanelTab(contentMessage.tab, sender);
      })();
    }
    if (contentMessage.type === "PANEL_CLOSED") {
      void (async () => {
        const tabId = await resolvePickModeTabId(sender);
        if (tabId === undefined) return;
        tabCopiedBadge.set(tabId, false);
        await syncToolbarBadge(tabId);
      })();
    }
    if (contentMessage.type === "WATCH_PIN_STATUS" && sender.tab?.id !== undefined) {
      watchWelcomePinStatus(sender.tab.id);
    }
    if (contentMessage.type === "ELEMENT_PICKED") {
      const label = contentMessage.id
        ? `${contentMessage.tagName}#${contentMessage.id}`
        : contentMessage.className
          ? `${contentMessage.tagName}.${contentMessage.className.trim().split(/\s+/).slice(0, 3).join(".")}`
          : contentMessage.tagName;
      console.log("[Element Copier] element picked:", label);
    }
  },
);

ext.tabs.onRemoved.addListener((tabId) => {
  clearBlockedBadgeTimer(tabId);
  tabBlockedBadge.delete(tabId);
  tabPrefixBadgeShown.delete(tabId);
  tabCopiedBadge.delete(tabId);
  stopWelcomePinWatcher(tabId);
});

registerPrefixHintBadgeListeners({
  badgeBackgroundColor: BADGE_PREFIX_BACKGROUND_COLOR,
  badgeTextColor: BADGE_PREFIX_TEXT_COLOR,
  canShowPrefixBadgeOnTab: canOperateOnTab,
  onShow: (tabId) => {
    if (tabId === undefined) return;
    tabPrefixBadgeShown.set(tabId, true);
  },
  onHide: (tabId) => {
    if (tabId === undefined) return;
    tabPrefixBadgeShown.set(tabId, false);
    void syncToolbarBadge(tabId);
  },
});

registerExtensionIconStateListeners();

ext.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.notificationSeconds || changes.locale) {
    void refreshRestrictedNoticeCache();
  }
});

const onBootstrap = async (): Promise<void> => {
  await ensureLocaleInStorage();
  await refreshRestrictedNoticeCache();
  await bootstrapToolbarIcons();
};

void ext.runtime.onInstalled.addListener((details) => {
  void onBootstrap();
  if (details.reason === "install") {
    void showWelcome();
  }
});

void ext.runtime.onStartup.addListener(() => {
  void onBootstrap();
});

void onBootstrap();
