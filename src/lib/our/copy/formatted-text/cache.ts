import { hasNonWhitespaceTextInClipboardHtml } from "./plain";
import type { FormattedText } from "./types";

export function serializeFormattedTextCache(payload: FormattedText): string {
  return JSON.stringify(payload);
}

export function parseFormattedTextCache(serialized: string): FormattedText | null {
  try {
    const parsed: unknown = JSON.parse(serialized);
    if (
      typeof parsed === "object"
      && parsed !== null
      && typeof (parsed as FormattedText).html === "string"
    ) {
      return { html: (parsed as FormattedText).html };
    }
  } catch {
    /* invalid cache entry */
  }
  return null;
}

/** Whether serialized text/html cache has copyable content (SPEC: no empty / whitespace-only). */
export function isFormattedTextCacheStorable(
  serialized: string,
  doc?: Document,
): boolean {
  const payload = parseFormattedTextCache(serialized);
  if (!payload?.html?.trim()) return false;
  if (!doc) return false;
  return hasNonWhitespaceTextInClipboardHtml(payload.html, doc);
}
