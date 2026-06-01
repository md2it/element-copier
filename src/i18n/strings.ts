import type { Locale, Strings } from "./types";
import { AR_MESSAGES } from "./locales/ar";
import { DE_MESSAGES } from "./locales/de";
import { ES_MESSAGES } from "./locales/es";
import { FR_MESSAGES } from "./locales/fr";
import { RU_MESSAGES } from "./locales/ru";
import { ZH_CN_MESSAGES } from "./locales/zh_CN";

const EN_MESSAGES: Strings = {
    restrictedPageNotice:
      "Browser extensions don't work on system pages and protected sites. Try another site.",
    panelSubtitle: "browser extension",
    titleSettings: "START",
    pickElementButtonLabel: "PICK ELEMENT",
    capturePageButtonLabel: "SCREENSHOT PAGE",
    settingsDefaultActionLabel: "Default action",
    settingsDefaultActionNothing: "NOTHING",
    settingsDefaultActionCopyText: "Copy Text",
    settingsDefaultActionCopyMarkdown: "Copy Markdown",
    settingsDefaultActionCopyImage: "Copy Image",
    settingsDefaultActionDownloadMarkdown: "Download Markdown",
    settingsDefaultActionDownloadHtml: "Download HTML",
    settingsDefaultActionDownloadPng: "Download PNG",
    settingsDefaultActionDownloadJpeg: "Download JPEG",
    settingsDefaultActionCopyCode: "Copy code",
    settingsDefaultActionCopySelector: "Copy selector",
    settingsDefaultActionCopyJsPath: "Copy JS path",
    settingsDefaultActionCopyXPath: "Copy XPath",
    settingsDefaultActionCopyFullXPath: "Copy full XPath",
    settingsDefaultActionCopyStyles: "Copy styles",
    settingsDefaultActionCopyComputedStyles: "Copy computed styles",
    settingsCopyDefaultNothing: "nothing",
    settingsInlineImagesLabel: "Inline images in text",
    settingsInlineImagesUseAll: "Use all",
    settingsInlineImagesRemoveLarge: "Remove large",
    settingsInlineImagesRemoveSmall: "Remove small",
    settingsInlineImagesRemoveAll: "Remove all",
    settingsInlineImagesInfoLabel: "About inline images",
    settingsInlineImagesInfo:
      "Some pages embed images in the HTML as Base64 (common on Google and similar sites). This can slow copying and bloat Text or Markdown output. Small images are often icons or buttons that add clutter. Use this setting to control what is included.",
    infoWindowCloseLabel: "Close",
    settingsDeveloperToolsToggleLabel: "Developer tools",
    settingsDarkThemeToggleLabel: "Dark theme",
    formatCode: "code",
    formatSelector: "selector",
    formatJsPath: "JS path",
    formatComputedStyles: "computed styles",
    formatStyles: "styles",
    formatXPath: "XPath",
    formatFullXPath: "full XPath",
    formatText: "Text",
    formatMarkdown: "Markdown",
    formatHtml: "HTML",
    formatPng: "PNG",
    formatJpeg: "JPEG",
    formatImage: "Image",
    formatUrl: "URL",
    tabCopied: "COPIED",
    copiedTitle: "Copied!",
    loadingDataProcessing: "Data processing",
    copiedSubtitlePrefix: "Copied to clipboard:",
    copiedSubtitleDownloadPrefix: "Downloaded:",
    copiedFormatsGroupLabel: "Options:",
    copiedFilesLabel: "Download",
    copiedCopyLabel: "Copy",
    copiedOpenUrlIconLabel: "Open URL in a new tab",
    copiedImageClipboardUnsupportedTooltip:
      "Your browser can't copy this image format to the clipboard. Use Download instead.",
    copiedEmptyLine1: "I don't have anything saved in my memory.",
    copiedEmptyLine2: "Should we copy something?",
    pageSettingsTitle: "SETTINGS",
    tabShortcuts: "SHORTCUTS",
    shortcutsRunStopHeading: "To run / stop the extension:",
    shortcutsStepPress: "Press:",
    shortcutsStepOnMac: "On Mac:",
    shortcutsStepRelease: "Release the keys",
    shortcutsStepThenPress: "Then press",
    shortcutsStopHeading: "To stop:",
    shortcutsSafetyLine1: "The 3-step shortcut is not obvious.",
    shortcutsSafetyLine2: "But it is safer and avoids conflicts with other apps.",
    tabAbout: "ABOUT",
    welcomePin: "To keep the extension handy:",
    welcomePinStep1: "The top bar has an extensions list",
    welcomePinStep2: "In the list, find:",
    welcomePinStep3: "Click the pin button:",
    aboutBullets: [
      "Copy to clipboard",
      "Download",
      "Remembers recent snapshots",
      "Texts: formatted, plain, markdown, HTML",
      "Images: PNG, JPEG",
      "Code selectors: selector, JS path, XPath, full XPath",
      "Code styles: declared, computed",
      "Doesn't use the network",
      "Doesn't collect data",
      "Credits (MIT): Lucide, Modern-Screenshot, Turndown",
    ],
    aboutProductName: "Element-Copier",
    aboutCreditAuthor: "Alex T",
};

const LOCALE_MESSAGES: Partial<Record<Locale, Strings>> = {
  ar: AR_MESSAGES,
  de: DE_MESSAGES,
  es: ES_MESSAGES,
  fr: FR_MESSAGES,
  ru: RU_MESSAGES,
  zh_CN: ZH_CN_MESSAGES,
};

/** UI locales are selectable; translated catalogs are added per locale later. */
export function t(locale: Locale): Strings {
  return LOCALE_MESSAGES[locale] ?? EN_MESSAGES;
}
