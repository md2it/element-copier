import type { Locale, Strings } from "./types";

const MESSAGES: Record<Locale, Strings> = {
  en: {
    restrictedPageNotice:
      "Browser extensions don't work on this page or site.",
    panelSubtitle: "browser extension",
    titleSettings: "Start",
    startBodyLead: "To copy:",
    startBodyAction: "HOVER and CLICK",
    startSettings: "Settings",
    startHistory: "History",
    startButtonComingSoon: "Coming soon",
    tabAbout: "ABOUT",
    welcomePin: "To keep the extension handy:",
    welcomePinStep1: "The top bar has an extensions list",
    welcomePinStep2: "In the list, find:",
    welcomePinStep3: "Click the pin button:",
    aboutBullets: [
      "Copies page content in one click,",
      "Doesn't use the network,",
      "Doesn't collect data.",
    ],
  },
};

export function t(locale: Locale): Strings {
  return MESSAGES[locale];
}
