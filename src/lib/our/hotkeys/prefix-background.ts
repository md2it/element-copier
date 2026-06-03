import { ext } from "../api";
import { registerPrefixHintBadgeListeners } from "./prefix-hint-badge";
import type { ToggleCommandSuppressTracker } from "./suppress";

/** Manifest command that also fires `action.onClicked` (suppress duplicate toggle). */
export const EXECUTE_ACTION_COMMAND = "_execute_action";

export type PrefixBackgroundHotkeysConfig = {
  badgeBackgroundColor?: string;
  getActiveCommandTab: () => Promise<chrome.tabs.Tab | undefined>;
  undoCommand?: string;
  isUndoCommandEnabled?: (tab: chrome.tabs.Tab) => Promise<boolean>;
  onUndoCommand?: (tab: chrome.tabs.Tab) => Promise<void>;
  isToggleEnabled: () => Promise<boolean>;
  toggleRequestMessageType: string;
  onToggleRequest: (tabId: number, windowId?: number) => Promise<void>;
  suppress: ToggleCommandSuppressTracker;
};

/** Background: optional undo manifest command + content `TOGGLE_REQUEST` (no manifest prefix chord). */
export function registerPrefixBackgroundHotkeys(
  config: PrefixBackgroundHotkeysConfig,
): void {
  registerPrefixHintBadgeListeners({
    badgeBackgroundColor: config.badgeBackgroundColor,
  });

  ext.commands.onCommand.addListener((command) => {
    if (command === EXECUTE_ACTION_COMMAND) {
      config.suppress.stampToggleCommand();
      void (async () => {
        const tab = await config.getActiveCommandTab();
        if (tab?.id === undefined) return;
        if (!(await config.isToggleEnabled())) return;
        await config.onToggleRequest(tab.id, tab.windowId);
      })();
      return;
    }
    if (!config.undoCommand || command !== config.undoCommand) {
      return;
    }
    void (async () => {
      const tab = await config.getActiveCommandTab();
      if (tab?.id === undefined) return;
      if (config.isUndoCommandEnabled && !(await config.isUndoCommandEnabled(tab))) {
        return;
      }
      await config.onUndoCommand?.(tab);
    })();
  });

  ext.runtime.onMessage.addListener((message, sender): boolean | void => {
    const msg = message as { type?: string };
    if (msg.type !== config.toggleRequestMessageType || sender.tab?.id === undefined) {
      return;
    }
    const tabId = sender.tab.id;
    void (async () => {
      if (!(await config.isToggleEnabled())) return;
      await config.onToggleRequest(tabId, sender.tab?.windowId);
    })();
  });
}
