import { PANEL_POPUP_PAGE, PANEL_SESSION_PORT_NAME } from "../panel-popup/constants.js";
import { PICK_COPY_CACHE_INDEX_KEY, PICK_COPY_CACHE_STORAGE_KEY, getPickCopyTextFromStorage, refreshPickCopyCachePresenceSync } from "../pick-mode/pick-copy-cache-storage.js";
import { bootstrapToolbarIcons, onContentActiveChanged2, registerExtensionIconStateListeners2, syncIconForTab } from "../extension-icon-state/index.js";
import { canOperateOnTab } from "../../lib/our/page-operability/can-operate.js";
import { clearBlockedBadgeState, clearTabBadgeState, onBlockedNoticeDismissed, registerToolbarPrefixBadgeListeners, setCopiedBadge, showBlockedPageFeedback, syncToolbarBadge } from "../background-badge.js";
import { clearCopiedPanelShowStatus, markCopiedPanelShowStatus, setLastCopiedFormat, setLastDownloadedFormat } from "../settings/copied-session.js";
import { consumePanelSessionClose } from "../panel-popup/panel-session.js";
import { ensureContextMenu, findContextMenuTab } from "../background-context-menu.js";
import { ensureLocaleInStorage } from "../storage.js";
import { ext } from "../../lib/our/api.js";
import { getTabActiveState, setTabActiveState } from "../../lib/our/extension-icon-state/tab-active-state.js";
import { isBlockedNoticeDismissedMessage } from "../../lib/our/page-operability/messages.js";
import { openCopiedPanelFromCopy, openPanelFromSender, openStartPanelFromToolbar } from "../panel-popup/open.js";
import { readPanelTargetTabId, rememberPanelTargetTab } from "../panel-popup/panel-target-tab.js";
import { refreshRestrictedNoticeCache } from "../page-operability/notice.js";
import { registerBackgroundHotkeys, shouldSuppressToolbarClickAfterHotkeyCommand } from "../hotkeys/background.js";
import { registerPrefixHintOperabilityListeners } from "../../lib/our/hotkeys/prefix-operability.js";
import { showWelcome, stopWelcomePinWatcher2, watchWelcomePinStatus2 } from "../welcome/background.js";

var TOGGLE_DEBOUNCE_MS = 80;

var MAIN_FRAME_ID = 0;

var PICK_LOADING_PANEL_DELAY_MS = 500;

var pickCopyLoadingTimers = /* @__PURE__ */ new Map();

function isLikelyNonOperableTabUrl(url) {
  if (!url) return false;
  try {
    const { protocol } = new URL(url);
    return protocol === "chrome:" || protocol === "chrome-extension:" || protocol === "moz-extension:" || protocol === "edge:" || protocol === "about:" || protocol === "devtools:";
  } catch {
    return false;
  }
}

var lastToggleTabId;

var lastToggleAt = 0;

async function injectContent(tabId, frameId) {
  try {
    const target = frameId === void 0 ? { tabId } : { tabId, frameIds: [frameId] };
    await ext.scripting.executeScript({
      target,
      files: ["app/content/loader.js"]
    });
    return true;
  } catch (err) {
    console.warn("[Element Copier] injectContent failed:", err);
    return false;
  }
}

function isActivationSuccess(message, response) {
  if (message.type === "SET_ACTIVE" && message.active) {
    return response?.ok === true;
  }
  return true;
}

async function sendToTab(tabId, message, frameId) {
  try {
    const response = frameId === void 0 ? await ext.tabs.sendMessage(tabId, message) : await ext.tabs.sendMessage(tabId, message, { frameId });
    return isActivationSuccess(message, response);
  } catch (err) {
    console.warn("[Element Copier] sendToTab failed:", err);
    return false;
  }
}

async function sendWithInject(tabId, message, frameId) {
  if (await sendToTab(tabId, message, frameId)) return true;
  if (!await injectContent(tabId, frameId)) return false;
  // loader.js starts the real content module with dynamic import(). Script
  // injection completes before that import necessarily registers its listener.
  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (await sendToTab(tabId, message, frameId)) return true;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return false;
}

