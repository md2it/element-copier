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
import {
  getComputeFormatsSettings,
  isFormatEnabledByComputeSettings,
  type ComputeFormatsSettings,
} from "./compute-formats";

export type EnabledFormatsMap = Record<CopyFormatId, boolean>;

const DEVTOOLS_FORMAT_IDS = COPY_FORMATS.filter(
  (format) => format.settingsGroup === "devtools",
).map((format) => format.id);

function buildEnabledFormatsMap(
  developerToolsEnabled: boolean,
  compute: ComputeFormatsSettings,
): EnabledFormatsMap {
  return Object.fromEntries(
    COPY_FORMATS.map((format) => {
      if (format.settingsGroup === "devtools") {
        return [format.id, developerToolsEnabled];
      }
      return [format.id, isFormatEnabledByComputeSettings(format.id, compute)];
    }),
  ) as EnabledFormatsMap;
}

export function defaultEnabledFormats(): EnabledFormatsMap {
  return buildEnabledFormatsMap(true, {
    computeImages: true,
    computeMarkdown: true,
    computeText: true,
  });
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
  const [developerToolsEnabled, compute] = await Promise.all([
    getDeveloperToolsEnabled(),
    getComputeFormatsSettings(),
  ]);
  return buildEnabledFormatsMap(developerToolsEnabled, compute);
}

export { isComputeControlledFormat } from "./compute-formats";

export function isDeveloperToolsGroup(group: SettingsChipGroup): boolean {
  return group === "devtools";
}

export const CLIPBOARD_DEFAULT_NOTHING = "nothing";

export type DefaultActionKind = "copy" | "download";

export type ActiveDefaultAction = {
  formatId: CopyFormatId;
  action: DefaultActionKind;
};

export type DefaultAction = typeof CLIPBOARD_DEFAULT_NOTHING | ActiveDefaultAction;

/** Spec order for SETTINGS "Default action" dropdown (storage-encoded values). */
export const DEFAULT_ACTION_STORAGE_OPTIONS = [
  CLIPBOARD_DEFAULT_NOTHING,
  "copy:text",
  "copy:markdown",
  "copy:png",
  "download:markdownFile",
  "download:htmlFile",
  "download:png",
  "download:jpeg",
  "copy:outerHTML",
  "copy:selector",
  "copy:jsPath",
  "copy:xpath",
  "copy:fullXPath",
  "copy:styles",
  "copy:computedStyles",
] as const;

export type DefaultActionStorageValue = (typeof DEFAULT_ACTION_STORAGE_OPTIONS)[number];

export function isActiveDefaultAction(
  action: DefaultAction,
): action is ActiveDefaultAction {
  return action !== CLIPBOARD_DEFAULT_NOTHING;
}

export function encodeDefaultAction(action: DefaultAction): string {
  if (action === CLIPBOARD_DEFAULT_NOTHING) return CLIPBOARD_DEFAULT_NOTHING;
  return `${action.action}:${action.formatId}`;
}

export function parseStoredDefaultAction(raw: unknown): DefaultAction {
  if (raw === CLIPBOARD_DEFAULT_NOTHING) {
    return CLIPBOARD_DEFAULT_NOTHING;
  }
  if (typeof raw === "string") {
    const colon = raw.indexOf(":");
    if (colon > 0) {
      const kind = raw.slice(0, colon);
      const formatId = normalizeCopyFormatId(raw.slice(colon + 1));
      if (formatId && (kind === "copy" || kind === "download")) {
        return { formatId, action: kind };
      }
    }
    const legacyFormatId = normalizeCopyFormatId(raw);
    if (legacyFormatId) {
      return { formatId: legacyFormatId, action: "copy" };
    }
  }
  return { formatId: DEFAULT_CLIPBOARD_FORMAT_ID, action: "copy" };
}

export function defaultDefaultAction(): ActiveDefaultAction {
  return { formatId: DEFAULT_CLIPBOARD_FORMAT_ID, action: "copy" };
}

export async function getDefaultAction(): Promise<DefaultAction> {
  const data = await ext.storage.local.get(CLIPBOARD_DEFAULT_FORMAT_KEY);
  const raw = data[CLIPBOARD_DEFAULT_FORMAT_KEY];
  if (raw === undefined) {
    return defaultDefaultAction();
  }
  return parseStoredDefaultAction(raw);
}

export async function setDefaultAction(action: DefaultAction): Promise<void> {
  await ext.storage.local.set({
    [CLIPBOARD_DEFAULT_FORMAT_KEY]: encodeDefaultAction(action),
  });
}
