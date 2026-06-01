import { ext } from "../api";
import type { InlineImageMode } from "../../../lib/src/copy/cleanup/index";
import { INLINE_IMAGES_KEY } from "../messages";

export type { InlineImageMode } from "../../../lib/src/copy/cleanup/index";

export const DEFAULT_INLINE_IMAGES_MODE: InlineImageMode = "all";

export const INLINE_IMAGES_MODES: readonly InlineImageMode[] = [
  "all",
  "remove-large",
  "remove-small",
  "remove-all",
];

function normalizeInlineImagesMode(raw: unknown): InlineImageMode {
  return INLINE_IMAGES_MODES.includes(raw as InlineImageMode)
    ? (raw as InlineImageMode)
    : DEFAULT_INLINE_IMAGES_MODE;
}

export async function getInlineImagesMode(): Promise<InlineImageMode> {
  const data = await ext.storage.local.get(INLINE_IMAGES_KEY);
  return normalizeInlineImagesMode(data[INLINE_IMAGES_KEY]);
}

export async function setInlineImagesMode(mode: InlineImageMode): Promise<void> {
  await ext.storage.local.set({ [INLINE_IMAGES_KEY]: mode });
}
