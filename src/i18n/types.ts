export type Locale = "en" | "es" | "fr" | "de" | "ru" | "zh_CN" | "ar";

export const LOCALES: readonly Locale[] = [
  "en",
  "es",
  "fr",
  "de",
  "ru",
  "zh_CN",
  "ar",
] as const;

/** Button labels on SETTINGS (fixed order; row stays LTR in RTL panels). */
export const LOCALE_BUTTON_LABELS: Record<Locale, string> = {
  en: "EN",
  es: "ES",
  fr: "FR",
  de: "DE",
  ru: "RU",
  zh_CN: "中文",
  ar: "عربي",
};

export type Strings = {
  restrictedPageNotice: string;
  panelSubtitle: string;
  titleSettings: string;
  pickElementButtonLabel: string;
  capturePageButtonLabel: string;
  settingsDefaultActionLabel: string;
  settingsDefaultActionNothing: string;
  settingsDefaultActionCopyText: string;
  settingsDefaultActionCopyMarkdown: string;
  settingsDefaultActionCopyImage: string;
  settingsDefaultActionDownloadMarkdown: string;
  settingsDefaultActionDownloadHtml: string;
  settingsDefaultActionDownloadPng: string;
  settingsDefaultActionDownloadJpeg: string;
  settingsDefaultActionCopyCode: string;
  settingsDefaultActionCopySelector: string;
  settingsDefaultActionCopyJsPath: string;
  settingsDefaultActionCopyXPath: string;
  settingsDefaultActionCopyFullXPath: string;
  settingsDefaultActionCopyStyles: string;
  settingsDefaultActionCopyComputedStyles: string;
  settingsCopyDefaultNothing: string;
  settingsInlineImagesLabel: string;
  settingsInlineImagesUseAll: string;
  settingsInlineImagesRemoveLarge: string;
  settingsInlineImagesRemoveSmall: string;
  settingsInlineImagesRemoveAll: string;
  settingsInlineImagesInfoLabel: string;
  settingsInlineImagesInfo: string;
  infoWindowCloseLabel: string;
  settingsDeveloperToolsToggleLabel: string;
  settingsDarkThemeToggleLabel: string;
  formatCode: string;
  formatSelector: string;
  formatJsPath: string;
  formatComputedStyles: string;
  formatStyles: string;
  formatXPath: string;
  formatFullXPath: string;
  formatText: string;
  formatMarkdown: string;
  formatHtml: string;
  formatPng: string;
  formatJpeg: string;
  formatImage: string;
  formatUrl: string;
  tabCopied: string;
  copiedTitle: string;
  loadingDataProcessing: string;
  copiedSubtitlePrefix: string;
  copiedSubtitleDownloadPrefix: string;
  copiedFormatsGroupLabel: string;
  copiedFilesLabel: string;
  copiedCopyLabel: string;
  copiedOpenUrlIconLabel: string;
  copiedImageClipboardUnsupportedTooltip: string;
  copiedEmptyLine1: string;
  copiedEmptyLine2: string;
  pageSettingsTitle: string;
  tabShortcuts: string;
  shortcutsRunStopHeading: string;
  shortcutsStepPress: string;
  shortcutsStepOnMac: string;
  shortcutsStepRelease: string;
  shortcutsStepThenPress: string;
  shortcutsStopHeading: string;
  shortcutsSafetyLine1: string;
  shortcutsSafetyLine2: string;
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
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
