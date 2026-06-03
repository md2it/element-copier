import { ext } from "./api";
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
import { registerPrefixHintOperabilityListeners } from "./lib/src/hotkeys";
import {
  clearBlockedBadgeState,
  clearTabBadgeState,
  onBlockedNoticeDismissed,
  registerToolbarPrefixBadgeListeners,
  setCopiedBadge,
  showBlockedPageFeedback,
  syncToolbarBadge,
} from "./background-badge";
import type {
  BgToContent,
  ContentActivationResponse,
  ContentToBg,
  CopyPickedFormatPanelResponse,
  GetPickCopyTextResponse,
  OpenCachedUrlPanelResponse,
  SetPopupTabResponse,
} from "./messages";
import type { CopyFormatId } from "./formats/definitions";
import {
  getPickCopyTextFromStorage,
  PICK_COPY_CACHE_INDEX_KEY,
  PICK_COPY_CACHE_STORAGE_KEY,
  refreshPickCopyCachePresenceSync,
} from "./pick-mode/pick-copy-cache-storage";
import {
  canOperateOnTab,
  isBlockedNoticeDismissedMessage,
  refreshRestrictedNoticeCache,
} from "./page-operability";
import {
  openCopiedPanelFromCopy,
  openPanelFromSender,
  openStartPanelFromToolbar,
  PANEL_POPUP_PAGE,
  PANEL_SESSION_PORT_NAME,
  type PanelPopupTab,
} from "./panel-popup";
import { consumePanelSessionClose } from "./panel-popup/panel-session";
import {
  readPanelTargetTabId,
  rememberPanelTargetTab,
} from "./panel-popup/panel-target-tab";
import {
  ensureContextMenu,
  findContextMenuTab,
} from "./background-context-menu";
import {
  clearCopiedPanelShowStatus,
  markCopiedPanelShowStatus,
  setLastCopiedFormat,
  setLastDownloadedFormat,
} from "./settings/copied-session";
import { ensureLocaleInStorage } from "./storage";
import { showWelcome, stopWelcomePinWatcher, watchWelcomePinStatus } from "./welcome";

type ToggleSource = "toolbar" | "hotkey";

const TOGGLE_DEBOUNCE_MS = 80;
/** Pick UI runs in the top document only (content_scripts use all_frames). */
const MAIN_FRAME_ID = 0;
const PICK_LOADING_PANEL_DELAY_MS = 500;

type PickCopyLoadingTimerState = {
  requestId: string;
  timer: ReturnType<typeof setTimeout>;
};

const pickCopyLoadingTimers = new Map<number, PickCopyLoadingTimerState>();

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

async function handlePanelSessionEnded(): Promise<void> {
  await clearCopiedPanelShowStatus();
  if (!consumePanelSessionClose()) return;
  const tabId = await readPanelTargetTabId();
  if (tabId === undefined) return;
  setCopiedBadge(tabId, false);
  await syncToolbarBadge(tabId);
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
  setCopiedBadge(tabId, false);
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
  setCopiedBadge(tabId, false);
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

async function getPickCopyTextForPanel(
  formatId: CopyFormatId,
  sender: chrome.runtime.MessageSender,
): Promise<string | undefined> {
  const fromStorage = await getPickCopyTextFromStorage(formatId);
  if (fromStorage !== undefined) return fromStorage;

  const tabId = await resolvePickModeTabId(sender);
  if (tabId === undefined) return undefined;

  try {
    const response = await ext.tabs.sendMessage<BgToContent, GetPickCopyTextResponse>(
      tabId,
      { type: "GET_PICK_COPY_TEXT", formatId },
      { frameId: MAIN_FRAME_ID },
    );
    if (!response?.ok || response.text === undefined) return undefined;
    return response.text;
  } catch {
    return undefined;
  }
}

function normalizeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).href;
  } catch {
    return undefined;
  }
}

async function openCachedUrl(targetUrl: string): Promise<OpenCachedUrlPanelResponse> {
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

/** Pick mode is off while any extension popup panel is open. */
async function syncPickModeForPanelTab(
  _tab: PanelPopupTab,
  sender: chrome.runtime.MessageSender,
): Promise<void> {
  const tabId = await resolvePickModeTabId(sender);
  if (tabId === undefined) return;
  await deactivateTab(tabId, sender.tab?.windowId);
}

function clearPickCopyLoadingTimer(tabId: number, requestId?: string): void {
  const current = pickCopyLoadingTimers.get(tabId);
  if (!current) return;
  if (requestId !== undefined && current.requestId !== requestId) return;
  clearTimeout(current.timer);
  pickCopyLoadingTimers.delete(tabId);
}

function schedulePickCopyLoadingPanel(
  sender: chrome.runtime.MessageSender,
  requestId: string,
  startedAtMs: number,
): void {
  const tabId = sender.tab?.id;
  if (tabId === undefined) return;
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

async function switchOpenPopupTab(tab: PanelPopupTab): Promise<boolean> {
  try {
    const response = await ext.runtime.sendMessage<BgToContent, SetPopupTabResponse>({
      type: "SET_POPUP_TAB",
      tab,
    });
    return response?.ok === true;
  } catch {
    return false;
  }
}

async function toggleTab(
  tabId: number,
  windowId?: number,
  tabUrl?: string,
  source: ToggleSource = "toolbar",
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

  if (tabUrl !== undefined && isLikelyNonOperableTabUrl(tabUrl)) {
    await activateTab(tabId, windowId);
    return;
  }

  // Sync before first await — action.openPopup needs the toolbar user gesture.
  openStartPanelFromToolbar({ id: tabId, windowId } as chrome.tabs.Tab);
  await deactivateTab(tabId, windowId);
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

ext.contextMenus.onClicked.addListener((info, tab) => {
  const panelTab = findContextMenuTab(info.menuItemId);
  if (panelTab === undefined) return;
  void (async () => {
    await syncPickModeForPanelTab(panelTab, { tab });
    openPanelFromSender(panelTab, tab);
  })();
});

ext.runtime.onMessage.addListener(
  (
    message: ContentToBg | unknown,
    sender,
    sendResponse: (
      response: CopyPickedFormatPanelResponse | OpenCachedUrlPanelResponse,
    ) => void,
  ): boolean | void => {
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
          if (sender.tab?.id !== undefined) {
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
        if (tabId !== undefined) {
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
        if (tabId === undefined) return;
        await activateTab(tabId, sender.tab?.windowId);
      })();
    }
    if (contentMessage.type === "REQUEST_COPY_PAGE") {
      void (async () => {
        const tabId = await resolvePickModeTabId(sender);
        if (tabId === undefined) return;
        if (!(await canOperateOnTab(tabId))) {
          await showBlockedPageFeedback(tabId, sender.tab?.windowId, "canOperateOnTab:copyPage");
          return;
        }
        await sendWithInject(tabId, { type: "COPY_PAGE" }, MAIN_FRAME_ID);
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
    if (contentMessage.type === "COPY_PICKED_FORMAT") {
      void (async () => {
        const text = await getPickCopyTextForPanel(contentMessage.formatId, sender);
        if (text === undefined) {
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
        contentMessage.startedAtMs,
      );
      return;
    }
    if (contentMessage.type === "PICK_COPY_FLOW_FINISHED" && sender.tab?.id !== undefined) {
      clearPickCopyLoadingTimer(sender.tab.id, contentMessage.requestId);
    }
  },
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
  stopWelcomePinWatcher(tabId);
});

registerToolbarPrefixBadgeListeners(canOperateOnTab);

registerExtensionIconStateListeners();

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

const onBootstrap = async (): Promise<void> => {
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
