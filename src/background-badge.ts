import { ext } from "./api";
import { COPIER_ACTIVE_COLOR } from "./brand";
import { getTabActiveState } from "./extension-icon-state";
import {
  getRestrictedNoticeDismissMs,
  showRestrictedNotice,
} from "./page-operability";
import { registerPrefixHintBadgeListeners } from "./lib/our/hotkeys";
import { createBadgeTextColorAnimation } from "./lib/our/badge/text-color-animation";

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

export function clearBlockedBadgeState(tabId: number): void {
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

export function onBlockedNoticeDismissed(tabId: number): void {
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

export async function showBlockedPageFeedback(
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

export async function syncToolbarBadge(tabId: number): Promise<void> {
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

export function setCopiedBadge(tabId: number, shown: boolean): void {
  tabCopiedBadge.set(tabId, shown);
}

export function clearTabBadgeState(tabId: number): void {
  clearBlockedBadgeTimer(tabId);
  clearSelectionBadgeAnimation(tabId);
  tabBlockedBadge.delete(tabId);
  tabPrefixBadgeShown.delete(tabId);
  tabCopiedBadge.delete(tabId);
}

export function registerToolbarPrefixBadgeListeners(
  canShowPrefixBadgeOnTab: (tabId: number) => Promise<boolean>,
): void {
  registerPrefixHintBadgeListeners({
    badgeBackgroundColor: BADGE_PREFIX_BACKGROUND_COLOR,
    badgeTextColor: BADGE_PREFIX_TEXT_COLOR,
    canShowPrefixBadgeOnTab,
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
}
