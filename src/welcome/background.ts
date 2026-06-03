import { isActionOnToolbar } from "../lib/src/pin";
import {
  openWelcomeTab,
  stopWelcomePinWatcher as stopLibWelcomePinWatcher,
  watchWelcomePinStatus as watchLibWelcomePinStatus,
} from "../lib/src/welcome";
import { ext } from "../api";
import { getLocale } from "../storage";
import {
  WELCOME_PIN_WATCH_CONFIG,
  WELCOME_TAB_CONFIG,
} from "./constants";
import { buildWelcomeData } from "./data";

export function stopWelcomePinWatcher(tabId: number): void {
  stopLibWelcomePinWatcher(tabId);
}

export function watchWelcomePinStatus(tabId: number): void {
  watchLibWelcomePinStatus(tabId, WELCOME_PIN_WATCH_CONFIG);
}

export async function showWelcome(): Promise<void> {
  const locale = await getLocale();
  const manifest = ext.runtime.getManifest();
  const isPinned = await isActionOnToolbar(ext.action);

  await openWelcomeTab(
    WELCOME_TAB_CONFIG,
    buildWelcomeData(locale, manifest.name, { isPinned }),
  );
}
