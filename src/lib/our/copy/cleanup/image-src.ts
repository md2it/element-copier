/** Inline payloads (data:, blob:, serialized SVG, page base64, etc.) stay in src as-is. */
const INLINE_IMAGE_SRC_RE = /^(data:|blob:)/i;

export function isInlineImageSrc(src: string): boolean {
  return INLINE_IMAGE_SRC_RE.test(src.trim());
}

/**
 * src for materialized or normalized <img>:
 * - inline → unchanged (typically data:... or blob:...)
 * - remote/path URL → absolute https?://... (not fetched, not inlined)
 */
export function resolveMaterializedImageSrc(raw: string, doc: Document): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  if (isInlineImageSrc(trimmed)) return trimmed;
  try {
    return new URL(trimmed, doc.baseURI).href;
  } catch {
    return null;
  }
}
