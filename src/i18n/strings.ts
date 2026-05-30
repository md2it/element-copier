import type { Locale, Strings } from "./types";

const MESSAGES: Record<Locale, Strings> = {
  en: {
    restrictedPageNotice:
      "Browser extensions don't work on system pages and protected sites. Try another site.",
    panelSubtitle: "browser extension",
    titleSettings: "Start",
    startButtonLabel: "START",
    skipStartPageToggleLabel: "Skip START page",
    settingsCopyDefaultLabel: "Copy default",
    settingsCopyDefaultNothing: "nothing",
    settingsFormatsGroupLabel: "COPIED page options",
    formatOuterHtml: "outerHTML",
    formatSelector: "selector",
    formatJsPath: "JS path",
    formatComputedStyles: "computed styles",
    formatStyles: "styles",
    formatXPath: "XPath",
    formatFullXPath: "full XPath",
    formatText: "Text",
    copiedTitle: "Copied!",
    copiedSubtitlePrefix: "Copied to clipboard:",
    copiedSettingsLink: "… change the options",
    copiedFormatsGroupLabel: "Options:",
    pageSettingsTitle: "SETTINGS",
    tabShortcuts: "SHORTCUTS",
    tabLanguage: "LANGUAGE",
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
      "On/Off with one click",
      "On/Off with shortcuts",
      "Copy to clipboard",
      "Download a document",
      "Download an image",
      "Doesn't use the network",
      "Doesn't collect data",
      "I hope you find the app useful",
    ],
    aboutProductName: "Element-Copier",
    aboutCreditAuthor: "Alex T",
  },
};

export function t(locale: Locale): Strings {
  return MESSAGES[locale];
}
