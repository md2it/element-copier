import { ext } from "../api";
import { sendToBackground } from "../messages";
import { PANEL_SESSION_PORT_NAME, type PanelPopupTab } from "./constants";

/** Sync pick mode with the visible panel tab (START on/off). */
export function notifyPanelTabChanged(tab: PanelPopupTab): void {
  sendToBackground({ type: "PANEL_TAB_CHANGED", tab });
}

/** PICK ELEMENT — enable pick mode on the target page (popup closes separately). */
export function notifyStartPickMode(): void {
  sendToBackground({ type: "REQUEST_START_PICK_MODE" });
}

/** CAPTURE PAGE — copy `<html>` without pick mode (popup closes separately). */
export function notifyCopyPage(): void {
  sendToBackground({ type: "REQUEST_COPY_PAGE" });
}

/** Notify background that popup/panel is closed. */
export function notifyPanelClosed(): void {
  sendToBackground({ type: "PANEL_CLOSED" });
}

/** Keep a port open until the panel document is destroyed (reliable close signal). */
export function bindPanelSessionPort(): void {
  ext.runtime.connect({ name: PANEL_SESSION_PORT_NAME });
}

export { copyPickedFormatFromPanel } from "./copy-picked-format";
export { savePickedFormatFromPanel } from "./save-picked-format";
