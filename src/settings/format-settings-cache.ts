import { ext } from "../api";
import {
  COPY_FORMATS,
  DEFAULT_CLIPBOARD_FORMAT_ID,
  type CopyFormatId,
} from "../formats/definitions";
import {
  CLIPBOARD_DEFAULT_FORMAT_KEY,
  ENABLED_FORMATS_KEY,
} from "../messages";
import type { EnabledFormatsMap } from "./format-settings";
import { getClipboardDefaultFormat, getEnabledFormats } from "./format-settings";

function defaultEnabledFormats(): EnabledFormatsMap {
  return Object.fromEntries(
    COPY_FORMATS.map((format) => [format.id, true]),
  ) as EnabledFormatsMap;
}

let cachedEnabledFormats: EnabledFormatsMap = defaultEnabledFormats();
let cachedDefaultFormat: CopyFormatId = DEFAULT_CLIPBOARD_FORMAT_ID;
let bound = false;

export function getCachedEnabledFormats(): EnabledFormatsMap {
  return cachedEnabledFormats;
}

export function getCachedClipboardDefaultFormat(): CopyFormatId {
  return cachedDefaultFormat;
}

export async function refreshFormatSettingsCache(): Promise<void> {
  cachedEnabledFormats = await getEnabledFormats();
  cachedDefaultFormat = await getClipboardDefaultFormat();
}

export function bindFormatSettingsCache(): void {
  if (bound) return;
  bound = true;
  void refreshFormatSettingsCache();
  ext.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes[ENABLED_FORMATS_KEY] || changes[CLIPBOARD_DEFAULT_FORMAT_KEY]) {
      void refreshFormatSettingsCache();
    }
  });
}
