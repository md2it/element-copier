export type WelcomeAboutItem = {
  iconKind: string;
  iconHtml: string;
  text: string;
};

export type WelcomeLocalePayload = {
  locale: string;
  dir: "ltr" | "rtl";
  headerSubtitle: string;
  pinHeading: string;
  pinStep1: string;
  pinStep2: string;
  pinStep3: string;
  aboutHeading: string;
  aboutItems: WelcomeAboutItem[];
  langAriaLabel: string;
};

/** Serializable welcome payload written to session storage by the background script. */
export type WelcomeData = {
  extensionName: string;
  locale: string;
  dir: "ltr" | "rtl";
  headerLogoSvg?: string;
  headerTitle: string;
  headerSubtitle: string;
  iconSvg?: string;
  pinHeading: string;
  pinStep1: string;
  pinStep2: string;
  pinStep3: string;
  puzzleIcon: string;
  pinIcon: string;
  arrowUpIcon: string;
  pinHintIcon: string;
  heartIcon: string;
  isPinned: boolean;
  aboutHeading: string;
  aboutItems: WelcomeAboutItem[];
  hasAbout: boolean;
  hasLocales: boolean;
  locales?: readonly string[];
  localeLabels?: Record<string, string>;
  langAriaLabel?: string;
  perLocale?: Record<string, WelcomeLocalePayload>;
};

export type WelcomeTabConfig = {
  pageHtml: string;
  sessionDataKey: string;
  logLabel: string;
};

export type WelcomePageConfig = {
  sessionDataKey: string;
  localeStorageKey: string;
  localeUserSelectedKey: string;
  pinStatusChangedMessageType: string;
  watchPinStatusMessageType: string;
  isRtlLocale: (locale: string) => boolean;
};

export type WelcomePinWatchConfig = {
  pinStatusChangedMessageType: string;
};
