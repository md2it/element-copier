export {
  clearTabActiveState,
  deleteTabActiveState,
  forEachActiveTabId,
  getTabActiveState,
  setTabActiveState,
} from "./tab-active-state";
export { createIconSync, type IconSyncApi } from "./icon-sync";
export {
  onContentActiveChanged,
  registerExtensionIconStateListeners,
} from "./listeners";
export { createExtensionIconState } from "./create";
export type {
  ExtensionIconStateConfig,
  ToolbarIconImageSets,
  ToolbarIconMode,
  ToolbarIconPaths,
} from "./types";
