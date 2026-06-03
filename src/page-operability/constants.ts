import type { BlockedNoticeConfig } from "../lib/src/page-operability";

export const RESTRICTED_NOTICE_POPUP = "blocked-notice.html";

export const RESTRICTED_NOTICE_MIN_MS = 4000;

export const RESTRICTED_NOTICE_SESSION_KEY = "restrictedNotice";

export const RESTRICTED_NOTICE_CONFIG: BlockedNoticeConfig = {
  popupHtml: RESTRICTED_NOTICE_POPUP,
  sessionKey: RESTRICTED_NOTICE_SESSION_KEY,
  logLabel: "Element Copier",
};
