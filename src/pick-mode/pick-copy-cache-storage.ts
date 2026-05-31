import { isFormattedTextCacheStorable } from "../../../lib/src/copy/formatted-text/index";
import { ext } from "../api";
import type { CopyFormatId } from "../formats/definitions";

export const PICK_COPY_CACHE_STORAGE_KEY = "pickCopyCache";
export const PICK_COPY_CACHE_INDEX_KEY = "pickCopyCacheFormats";
export const PICK_COPY_META_STORAGE_KEY = "pickCopyMeta";

export type PickCopyMeta = {
  tagName: string;
  hostname: string;
};

/** Background-only mirror for sync toolbar popup open (user gesture). */
let pickCopyCachePresentSync = false;

export function hasPickCopyCachePresentSync(): boolean {
  return pickCopyCachePresentSync;
}

function applyPickCopyCachePresence(
  record: PickCopyCacheRecord | undefined,
  index: unknown,
): void {
  pickCopyCachePresentSync =
    (record !== undefined && Object.keys(record).length > 0) ||
    (Array.isArray(index) && index.length > 0);
}

export type PickCopyCacheRecord = Partial<Record<CopyFormatId, string>>;

export function resolvePickCopyCacheStorageKey(formatId: CopyFormatId): CopyFormatId {
  if (formatId === "markdownFile") return "markdown";
  if (formatId === "htmlFile") return "outerHTML";
  return formatId;
}

/** Whether a snapshot value should be written to pick-copy cache (SPEC: no empty values). */
export function isPickCopyCacheValueStorable(
  formatId: CopyFormatId,
  value: string,
  doc?: Document,
): boolean {
  if (formatId === "text") {
    return isFormattedTextCacheStorable(value, doc);
  }
  return value.trim() !== "";
}

/** Whether COPIED can offer this format (derived formats use their storage key). */
export function isPickCopyFormatAvailable(
  formatId: CopyFormatId,
  record: PickCopyCacheRecord | undefined,
  doc?: Document,
): boolean {
  if (!record) return false;
  const value = record[resolvePickCopyCacheStorageKey(formatId)];
  if (value === undefined) return false;
  if (formatId === "text") {
    return isFormattedTextCacheStorable(value, doc);
  }
  return true;
}

export async function readPickCopyCacheFromStorage(): Promise<PickCopyCacheRecord | undefined> {
  const data = await ext.storage.local.get(PICK_COPY_CACHE_STORAGE_KEY);
  const record = data[PICK_COPY_CACHE_STORAGE_KEY];
  if (!record || typeof record !== "object") return undefined;
  return record as PickCopyCacheRecord;
}

export async function hasPickCopyCacheInStorage(): Promise<boolean> {
  const record = await readPickCopyCacheFromStorage();
  const data = await ext.storage.local.get(PICK_COPY_CACHE_INDEX_KEY);
  applyPickCopyCachePresence(record, data[PICK_COPY_CACHE_INDEX_KEY]);
  return pickCopyCachePresentSync;
}

/** Refresh sync mirror from storage (background bootstrap / onChanged). */
export async function refreshPickCopyCachePresenceSync(): Promise<boolean> {
  return hasPickCopyCacheInStorage();
}

export async function writePickCopyCacheIndex(
  formatIds: readonly CopyFormatId[],
): Promise<void> {
  if (formatIds.length === 0) {
    await ext.storage.local.remove(PICK_COPY_CACHE_INDEX_KEY);
    const record = await readPickCopyCacheFromStorage();
    applyPickCopyCachePresence(record, undefined);
    return;
  }
  await ext.storage.local.set({ [PICK_COPY_CACHE_INDEX_KEY]: formatIds });
  const record = await readPickCopyCacheFromStorage();
  applyPickCopyCachePresence(record, formatIds);
}

export async function writePickCopyCacheToStorage(
  entries: readonly { key: CopyFormatId; value: string }[],
  doc?: Document,
): Promise<void> {
  const record: PickCopyCacheRecord = {};
  for (const { key, value } of entries) {
    if (!isPickCopyCacheValueStorable(key, value, doc)) continue;
    record[key] = value;
  }
  if (Object.keys(record).length === 0) {
    await ext.storage.local.remove(PICK_COPY_CACHE_STORAGE_KEY);
    const data = await ext.storage.local.get(PICK_COPY_CACHE_INDEX_KEY);
    applyPickCopyCachePresence(undefined, data[PICK_COPY_CACHE_INDEX_KEY]);
    return;
  }
  await ext.storage.local.set({ [PICK_COPY_CACHE_STORAGE_KEY]: record });
  const data = await ext.storage.local.get(PICK_COPY_CACHE_INDEX_KEY);
  applyPickCopyCachePresence(record, data[PICK_COPY_CACHE_INDEX_KEY]);
}

export async function clearPickCopyCacheStorage(): Promise<void> {
  await ext.storage.local.remove([
    PICK_COPY_CACHE_STORAGE_KEY,
    PICK_COPY_CACHE_INDEX_KEY,
    PICK_COPY_META_STORAGE_KEY,
  ]);
  applyPickCopyCachePresence(undefined, undefined);
}

export async function writePickCopyMetaToStorage(meta: PickCopyMeta): Promise<void> {
  await ext.storage.local.set({ [PICK_COPY_META_STORAGE_KEY]: meta });
}

export async function readPickCopyMetaFromStorage(): Promise<PickCopyMeta | undefined> {
  const data = await ext.storage.local.get(PICK_COPY_META_STORAGE_KEY);
  const meta = data[PICK_COPY_META_STORAGE_KEY];
  if (!meta || typeof meta !== "object") return undefined;
  const { tagName, hostname } = meta as PickCopyMeta;
  if (typeof tagName !== "string" || typeof hostname !== "string") return undefined;
  return { tagName, hostname };
}

export async function getPickCopyTextFromStorage(
  formatId: CopyFormatId,
): Promise<string | undefined> {
  const record = await readPickCopyCacheFromStorage();
  if (!record) return undefined;
  return record[resolvePickCopyCacheStorageKey(formatId)];
}
