/** Resolved computed styles as plain text for clipboard. */
export function getElementComputedStyles(element: Element): string {
  const computed = element.ownerDocument.defaultView?.getComputedStyle(element);
  if (!computed) return "";

  const decls: string[] = [];
  for (let i = 0; i < computed.length; i += 1) {
    const name = computed.item(i);
    if (!name) continue;
    const value = computed.getPropertyValue(name);
    if (value) decls.push(`${name}: ${value};`);
  }
  return decls.join("\n");
}
