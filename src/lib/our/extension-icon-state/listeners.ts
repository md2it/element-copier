import { ext } from "../api";
import type { IconSyncApi } from "./icon-sync";
import {
  clearTabActiveState,
  deleteTabActiveState,
  setTabActiveState,
} from "./tab-active-state";

export function registerExtensionIconStateListeners(
  sync: IconSyncApi,
): void {
  ext.tabs.onRemoved.addListener((tabId) => {
    deleteTabActiveState(tabId);
    void sync.forgetIconSyncedTab(tabId);
  });

  ext.tabs.onActivated.addListener(({ tabId }) => {
    void sync.syncIconForTab(tabId);
  });

  ext.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === "loading" || changeInfo.url !== undefined) {
      clearTabActiveState(tabId);
    }

    if (changeInfo.url === undefined && changeInfo.status !== "complete") {
      return;
    }

    void sync.syncIconForTab(tabId);
  });
}

export function onContentActiveChanged(
  sync: IconSyncApi,
  tabId: number,
  active: boolean,
): void {
  setTabActiveState(tabId, active);
  void sync.syncIconForTab(tabId);
}
