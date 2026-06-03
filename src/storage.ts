import { normalizeLocaleCode } from "./lib/our/i18n/locale-code";
import { ext } from "./api";
import { detectLocale, isLocale, type Locale } from "./i18n";
import {
  DEFAULT_NOTIFICATION_SECONDS,
  LOCALE_DETECT_VERSION,
  LOCALE_DETECT_VERSION_KEY,
  LOCALE_STORAGE_KEY,
  LOCALE_USER_SELECTED_KEY,
  STORAGE_KEY,
} from "./messages";

export async function getNotificationSeconds(): Promise<number> {
  const data = await ext.storage.local.get(STORAGE_KEY);
  const raw = data[STORAGE_KEY];
  if (typeof raw !== "number" || !Number.isInteger(raw) || raw < 0 || raw > 10) {
    return DEFAULT_NOTIFICATION_SECONDS;
  }
  return raw;
}

export async function getLocale(): Promise<Locale> {
  const data = await ext.storage.local.get(LOCALE_STORAGE_KEY);
  const raw = data[LOCALE_STORAGE_KEY];
  if (typeof raw === "string") {
    const normalized = normalizeLocaleCode(raw);
    if (isLocale(normalized)) {
      if (normalized !== raw) {
        await ext.storage.local.set({ [LOCALE_STORAGE_KEY]: normalized });
      }
      return normalized;
    }
  }
  return detectLocale();
}

export async function setLocale(locale: Locale): Promise<void> {
  await ext.storage.local.set({
    [LOCALE_STORAGE_KEY]: locale,
    [LOCALE_USER_SELECTED_KEY]: true,
  });
}

export async function ensureLocaleInStorage(): Promise<void> {
  const data = await ext.storage.local.get([
    LOCALE_STORAGE_KEY,
    LOCALE_USER_SELECTED_KEY,
    LOCALE_DETECT_VERSION_KEY,
  ]);

  if (data[LOCALE_USER_SELECTED_KEY] && isLocale(data[LOCALE_STORAGE_KEY])) {
    return;
  }

  const version = data[LOCALE_DETECT_VERSION_KEY];
  if (version === LOCALE_DETECT_VERSION && isLocale(data[LOCALE_STORAGE_KEY])) {
    return;
  }

  const detected = await detectLocale();
  await ext.storage.local.set({
    [LOCALE_STORAGE_KEY]: detected,
    [LOCALE_DETECT_VERSION_KEY]: LOCALE_DETECT_VERSION,
  });
}
