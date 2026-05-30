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
import { createBadgeTextColorAnimation } from "../../lib/src/badge/text-color-animation";
import type {
  BgToContent,
  ContentActivationResponse,
  ContentToBg,
  CopyPickedFormatPanelResponse,
  GetPickCopyTextResponse,
} from "./messages";
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
  PANEL_SESSION_PORT_NAME,
  type PanelMenuTab,
  type PanelPopupTab,
} from "./panel-popup";
import { consumePanelSessionClose } from "./panel-popup/panel-session";
import {
  readPanelTargetTabId,
  rememberPanelTargetTab,
} from "./panel-popup/panel-target-tab";
import { isRtlLocale, t, type Locale } from "./i18n";
import type { Strings } from "./i18n/types";
import { setLastCopiedFormat } from "./settings/copied-session";
import { getSkipStartPage } from "./settings/skip-start-page";
import { ensureLocaleInStorage, getLocale } from "./storage";
import { showWelcome, stopWelcomePinWatcher, watchWelcomePinStatus } from "./welcome";

type ToggleSource = "toolbar" | "hotkey";

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
const BADGE_SELECTION_TEXT_COLOR_WHITE: readonly [number, number, number] = [255, 255, 255];
const BADGE_SELECTION_TEXT_COLOR_BLUE: readonly [number, number, number] = [1, 34, 146];
const BADGE_COPIED_TEXT = "✓";
const BADGE_BLOCKED_TEXT = "✕";
const BADGE_SELECTION_ANIMATION_STEPS = 40;
const BADGE_SELECTION_ANIMATION_STEP_MS = 25;

const selectionBadgeTextAnimation = createBadgeTextColorAnimation({
  startColor: BADGE_SELECTION_TEXT_COLOR_WHITE,
  endColor: BADGE_SELECTION_TEXT_COLOR_BLUE,
  steps: BADGE_SELECTION_ANIMATION_STEPS,
  stepIntervalMs: BADGE_SELECTION_ANIMATION_STEP_MS,
  mode: "ping-pong",
});

/**
 * Badge state priority (lib/SPEC/ui-badge.md):
 * 1) prefix letter (lib prefix badge; we only suppress/restore)
 * 2) cannot operate on page => ✕ (while blocked notice is shown)
 * 3) running => ◉
 * 4) off => no badge
 */

const tabBlockedBadge = new Map<number, boolean>();
const tabPrefixBadgeShown = new Map<number, boolean>();
const tabCopiedBadge = new Map<number, boolean>();
const blockedBadgeClearTimers = new Map<number, ReturnType<typeof setTimeout>>();
const selectionBadgeAnimationIntervals = new Map<number, ReturnType<typeof setInterval>>();
const selectionBadgeAnimationFrame = new Map<number, number>();

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

function clearSelectionBadgeAnimation(tabId: number): void {
  const interval = selectionBadgeAnimationIntervals.get(tabId);
  if (interval !== undefined) {
    clearInterval(interval);
    selectionBadgeAnimationIntervals.delete(tabId);
  }
  selectionBadgeAnimationFrame.delete(tabId);
}

