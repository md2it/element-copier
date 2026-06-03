import type { WelcomeTabConfig } from "../lib/our/welcome";

/** Extension page URL path (project root). */
export const WELCOME_PAGE = "welcome.html";

export const WELCOME_SESSION_DATA_KEY = "welcomeData";

export const WELCOME_TAB_CONFIG: WelcomeTabConfig = {
  pageHtml: WELCOME_PAGE,
  sessionDataKey: WELCOME_SESSION_DATA_KEY,
  logLabel: "Element Copier",
};

export const WELCOME_PIN_WATCH_CONFIG = {
  pinStatusChangedMessageType: "PIN_STATUS_CHANGED",
} as const;
