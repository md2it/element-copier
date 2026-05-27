export type Locale = "en";

export const LOCALES: readonly Locale[] = ["en"] as const;

export type Strings = {
  restrictedPageNotice: string;
  panelSubtitle: string;
  titleSettings: string;
  startBodyLead: string;
  startBodyAction: string;
  copiedTitle: string;
  copiedSubtitle: string;
  pageSettingsTitle: string;
  pageHistoryTitle: string;
  pagePlaceholderTodo: string;
  tabAbout: string;
  welcomePin: string;
  welcomePinStep1: string;
  welcomePinStep2: string;
  welcomePinStep3: string;
  aboutBullets: readonly string[];
  aboutHotkeyHeading: string;
  aboutHotkeyStepPress: string;
  aboutHotkeyStepOnMac: string;
  aboutHotkeyStepRelease: string;
  aboutHotkeyStepThenPress: string;
  aboutCopyright: string;
};

export function isLocale(value: unknown): value is Locale {
  return value === "en";
}
