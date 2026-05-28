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

/** START button — enable pick mode on the target page (popup closes separately). */
export function notifyStartPickMode(): void {
  const msg: ContentToBg = { type: "REQUEST_START_PICK_MODE" };
  void ext.runtime.sendMessage(msg).catch(() => {
    /* extension reloaded */
  });
}

/** Notify background that popup/panel is closed. */
export function notifyPanelClosed(): void {
  const msg: ContentToBg = { type: "PANEL_CLOSED" };
  void ext.runtime.sendMessage(msg).catch(() => {
    /* extension reloaded */
  });
}
