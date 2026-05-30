import { ext } from "../api";
import {
  COPY_FORMATS,
  DEFAULT_CLIPBOARD_FORMAT_ID,
  normalizeCopyFormatId,
  type CopyFormatId,
  type SettingsChipGroup,
} from "../formats/definitions";
import {
  CLIPBOARD_DEFAULT_FORMAT_KEY,
  DEVELOPER_TOOLS_ENABLED_KEY,
  ENABLED_FORMATS_KEY,
} from "../messages";

export type EnabledFormatsMap = Record<CopyFormatId, boolean>;

const DEVTOOLS_FORMAT_IDS = COPY_FORMATS.filter(
  (format) => format.settingsGroup === "devtools",
).map((format) => format.id);

function buildEnabledFormatsMap(developerToolsEnabled: boolean): EnabledFormatsMap {
  return Object.fromEntries(
    COPY_FORMATS.map((format) => [
      format.id,
      format.settingsGroup === "devtools" ? developerToolsEnabled : true,
    ]),
  ) as EnabledFormatsMap;
}

export function defaultEnabledFormats(): EnabledFormatsMap {
  return buildEnabledFormatsMap(true);
}

function migrateDeveloperToolsFromLegacyEnabledFormats(
  raw: unknown,
): boolean | undefined {
  if (typeof raw !== "object" || raw === null) {
    return undefined;
  }

  const stored = raw as Partial<Record<string, unknown>>;
  if (DEVTOOLS_FORMAT_IDS.some((id) => stored[id] === true)) {
    return true;
  }
  if (DEVTOOLS_FORMAT_IDS.every((id) => stored[id] === false)) {
    return false;
  }

  if (typeof stored.declaredStyles === "boolean" && typeof stored.styles !== "boolean") {
    if (stored.declaredStyles) return true;
  }

  return undefined;
}

export async function getDeveloperToolsEnabled(): Promise<boolean> {
  const data = await ext.storage.local.get([
    DEVELOPER_TOOLS_ENABLED_KEY,
    ENABLED_FORMATS_KEY,
  ]);
  const stored = data[DEVELOPER_TOOLS_ENABLED_KEY];
  if (typeof stored === "boolean") {
    return stored;
  }

  const migrated = migrateDeveloperToolsFromLegacyEnabledFormats(
    data[ENABLED_FORMATS_KEY],
  );
  return migrated ?? true;
}

export async function setDeveloperToolsEnabled(enabled: boolean): Promise<void> {
  await ext.storage.local.set({ [DEVELOPER_TOOLS_ENABLED_KEY]: enabled });
}

export async function getEnabledFormats(): Promise<EnabledFormatsMap> {
  const developerToolsEnabled = await getDeveloperToolsEnabled();
  return buildEnabledFormatsMap(developerToolsEnabled);
}

export function isDeveloperToolsGroup(group: SettingsChipGroup): boolean {
  return group === "devtools";
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
