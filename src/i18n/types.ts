export type Locale = "en";

export const LOCALES: readonly Locale[] = ["en"] as const;

export type Strings = {
  restrictedPageNotice: string;
  panelSubtitle: string;
  titleSettings: string;
  startButtonLabel: string;
  skipStartPageToggleLabel: string;
  settingsCopyDefaultLabel: string;
  settingsCopyDefaultNothing: string;
  settingsFormatsGroupLabel: string;
  formatOuterHtml: string;
  formatSelector: string;
  formatJsPath: string;
  formatComputedStyles: string;
  formatStyles: string;
  formatXPath: string;
  formatFullXPath: string;
  formatText: string;
  copiedTitle: string;
  copiedSubtitlePrefix: string;
  copiedSettingsLink: string;
  copiedFormatsGroupLabel: string;
  pageSettingsTitle: string;
  pageHistoryTitle: string;
  tabShortcuts: string;
  tabLanguage: string;
  shortcutsRunStopHeading: string;
  shortcutsStepPress: string;
  shortcutsStepOnMac: string;
  shortcutsStepRelease: string;
  shortcutsStepThenPress: string;
  shortcutsStopHeading: string;
  shortcutsSafetyLine1: string;
  shortcutsSafetyLine2: string;
  pagePlaceholderTodo: string;
  tabAbout: string;
  welcomePin: string;
  welcomePinStep1: string;
  welcomePinStep2: string;
  welcomePinStep3: string;
  aboutBullets: readonly string[];
  aboutProductName: string;
  aboutCreditAuthor: string;
};

export function isLocale(value: unknown): value is Locale {
  return value === "en";
}
