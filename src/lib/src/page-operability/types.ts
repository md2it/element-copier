export type BlockedNoticePayload = {
  text: string;
  dismissMs: number;
  /** Tab that triggered the notice; used to clear toolbar badge on early dismiss. */
  tabId?: number;
};

/** Extension-specific paths and storage keys for the blocked-page notice popup. */
export type BlockedNoticeConfig = {
  popupHtml: string;
  sessionKey: string;
  logLabel: string;
};
