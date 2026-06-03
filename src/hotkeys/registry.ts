import {
  registerContentHotkey as registerLibContentHotkey,
  unregisterContentHotkey as unregisterLibContentHotkey,
} from "../lib/src/hotkeys";

const HOTKEY_NAMESPACE = "elementCopier";

export type ContentHotkeySlot = "esc";

/** Replace a capture-phase `keydown` listener on `window` for the given slot. */
export function registerContentHotkey(
  slot: ContentHotkeySlot,
  handler: (e: KeyboardEvent) => void,
): void {
  registerLibContentHotkey(HOTKEY_NAMESPACE, slot, handler);
}

export function unregisterContentHotkey(slot: ContentHotkeySlot): void {
  unregisterLibContentHotkey(HOTKEY_NAMESPACE, slot);
}
