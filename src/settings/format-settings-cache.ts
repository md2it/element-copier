import { ext } from "../api";
import type { CopyFormatId } from "../formats/definitions";
import {
  CLIPBOARD_DEFAULT_FORMAT_KEY,
  DEVELOPER_TOOLS_ENABLED_KEY,
  ENABLED_FORMATS_KEY,
  INLINE_IMAGES_KEY,
} from "../messages";
import {
  defaultEnabledFormats,
  getClipboardDefaultFormat,
  getEnabledFormats,
  isActiveCopyDefault,
  type EnabledFormatsMap,
} from "./format-settings";
import {
  DEFAULT_INLINE_IMAGES_MODE,
  getInlineImagesMode,
  type InlineImageMode,
} from "./inline-images";

let cachedEnabledFormats: EnabledFormatsMap = defaultEnabledFormats();
let cachedDefaultFormat: CopyFormatId | null = null;
let cachedInlineImagesMode: InlineImageMode = DEFAULT_INLINE_IMAGES_MODE;
let bound = false;

export function getCachedEnabledFormats(): EnabledFormatsMap {
  return cachedEnabledFormats;
}

export function getCachedClipboardDefaultFormat(): CopyFormatId | null {
  return cachedDefaultFormat;
}

export function getCachedInlineImagesMode(): InlineImageMode {
  return cachedInlineImagesMode;
}

export async function refreshFormatSettingsCache(): Promise<void> {
  cachedEnabledFormats = await getEnabledFormats();
  const stored = await getClipboardDefaultFormat();
  cachedDefaultFormat = isActiveCopyDefault(stored) ? stored : null;
  cachedInlineImagesMode = await getInlineImagesMode();
}

export function bindFormatSettingsCache(): void {
  if (bound) return;
  bound = true;
  void refreshFormatSettingsCache();
  ext.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (
      changes[DEVELOPER_TOOLS_ENABLED_KEY] ||
      changes[ENABLED_FORMATS_KEY] ||
      changes[CLIPBOARD_DEFAULT_FORMAT_KEY] ||
      changes[INLINE_IMAGES_KEY]
    ) {
      void refreshFormatSettingsCache();
    }
  });
}
