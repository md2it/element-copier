const DEFAULT_IMAGE_ALT = "image";

/** Brackets in alt/link labels become Turndown `\\[` and break some Markdown viewers. */
export function sanitizeMarkdownAltText(alt: string): string {
  const cleaned = alt.replace(/[[\]]/g, "").replace(/\s+/g, " ").trim();
  return cleaned || DEFAULT_IMAGE_ALT;
}

export { DEFAULT_IMAGE_ALT };
