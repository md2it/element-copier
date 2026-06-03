/** Ignore AdSense relay/tracking iframes smaller than this (px on each axis). */
const MIN_IFRAME_PICK_PX = 4;

export type ElementPickOptions = {
  isOurNode: (node: Node | null) => boolean;
};

export function isPointInElement(el: Element, x: number, y: number): boolean {
  const rect = el.getBoundingClientRect();
  return (
    x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
  );
}

export function listIframesWithin(
  root: ParentNode,
  isOurNode: (node: Node | null) => boolean,
): HTMLIFrameElement[] {
  const out: HTMLIFrameElement[] = [];
  const seen = new Set<HTMLIFrameElement>();

  const scan = (node: ParentNode): void => {
    for (const el of Array.from(node.querySelectorAll("iframe"))) {
      if (
        el instanceof HTMLIFrameElement &&
        !seen.has(el) &&
        !isOurNode(el)
      ) {
        seen.add(el);
        out.push(el);
      }
    }
    for (const el of Array.from(node.querySelectorAll("*"))) {
      if (el instanceof Element && el.shadowRoot) {
        scan(el.shadowRoot);
      }
    }
  };

  scan(root);
  return out;
}

export function isIframeHitTestable(iframe: HTMLIFrameElement): boolean {
  if (iframe.hasAttribute("hidden")) return false;
  const style = getComputedStyle(iframe);
  if (style.display === "none" || style.visibility === "hidden") return false;
  if (parseFloat(style.opacity) <= 0) return false;
  const rect = iframe.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

export function isSignificantIframe(iframe: HTMLIFrameElement): boolean {
  const rect = iframe.getBoundingClientRect();
  return (
    rect.width >= MIN_IFRAME_PICK_PX && rect.height >= MIN_IFRAME_PICK_PX
  );
}

function iframeContainsPoint(
  iframe: HTMLIFrameElement,
  x: number,
  y: number,
): boolean {
  const rect = iframe.getBoundingClientRect();
  return (
    x >= rect.left &&
    x <= rect.right &&
    y >= rect.top &&
    y <= rect.bottom
  );
}

export function findIframeAtPoint(
  x: number,
  y: number,
  options: ElementPickOptions,
): HTMLIFrameElement | null {
  let best: HTMLIFrameElement | null = null;
  let bestArea = Infinity;

  for (const node of listIframesWithin(document, options.isOurNode)) {
    if (
      !isIframeHitTestable(node) ||
      !isSignificantIframe(node) ||
      !iframeContainsPoint(node, x, y)
    ) {
      continue;
    }

    const rect = node.getBoundingClientRect();
    const area = rect.width * rect.height;
    if (area < bestArea) {
      bestArea = area;
      best = node;
    }
  }

  return best;
}

export function pickElementUnderCursor(
  x: number,
  y: number,
  options: ElementPickOptions,
): Element | null {
  const iframe = findIframeAtPoint(x, y, options);
  if (iframe) return iframe;

  const stack = document.elementsFromPoint(x, y);
  for (const node of stack) {
    if (!(node instanceof Element)) continue;
    if (options.isOurNode(node)) continue;
    if (node === document.documentElement || node === document.body) continue;
    return node;
  }

  return null;
}
