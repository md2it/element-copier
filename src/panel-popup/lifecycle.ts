import { sendToBackground } from "../messages";
import type { PanelPopupTab } from "./constants";

/** Sync pick mode with the visible panel tab (START on/off). */
export function notifyPanelTabChanged(tab: PanelPopupTab): void {
  sendToBackground({ type: "PANEL_TAB_CHANGED", tab });
}

/** START button — enable pick mode on the target page (popup closes separately). */
export function notifyStartPickMode(): void {
  sendToBackground({ type: "REQUEST_START_PICK_MODE" });
}

/** Notify background that popup/panel is closed. */
export function notifyPanelClosed(): void {
  sendToBackground({ type: "PANEL_CLOSED" });
}

export { copyPickedFormatFromPanel } from "./copy-picked-format";
