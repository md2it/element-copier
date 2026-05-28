import type { PrefixHintContentToBg } from "../../lib/src/hotkeys/prefix-hint-messages";
import type { PanelPopupTab } from "./panel-popup/constants";

export type BgToContent = { type: "SET_ACTIVE"; active: boolean };

export type ContentToBg =
  | { type: "ACTIVE_CHANGED"; active: boolean }
  | { type: "OPEN_PANEL"; tab: "start" | "copied" }
  | { type: "PANEL_TAB_CHANGED"; tab: PanelPopupTab }
  | { type: "PANEL_CLOSED" }
  | { type: "REQUEST_START_PICK_MODE" }
  | { type: "WATCH_PIN_STATUS" }
  | { type: "TOGGLE_REQUEST" }
  | {
      type: "ELEMENT_PICKED";
      tagName: string;
      id: string;
      className: string;
    }
  | PrefixHintContentToBg;

export type BgToWelcome = { type: "PIN_STATUS_CHANGED"; pinned: boolean };

export type ContentActivationResponse = { ok: boolean };

export const STORAGE_KEY = "notificationSeconds";
export const LOCALE_STORAGE_KEY = "locale";
export const LOCALE_USER_SELECTED_KEY = "localeUserSelected";
export const LOCALE_DETECT_VERSION_KEY = "localeDetectVersion";
export const LOCALE_DETECT_VERSION = 1;
export const START_HOTKEY_ENABLED_KEY = "startHotkeyEnabled";
export const ESC_HOTKEY_ENABLED_KEY = "escHotkeyEnabled";
/** Default off — pick mode starts from START button unless enabled. */
export const SKIP_START_PAGE_KEY = "skipStartPage";
export const DEFAULT_NOTIFICATION_SECONDS = 4;
