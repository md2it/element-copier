function escapeXPathLiteral(value: string): string {
  if (!value.includes('"')) return `"${value}"`;
  if (!value.includes("'")) return `'${value}'`;
  const parts = value.split("'");
  return `concat(${parts.map((part, i) => {
    const chunks: string[] = [];
    if (part) chunks.push(`'${part}'`);
    if (i < parts.length - 1) chunks.push(`"'"`);
    return chunks.join(", ");
  }).join(", ")})`;
}

function xpathSegment(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const parent = element.parentElement;
  if (!parent) return tag;

  let sameTagCount = 0;
  for (const child of parent.children) {
    if (child.tagName === element.tagName) sameTagCount += 1;
  }
  if (sameTagCount <= 1) return tag;

  let index = 1;
  for (const child of parent.children) {
    if (child === element) break;
    if (child.tagName === element.tagName) index += 1;
  }
  return `${tag}[${index}]`;
}

function evaluateXPath(
  xpath: string,
  element: Element,
  doc: Document = element.ownerDocument,
): boolean {
  try {
    const result = doc.evaluate(
      xpath,
      doc,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    );
    return result.singleNodeValue === element;
  } catch {
    return false;
  }
}

/** Absolute XPath from /html (full XPath format). */
export function getFullXPath(element: Element): string {
  const parts: string[] = [];
  let node: Element | null = element;
  while (node) {
    parts.unshift(xpathSegment(node));
    node = node.parentElement;
  }
  return `/${parts.join("/")}`;
}

/** Shorter XPath anchored at @id or stable @data-* when possible. */
export function getXPath(element: Element): string {
  const doc = element.ownerDocument;

  if (element.id) {
    const byId = `//*[@id=${escapeXPathLiteral(element.id)}]`;
    if (evaluateXPath(byId, element, doc)) return byId;
  }

  for (const attrName of ["data-testid", "data-test", "data-cy", "data-qa"] as const) {
    const attr = element.getAttribute(attrName);
    if (!attr) continue;
    const byAttr = `//*[@${attrName}=${escapeXPathLiteral(attr)}]`;
    if (evaluateXPath(byAttr, element, doc)) return byAttr;
  }

  const parts: string[] = [];
  let node: Element | null = element;

  while (node) {
    parts.unshift(xpathSegment(node));
    if (node.id && node !== element) {
      const tail = parts.slice(1).join("/");
      return tail
        ? `//*[@id=${escapeXPathLiteral(node.id)}]/${tail}`
        : `//*[@id=${escapeXPathLiteral(node.id)}]`;
    }
    node = node.parentElement;
  }

  return `//${parts.join("/")}`;
}
