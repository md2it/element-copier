export type Locale = "en";

export const LOCALES: readonly Locale[] = ["en"] as const;

export type Strings = {
  restrictedPageNotice: string;
  panelSubtitle: string;
  titleSettings: string;
  startBodyLead: string;
  startBodyAction: string;
  startSettings: string;
  startHistory: string;
  startButtonComingSoon: string;
  tabAbout: string;
  welcomePin: string;
  welcomePinStep1: string;
  welcomePinStep2: string;
  welcomePinStep3: string;
  aboutBullets: readonly string[];
};

export function isLocale(value: unknown): value is Locale {
  return value === "en";
}
