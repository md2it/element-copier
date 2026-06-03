/** UI / `_locales` code for Simplified Chinese (China). No Taiwan/HK/traditional. */
export const CHINESE_UI_LOCALE = "zh_CN" as const;

const TRADITIONAL_CHINESE_RE =
  /^zh-(tw|hk|mo|hant)(-|$)|^zh-hant(-|$)/;

/**
 * Maps browser `zh*` tags to mainland Simplified Chinese.
 * Returns null for Taiwan, Hong Kong, and other traditional variants.
 */
export function mapChineseUiLocale(
  tag: string,
): typeof CHINESE_UI_LOCALE | null {
  const lower = tag.trim().toLowerCase().replace(/_/g, "-");
  if (!lower.startsWith("zh")) return null;
  if (TRADITIONAL_CHINESE_RE.test(lower)) return null;
  return CHINESE_UI_LOCALE;
}

/** Migrates legacy stored codes (e.g. `zh` → `zh_CN`). */
export function normalizeLocaleCode(code: string): string {
  if (code === "zh") return CHINESE_UI_LOCALE;
  return code;
}

/** BCP 47 for HTML `lang` (Chrome `_locales` use underscores). */
export function localeToHtmlLang(locale: string): string {
  return locale.replace(/_/g, "-");
}
