import { detectLocale as detectLocaleBase } from "../lib/our/i18n/detect";
import type { Locale } from "./types";

export { getAcceptLanguageTags } from "../lib/our/i18n/detect";

function mapLanguageTag(tag: string): Locale | null {
  const base = tag.trim().toLowerCase().replace(/_/g, "-").split("-")[0];
  if (base === "en") return "en";
  return null;
}

export function detectLocale(): Promise<Locale> {
  return detectLocaleBase(mapLanguageTag, "en");
}
