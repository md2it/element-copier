/** Pin-onboarding helpers shared across catalog extensions. */

export type ActionPinApi = {
  getUserSettings?: () => Promise<{ isOnToolbar?: boolean }>;
  setUserSettings?: (settings: { isOnToolbar: boolean }) => Promise<void>;
  onUserSettingsChanged?: {
    addListener: (callback: (change: { isOnToolbar?: boolean }) => void) => void;
    removeListener: (callback: (change: { isOnToolbar?: boolean }) => void) => void;
  };
};

export async function isActionOnToolbar(action: ActionPinApi): Promise<boolean | null> {
  if (typeof action.getUserSettings !== "function") return null;
  try {
    const settings = await action.getUserSettings();
    return settings.isOnToolbar === true;
  } catch {
    return null;
  }
}

/** Best-effort pin; returns whether the action is on the toolbar after the attempt. */
export async function requestActionPin(action: ActionPinApi): Promise<boolean> {
  if (typeof action.setUserSettings === "function") {
    try {
      await action.setUserSettings({ isOnToolbar: true });
    } catch {
      /* browser may reject programmatic pin */
    }
  }

  const pinned = await isActionOnToolbar(action);
  return pinned === true;
}

export function onActionToolbarChanged(
  action: ActionPinApi,
  listener: (pinned: boolean) => void,
): () => void {
  const handler = (change: { isOnToolbar?: boolean }) => {
    if (typeof change.isOnToolbar === "boolean") {
      listener(change.isOnToolbar);
    }
  };

  if (typeof action.onUserSettingsChanged?.addListener === "function") {
    action.onUserSettingsChanged.addListener(handler);
    return () => {
      action.onUserSettingsChanged?.removeListener(handler);
    };
  }

  let stopped = false;
  const poll = async (): Promise<void> => {
    while (!stopped) {
      const pinned = await isActionOnToolbar(action);
      if (pinned === true) {
        listener(true);
        return;
      }
      await new Promise((resolve) => globalThis.setTimeout(resolve, 750));
    }
  };
  void poll();
  return () => {
    stopped = true;
  };
}
