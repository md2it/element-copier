import { TOOLBAR_ICON_PATHS } from "../icon-paths";
import { getToolbarIconSets } from "../icons";
import {
  clearTabActiveState,
  createExtensionIconState,
  deleteTabActiveState,
  forEachActiveTabId,
  getTabActiveState,
  setTabActiveState,
} from "../lib/src/extension-icon-state";
import { ICON_STATE_LOG_LABEL, ICON_SYNCED_TAB_IDS_KEY } from "./constants";

const iconState = createExtensionIconState({
  paths: TOOLBAR_ICON_PATHS,
  syncedTabIdsStorageKey: ICON_SYNCED_TAB_IDS_KEY,
  logLabel: ICON_STATE_LOG_LABEL,
  getImageSets: getToolbarIconSets,
});

export {
  clearTabActiveState,
  deleteTabActiveState,
  forEachActiveTabId,
  getTabActiveState,
  setTabActiveState,
};

export const {
  bootstrapToolbarIcons,
  forgetIconSyncedTab,
  onContentActiveChanged,
  registerExtensionIconStateListeners,
  setGlobalToolbarIcon,
  syncIconForTab,
} = iconState;
