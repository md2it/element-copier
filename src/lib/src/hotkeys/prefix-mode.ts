import {
  isPrefixActionKeyEvent,
  isPrefixChordHeld,
  isPrefixChordKeyEvent,
  PREFIX_ACTION_TIMEOUT_MS,
  PREFIX_DOUBLE_ACTION_WINDOW_MS,
} from "./keys";
import type { PrefixHintSink } from "./prefix-hint";

export type PrefixModeController = {
  onPrefixChordKeyDown: (e: KeyboardEvent) => void;
  onPrefixChordKeyUp: (e: KeyboardEvent) => void;
  onPrefixActionKeyDown: (e: KeyboardEvent) => void;
  /** @deprecated Manifest chord without content listener; prefer content-only prefix. */
  prepareAwaitAction: (letter?: string) => void;
  arm: (letter: string) => void;
  disarm: () => void;
};

export type PrefixModeOptions = {
  hintLetter: string;
  hint: PrefixHintSink;
  isEnabled: () => Promise<boolean>;
  /** When set, prefix badge arms only if this resolves true (page operability). */
  canShowPrefixHint?: () => Promise<boolean>;
  /** Blocked-page feedback when the user presses the action letter. */
  onPrefixHintBlocked?: () => void;
  onAction: () => void;
  /** Second press on the action letter within the double-tap window (optional). */
  onDoubleAction?: () => void;
  doubleActionWindowMs?: number;
};

/** Prefix chord → release → action letter within {@link PREFIX_ACTION_TIMEOUT_MS}. */
export function createPrefixModeController(
  options: PrefixModeOptions,
): PrefixModeController {
  let armed = false;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let singleActionTimeoutId: ReturnType<typeof setTimeout> | undefined;
  let chordHeld = false;
  let awaitingRelease = false;
  let firstActionPressAt = 0;

  const doubleActionWindowMs =
    options.doubleActionWindowMs ?? PREFIX_DOUBLE_ACTION_WINDOW_MS;

  const clearTimeoutIfAny = (): void => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };

  const clearSingleActionTimeout = (): void => {
    if (singleActionTimeoutId !== undefined) {
      clearTimeout(singleActionTimeoutId);
      singleActionTimeoutId = undefined;
    }
  };

  const disarm = (): void => {
    armed = false;
    awaitingRelease = false;
    chordHeld = false;
    firstActionPressAt = 0;
    clearTimeoutIfAny();
    clearSingleActionTimeout();
    options.hint.hide();
  };

  const canOperateOnPage = async (): Promise<boolean> =>
    !options.canShowPrefixHint || (await options.canShowPrefixHint());

  const tryArmAfterPrefixRelease = (): void => {
    void (async () => {
      if (!(await options.isEnabled())) {
        options.hint.hide();
        return;
      }
      if (!(await canOperateOnPage())) {
        options.hint.hide();
        return;
      }
      arm(options.hintLetter);
    })();
  };

  const arm = (letter: string): void => {
    clearTimeoutIfAny();
    armed = true;
    options.hint.show(letter);
    timeoutId = setTimeout(() => {
      disarm();
    }, PREFIX_ACTION_TIMEOUT_MS);
  };

  const onPrefixChordKeyDown = (e: KeyboardEvent): void => {
    if (!isPrefixChordKeyEvent(e)) return;
    chordHeld = true;
  };

  const onPrefixChordKeyUp = (e: KeyboardEvent): void => {
    if (!chordHeld && !awaitingRelease) return;
    if (isPrefixChordHeld(e)) return;
    chordHeld = false;
    awaitingRelease = false;
    clearTimeoutIfAny();
    tryArmAfterPrefixRelease();
  };

  const prepareAwaitAction = (_letter = options.hintLetter): void => {
    clearTimeoutIfAny();
    armed = false;
    chordHeld = false;
    awaitingRelease = false;
    tryArmAfterPrefixRelease();
  };

  const fireSingleAction = (): void => {
    clearSingleActionTimeout();
    firstActionPressAt = 0;
    disarm();
    options.onAction();
  };

  const fireDoubleAction = (): void => {
    clearSingleActionTimeout();
    firstActionPressAt = 0;
    disarm();
    options.onDoubleAction?.();
  };

  const onPrefixActionKeyDown = (e: KeyboardEvent): void => {
    if (!isPrefixActionKeyEvent(e, options.hintLetter)) return;
    if (e.repeat) return;

    void (async () => {
      if (!(await options.isEnabled())) return;

      const canOperate = await canOperateOnPage();

      if (!armed) {
        if (!canOperate) {
          e.preventDefault();
          e.stopPropagation();
          options.hint.hide();
          options.onPrefixHintBlocked?.();
        }
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      if (!canOperate) {
        disarm();
        options.onPrefixHintBlocked?.();
        return;
      }

      if (!options.onDoubleAction) {
        disarm();
        options.onAction();
        return;
      }

      const now = Date.now();
      if (
        firstActionPressAt > 0 &&
        now - firstActionPressAt < doubleActionWindowMs
      ) {
        fireDoubleAction();
        return;
      }

      firstActionPressAt = now;
      clearSingleActionTimeout();
      clearTimeoutIfAny();
      timeoutId = setTimeout(() => {
        disarm();
      }, PREFIX_ACTION_TIMEOUT_MS);
      singleActionTimeoutId = setTimeout(() => {
        singleActionTimeoutId = undefined;
        if (!armed) return;
        fireSingleAction();
      }, doubleActionWindowMs);
    })();
  };

  return {
    onPrefixChordKeyDown,
    onPrefixChordKeyUp,
    onPrefixActionKeyDown,
    prepareAwaitAction,
    arm,
    disarm,
  };
}
