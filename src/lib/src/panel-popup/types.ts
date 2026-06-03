/** Per-tab popup only when the icon is pinned; omit for the extensions menu. */
export type PanelPageOpenTarget = {
  tabId?: number;
  windowId?: number;
};

/** Extension-specific paths and storage keys for settings/about panel pages. */
export type PanelPageConfig = {
  pageHtml: string;
  sessionTabKey: string;
  tabQueryParam?: string;
  logLabel: string;
};
