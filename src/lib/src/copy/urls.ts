export const URL_ATTRS = ["href", "src", "poster"] as const;

function absolutizeUrl(value: string, baseHref: string): string {
  try {
    return new URL(value, baseHref).href;
  } catch {
    return value;
  }
}

export function absolutizeElementUrls(root: Element, baseHref: string): void {
  const elements = root.querySelectorAll("*");
  for (const el of elements) {
    for (const attrName of URL_ATTRS) {
      const value = el.getAttribute(attrName);
      if (value && !value.startsWith("#") && !/^(data:|mailto:|tel:|javascript:)/i.test(value)) {
        el.setAttribute(attrName, absolutizeUrl(value, baseHref));
      }
    }

    const srcset = el.getAttribute("srcset");
    if (srcset) {
      const resolved = srcset
        .split(",")
        .map((part) => {
          const trimmed = part.trim();
          const spaceIdx = trimmed.search(/\s/);
          if (spaceIdx === -1) {
            return absolutizeUrl(trimmed, baseHref);
          }
          const url = trimmed.slice(0, spaceIdx);
          const descriptor = trimmed.slice(spaceIdx);
          return `${absolutizeUrl(url, baseHref)}${descriptor}`;
        })
        .join(", ");
      el.setAttribute("srcset", resolved);
    }
  }
}
