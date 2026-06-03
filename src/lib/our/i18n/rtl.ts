const RTL_LOCALES = new Set<string>(["ar"]);

export function isRtlLocale(locale: string): boolean {
  return RTL_LOCALES.has(locale);
}
