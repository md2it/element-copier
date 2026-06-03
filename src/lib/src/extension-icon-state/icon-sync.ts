import { ext } from "../api";
import type { ExtensionIconStateConfig, ToolbarIconMode } from "./types";
import { getTabActiveState } from "./tab-active-state";

export type IconSyncApi = {
  syncIconForTab: (tabId: number) => Promise<void>;
  forgetIconSyncedTab: (tabId: number) => Promise<void>;
  setGlobalToolbarIcon: () => Promise<void>;
  bootstrapToolbarIcons: () => Promise<void>;
};

export function createIconSync(config: ExtensionIconStateConfig): IconSyncApi {
  const { paths, syncedTabIdsStorageKey, logLabel, getImageSets } = config;

  let imageSetsFailed = false;

  function loadImageSets() {
    if (!getImageSets || imageSetsFailed) return null;
    try {
      return getImageSets();
    } catch (err) {
      imageSetsFailed = true;
      console.error(`[${logLabel}] dynamic toolbar icons unavailable:`, err);
      return null;
    }
  }

  function resolveToolbarIconMode(tabId: number): ToolbarIconMode {
    return getTabActiveState(tabId) ? "active" : "inactive";
  }

  async function applyToolbarIcon(
    details: { tabId?: number },
    mode: ToolbarIconMode,
  ): Promise<void> {
    const sets = loadImageSets();
    const iconPaths = paths[mode];

    if (sets) {
      const imageData = sets[mode];
      try {
        await ext.action.setIcon({ ...details, imageData });
        return;
      } catch (err) {
        console.warn(
          `[${logLabel}] setIcon(imageData) failed, using SVG paths:`,
          err,
        );
      }
    }

    try {
      await ext.action.setIcon({ ...details, path: iconPaths });
    } catch (err) {
      if (details.tabId !== undefined) {
        console.warn(`[${logLabel}] setIcon(tabId, path) failed:`, err);
        try {
          await ext.action.setIcon({ path: iconPaths });
        } catch (err2) {
          console.error(`[${logLabel}] setIcon(path) failed:`, err2);
        }
        return;
      }
      console.error(`[${logLabel}] setIcon failed:`, err);
    }
  }

  async function getIconSyncedTabIds(): Promise<number[]> {
    const data = await ext.storage.session.get(syncedTabIdsStorageKey);
    const raw = data[syncedTabIdsStorageKey];
    if (!Array.isArray(raw)) return [];
    return raw.filter((id): id is number => typeof id === "number");
  }

  async function setIconSyncedTabIds(ids: number[]): Promise<void> {
    await ext.storage.session.set({ [syncedTabIdsStorageKey]: ids });
  }

  async function rememberIconSyncedTab(tabId: number): Promise<void> {
    const ids = await getIconSyncedTabIds();
    if (ids.includes(tabId)) return;
    await setIconSyncedTabIds([...ids, tabId]);
  }

  async function forgetIconSyncedTab(tabId: number): Promise<void> {
    const ids = await getIconSyncedTabIds();
    if (!ids.includes(tabId)) return;
    await setIconSyncedTabIds(ids.filter((id) => id !== tabId));
  }

  async function syncIconForTab(tabId: number): Promise<void> {
    await applyToolbarIcon({ tabId }, resolveToolbarIconMode(tabId));
    await rememberIconSyncedTab(tabId);
  }

  async function setGlobalToolbarIcon(): Promise<void> {
    await applyToolbarIcon({}, "inactive");
  }

  async function syncAllTabIcons(): Promise<void> {
    const tabIds = await getIconSyncedTabIds();
    const alive: number[] = [];
    for (const tabId of tabIds) {
      try {
        await applyToolbarIcon({ tabId }, resolveToolbarIconMode(tabId));
        alive.push(tabId);
      } catch {
        /* tab closed */
      }
    }
    if (alive.length !== tabIds.length) {
      await setIconSyncedTabIds(alive);
    }
  }

  async function bootstrapToolbarIcons(): Promise<void> {
    await setGlobalToolbarIcon();
    await syncAllTabIcons();
  }

  return {
    syncIconForTab,
    forgetIconSyncedTab,
    setGlobalToolbarIcon,
    bootstrapToolbarIcons,
  };
}
