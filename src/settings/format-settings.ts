import { ext } from "../api";
import {
  COPY_FORMATS,
  DEFAULT_CLIPBOARD_FORMAT_ID,
  normalizeCopyFormatId,
  type CopyFormatId,
} from "../formats/definitions";
import {
  CLIPBOARD_DEFAULT_FORMAT_KEY,
  ENABLED_FORMATS_KEY,
} from "../messages";

export type EnabledFormatsMap = Record<CopyFormatId, boolean>;

const DEFAULT_DISABLED_FORMAT_IDS = new Set<CopyFormatId>(["styles", "xpath"]);

export function defaultEnabledFormats(): EnabledFormatsMap {
  return Object.fromEntries(
    COPY_FORMATS.map((format) => [
      format.id,
      !DEFAULT_DISABLED_FORMAT_IDS.has(format.id),
    ]),
  ) as EnabledFormatsMap;
}

export async function getEnabledFormats(): Promise<EnabledFormatsMap> {
  const data = await ext.storage.local.get(ENABLED_FORMATS_KEY);
  const raw = data[ENABLED_FORMATS_KEY];
  const defaults = defaultEnabledFormats();

  if (typeof raw !== "object" || raw === null) {
    return defaults;
  }

  const stored = raw as Partial<Record<string, unknown>>;
  for (const format of COPY_FORMATS) {
    const enabled = stored[format.id];
    if (typeof enabled === "boolean") {
      defaults[format.id] = enabled;
    }
  }

  if (typeof stored.declaredStyles === "boolean" && typeof stored.styles !== "boolean") {
    defaults.styles = stored.declaredStyles;
  }

  return defaults;
}

export async function setFormatEnabled(
  formatId: CopyFormatId,
  enabled: boolean,
): Promise<void> {
  const current = await getEnabledFormats();
  current[formatId] = enabled;
  await ext.storage.local.set({ [ENABLED_FORMATS_KEY]: current });
}

export const CLIPBOARD_DEFAULT_NOTHING = "nothing";

export type ClipboardDefaultFormatId = CopyFormatId | typeof CLIPBOARD_DEFAULT_NOTHING;

export function isActiveCopyDefault(
  formatId: ClipboardDefaultFormatId,
): formatId is CopyFormatId {
  return formatId !== CLIPBOARD_DEFAULT_NOTHING;
}

export async function getClipboardDefaultFormat(): Promise<ClipboardDefaultFormatId> {
  const data = await ext.storage.local.get(CLIPBOARD_DEFAULT_FORMAT_KEY);
  const raw = data[CLIPBOARD_DEFAULT_FORMAT_KEY];
  if (raw === CLIPBOARD_DEFAULT_NOTHING) {
    return CLIPBOARD_DEFAULT_NOTHING;
  }
  return normalizeCopyFormatId(raw) ?? DEFAULT_CLIPBOARD_FORMAT_ID;
}

export async function setClipboardDefaultFormat(
  formatId: ClipboardDefaultFormatId,
): Promise<void> {
  await ext.storage.local.set({ [CLIPBOARD_DEFAULT_FORMAT_KEY]: formatId });
}
