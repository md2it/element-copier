import { ext } from "../api";
import { SKIP_START_PAGE_KEY } from "../messages";

export async function getSkipStartPage(): Promise<boolean> {
  const data = await ext.storage.local.get(SKIP_START_PAGE_KEY);
  return data[SKIP_START_PAGE_KEY] === true;
}

export async function setSkipStartPage(value: boolean): Promise<void> {
  await ext.storage.local.set({ [SKIP_START_PAGE_KEY]: value });
}
