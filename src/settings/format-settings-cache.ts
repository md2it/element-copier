import { ext } from "../api";
import { t } from "../i18n";
import { getLocale } from "../storage";
import {
  CLIPBOARD_DEFAULT_FORMAT_KEY,
  COMPUTE_IMAGES_ENABLED_KEY,
  COMPUTE_MARKDOWN_ENABLED_KEY,
  COMPUTE_TEXT_ENABLED_KEY,
  DEVELOPER_TOOLS_ENABLED_KEY,
  ENABLED_FORMATS_KEY,
  FRAME_LABEL_STYLE_KEY,
  INLINE_IMAGES_KEY,
  LOCALE_STORAGE_KEY,
} from "../messages";
import {
  defaultEnabledFormats,
  getDefaultAction,
  getEnabledFormats,
  isActiveDefaultAction,
  type ActiveDefaultAction,
  type EnabledFormatsMap,
} from "./format-settings";
import {
  DEFAULT_INLINE_IMAGES_MODE,
  getInlineImagesMode,
  type InlineImageMode,
} from "./inline-images";
import {
  DEFAULT_FRAME_LABEL_STYLE,
  getFrameLabelStyle,
  type FrameLabelStyle,
} from "./frame-label-style";

let cachedEnabledFormats: EnabledFormatsMap = defaultEnabledFormats();
let cachedDefaultAction: ActiveDefaultAction | null = null;
let cachedInlineImagesMode: InlineImageMode = DEFAULT_INLINE_IMAGES_MODE;
let cachedFrameLabelStyle: FrameLabelStyle = DEFAULT_FRAME_LABEL_STYLE;
let cachedFrameClickToCopyLabel = t("en").settingsFrameLabelClickToCopy;
let bound = false;

const frameLabelStyleChangeListeners = new Set<() => void>();

export function getCachedEnabledFormats(): EnabledFormatsMap {
  return cachedEnabledFormats;
}

export function getCachedDefaultAction(): ActiveDefaultAction | null {
  return cachedDefaultAction;
}

export function getCachedInlineImagesMode(): InlineImageMode {
  return cachedInlineImagesMode;
}

export function getCachedFrameLabelStyle(): FrameLabelStyle {
  return cachedFrameLabelStyle;
}

export function getCachedFrameClickToCopyLabel(): string {
  return cachedFrameClickToCopyLabel;
}

export function subscribeFrameLabelStyleChange(listener: () => void): () => void {
  frameLabelStyleChangeListeners.add(listener);
  return () => frameLabelStyleChangeListeners.delete(listener);
}

function shouldRefreshFrameLabel(
  previousStyle: FrameLabelStyle,
  previousClickToCopyLabel: string,
): boolean {
  if (previousStyle !== cachedFrameLabelStyle) return true;
  if (cachedFrameLabelStyle !== "click-to-copy") return false;
  return previousClickToCopyLabel !== cachedFrameClickToCopyLabel;
}

export async function refreshFormatSettingsCache(): Promise<void> {
  const previousFrameLabelStyle = cachedFrameLabelStyle;
  const previousClickToCopyLabel = cachedFrameClickToCopyLabel;
  cachedEnabledFormats = await getEnabledFormats();
  const stored = await getDefaultAction();
  cachedDefaultAction = isActiveDefaultAction(stored) ? stored : null;
  cachedInlineImagesMode = await getInlineImagesMode();
  cachedFrameLabelStyle = await getFrameLabelStyle();
  const locale = await getLocale();
  cachedFrameClickToCopyLabel = t(locale).settingsFrameLabelClickToCopy;
  if (
    shouldRefreshFrameLabel(previousFrameLabelStyle, previousClickToCopyLabel)
  ) {
    for (const listener of frameLabelStyleChangeListeners) {
      listener();
    }
  }
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
      changes[COMPUTE_IMAGES_ENABLED_KEY] ||
      changes[COMPUTE_MARKDOWN_ENABLED_KEY] ||
      changes[COMPUTE_TEXT_ENABLED_KEY] ||
      changes[CLIPBOARD_DEFAULT_FORMAT_KEY] ||
      changes[INLINE_IMAGES_KEY] ||
      changes[FRAME_LABEL_STYLE_KEY] ||
      changes[LOCALE_STORAGE_KEY]
    ) {
      void refreshFormatSettingsCache();
    }
  });
}
