export type Locale = "en";

export const LOCALES: readonly Locale[] = ["en"] as const;

export type Strings = {
  restrictedPageNotice: string;
  panelSubtitle: string;
  titleSettings: string;
  startButtonLabel: string;
  settingsCopyDefaultLabel: string;
  settingsCopyDefaultNothing: string;
  settingsInlineImagesLabel: string;
  settingsInlineImagesUseAll: string;
  settingsInlineImagesRemoveLarge: string;
  settingsInlineImagesRemoveAll: string;
  settingsInlineImagesInfoLabel: string;
  settingsInlineImagesInfo: string;
  infoWindowCloseLabel: string;
  settingsDeveloperToolsToggleLabel: string;
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
  tabCopied: string;
  copiedTitle: string;
  loadingDataProcessing: string;
  copiedSubtitlePrefix: string;
  copiedSubtitleDownloadPrefix: string;
  copiedFormatsGroupLabel: string;
  copiedFilesLabel: string;
  copiedCopyImagesLabel: string;
  copiedImageClipboardUnsupportedTooltip: string;
  copiedCopyTextLabel: string;
  copiedDeveloperToolsLabel: string;
  copiedStartOverButtonLabel: string;
  copiedEmptyLine1: string;
  copiedEmptyLine2: string;
  pageSettingsTitle: string;
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
