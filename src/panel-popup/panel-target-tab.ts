import { ext } from "../api";

export const PANEL_TARGET_TAB_SESSION_KEY = "panelTargetTabId";

export async function rememberPanelTargetTab(tabId: number): Promise<void> {
  await ext.storage.session.set({ [PANEL_TARGET_TAB_SESSION_KEY]: tabId });
}

export async function readPanelTargetTabId(): Promise<number | undefined> {
  const data = await ext.storage.session.get(PANEL_TARGET_TAB_SESSION_KEY);
  const id = data[PANEL_TARGET_TAB_SESSION_KEY];
  return typeof id === "number" ? id : undefined;
}
