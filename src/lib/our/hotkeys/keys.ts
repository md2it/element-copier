import { isMacPlatform } from "./platform";

export const ESCAPE_KEY_LABEL = "Esc";

/** Catalog prefix chord: Ctrl/Cmd+Shift+X, then a letter within this window. */
export const PREFIX_ACTION_TIMEOUT_MS = 3000;

/** Max gap between two action-letter presses for a double-tap (ms). */
export const PREFIX_DOUBLE_ACTION_WINDOW_MS = 400;

export const PREFIX_CHORD_KEY = "x";

export function isEscapeKeyEvent(e: KeyboardEvent): boolean {
  return e.key === "Escape";
}

/** Physical KeyboardEvent.code for an A–Z letter (layout-independent). */
export function letterToCode(letter: string): string {
  return `Key${letter.toUpperCase()}`;
}

/** Match a single A–Z letter by physical key (code), fall back to key for older runtimes. */
export function isLetterKeyEvent(e: KeyboardEvent, letter: string): boolean {
  const expectedCode = letterToCode(letter);
  if (typeof e.code === "string" && e.code.length > 0) {
    return e.code === expectedCode;
  }
  return e.key.toLowerCase() === letter.toLowerCase();
}

export function isModifierShiftKeyEvent(
  e: KeyboardEvent,
  key: string,
  mac = isMacPlatform(),
): boolean {
  const modifier = mac ? e.metaKey : e.ctrlKey;
  return modifier && e.shiftKey && isLetterKeyEvent(e, key);
}

export function isModifierKeyEvent(
  e: KeyboardEvent,
  key: string,
  options: { shift?: boolean; alt?: boolean } = {},
  mac = isMacPlatform(),
): boolean {
  const modifier = mac ? e.metaKey : e.ctrlKey;
  const shift = options.shift ?? false;
  const alt = options.alt ?? false;
  return (
    modifier &&
    Boolean(e.shiftKey) === shift &&
    Boolean(e.altKey) === alt &&
    isLetterKeyEvent(e, key)
  );
}

export function formatModifierShiftKeyLabel(
  key: string,
  mac = isMacPlatform(),
): string {
  const mod = mac ? "⌘" : "Ctrl";
  return `${mod} + Shift + ${key.toUpperCase()}`;
}

export function formatModifierKeyLabel(
  key: string,
  mac = isMacPlatform(),
): string {
  const mod = mac ? "⌘" : "Ctrl";
  return `${mod} + ${key.toUpperCase()}`;
}

export function formatPrefixChordLabel(mac = isMacPlatform()): string {
  return formatModifierShiftKeyLabel(PREFIX_CHORD_KEY, mac);
}

export function formatPrefixHotkeyLabel(
  actionKey: string,
  mac = isMacPlatform(),
): string {
  return `${formatPrefixChordLabel(mac)} → ${actionKey.toUpperCase()}`;
}

export function isPrefixChordKeyEvent(
  e: KeyboardEvent,
  mac = isMacPlatform(),
): boolean {
  return isModifierShiftKeyEvent(e, PREFIX_CHORD_KEY, mac);
}

/** True while Ctrl/Cmd+Shift are still held after the chord key was pressed. */
export function isPrefixChordHeld(
  e: KeyboardEvent,
  mac = isMacPlatform(),
): boolean {
  const modifier = mac ? e.metaKey : e.ctrlKey;
  return modifier && e.shiftKey;
}

/** Second step of prefix mode: plain physical letter, no Ctrl/Meta/Alt (Shift tolerated). */
export function isPrefixActionKeyEvent(e: KeyboardEvent, key: string): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey) return false;
  return isLetterKeyEvent(e, key);
}

/** Skip hotkeys when the user is typing in a field (native shortcuts). */
export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return !!target.closest('[contenteditable=""], [contenteditable="true"]');
}
