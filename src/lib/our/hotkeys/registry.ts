type WindowWithHotkeyHandlers = Window & {
  [key: string]: ((e: KeyboardEvent) => void) | undefined;
};

function handlerPropertyKey(namespace: string, slot: string): string {
  return `__${namespace}HotkeyHandler_${slot}`;
}

/** Replace a capture-phase `keydown` listener on `window` for the given slot. */
export function registerContentHotkey(
  namespace: string,
  slot: string,
  handler: (e: KeyboardEvent) => void,
): void {
  const win = window as unknown as WindowWithHotkeyHandlers;
  const key = handlerPropertyKey(namespace, slot);
  const prev = win[key];
  if (prev) {
    window.removeEventListener("keydown", prev, true);
  }
  win[key] = handler;
  window.addEventListener("keydown", handler, true);
}

/** Remove a capture-phase `keydown` listener registered for the slot, if any. */
export function unregisterContentHotkey(namespace: string, slot: string): void {
  const win = window as unknown as WindowWithHotkeyHandlers;
  const key = handlerPropertyKey(namespace, slot);
  const prev = win[key];
  if (!prev) return;
  window.removeEventListener("keydown", prev, true);
  win[key] = undefined;
}
