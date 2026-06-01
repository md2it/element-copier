import {
  notifyPrefixHintBlockedOnBackground,
  queryPrefixHintCanShowFromBackground,
  registerPrefixStartHotkey,
} from "../../../lib/src/hotkeys";
import { isEscHotkeyEvent } from "./keys";
import { PREFIX_ACTION_KEY } from "./commands";
import {
  registerContentHotkey,
  unregisterContentHotkey,
  type ContentHotkeySlot,
} from "./registry";
import { getEscHotkeyEnabled, getStartHotkeyEnabled } from "./settings";

const HOTKEY_NAMESPACE = "elementCopier";

let contentHotkeysMounted = false;

export type CopierContentHotkeysHost = {
  isActive: () => boolean;
  deactivate: () => void;
};

/** Ctrl/Cmd+Shift+X → C (top frame; no manifest suggested_key). */
export function registerCopierStartHotkey(
  requestToggle: () => void,
  requestCopyPage: () => void,
): void {
  registerPrefixStartHotkey({
    namespace: HOTKEY_NAMESPACE,
    hintLetter: PREFIX_ACTION_KEY,
    isEnabled: getStartHotkeyEnabled,
    canShowPrefixHint: queryPrefixHintCanShowFromBackground,
    onPrefixHintBlocked: notifyPrefixHintBlockedOnBackground,
    onAction: requestToggle,
    onDoubleAction: requestCopyPage,
  });
}

/** Page `keydown` handler: Esc off (top frame, only while active). */
export function mountCopierContentHotkeys(
  host: CopierContentHotkeysHost,
  slots: readonly ContentHotkeySlot[] = ["esc"],
): void {
  if (typeof window !== "undefined" && window.top !== window) return;
  if (contentHotkeysMounted) return;
  contentHotkeysMounted = true;

  if (slots.includes("esc")) {
    registerContentHotkey("esc", (e) => {
      if (!isEscHotkeyEvent(e)) return;
      if (!host.isActive()) return;
      void (async () => {
        if (!(await getEscHotkeyEnabled())) return;
        e.preventDefault();
        e.stopPropagation();
        host.deactivate();
      })();
    });
  }
}

export function unmountCopierContentHotkeys(
  slots: readonly ContentHotkeySlot[] = ["esc"],
): void {
  if (!contentHotkeysMounted) return;
  contentHotkeysMounted = false;
  for (const slot of slots) {
    unregisterContentHotkey(slot);
  }
}
