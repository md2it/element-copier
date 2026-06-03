import { ext } from "../api";

const messageCache = new Map<string, string>();

function cacheKey(messageName: string, substitutions?: string | string[]): string {
  if (substitutions === undefined) return messageName;
  const sub = Array.isArray(substitutions) ? substitutions.join("\0") : substitutions;
  return `${messageName}\0${sub}`;
}

/**
 * Manifest / command strings from `_locales` via `chrome.i18n.getMessage`.
 * Results are cached for the lifetime of the extension context.
 */
export function getMessage(
  messageName: string,
  substitutions?: string | string[],
): string {
  const key = cacheKey(messageName, substitutions);
  const cached = messageCache.get(key);
  if (cached !== undefined) return cached;

  const get = ext.i18n?.getMessage;
  if (typeof get !== "function") {
    messageCache.set(key, messageName);
    return messageName;
  }

  try {
    const result = get(messageName, substitutions);
    const text = typeof result === "string" && result.length > 0 ? result : messageName;
    messageCache.set(key, text);
    return text;
  } catch {
    messageCache.set(key, messageName);
    return messageName;
  }
}

/** Clears cached `getMessage` results (tests or locale override hooks). */
export function clearMessageCache(): void {
  messageCache.clear();
}
