import { LINKEDIN, MD2IT } from "../icons";
import { PANEL_FOOTER_LINKEDIN_URL, PANEL_FOOTER_MD2IT_URL } from "./constants";

export type PanelFooterLink = {
  href: string;
  title: string;
  iconHtml: string;
};

export const PANEL_FOOTER_LINKS: readonly PanelFooterLink[] = [
  { href: PANEL_FOOTER_LINKEDIN_URL, title: "LinkedIn", iconHtml: LINKEDIN },
  { href: PANEL_FOOTER_MD2IT_URL, title: "MD2IT", iconHtml: MD2IT },
] as const;

export type PanelFooterConfig = {
  footerClassName: string;
};

function createFooterLink(link: PanelFooterLink): HTMLAnchorElement {
  const anchor = document.createElement("a");
  anchor.href = link.href;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.title = link.title;
  anchor.innerHTML = link.iconHtml;
  return anchor;
}

/** Stops footer link clicks from bubbling (panel / page handlers). */
export function attachPanelFooterLinks(footer: HTMLElement): void {
  for (const anchor of Array.from(
    footer.querySelectorAll<HTMLAnchorElement>("a[href]"),
  )) {
    anchor.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
    });
  }
}

export function createPanelFooter(config: PanelFooterConfig): HTMLDivElement {
  const footer = document.createElement("div");
  footer.className = config.footerClassName;
  for (const link of PANEL_FOOTER_LINKS) {
    footer.appendChild(createFooterLink(link));
  }
  attachPanelFooterLinks(footer);
  return footer;
}
