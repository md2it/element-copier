import { ext } from "../api";

/** Full browser language list (primary + fallbacks) from Chrome/Firefox prefs. */
export function getAcceptLanguageTags(): Promise<string[]> {
  return new Promise((resolve) => {
    const getAccept = ext.i18n?.getAcceptLanguages;
    if (typeof getAccept !== "function") {
      resolve(fallbackLanguageTags());
      return;
    }
    try {
      const maybePromise: unknown = getAccept((languages: string[]) => {
        resolve(pickLanguageTags(languages));
      });
      if (
        maybePromise &&
        typeof (maybePromise as Promise<string[]>).then === "function"
      ) {
        void (maybePromise as Promise<string[]>)
          .then((languages) => resolve(pickLanguageTags(languages)))
          .catch(() => resolve(fallbackLanguageTags()));
      }
    } catch {
      resolve(fallbackLanguageTags());
    }
  });
}

function pickLanguageTags(languages: string[] | undefined): string[] {
  if (languages?.length) return [...languages];
  return fallbackLanguageTags();
}

function fallbackLanguageTags(): string[] {
  if (typeof navigator !== "undefined" && navigator.languages?.length) {
    return [...navigator.languages];
  }
  try {
    const ui = ext.i18n?.getUILanguage?.();
    return ui ? [ui] : [];
  } catch {
    return [];
  }
}

/**
 * User language preferences: primary, then fallbacks, then `fallbackLocale`.
 * Uses i18n.getAcceptLanguages (full Chrome language list). Do not use navigator.language —
 * in content scripts that is the page locale; navigator.languages may omit fallbacks.
 */
export async function detectLocale<T extends string>(
  mapLanguageTag: (tag: string) => T | null,
  fallbackLocale: T,
): Promise<T> {
  const tags = await getAcceptLanguageTags();
  const seen = new Set<string>();
  for (const tag of tags) {
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const mapped = mapLanguageTag(tag);
    if (mapped) return mapped;
  }
  return fallbackLocale;
}
