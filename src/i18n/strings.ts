import type { Locale, Strings } from "./types";

const MESSAGES: Record<Locale, Strings> = {
  en: {
    restrictedPageNotice:
      "Browser extensions don't work on system pages and protected sites. Try another site.",
    panelSubtitle: "browser extension",
    titleSettings: "Start",
    startBodyLead: "To copy:",
    startBodyAction: "HOVER and CLICK",
    copiedTitle: "Copied!",
    copiedSubtitle: "Saved to your clipboard",
    pageSettingsTitle: "SETTINGS",
    pageHistoryTitle: "HISTORY",
    pagePlaceholderTodo: "TODO",
    tabAbout: "ABOUT",
    welcomePin: "To keep the extension handy:",
    welcomePinStep1: "The top bar has an extensions list",
    welcomePinStep2: "In the list, find:",
    welcomePinStep3: "Click the pin button:",
    aboutBullets: [
      "On/Off with one click",
      "Doesn't use the network",
      "Doesn't collect data",
    ],
    aboutHotkeyHeading: "Hotkey:",
    aboutHotkeyStepPress: "Press:",
    aboutHotkeyStepOnMac: "On Mac:",
    aboutHotkeyStepRelease: "Release the keys",
    aboutHotkeyStepThenPress: "Then press",
    aboutCopyright: "© Alex T",
  },
};

export function t(locale: Locale): Strings {
  return MESSAGES[locale];
}
