import { ext } from "../api";
import type { ToggleCommandSuppressTracker } from "./suppress";

export type ManifestCommandHotkeysHost = {
  getActiveCommandTab: () => Promise<chrome.tabs.Tab | undefined>;
  onToggleCommand: (tab: chrome.tabs.Tab) => Promise<void>;
  onUndoCommand?: (tab: chrome.tabs.Tab) => Promise<void>;
};

export type ManifestCommandHotkeysConfig = {
  toggleCommand: string;
  undoCommand?: string;
  /** Undo manifest command; omit to allow whenever undoCommand is set. */
  isUndoCommandEnabled?: (tab: chrome.tabs.Tab) => Promise<boolean>;
  isToggleEnabled: () => Promise<boolean>;
  toggleRequestMessageType?: string;
  onToggleRequest?: (tabId: number, windowId?: number) => Promise<void>;
  host: ManifestCommandHotkeysHost;
  suppress: ToggleCommandSuppressTracker;
};

/** Manifest commands + optional content-script toggle fallback message. */
export function registerManifestCommandHotkeys(
  config: ManifestCommandHotkeysConfig,
): void {
  ext.commands.onCommand.addListener((command) => {
    void (async () => {
      const tab = await config.host.getActiveCommandTab();
      if (tab?.id === undefined) return;

      if (command === config.toggleCommand) {
        config.suppress.stampToggleCommand();
        if (!(await config.isToggleEnabled())) return;
        await config.host.onToggleCommand(tab);
        return;
      }

      if (config.undoCommand && command === config.undoCommand) {
        if (config.isUndoCommandEnabled && !(await config.isUndoCommandEnabled(tab))) {
          return;
        }
        await config.host.onUndoCommand?.(tab);
      }
    })();
  });

  if (!config.toggleRequestMessageType || !config.onToggleRequest) {
    return;
  }

  ext.runtime.onMessage.addListener((message, sender): boolean | void => {
    const msg = message as { type?: string };
    if (msg.type !== config.toggleRequestMessageType || sender.tab?.id === undefined) {
      return;
    }
    const tabId = sender.tab.id;
    void (async () => {
      if (!(await config.isToggleEnabled())) return;
      if (config.suppress.shouldSuppressContentToggle()) return;
      await config.onToggleRequest!(tabId, sender.tab?.windowId);
    })();
  });
}
