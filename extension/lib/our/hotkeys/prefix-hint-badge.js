import { ext } from "../api.js";
import { isPrefixHintHideMessage, isPrefixHintShowMessage } from "./prefix-hint-messages.js";

var PREFIX_BADGE_BACKGROUND_COLOR = "#012292";

var PREFIX_BADGE_TEXT_COLOR = "#ffffff";

async function showPrefixBadge(letter, tabId, backgroundColor = PREFIX_BADGE_BACKGROUND_COLOR, textColor = PREFIX_BADGE_TEXT_COLOR) {
  const text = letter.toUpperCase().slice(0, 4);
  const tabDetails = tabId !== void 0 ? { tabId } : {};
  try {
    await ext.action.setBadgeBackgroundColor({
      ...tabDetails,
      color: backgroundColor
    });
    const setBadgeTextColor = ext.action.setBadgeTextColor;
    await setBadgeTextColor?.({ ...tabDetails, color: textColor });
    await ext.action.setBadgeText({ ...tabDetails, text });
  } catch (err) {
    console.debug("[prefix-hint] setBadgeText failed:", err);
  }
}

async function hidePrefixBadge(tabId) {
  const tabDetails = tabId !== void 0 ? { tabId } : {};
  try {
    await ext.action.setBadgeText({ ...tabDetails, text: "" });
  } catch (err) {
    console.debug("[prefix-hint] clear badge failed:", err);
  }
}

var badgeListenersRegistered = false;

var badgeBackgroundColor = PREFIX_BADGE_BACKGROUND_COLOR;

var badgeTextColor = PREFIX_BADGE_TEXT_COLOR;

var canShowPrefixBadgeOnTab;

var onShowCallbacks = [];

var onHideCallbacks = [];

function registerPrefixHintBadgeListeners(options = {}) {
  if (options.badgeBackgroundColor !== void 0) {
    badgeBackgroundColor = options.badgeBackgroundColor;
  }
  if (options.badgeTextColor !== void 0) {
    badgeTextColor = options.badgeTextColor;
  }
  if (options.canShowPrefixBadgeOnTab !== void 0) {
    canShowPrefixBadgeOnTab = options.canShowPrefixBadgeOnTab;
  }
  if (options.onShow) onShowCallbacks.push(options.onShow);
  if (options.onHide) onHideCallbacks.push(options.onHide);
  if (badgeListenersRegistered) return;
  badgeListenersRegistered = true;
  ext.runtime.onMessage.addListener((message, sender) => {
    const tabId = sender.tab?.id;
    if (isPrefixHintShowMessage(message)) {
      void (async () => {
        if (tabId !== void 0 && canShowPrefixBadgeOnTab) {
          if (!await canShowPrefixBadgeOnTab(tabId)) return;
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

export { PREFIX_BADGE_BACKGROUND_COLOR, PREFIX_BADGE_TEXT_COLOR, badgeBackgroundColor, badgeListenersRegistered, badgeTextColor, canShowPrefixBadgeOnTab, hidePrefixBadge, onHideCallbacks, onShowCallbacks, registerPrefixHintBadgeListeners, showPrefixBadge };
