import { getCssSelector } from "../lib/our/copy/selector";
import { getFullXPath } from "../lib/our/copy/xpath";
import type { FrameLabelStyle } from "../settings/frame-label-style";

/** Short label: tag + id or up to three classes. */
export function formatTagIdClassLabel(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const id = el.id.trim();
  if (id) return `${tag}#${id}`;
  const classes = Array.from(el.classList)
    .map((c) => c.trim())
    .filter(Boolean);
  if (classes.length > 0) {
    return `${tag}.${classes.slice(0, 3).join(".")}`;
  }
  return tag;
}

export function formatFrameElementLabel(
  el: Element,
  style: FrameLabelStyle,
  clickToCopyLabel: string,
): string {
  switch (style) {
    case "none":
      return "";
    case "click-to-copy":
      return clickToCopyLabel;
    case "tag-id-class":
      return formatTagIdClassLabel(el);
    case "selector":
      return getCssSelector(el);
    case "full-xpath":
      return getFullXPath(el);
  }
}
