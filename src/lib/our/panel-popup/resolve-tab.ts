import { ext } from "../api";

export function resolveInitialPanelTab<T extends string>(
  sessionTab: unknown,
  queryTab: string | null,
  defaultTab: T,
  validTabs: readonly T[],
): T {
  if (typeof sessionTab === "string" && validTabs.includes(sessionTab as T)) {
    return sessionTab as T;
  }
  if (typeof queryTab === "string" && validTabs.includes(queryTab as T)) {
    return queryTab as T;
  }
  return defaultTab;
}

export async function resolvePanelPageInitialTab<T extends string>(config: {
  sessionTabKey: string;
  defaultTab: T;
  validTabs: readonly T[];
  tabQueryParam?: string;
}): Promise<T> {
  const { [config.sessionTabKey]: sessionTab } = await ext.storage.session.get(
    config.sessionTabKey,
  );
  await ext.storage.session.remove(config.sessionTabKey);
  const tabParam = new URLSearchParams(location.search).get(
    config.tabQueryParam ?? "tab",
  );
  return resolveInitialPanelTab(sessionTab, tabParam, config.defaultTab, config.validTabs);
}
