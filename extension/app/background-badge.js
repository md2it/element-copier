import { COPIER_ACTIVE_COLOR } from "./brand.js";
import { createBadgeTextColorAnimation } from "../lib/our/badge/text-color-animation.js";
import { ext } from "../lib/our/api.js";
import { getRestrictedNoticeDismissMs, showRestrictedNotice } from "./page-operability/notice.js";
import { getTabActiveState } from "../lib/our/extension-icon-state/tab-active-state.js";
import { registerPrefixHintBadgeListeners } from "../lib/our/hotkeys/prefix-hint-badge.js";

var BADGE_TEXT_COLOR = "#ffffff";

var BADGE_PREFIX_BACKGROUND_COLOR = "#ffffff";

var BADGE_PREFIX_TEXT_COLOR = COPIER_ACTIVE_COLOR;

var BADGE_SELECTION_BACKGROUND_COLOR = COPIER_ACTIVE_COLOR;

var BADGE_COPIED_BACKGROUND_COLOR = "#008000";

var BADGE_BLOCKED_BACKGROUND_COLOR = "#d3d3d3";

var BADGE_BLOCKED_TEXT_COLOR = "#4a4a4a";

var BADGE_SELECTION_TEXT = "◉";

var BADGE_SELECTION_TEXT_COLOR_WHITE = [255, 255, 255];

var BADGE_SELECTION_TEXT_COLOR_BLUE = [1, 34, 146];

var BADGE_COPIED_TEXT = "✓";

var BADGE_BLOCKED_TEXT = "✕";

var BADGE_SELECTION_ANIMATION_STEPS = 40;

var BADGE_SELECTION_ANIMATION_STEP_MS = 25;

var selectionBadgeTextAnimation = createBadgeTextColorAnimation({
  startColor: BADGE_SELECTION_TEXT_COLOR_WHITE,
  endColor: BADGE_SELECTION_TEXT_COLOR_BLUE,
  steps: BADGE_SELECTION_ANIMATION_STEPS,
  stepIntervalMs: BADGE_SELECTION_ANIMATION_STEP_MS,
  mode: "ping-pong"
});

var tabBlockedBadge = /* @__PURE__ */ new Map();

var tabPrefixBadgeShown = /* @__PURE__ */ new Map();

var tabCopiedBadge = /* @__PURE__ */ new Map();

var blockedBadgeClearTimers = /* @__PURE__ */ new Map();

var selectionBadgeAnimationIntervals = /* @__PURE__ */ new Map();

var selectionBadgeAnimationFrame = /* @__PURE__ */ new Map();

function clearBlockedBadgeTimer(tabId) {
  const timer = blockedBadgeClearTimers.get(tabId);
  if (timer === void 0) return;
  clearTimeout(timer);
  blockedBadgeClearTimers.delete(tabId);
}

function clearBlockedBadgeState(tabId) {
  clearBlockedBadgeTimer(tabId);
  tabBlockedBadge.set(tabId, false);
}

function clearSelectionBadgeAnimation(tabId) {
  const interval = selectionBadgeAnimationIntervals.get(tabId);
  if (interval !== void 0) {
    clearInterval(interval);
    selectionBadgeAnimationIntervals.delete(tabId);
  }
  selectionBadgeAnimationFrame.delete(tabId);
}

function ensureSelectionBadgeAnimation(tabId) {
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
        selectionBadgeTextAnimation.nextFrame(currentFrame)
      );
      void syncToolbarBadge(tabId);
    }, selectionBadgeTextAnimation.stepIntervalMs)
  );
}

function onBlockedNoticeDismissed(tabId) {
  if (!tabBlockedBadge.get(tabId)) return;
  clearBlockedBadgeState(tabId);
  void syncToolbarBadge(tabId);
}

