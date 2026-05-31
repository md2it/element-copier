import { ext } from "../api";
import type { CopyFormatId } from "../formats/definitions";

export const PICK_COPY_CACHE_STORAGE_KEY = "pickCopyCache";
export const PICK_COPY_CACHE_INDEX_KEY = "pickCopyCacheFormats";

export type PickCopyCacheRecord = Partial<Record<CopyFormatId, string>>;

export async function readPickCopyCacheFromStorage(): Promise<PickCopyCacheRecord | undefined> {
  const data = await ext.storage.local.get(PICK_COPY_CACHE_STORAGE_KEY);
  const record = data[PICK_COPY_CACHE_STORAGE_KEY];
  if (!record || typeof record !== "object") return undefined;
  return record as PickCopyCacheRecord;
}

export async function hasPickCopyCacheInStorage(): Promise<boolean> {
  const record = await readPickCopyCacheFromStorage();
  if (record !== undefined && Object.keys(record).length > 0) return true;

  // Content scripts cannot access session storage; keep index in local.
  const data = await ext.storage.local.get(PICK_COPY_CACHE_INDEX_KEY);
  const index = data[PICK_COPY_CACHE_INDEX_KEY];
  return Array.isArray(index) && index.length > 0;
}

export async function writePickCopyCacheIndex(
  formatIds: readonly CopyFormatId[],
): Promise<void> {
  if (formatIds.length === 0) {
    await ext.storage.local.remove(PICK_COPY_CACHE_INDEX_KEY);
    return;
  }
  await ext.storage.local.set({ [PICK_COPY_CACHE_INDEX_KEY]: formatIds });
}

export async function writePickCopyCacheToStorage(
  entries: readonly { key: CopyFormatId; value: string }[],
): Promise<void> {
  const record: PickCopyCacheRecord = {};
  for (const { key, value } of entries) {
    record[key] = value;
  }
  await ext.storage.local.set({ [PICK_COPY_CACHE_STORAGE_KEY]: record });
}

export async function clearPickCopyCacheStorage(): Promise<void> {
  await ext.storage.local.remove([PICK_COPY_CACHE_STORAGE_KEY, PICK_COPY_CACHE_INDEX_KEY]);
}

export async function getPickCopyTextFromStorage(
  formatId: CopyFormatId,
): Promise<string | undefined> {
  const record = await readPickCopyCacheFromStorage();
  if (!record) return undefined;
  if (formatId === "markdownFile") {
    return record.markdown;
  }
  return record[formatId];
}
