export function isInlineLikeDisplay(display: string): boolean {
  return display === "inline"
    || display.startsWith("inline-")
    || display === "contents";
}

export function mergeInlineStyle(element: Element, extra: string): void {
  const current = element.getAttribute("style")?.trim();
  element.setAttribute("style", current ? `${current};${extra}` : extra);
}
