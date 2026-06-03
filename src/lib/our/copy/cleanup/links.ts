import { sanitizeMarkdownAltText } from "../../../vendor/turndown/sanitize-alt";
import { absolutizeElementUrls } from "../urls";

/** Resolve relative href/src URLs against the document base. */
export function absolutizeClipboardLinks(root: Element, baseHref: string): void {
  if (!baseHref) return;
  absolutizeElementUrls(root, baseHref);
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function extractVisibleLinkText(anchor: Element): string {
  return collapseWhitespace(anchor.textContent ?? "");
}

function extractDescendantAltText(anchor: Element): string {
  for (const img of Array.from(anchor.querySelectorAll("img[alt]"))) {
    const alt = sanitizeMarkdownAltText(
      collapseWhitespace(img.getAttribute("alt") ?? ""),
    );
    if (alt) return alt;
  }
  return "";
}

const CONTACT_ACTION_SCHEME_RE =
  /^(mailto|tel|sms|facetime|tg|whatsapp|skype|slack):/i;

/** Contact/action href label: payload from href, not domain shorthand. */
function hrefToContactActionLabel(href: string): string | null {
  const trimmed = href.trim();
  if (!CONTACT_ACTION_SCHEME_RE.test(trimmed)) return null;

  try {
    const url = new URL(trimmed);
    let dest = "";
    if (url.hostname) {
      dest = url.hostname;
      if (url.pathname && url.pathname !== "/") {
        dest += url.pathname;
      }
    } else if (url.pathname && url.pathname !== "/") {
      dest = url.pathname.replace(/^\//, "");
    }
    if (url.search) dest += url.search;
    if (url.hash) dest += url.hash;
    if (dest) return dest;
  } catch {
    // fall through to scheme strip
  }

  const colon = trimmed.indexOf(":");
  return colon >= 0 ? trimmed.slice(colon + 1) : trimmed;
}

/** Short href label: `youtube.com/...` — domain without www, path truncated. */
export function hrefToDomainShorthand(href: string, baseHref?: string): string {
  const trimmed = href.trim();
  if (/^data:/i.test(trimmed)) return trimmed;

  const contactAction = hrefToContactActionLabel(trimmed);
  if (contactAction !== null) return contactAction;

  try {
    const url = new URL(href, baseHref || undefined);
    let host = url.hostname;
    if (host.startsWith("www.")) host = host.slice(4);

    const hasPath = url.pathname && url.pathname !== "/";
    const hasQuery = Boolean(url.search);
    if (!hasPath && !hasQuery) return host;
    return `${host}/...`;
  } catch {
    if (!trimmed) return "link";
    return trimmed.length > 40 ? `${trimmed.slice(0, 37)}...` : trimmed;
  }
}

function resolveLinkLabel(anchor: HTMLAnchorElement, baseHref?: string): string {
  const text = extractVisibleLinkText(anchor);
  if (text) return text;

  const alt = extractDescendantAltText(anchor);
  if (alt) return alt;

  const href = anchor.getAttribute("href");
  if (href) return hrefToDomainShorthand(href, baseHref);
  return "";
}

/** Image-only links (logos, icons) must keep `<img>` for HTML/markdown output. */
function isImagePrimaryLink(anchor: Element): boolean {
  if (!anchor.querySelector("img")) return false;
  return !extractVisibleLinkText(anchor);
}

/** Drop decorative siblings so Turndown sees `<a><img></a>`, not block gaps inside the link. */
function trimImagePrimaryLinkMarkup(anchor: Element): void {
  const imgs = Array.from(anchor.querySelectorAll("img"));
  if (imgs.length === 0) return;
  anchor.replaceChildren(...imgs.map((img) => img.cloneNode(true)));
}

/**
 * Flatten anchor inner markup to a single-line plain-text label so Turndown
 * emits valid `[text](url)` (no empty labels, no line breaks inside brackets).
 */
export function normalizeClipboardLinks(root: Element, baseHref?: string): void {
  for (const anchor of Array.from(root.querySelectorAll("a[href]"))) {
    if (!(anchor instanceof HTMLAnchorElement)) continue;
    if (isImagePrimaryLink(anchor)) {
      trimImagePrimaryLinkMarkup(anchor);
      continue;
    }
    const label = resolveLinkLabel(anchor, baseHref);
    if (!label) continue;
    anchor.textContent = sanitizeMarkdownAltText(label);
  }
}
