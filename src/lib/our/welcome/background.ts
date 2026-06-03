import { ext } from "../api";
import { isActionOnToolbar, onActionToolbarChanged } from "../pin";
import type { WelcomeData, WelcomePinWatchConfig, WelcomeTabConfig } from "./types";

const welcomePinWatchers = new Map<number, () => void>();

export function stopWelcomePinWatcher(tabId: number): void {
  welcomePinWatchers.get(tabId)?.();
  welcomePinWatchers.delete(tabId);
}

function notifyWelcomePinned(
  tabId: number,
  messageType: string,
): void {
  void ext.tabs
    .sendMessage(tabId, { type: messageType, pinned: true })
    .catch(() => {
      /* welcome tab closed */
    });
  stopWelcomePinWatcher(tabId);
}

export function watchWelcomePinStatus(
  tabId: number,
  config: WelcomePinWatchConfig,
): void {
  stopWelcomePinWatcher(tabId);

  void isActionOnToolbar(ext.action).then((pinned) => {
    if (pinned === true) notifyWelcomePinned(tabId, config.pinStatusChangedMessageType);
  });

  const stop = onActionToolbarChanged(ext.action, (pinned) => {
    if (!pinned) return;
    notifyWelcomePinned(tabId, config.pinStatusChangedMessageType);
  });
  welcomePinWatchers.set(tabId, stop);
}

export async function openWelcomeTab(
  config: WelcomeTabConfig,
  data: WelcomeData,
): Promise<void> {
  await ext.storage.session.set({
    [config.sessionDataKey]: data,
  });

  try {
    await ext.tabs.create({
      url: ext.runtime.getURL(config.pageHtml),
      active: true,
    });
  } catch (err) {
    console.error(`[${config.logLabel}] welcome tab failed:`, err);
  }
}
