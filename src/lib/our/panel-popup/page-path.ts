import { ext } from "../api";

export function panelPagePath(
  pageHtml: string,
  panelTab: string,
  extraParams?: Record<string, string>,
  tabQueryParam = "tab",
): string {
  const params = new URLSearchParams({ [tabQueryParam]: panelTab, ...extraParams });
  return `${pageHtml}?${params.toString()}`;
}

export function getPanelPageUrl(pageHtml: string): string {
  return ext.runtime.getURL(pageHtml);
}

export function isPanelPage(href: string, pageHtml: string): boolean {
  return href.startsWith(getPanelPageUrl(pageHtml));
}
