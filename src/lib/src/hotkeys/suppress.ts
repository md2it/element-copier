/** Ignore content toggle shortly after manifest toggle command (`_execute_action`). */
export const DEFAULT_TOGGLE_COMMAND_SUPPRESS_MS = 300;

export function shouldSuppressContentToggleAfterToggleCommand(
  lastAt: number,
  now: number,
  windowMs = DEFAULT_TOGGLE_COMMAND_SUPPRESS_MS,
): boolean {
  return lastAt > 0 && now - lastAt < windowMs;
}

export type ToggleCommandSuppressTracker = {
  stampToggleCommand: () => void;
  shouldSuppressContentToggle: (now?: number) => boolean;
  shouldSuppressToolbarClick: (now?: number) => boolean;
};

export function createToggleCommandSuppressTracker(
  windowMs = DEFAULT_TOGGLE_COMMAND_SUPPRESS_MS,
): ToggleCommandSuppressTracker {
  let lastToggleCommandAt = 0;

  return {
    stampToggleCommand: () => {
      lastToggleCommandAt = Date.now();
    },
    shouldSuppressContentToggle: (now = Date.now()) =>
      shouldSuppressContentToggleAfterToggleCommand(
        lastToggleCommandAt,
        now,
        windowMs,
      ),
    shouldSuppressToolbarClick: (now = Date.now()) =>
      shouldSuppressContentToggleAfterToggleCommand(
        lastToggleCommandAt,
        now,
        windowMs,
      ),
  };
}
