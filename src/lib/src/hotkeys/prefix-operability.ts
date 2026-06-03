import { ext } from "../api";
import { probeDocumentOperability } from "../page-operability/probe";
import {
  PREFIX_HINT_BLOCKED,
  PREFIX_HINT_CAN_SHOW,
} from "./prefix-hint-messages";

export type PrefixHintOperabilityHandlers = {
  canOperateOnTab: (tabId: number) => Promise<boolean>;
  onBlockedOnTab?: (tabId: number, windowId?: number) => Promise<void>;
};

let operabilityListenersRegistered = false;

/** Background handlers for content prefix operability probes. */
export function registerPrefixHintOperabilityListeners(
  handlers: PrefixHintOperabilityHandlers,
): void {
  if (operabilityListenersRegistered) return;
  operabilityListenersRegistered = true;

  ext.runtime.onMessage.addListener((message, sender, sendResponse): boolean | void => {
    const tabId = sender.tab?.id;
    if (tabId === undefined) return;

    const msg = message as { type?: string };
    if (msg.type === PREFIX_HINT_CAN_SHOW) {
      void handlers.canOperateOnTab(tabId).then((ok) => {
        sendResponse(ok);
      });
      return true;
    }

    if (msg.type === PREFIX_HINT_BLOCKED) {
      void handlers.onBlockedOnTab?.(tabId, sender.tab?.windowId);
    }
  });
}

/** Content: probe DOM operability in this frame (no `scripting` permission needed). */
export async function queryPrefixHintCanShowInContent(): Promise<boolean> {
  return probeDocumentOperability();
}

/** Content: ask background whether the prefix hint badge may appear. */
export async function queryPrefixHintCanShowFromBackground(): Promise<boolean> {
  try {
    return (await ext.runtime.sendMessage({ type: PREFIX_HINT_CAN_SHOW })) === true;
  } catch {
    return false;
  }
}

/** Content: prefix action on a page where the extension cannot run. */
export function notifyPrefixHintBlockedOnBackground(): void {
  void ext.runtime.sendMessage({ type: PREFIX_HINT_BLOCKED }).catch(() => {
    // Background may be unavailable during teardown.
  });
}
