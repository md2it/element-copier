import { bootstrapWelcomePage } from "../lib/our/welcome";
import { isRtlLocale } from "../i18n";
import { WELCOME_SESSION_DATA_KEY } from "./constants";

void bootstrapWelcomePage({
  sessionDataKey: WELCOME_SESSION_DATA_KEY,
  localeStorageKey: "locale",
  localeUserSelectedKey: "localeUserSelected",
  pinStatusChangedMessageType: "PIN_STATUS_CHANGED",
  watchPinStatusMessageType: "WATCH_PIN_STATUS",
  isRtlLocale,
});
