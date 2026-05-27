import { ext } from "../api";
import type { ContentToBg } from "../messages";
import type { PanelPopupTab } from "./constants";

/** Sync pick mode with the visible panel tab (START on/off). */
export function notifyPanelTabChanged(tab: PanelPopupTab): void {
  const msg: ContentToBg = { type: "PANEL_TAB_CHANGED", tab };
  void ext.runtime.sendMessage(msg).catch(() => {
    /* extension reloaded */
  });
}
