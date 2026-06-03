import type { PrefixHintContentToBg } from "./lib/our/hotkeys/prefix-hint-messages";
import { ext } from "./api";
import type { CopyFormatId } from "./formats/definitions";
import type { CopiedPanelActionKind } from "./settings/copied-session";
import type { PanelPopupTab } from "./panel-popup/constants";

export type BgToContent =
  | { type: "SET_ACTIVE"; active: boolean }
  | { type: "GET_PICK_COPY_TEXT"; formatId: CopyFormatId }
  | { type: "SET_POPUP_TAB"; tab: PanelPopupTab }
  | { type: "COPY_PAGE" };

export type ContentToBg =
  | { type: "ACTIVE_CHANGED"; active: boolean }
  | { type: "OPEN_PANEL"; tab: "start" }
  | { type: "OPEN_PANEL"; tab: "loading" }
  | { type: "OPEN_PANEL"; tab: "copied"; formatId: CopyFormatId | null; panelAction?: CopiedPanelActionKind }
  | { type: "PANEL_TAB_CHANGED"; tab: PanelPopupTab }
  | { type: "PANEL_CLOSED" }
  | { type: "REQUEST_START_PICK_MODE" }
  | { type: "REQUEST_COPY_PAGE" }
  | { type: "WATCH_PIN_STATUS" }
  | { type: "TOGGLE_REQUEST" }
  | {
      type: "ELEMENT_PICKED";
      tagName: string;
      id: string;
      className: string;
    }
  | { type: "COPY_PICKED_FORMAT"; formatId: CopyFormatId }
  | { type: "OPEN_CACHED_URL"; url: string }
  | { type: "PICK_COPY_FLOW_STARTED"; requestId: string; startedAtMs: number }
  | { type: "PICK_COPY_FLOW_FINISHED"; requestId: string }
  | PrefixHintContentToBg;

export type BgToWelcome = { type: "PIN_STATUS_CHANGED"; pinned: boolean };

export type ContentActivationResponse = { ok: boolean };

export type GetPickCopyTextResponse = { ok: boolean; text?: string };
export type SetPopupTabResponse = { ok: boolean };

/** Background → panel after fetching cached pick text from extension storage. */
export type CopyPickedFormatPanelResponse = { ok: boolean; text?: string };
export type OpenCachedUrlPanelResponse = { ok: boolean };

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
/** Per-format enable flags for SETTINGS chips and COPIED buttons. */
export const ENABLED_FORMATS_KEY = "enabledFormats";
export const DEVELOPER_TOOLS_ENABLED_KEY = "developerToolsEnabled";
/** Dark theme for extension panel UI (SETTINGS toggler). Default off. */
export const DARK_THEME_ENABLED_KEY = "darkThemeEnabled";
/** Default action on pick/capture (SETTINGS dropdown). Encoded as nothing | copy:formatId | download:formatId. */
export const CLIPBOARD_DEFAULT_FORMAT_KEY = "clipboardDefaultFormat";
/** Inline (data:) image handling for TEXT/MARKDOWN (SETTINGS dropdown). */
export const INLINE_IMAGES_KEY = "inlineImages";
/** Highlight frame label style in pick mode (SETTINGS dropdown). */
export const FRAME_LABEL_STYLE_KEY = "frameLabelStyle";
/** Skip image formats during snapshot when false (SETTINGS toggler). Default on. */
export const COMPUTE_IMAGES_ENABLED_KEY = "computeImagesEnabled";
export const DEFAULT_NOTIFICATION_SECONDS = 4;