async function handlePanelSessionEnded() {
  await clearCopiedPanelShowStatus();
  if (!consumePanelSessionClose()) return;
  const tabId = await readPanelTargetTabId();
  if (tabId === void 0) return;
  setCopiedBadge(tabId, false);
  await syncToolbarBadge(tabId);
}

async function setTabActive(tabId, active, windowId) {
  if (active && !await canOperateOnTab(tabId)) {
    setTabActiveState(tabId, false);
    await syncIconForTab(tabId);
    await showBlockedPageFeedback(tabId, windowId, "canOperateOnTab:setTabActive");
    return;
  }
  const reached = active ? await sendWithInject(tabId, { type: "SET_ACTIVE", active: true }, MAIN_FRAME_ID) : await sendToTab(tabId, { type: "SET_ACTIVE", active: false }, MAIN_FRAME_ID);
  if (active && !reached) {
    setTabActiveState(tabId, false);
    await syncIconForTab(tabId);
    await sendToTab(tabId, { type: "SET_ACTIVE", active: false }, MAIN_FRAME_ID);
    console.warn(
      "[Element Copier] pick mode activation failed on tab",
      tabId,
      windowId ?? ""
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

async function deactivateTab(tabId, windowId) {
  if (!getTabActiveState(tabId)) return;
  setTabActiveState(tabId, false);
  clearBlockedBadgeState(tabId);
  setCopiedBadge(tabId, false);
  await syncIconForTab(tabId);
  await syncToolbarBadge(tabId);
  await setTabActive(tabId, false, windowId);
}

async function activateTab(tabId, windowId) {
  if (getTabActiveState(tabId)) {
    await setTabActive(tabId, true, windowId);
    return;
  }
  if (!await canOperateOnTab(tabId)) {
    setTabActiveState(tabId, false);
    await syncIconForTab(tabId);
    await showBlockedPageFeedback(tabId, windowId, "canOperateOnTab:activateTab");
    return;
  }
  setTabActiveState(tabId, true);
  clearBlockedBadgeState(tabId);
  setCopiedBadge(tabId, false);
  await syncIconForTab(tabId);
  await syncToolbarBadge(tabId);
  await setTabActive(tabId, true, windowId);
}

function isExtensionPanelSenderUrl(url) {
  if (!url) return false;
  return url.includes(PANEL_POPUP_PAGE) || url.includes("welcome.html");
}

async function resolvePickModeTabId(sender) {
  const senderUrl = sender.tab?.url;
  if (sender.tab?.id !== void 0 && !isExtensionPanelSenderUrl(senderUrl)) {
    return sender.tab.id;
  }
  const remembered = await readPanelTargetTabId();
  if (remembered !== void 0) return remembered;
  const tab = await getActiveCommandTab();
  return tab?.id;
}

async function getPickCopyTextForPanel(formatId, sender) {
  const fromStorage = await getPickCopyTextFromStorage(formatId);
  if (fromStorage !== void 0) return fromStorage;
  const tabId = await resolvePickModeTabId(sender);
  if (tabId === void 0) return void 0;
  try {
    const response = await ext.tabs.sendMessage(
      tabId,
      { type: "GET_PICK_COPY_TEXT", formatId },
      { frameId: MAIN_FRAME_ID }
    );
    if (!response?.ok || response.text === void 0) return void 0;
    return response.text;
  } catch {
    return void 0;
  }
}

function normalizeUrl(url) {
  if (!url) return void 0;
  try {
    return new URL(url).href;
  } catch {
    return void 0;
  }
}

async function openCachedUrl(targetUrl) {
  const normalizedUrl = normalizeUrl(targetUrl);
  if (!normalizedUrl) {
    return { ok: false };
  }
  try {
    await ext.tabs.create({ url: normalizedUrl });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

async function syncPickModeForPanelTab(_tab, sender) {
  const tabId = await resolvePickModeTabId(sender);
  if (tabId === void 0) return;
  await deactivateTab(tabId, sender.tab?.windowId);
}

function clearPickCopyLoadingTimer(tabId, requestId) {
  const current = pickCopyLoadingTimers.get(tabId);
  if (!current) return;
  if (requestId !== void 0 && current.requestId !== requestId) return;
  clearTimeout(current.timer);
  pickCopyLoadingTimers.delete(tabId);
}

function schedulePickCopyLoadingPanel(sender, requestId, startedAtMs) {
  const tabId = sender.tab?.id;
  if (tabId === void 0) return;
  clearPickCopyLoadingTimer(tabId);
  const elapsedMs = Math.max(0, Date.now() - startedAtMs);
  const delayMs = Math.max(0, PICK_LOADING_PANEL_DELAY_MS - elapsedMs);
  const timer = setTimeout(() => {
    const current = pickCopyLoadingTimers.get(tabId);
    if (!current || current.requestId !== requestId) return;
    pickCopyLoadingTimers.delete(tabId);
    void (async () => {
      const switched = await switchOpenPopupTab("loading");
      if (!switched) {
        openPanelFromSender("loading", sender.tab);
      }
    })();
  }, delayMs);
  pickCopyLoadingTimers.set(tabId, { requestId, timer });
}

async function switchOpenPopupTab(tab) {
  try {
    const response = await ext.runtime.sendMessage({
      type: "SET_POPUP_TAB",
      tab
    });
    return response?.ok === true;
  } catch {
    return false;
  }
}

async function toggleTab(tabId, windowId, tabUrl, source = "toolbar") {
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
    setCopiedBadge(tabId, false);
    await syncIconForTab(tabId);
    await syncToolbarBadge(tabId);
    await setTabActive(tabId, false, windowId);
    return;
  }
  if (source === "hotkey") {
    await activateTab(tabId, windowId);
    return;
  }
  if (tabUrl !== void 0 && isLikelyNonOperableTabUrl(tabUrl)) {
    await activateTab(tabId, windowId);
    return;
  }
  openStartPanelFromToolbar({ id: tabId, windowId });
  await deactivateTab(tabId, windowId);
}

function getActiveCommandTab() {
  return new Promise((resolve) => {
    ext.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.id !== void 0) {
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
  if (tab.id === void 0) return;
  if (shouldSuppressToolbarClickAfterHotkeyCommand()) {
    console.log("[Element Copier] toolbar click suppressed (after _execute_action)");
    return;
  }
  console.log("[Element Copier] toolbar click → toggleTab", tab.id);
  void toggleTab(tab.id, tab.windowId, tab.url);
});

registerBackgroundHotkeys({
  getActiveCommandTab,
  toggleTab
});

registerPrefixHintOperabilityListeners({
  canOperateOnTab,
  onBlockedOnTab: (tabId, windowId) => showBlockedPageFeedback(tabId, windowId, "prefixHint")
});

ext.contextMenus.onClicked.addListener((info, tab) => {
  const panelTab = findContextMenuTab(info.menuItemId);
  if (panelTab === void 0) return;
  void (async () => {
    await syncPickModeForPanelTab(panelTab, { tab });
    openPanelFromSender(panelTab, tab);
  })();
});

ext.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    if (isBlockedNoticeDismissedMessage(message)) {
      onBlockedNoticeDismissed(message.tabId);
      return;
    }
    const contentMessage = message;
    if (contentMessage.type === "ACTIVE_CHANGED" && sender.tab?.id !== void 0) {
      const tabId = sender.tab.id;
      onContentActiveChanged2(tabId, contentMessage.active);
      if (!contentMessage.active) {
        clearBlockedBadgeState(tabId);
      }
      void syncToolbarBadge(tabId);
    }
    if (contentMessage.type === "OPEN_PANEL") {
      if (contentMessage.tab === "copied") {
        void (async () => {
          if (contentMessage.formatId !== null) {
            if (contentMessage.panelAction === "download") {
              await setLastDownloadedFormat(contentMessage.formatId);
            } else {
              await setLastCopiedFormat(contentMessage.formatId);
            }
          } else {
            await setLastCopiedFormat(null);
          }
          await markCopiedPanelShowStatus();
          if (sender.tab?.id !== void 0) {
            clearPickCopyLoadingTimer(sender.tab.id);
            await rememberPanelTargetTab(sender.tab.id);
            setCopiedBadge(sender.tab.id, true);
            await syncToolbarBadge(sender.tab.id);
          }
          const switched = await switchOpenPopupTab("copied");
          if (!switched) {
            openCopiedPanelFromCopy(sender.tab);
          }
        })();
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
        if (tabId !== void 0) {
          setCopiedBadge(tabId, contentMessage.tab === "copied");
          await syncToolbarBadge(tabId);
        }
        await syncPickModeForPanelTab(contentMessage.tab, sender);
      })();
    }
    if (contentMessage.type === "PANEL_CLOSED") {
      void handlePanelSessionEnded();
    }
    if (contentMessage.type === "REQUEST_START_PICK_MODE") {
      void (async () => {
        const tabId = await resolvePickModeTabId(sender);
        if (tabId === void 0) return;
        await activateTab(tabId, sender.tab?.windowId);
      })();
    }
    if (contentMessage.type === "REQUEST_COPY_PAGE") {
      void (async () => {
        const tabId = await resolvePickModeTabId(sender);
        if (tabId === void 0) return;
        if (!await canOperateOnTab(tabId)) {
          await showBlockedPageFeedback(tabId, sender.tab?.windowId, "canOperateOnTab:copyPage");
          return;
        }
        await sendWithInject(tabId, { type: "COPY_PAGE" }, MAIN_FRAME_ID);
      })();
    }
    if (contentMessage.type === "WATCH_PIN_STATUS" && sender.tab?.id !== void 0) {
      watchWelcomePinStatus2(sender.tab.id);
    }
    if (contentMessage.type === "ELEMENT_PICKED") {
      const label = contentMessage.id ? `${contentMessage.tagName}#${contentMessage.id}` : contentMessage.className ? `${contentMessage.tagName}.${contentMessage.className.trim().split(/\s+/).slice(0, 3).join(".")}` : contentMessage.tagName;
      console.log("[Element Copier] element picked:", label);
    }
    if (contentMessage.type === "COPY_PICKED_FORMAT") {
      void (async () => {
        const text = await getPickCopyTextForPanel(contentMessage.formatId, sender);
        if (text === void 0) {
          sendResponse({ ok: false });
          return;
        }
        sendResponse({ ok: true, text });
      })();
      return true;
    }
    if (contentMessage.type === "OPEN_CACHED_URL") {
      void (async () => {
        const response = await openCachedUrl(contentMessage.url);
        sendResponse(response);
      })();
      return true;
    }
    if (contentMessage.type === "PICK_COPY_FLOW_STARTED") {
      schedulePickCopyLoadingPanel(
        sender,
        contentMessage.requestId,
        contentMessage.startedAtMs
      );
      return;
    }
    if (contentMessage.type === "PICK_COPY_FLOW_FINISHED" && sender.tab?.id !== void 0) {
      clearPickCopyLoadingTimer(sender.tab.id, contentMessage.requestId);
    }
  }
);

ext.runtime.onConnect.addListener((port) => {
  if (port.name !== PANEL_SESSION_PORT_NAME) return;
  port.onDisconnect.addListener(() => {
    void handlePanelSessionEnded();
  });
});

ext.tabs.onRemoved.addListener((tabId) => {
  clearPickCopyLoadingTimer(tabId);
  clearTabBadgeState(tabId);
  stopWelcomePinWatcher2(tabId);
});

registerToolbarPrefixBadgeListeners(canOperateOnTab);

registerExtensionIconStateListeners2();

ext.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.notificationSeconds || changes.locale) {
    void refreshRestrictedNoticeCache();
  }
  if (changes.locale) {
    void ensureContextMenu();
  }
  if (changes[PICK_COPY_CACHE_STORAGE_KEY] || changes[PICK_COPY_CACHE_INDEX_KEY]) {
    void refreshPickCopyCachePresenceSync();
    void ensureContextMenu();
  }
});

var onBootstrap = async () => {
  await ensureLocaleInStorage();
  await refreshPickCopyCachePresenceSync();
  await ensureContextMenu();
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
