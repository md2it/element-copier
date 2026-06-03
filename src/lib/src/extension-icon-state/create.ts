import { createIconSync } from "./icon-sync";
import {
  onContentActiveChanged as onContentActiveChangedImpl,
  registerExtensionIconStateListeners as registerListeners,
} from "./listeners";
import type { ExtensionIconStateConfig } from "./types";

export function createExtensionIconState(config: ExtensionIconStateConfig) {
  const sync = createIconSync(config);

  return {
    bootstrapToolbarIcons: sync.bootstrapToolbarIcons,
    forgetIconSyncedTab: sync.forgetIconSyncedTab,
    setGlobalToolbarIcon: sync.setGlobalToolbarIcon,
    syncIconForTab: sync.syncIconForTab,
    registerExtensionIconStateListeners: () => registerListeners(sync),
    onContentActiveChanged: (tabId: number, active: boolean) => {
      onContentActiveChangedImpl(sync, tabId, active);
    },
  };
}
