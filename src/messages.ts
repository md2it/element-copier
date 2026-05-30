import type { PrefixHintContentToBg } from "../../lib/src/hotkeys/prefix-hint-messages";
import { ext } from "./api";
import type { CopyFormatId } from "./formats/definitions";
import type { PanelPopupTab } from "./panel-popup/constants";

export type BgToContent =
  | { type: "SET_ACTIVE"; active: boolean }
  | { type: "GET_PICK_COPY_TEXT"; formatId: CopyFormatId };

export type ContentToBg =
  | { type: "ACTIVE_CHANGED"; active: boolean }
  | { type: "OPEN_PANEL"; tab: "start" }
  | { type: "OPEN_PANEL"; tab: "copied"; formatId: CopyFormatId | null }
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
  | { type: "COPY_PICKED_FORMAT"; formatId: CopyFormatId }
  | PrefixHintContentToBg;

export type BgToWelcome = { type: "PIN_STATUS_CHANGED"; pinned: boolean };

export type ContentActivationResponse = { ok: boolean };

export type GetPickCopyTextResponse = { ok: boolean; text?: string };

/** Background → panel after fetching cached pick text from extension storage. */
export type CopyPickedFormatPanelResponse = { ok: boolean; text?: string };

export function sendToBackground(msg: ContentToBg): void {
  void ext.runtime.sendMessage(msg).catch(() => {
    /* extension reloaded */
  });
}

export const STORAGE_KEY = "notificationSeconds";
export const LOCALE_STORAGE_KEY = "locale";
export const LOCALE_USER_SELECTED_KEY = "localeUserSelected";
export const LOCALE_DETECT_VERSION_KEY = "localeDetectVersion";
export const LOCALE_DETECT_VERSION = 1;
export const START_HOTKEY_ENABLED_KEY = "startHotkeyEnabled";
export const ESC_HOTKEY_ENABLED_KEY = "escHotkeyEnabled";
/** Default off — pick mode starts from START button unless enabled. */
export const SKIP_START_PAGE_KEY = "skipStartPage";
/** Per-format enable flags for SETTINGS chips and COPIED buttons. */
export const ENABLED_FORMATS_KEY = "enabledFormats";
export const DEVELOPER_TOOLS_ENABLED_KEY = "developerToolsEnabled";
/** Default format saved to clipboard on copy (SETTINGS dropdown). */
export const CLIPBOARD_DEFAULT_FORMAT_KEY = "clipboardDefaultFormat";
/** Inline (data:) image handling for TEXT/MARKDOWN (SETTINGS dropdown). */
export const INLINE_IMAGES_KEY = "inlineImages";
export const DEFAULT_NOTIFICATION_SECONDS = 4;
