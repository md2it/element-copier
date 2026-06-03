import { createContentPrefixHintSink } from "./prefix-hint-content";
import {
  createPrefixModeController,
  type PrefixModeController,
} from "./prefix-mode";
import { registerContentHotkey } from "./registry";

export type RegisterPrefixStartHotkeyOptions = {
  namespace: string;
  hintLetter: string;
  isEnabled: () => Promise<boolean>;
  canShowPrefixHint?: () => Promise<boolean>;
  onPrefixHintBlocked?: () => void;
  onAction: () => void;
  onDoubleAction?: () => void;
  doubleActionWindowMs?: number;
};

/** Page fallback: Ctrl/Cmd+Shift+X → hint on release → letter (top frame only). */
export function registerPrefixStartHotkey(
  options: RegisterPrefixStartHotkeyOptions,
): PrefixModeController | undefined {
  if (typeof window === "undefined" || window.top !== window) return undefined;

  const controller = createPrefixModeController({
    hintLetter: options.hintLetter,
    hint: createContentPrefixHintSink(),
    isEnabled: options.isEnabled,
    canShowPrefixHint: options.canShowPrefixHint,
    onPrefixHintBlocked: options.onPrefixHintBlocked,
    onAction: options.onAction,
    onDoubleAction: options.onDoubleAction,
    doubleActionWindowMs: options.doubleActionWindowMs,
  });

  registerContentHotkey(options.namespace, "prefix-chord", (e) => {
    controller.onPrefixChordKeyDown(e);
  });

  const onKeyUp = (e: KeyboardEvent): void => {
    controller.onPrefixChordKeyUp(e);
  };

  type WinWithPrefixKeyUp = Window & {
    [key: string]: ((e: KeyboardEvent) => void) | undefined;
  };
  const win = window as unknown as WinWithPrefixKeyUp;
  const keyUpProp = `__${options.namespace}_prefixKeyUp`;
  const prev = win[keyUpProp];
  if (prev) window.removeEventListener("keyup", prev, true);
  win[keyUpProp] = onKeyUp;
  window.addEventListener("keyup", onKeyUp, true);

  registerContentHotkey(options.namespace, "prefix-action", (e) => {
    controller.onPrefixActionKeyDown(e);
  });

  return controller;
}

export type { PrefixModeController } from "./prefix-mode";
