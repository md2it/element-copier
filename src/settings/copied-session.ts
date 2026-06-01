import { ext } from "../api";
import { normalizeCopyFormatId, type CopyFormatId } from "../formats/definitions";

export const LAST_COPIED_FORMAT_KEY = "lastCopiedFormat";
export const LAST_DOWNLOADED_FORMAT_KEY = "lastDownloadedFormat";
export const LAST_COPIED_PANEL_ACTION_KEY = "lastCopiedPanelAction";
/** True after copy or a COPIED-page action; cleared when the panel closes. */
export const COPIED_PANEL_SHOW_STATUS_KEY = "copiedPanelShowStatus";

export type CopiedPanelLastAction = "copied" | "saved";

/** COPIED button highlight: copy-to-clipboard vs download (same formatId can exist twice). */
export type CopiedPanelActionKind = "copy" | "download";

export type CopiedPanelButtonSelection = {
  formatId: CopyFormatId;
  action: CopiedPanelActionKind;
};

export async function getLastCopiedFormat(): Promise<CopyFormatId | null> {
  const data = await ext.storage.session.get(LAST_COPIED_FORMAT_KEY);
  const raw = data[LAST_COPIED_FORMAT_KEY];
  return normalizeCopyFormatId(raw) ?? null;
}

export async function getLastDownloadedFormat(): Promise<CopyFormatId | null> {
  const data = await ext.storage.session.get(LAST_DOWNLOADED_FORMAT_KEY);
  const raw = data[LAST_DOWNLOADED_FORMAT_KEY];
  return normalizeCopyFormatId(raw) ?? null;
}

export async function getLastCopiedPanelAction(): Promise<CopiedPanelLastAction | null> {
  const data = await ext.storage.session.get(LAST_COPIED_PANEL_ACTION_KEY);
  const raw = data[LAST_COPIED_PANEL_ACTION_KEY];
  if (raw === "copied" || raw === "saved") return raw;
  return null;
}

export async function setLastCopiedFormat(formatId: CopyFormatId | null): Promise<void> {
  if (formatId === null) {
    await ext.storage.session.remove(LAST_COPIED_FORMAT_KEY);
    await ext.storage.session.remove(LAST_COPIED_PANEL_ACTION_KEY);
    return;
  }
  await ext.storage.session.set({
    [LAST_COPIED_FORMAT_KEY]: formatId,
    [LAST_COPIED_PANEL_ACTION_KEY]: "copied",
  });
}

export async function setLastDownloadedFormat(formatId: CopyFormatId): Promise<void> {
  await ext.storage.session.set({
    [LAST_DOWNLOADED_FORMAT_KEY]: formatId,
    [LAST_COPIED_PANEL_ACTION_KEY]: "saved",
  });
}

export async function markCopiedPanelShowStatus(): Promise<void> {
  await ext.storage.session.set({ [COPIED_PANEL_SHOW_STATUS_KEY]: true });
}

export async function clearCopiedPanelShowStatus(): Promise<void> {
  await ext.storage.session.remove(COPIED_PANEL_SHOW_STATUS_KEY);
}

export async function shouldShowCopiedPanelStatus(): Promise<boolean> {
  const data = await ext.storage.session.get(COPIED_PANEL_SHOW_STATUS_KEY);
  return data[COPIED_PANEL_SHOW_STATUS_KEY] === true;
}

/** COPIED highlight: last copy or download action (one button at a time). */
export function resolveCopiedPanelSelection(
  lastAction: CopiedPanelLastAction | null,
  lastCopiedFormatId: CopyFormatId | null,
  lastDownloadedFormatId: CopyFormatId | null,
  clipboardDefaultFormatId: CopyFormatId | null = null,
): CopiedPanelButtonSelection | null {
  if (lastAction === "saved") {
    return lastDownloadedFormatId
      ? { formatId: lastDownloadedFormatId, action: "download" }
      : null;
  }
  const copiedFormatId = lastCopiedFormatId ?? clipboardDefaultFormatId;
  return copiedFormatId ? { formatId: copiedFormatId, action: "copy" } : null;
}