function ensureSelectionBadgeAnimation(tabId: number): void {
  if (selectionBadgeAnimationIntervals.has(tabId)) return;
  selectionBadgeAnimationFrame.set(tabId, 0);
  selectionBadgeAnimationIntervals.set(
    tabId,
    setInterval(() => {
      if (!getTabActiveState(tabId)) {
        clearSelectionBadgeAnimation(tabId);
        return;
      }
      const currentFrame = selectionBadgeAnimationFrame.get(tabId) ?? 0;
      selectionBadgeAnimationFrame.set(
        tabId,
        selectionBadgeTextAnimation.nextFrame(currentFrame),
      );
      void syncToolbarBadge(tabId);
    }, selectionBadgeTextAnimation.stepIntervalMs),
  );
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
  if (tabPrefixBadgeShown.get(tabId)) {
    clearSelectionBadgeAnimation(tabId);
    return;
  }

  if (tabBlockedBadge.get(tabId)) {
    clearSelectionBadgeAnimation(tabId);
    await setToolbarBadge(
      tabId,
      BADGE_BLOCKED_TEXT,
      BADGE_BLOCKED_BACKGROUND_COLOR,
      BADGE_BLOCKED_TEXT_COLOR,
    );
    return;
  }

  if (getTabActiveState(tabId)) {
    ensureSelectionBadgeAnimation(tabId);
    const frame = selectionBadgeAnimationFrame.get(tabId) ?? 0;
    await setToolbarBadge(
      tabId,
      BADGE_SELECTION_TEXT,
      BADGE_SELECTION_BACKGROUND_COLOR,
      selectionBadgeTextAnimation.getColor(frame),
    );
    return;
  }

  if (tabCopiedBadge.get(tabId)) {
    clearSelectionBadgeAnimation(tabId);
    await setToolbarBadge(tabId, BADGE_COPIED_TEXT, BADGE_COPIED_BACKGROUND_COLOR);
    return;
  }

  clearSelectionBadgeAnimation(tabId);
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

async function clearPickCopyCacheOnTab(tabId: number): Promise<void> {
  try {
    await ext.tabs.sendMessage(
      tabId,
      { type: "CLEAR_PICK_COPY_CACHE" },
      { frameId: MAIN_FRAME_ID },
    );
  } catch {
    /* tab closed, navigated, or content script unavailable */
  }
}

async function handlePanelSessionEnded(): Promise<void> {
  if (!consumePanelSessionClose()) return;
  const tabId = await readPanelTargetTabId();
  if (tabId === undefined) return;
  tabCopiedBadge.set(tabId, false);
  await syncToolbarBadge(tabId);
  await clearPickCopyCacheOnTab(tabId);
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

/** Pick mode is off while any extension popup panel is open. */
async function syncPickModeForPanelTab(
  _tab: PanelPopupTab,
  sender: chrome.runtime.MessageSender,
): Promise<void> {
  const tabId = await resolvePickModeTabId(sender);
  if (tabId === undefined) return;
  await deactivateTab(tabId, sender.tab?.windowId);
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
    tabCopiedBadge.set(tabId, false);
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

  const skipStartPage = await getSkipStartPage();
  if (skipStartPage) {
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

const CONTEXT_MENU_LANGUAGE = "element-copier-language";
const CONTEXT_MENU_SETTINGS = "element-copier-settings";
const CONTEXT_MENU_SHORTCUTS = "element-copier-shortcuts";
const CONTEXT_MENU_ABOUT = "element-copier-about";

const ACTION_MENU_EMOJI = {
  language: "🌐",
  settings: "⚙️",
  shortcuts: "⌨️",
  about: "ℹ️",
} as const;

const CONTEXT_MENU_ITEMS: readonly {
  id: string;
  tab: PanelMenuTab;
  emoji: string;
  title: (strings: Strings) => string;
}[] = [
  {
    id: CONTEXT_MENU_LANGUAGE,
    tab: "language",
    emoji: ACTION_MENU_EMOJI.language,
    title: (strings) => strings.tabLanguage,
  },
  {
    id: CONTEXT_MENU_SETTINGS,
    tab: "settings",
    emoji: ACTION_MENU_EMOJI.settings,
    title: (strings) => strings.pageSettingsTitle,
  },
  {
    id: CONTEXT_MENU_SHORTCUTS,
    tab: "shortcuts",
    emoji: ACTION_MENU_EMOJI.shortcuts,
    title: (strings) => strings.tabShortcuts,
  },
  {
    id: CONTEXT_MENU_ABOUT,
    tab: "about",
    emoji: ACTION_MENU_EMOJI.about,
    title: (strings) => strings.tabAbout,
  },
];

type ContextMenuCreateProps = chrome.contextMenus.CreateProperties;

let ensureContextMenuChain: Promise<void> = Promise.resolve();

async function createContextMenuItem(props: ContextMenuCreateProps): Promise<void> {
  try {
    await ext.contextMenus.create(props);
  } catch (err) {
    console.error("[Element Copier] contextMenus.create failed:", err, props);
  }
}

function actionMenuTitle(title: string, emoji: string, locale: Locale): string {
  // RTL labels + leading LTR emoji reorder inconsistently in native menus (bidi).
  return isRtlLocale(locale) ? `${title} ${emoji}` : `${emoji} ${title}`;
}

async function ensureContextMenu(): Promise<void> {
  ensureContextMenuChain = ensureContextMenuChain.then(async () => {
    const locale = await getLocale();
    const strings = t(locale);

    try {
      await ext.contextMenus.removeAll();
    } catch (err) {
      console.error("[Element Copier] contextMenus.removeAll failed:", err);
    }

    for (const item of CONTEXT_MENU_ITEMS) {
      await createContextMenuItem({
        id: item.id,
        title: actionMenuTitle(item.title(strings), item.emoji, locale),
        contexts: ["action"],
      });
    }
  });

  await ensureContextMenuChain;
}

function findContextMenuTab(menuItemId: string | number): PanelMenuTab | undefined {
  return CONTEXT_MENU_ITEMS.find((item) => item.id === menuItemId)?.tab;
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
    sendResponse: (response: CopyPickedFormatPanelResponse) => void,
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
          await setLastCopiedFormat(contentMessage.formatId);
          if (sender.tab?.id !== undefined) {
            await rememberPanelTargetTab(sender.tab.id);
            tabCopiedBadge.set(sender.tab.id, true);
            await syncToolbarBadge(sender.tab.id);
          }
          openCopiedPanelFromCopy(sender.tab);
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
          tabCopiedBadge.set(tabId, contentMessage.tab === "copied");
          await syncToolbarBadge(tabId);
          if (contentMessage.tab !== "copied") {
            await clearPickCopyCacheOnTab(tabId);
          }
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
        const tabId = await resolvePickModeTabId(sender);
        if (tabId === undefined) {
          sendResponse({ ok: false });
          return;
        }
        const msg: BgToContent = {
          type: "GET_PICK_COPY_TEXT",
          formatId: contentMessage.formatId,
        };
        try {
          const response = await ext.tabs.sendMessage<BgToContent, GetPickCopyTextResponse>(
            tabId,
            msg,
            { frameId: MAIN_FRAME_ID },
          );
          if (!response?.ok || !response.text) {
            sendResponse({ ok: false });
            return;
          }
          sendResponse({ ok: true, text: response.text });
        } catch {
          sendResponse({ ok: false });
        }
      })();
      return true;
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
  clearBlockedBadgeTimer(tabId);
  clearSelectionBadgeAnimation(tabId);
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
  if (changes.locale) {
    void ensureContextMenu();
  }
});

const onBootstrap = async (): Promise<void> => {
  await ensureLocaleInStorage();
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
