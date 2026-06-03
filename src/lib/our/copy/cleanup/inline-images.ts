export type InlineImageMode = "all" | "remove-large" | "remove-small" | "remove-all";

/** Data: URL value length (~chars) treated as "large" (~2KB). */
const LARGE_INLINE_DATA_URL_CHARS = 2048;

/** Whether a data: payload should be kept or produced during materialization. */
export function shouldMaterializeInlineDataUrl(value: string, mode: InlineImageMode): boolean {
  if (mode === "all" || !value.includes("data:")) return true;
  if (mode === "remove-all") return false;
  if (mode === "remove-large") return value.length <= LARGE_INLINE_DATA_URL_CHARS;
  return value.length > LARGE_INLINE_DATA_URL_CHARS;
}

const INLINE_DATA_URL_ATTRS = ["src", "href", "poster", "srcset"] as const;

/**
 * Strip inline (data:) image payloads from a clipboard container.
 * Remote images (<img src="https://...">) are not affected — only data: in src/href/etc.
 * - "all": keep everything (no-op)
 * - "remove-large": drop data: URLs over ~2KB
 * - "remove-small": drop data: URLs at or under ~2KB
 * - "remove-all": drop every data: URL
 */
export function applyInlineImagePolicy(root: Element, mode: InlineImageMode): void {
  if (mode === "all") return;

  for (const el of root.querySelectorAll("[src], [href], [poster], [srcset]")) {
    for (const attr of INLINE_DATA_URL_ATTRS) {
      const value = el.getAttribute(attr);
      if (!value?.includes("data:")) continue;
      if (!shouldMaterializeInlineDataUrl(value, mode)) {
        el.removeAttribute(attr);
      }
    }
  }
}
