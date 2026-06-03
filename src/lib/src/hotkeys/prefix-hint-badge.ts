import { ext } from "../api";
import {
  isPrefixHintHideMessage,
  isPrefixHintShowMessage,
  PREFIX_HINT_HIDE,
  PREFIX_HINT_SHOW,
} from "./prefix-hint-messages";

/** Catalog default; matches former in-page hint color #012292. */
export const PREFIX_BADGE_BACKGROUND_COLOR = "#012292";
const PREFIX_BADGE_TEXT_COLOR = "#ffffff";

export async function showPrefixBadge(
  letter: string,
  tabId?: number,
  backgroundColor = PREFIX_BADGE_BACKGROUND_COLOR,
  textColor = PREFIX_BADGE_TEXT_COLOR,
): Promise<void> {
  const text = letter.toUpperCase().slice(0, 4);
  const tabDetails = tabId !== undefined ? { tabId } : {};

  try {
    await ext.action.setBadgeBackgroundColor({
      ...tabDetails,
      color: backgroundColor,
    });
    const setBadgeTextColor = (
      ext.action as typeof ext.action & {
        setBadgeTextColor?: (details: { tabId?: number; color: string }) => Promise<void>;
      }
    ).setBadgeTextColor;
    await setBadgeTextColor?.({ ...tabDetails, color: textColor });
    await ext.action.setBadgeText({ ...tabDetails, text });
  } catch (err) {
    console.warn("[prefix-hint] setBadgeText failed:", err);
  }
}

export async function hidePrefixBadge(tabId?: number): Promise<void> {
  const tabDetails = tabId !== undefined ? { tabId } : {};

  try {
    await ext.action.setBadgeText({ ...tabDetails, text: "" });
  } catch (err) {
    console.warn("[prefix-hint] clear badge failed:", err);
  }
}

let badgeListenersRegistered = false;
let badgeBackgroundColor = PREFIX_BADGE_BACKGROUND_COLOR;
let badgeTextColor = PREFIX_BADGE_TEXT_COLOR;
let canShowPrefixBadgeOnTab: ((tabId: number) => Promise<boolean>) | undefined;
let onShowCallbacks: Array<(tabId: number | undefined, letter: string) => void> =
  [];
let onHideCallbacks: Array<(tabId: number | undefined) => void> = [];

export type PrefixHintBadgeListenersOptions = {
  badgeBackgroundColor?: string;
  badgeTextColor?: string;
  /** When set, {@link PREFIX_HINT_SHOW} is ignored for inoperable tabs. */
  canShowPrefixBadgeOnTab?: (tabId: number) => Promise<boolean>;
  /**
   * Fires when the prefix badge is shown.
   * Useful to suppress other badge writers while armed.
   */
  onShow?: (tabId: number | undefined, letter: string) => void;
  /**
   * Fires when the prefix badge is cleared.
   * Useful to restore the default badge if extension is still active.
   */
  onHide?: (tabId: number | undefined) => void;
};

/** Handles {@link PREFIX_HINT_SHOW} / {@link PREFIX_HINT_HIDE} from content scripts. */
export function registerPrefixHintBadgeListeners(
  options: PrefixHintBadgeListenersOptions = {},
): void {
  if (options.badgeBackgroundColor !== undefined) {
    badgeBackgroundColor = options.badgeBackgroundColor;
  }
  if (options.badgeTextColor !== undefined) {
    badgeTextColor = options.badgeTextColor;
  }
  if (options.canShowPrefixBadgeOnTab !== undefined) {
    canShowPrefixBadgeOnTab = options.canShowPrefixBadgeOnTab;
  }
  if (options.onShow) onShowCallbacks.push(options.onShow);
  if (options.onHide) onHideCallbacks.push(options.onHide);

  if (badgeListenersRegistered) return;
  badgeListenersRegistered = true;

  ext.runtime.onMessage.addListener((message, sender): boolean | void => {
    const tabId = sender.tab?.id;

    if (isPrefixHintShowMessage(message)) {
      void (async () => {
        if (tabId !== undefined && canShowPrefixBadgeOnTab) {
          if (!(await canShowPrefixBadgeOnTab(tabId))) return;
        }
        for (const cb of onShowCallbacks) cb(tabId, message.letter);
        await showPrefixBadge(message.letter, tabId, badgeBackgroundColor, badgeTextColor);
      })();
      return;
    }

    if (isPrefixHintHideMessage(message)) {
      void (async () => {
        await hidePrefixBadge(tabId);
        for (const cb of onHideCallbacks) cb(tabId);
      })();
    }
  });
}

export { PREFIX_HINT_HIDE, PREFIX_HINT_SHOW };