function scheduleClearBlockedBadge(tabId, dismissMs) {
  clearBlockedBadgeTimer(tabId);
  blockedBadgeClearTimers.set(
    tabId,
    setTimeout(() => {
      blockedBadgeClearTimers.delete(tabId);
      if (!tabBlockedBadge.get(tabId)) return;
      clearBlockedBadgeState(tabId);
      void syncToolbarBadge(tabId);
    }, dismissMs)
  );
}

async function showBlockedPageFeedback(tabId, windowId, reason) {
  console.debug("[Element Copier] page blocked:", reason ?? "unknown", tabId);
  tabBlockedBadge.set(tabId, true);
  await syncToolbarBadge(tabId);
  const dismissMs = await getRestrictedNoticeDismissMs();
  await showRestrictedNotice(tabId, windowId);
  scheduleClearBlockedBadge(tabId, dismissMs);
}

async function setToolbarBadge(tabId, text, backgroundColor = BADGE_SELECTION_BACKGROUND_COLOR, textColor = BADGE_TEXT_COLOR) {
  try {
    if (text) {
      await ext.action.setBadgeBackgroundColor({ tabId, color: backgroundColor });
      const setBadgeTextColor = ext.action.setBadgeTextColor;
      await setBadgeTextColor?.({ tabId, color: textColor });
    }
    await ext.action.setBadgeText({ tabId, text });
  } catch (err) {
    console.debug("[Element Copier] setBadgeText failed:", err);
  }
}

async function syncToolbarBadge(tabId) {
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
      BADGE_BLOCKED_TEXT_COLOR
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
      selectionBadgeTextAnimation.getColor(frame)
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

function setCopiedBadge(tabId, shown) {
  tabCopiedBadge.set(tabId, shown);
}

function clearTabBadgeState(tabId) {
  clearBlockedBadgeTimer(tabId);
  clearSelectionBadgeAnimation(tabId);
  tabBlockedBadge.delete(tabId);
  tabPrefixBadgeShown.delete(tabId);
  tabCopiedBadge.delete(tabId);
}

function registerToolbarPrefixBadgeListeners(canShowPrefixBadgeOnTab2) {
  registerPrefixHintBadgeListeners({
    badgeBackgroundColor: BADGE_PREFIX_BACKGROUND_COLOR,
    badgeTextColor: BADGE_PREFIX_TEXT_COLOR,
    canShowPrefixBadgeOnTab: canShowPrefixBadgeOnTab2,
    onShow: (tabId) => {
      if (tabId === void 0) return;
      tabPrefixBadgeShown.set(tabId, true);
    },
    onHide: (tabId) => {
      if (tabId === void 0) return;
      tabPrefixBadgeShown.set(tabId, false);
      void syncToolbarBadge(tabId);
    }
  });
}

export { BADGE_BLOCKED_BACKGROUND_COLOR, BADGE_BLOCKED_TEXT, BADGE_BLOCKED_TEXT_COLOR, BADGE_COPIED_BACKGROUND_COLOR, BADGE_COPIED_TEXT, BADGE_PREFIX_BACKGROUND_COLOR, BADGE_PREFIX_TEXT_COLOR, BADGE_SELECTION_ANIMATION_STEPS, BADGE_SELECTION_ANIMATION_STEP_MS, BADGE_SELECTION_BACKGROUND_COLOR, BADGE_SELECTION_TEXT, BADGE_SELECTION_TEXT_COLOR_BLUE, BADGE_SELECTION_TEXT_COLOR_WHITE, BADGE_TEXT_COLOR, blockedBadgeClearTimers, clearBlockedBadgeState, clearBlockedBadgeTimer, clearSelectionBadgeAnimation, clearTabBadgeState, ensureSelectionBadgeAnimation, onBlockedNoticeDismissed, registerToolbarPrefixBadgeListeners, scheduleClearBlockedBadge, selectionBadgeAnimationFrame, selectionBadgeAnimationIntervals, selectionBadgeTextAnimation, setCopiedBadge, setToolbarBadge, showBlockedPageFeedback, syncToolbarBadge, tabBlockedBadge, tabCopiedBadge, tabPrefixBadgeShown };
