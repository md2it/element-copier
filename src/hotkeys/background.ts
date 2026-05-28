import {
  createToggleCommandSuppressTracker,
  registerPrefixBackgroundHotkeys,
} from "../../../lib/src/hotkeys";
import { COPIER_ACTIVE_COLOR } from "../brand";
import { getStartHotkeyEnabled } from "./settings";

const toggleCommandSuppress = createToggleCommandSuppressTracker();

/** Paired `action.onClicked` after manifest `_execute_action`. */
export function shouldSuppressToolbarClickAfterHotkeyCommand(
  now = Date.now(),
): boolean {
  return toggleCommandSuppress.shouldSuppressToolbarClick(now);
}

export type BackgroundHotkeysHost = {
  getActiveCommandTab: () => Promise<chrome.tabs.Tab | undefined>;
  toggleTab: (
    tabId: number,
    windowId?: number,
    tabUrl?: string,
    source?: "toolbar" | "hotkey",
  ) => Promise<void>;
};

/** Content prefix chord + `TOGGLE_REQUEST` after action letter (no manifest suggested_key). */
export function registerBackgroundHotkeys(host: BackgroundHotkeysHost): void {
  registerPrefixBackgroundHotkeys({
    badgeBackgroundColor: COPIER_ACTIVE_COLOR,
    getActiveCommandTab: host.getActiveCommandTab,
    isToggleEnabled: getStartHotkeyEnabled,
    toggleRequestMessageType: "TOGGLE_REQUEST",
    onToggleRequest: (tabId, windowId) =>
      host.toggleTab(tabId, windowId, undefined, "hotkey"),
    suppress: toggleCommandSuppress,
  });
}
