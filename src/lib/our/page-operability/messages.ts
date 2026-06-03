export const BLOCKED_NOTICE_DISMISSED = "BLOCKED_NOTICE_DISMISSED" as const;

export type BlockedNoticeDismissedMessage = {
  type: typeof BLOCKED_NOTICE_DISMISSED;
  tabId: number;
};

export function isBlockedNoticeDismissedMessage(
  message: unknown,
): message is BlockedNoticeDismissedMessage {
  if (typeof message !== "object" || message === null) return false;
  const m = message as BlockedNoticeDismissedMessage;
  return m.type === BLOCKED_NOTICE_DISMISSED && typeof m.tabId === "number";
}
