import type { WelcomeAboutItem } from "./lib/src/welcome";
import { ABOUT_BULLET_ICONS } from "./icons";
import type { Strings } from "./i18n/types";

export function buildAboutListItems(copy: Strings): WelcomeAboutItem[] {
  return copy.aboutBullets.map((text, index) => ({
    iconKind: "bool",
    iconHtml: ABOUT_BULLET_ICONS[index] ?? ABOUT_BULLET_ICONS[0],
    text,
  }));
}
