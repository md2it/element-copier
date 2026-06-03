import { getCssSelector } from "./selector";

function escapeJsString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function matchesOnly(
  selector: string,
  element: Element,
  doc: Document = element.ownerDocument,
): boolean {
  try {
    const found = doc.querySelectorAll(selector);
    return found.length === 1 && found[0] === element;
  } catch {
    return false;
  }
}

/** JS path via document.querySelector when selector is unique, else index chain. */
export function getJsPath(element: Element): string {
  const selector = getCssSelector(element);
  if (matchesOnly(selector, element)) {
    return `document.querySelector("${escapeJsString(selector)}")`;
  }
  return getJsPathByIndex(element);
}

function getJsPathByIndex(element: Element): string {
  const doc = element.ownerDocument;
  if (element === doc.documentElement) return "document.documentElement";
  if (element === doc.body) return "document.body";

  const segments: string[] = [];
  let node: Element | null = element;

  while (node && node !== doc.body && node !== doc.documentElement) {
    const parent: Element | null = node.parentElement;
    if (!parent) break;
    const index = Array.prototype.indexOf.call(parent.children, node);
    segments.unshift(`children[${index}]`);
    node = parent;
  }

  if (node === doc.body) {
    return segments.length > 0
      ? `document.body.${segments.join(".")}`
      : "document.body";
  }

  return segments.length > 0
    ? `document.documentElement.${segments.join(".")}`
    : "document.documentElement";
}
