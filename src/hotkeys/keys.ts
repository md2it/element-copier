import {
  ESCAPE_KEY_LABEL,
  formatPrefixChordLabel,
  isEditableKeyboardTarget,
  isEscapeKeyEvent,
  isPrefixChordKeyEvent,
} from "../lib/our/hotkeys";
import { PREFIX_ACTION_KEY } from "./commands";

export const ESC_HOTKEY_LABEL = ESCAPE_KEY_LABEL;

/** ABOUT panel step 1: Windows/Linux chord (always shown). */
export const ABOUT_PREFIX_CHORD_WIN_DISPLAY = "Ctrl+Shift+X";

/** ABOUT panel step 1: Mac chord in parentheses (always shown). */
export const ABOUT_PREFIX_CHORD_MAC_DISPLAY = "Cmd+Shift+X";

/** Prefix chord for settings (`kbd` before `→`). */
export function getStartHotkeyChordLabel(): string {
  return formatPrefixChordLabel();
}

/** Action letter for settings (`kbd` after `→`). */
export function getStartHotkeyActionLabel(): string {
  return PREFIX_ACTION_KEY.toUpperCase();
}

/** Full label for aria (chord + arrow + letter, no markup). */
export function getStartHotkeyAriaLabel(): string {
  return `${getStartHotkeyChordLabel()} → ${getStartHotkeyActionLabel()}`;
}

/** Ctrl/Cmd+Shift+X — prefix chord (page fallback). */
export function isStartHotkeyEvent(e: KeyboardEvent): boolean {
  return isPrefixChordKeyEvent(e);
}

/** Escape — exit copy mode (content listener, no manifest suggested_key). */
export function isEscHotkeyEvent(e: KeyboardEvent): boolean {
  return isEscapeKeyEvent(e);
}

export { isEditableKeyboardTarget };
