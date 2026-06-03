const tabActive = new Map<number, boolean>();

export function getTabActiveState(tabId: number): boolean {
  return tabActive.get(tabId) ?? false;
}

export function setTabActiveState(tabId: number, active: boolean): void {
  tabActive.set(tabId, active);
}

export function deleteTabActiveState(tabId: number): void {
  tabActive.delete(tabId);
}

/** Page load / navigation: extension is off until user toggles again. */
export function clearTabActiveState(tabId: number): void {
  tabActive.set(tabId, false);
}

export function forEachActiveTabId(fn: (tabId: number) => void): void {
  for (const tabId of tabActive.keys()) {
    if (tabActive.get(tabId)) fn(tabId);
  }
}
