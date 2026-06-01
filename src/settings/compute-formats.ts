import { ext } from "../api";
import type { CopyFormatId } from "../formats/definitions";
import {
  COMPUTE_IMAGES_ENABLED_KEY,
  COMPUTE_MARKDOWN_ENABLED_KEY,
  COMPUTE_TEXT_ENABLED_KEY,
} from "../messages";

export type ComputeFormatsSettings = {
  computeImages: boolean;
  computeMarkdown: boolean;
  computeText: boolean;
};

const COMPUTE_IMAGES_FORMAT_IDS: readonly CopyFormatId[] = ["png", "jpeg"];
const COMPUTE_MARKDOWN_FORMAT_IDS: readonly CopyFormatId[] = ["markdown", "markdownFile"];
const COMPUTE_TEXT_FORMAT_IDS: readonly CopyFormatId[] = ["text"];

export function defaultComputeFormatsSettings(): ComputeFormatsSettings {
  return {
    computeImages: true,
    computeMarkdown: true,
    computeText: true,
  };
}

export function isComputeControlledFormat(formatId: CopyFormatId): boolean {
  return (
    COMPUTE_IMAGES_FORMAT_IDS.includes(formatId) ||
    COMPUTE_MARKDOWN_FORMAT_IDS.includes(formatId) ||
    COMPUTE_TEXT_FORMAT_IDS.includes(formatId)
  );
}

export function isFormatEnabledByComputeSettings(
  formatId: CopyFormatId,
  settings: ComputeFormatsSettings,
): boolean {
  if (COMPUTE_IMAGES_FORMAT_IDS.includes(formatId)) return settings.computeImages;
  if (COMPUTE_MARKDOWN_FORMAT_IDS.includes(formatId)) return settings.computeMarkdown;
  if (COMPUTE_TEXT_FORMAT_IDS.includes(formatId)) return settings.computeText;
  return true;
}

function readStoredBoolean(raw: unknown, fallback: boolean): boolean {
  return typeof raw === "boolean" ? raw : fallback;
}

export async function getComputeFormatsSettings(): Promise<ComputeFormatsSettings> {
  const defaults = defaultComputeFormatsSettings();
  const data = await ext.storage.local.get([
    COMPUTE_IMAGES_ENABLED_KEY,
    COMPUTE_MARKDOWN_ENABLED_KEY,
    COMPUTE_TEXT_ENABLED_KEY,
  ]);
  return {
    computeImages: readStoredBoolean(data[COMPUTE_IMAGES_ENABLED_KEY], defaults.computeImages),
    computeMarkdown: readStoredBoolean(
      data[COMPUTE_MARKDOWN_ENABLED_KEY],
      defaults.computeMarkdown,
    ),
    computeText: readStoredBoolean(data[COMPUTE_TEXT_ENABLED_KEY], defaults.computeText),
  };
}

export async function setComputeImagesEnabled(enabled: boolean): Promise<void> {
  await ext.storage.local.set({ [COMPUTE_IMAGES_ENABLED_KEY]: enabled });
}

export async function setComputeMarkdownEnabled(enabled: boolean): Promise<void> {
  await ext.storage.local.set({ [COMPUTE_MARKDOWN_ENABLED_KEY]: enabled });
}

export async function setComputeTextEnabled(enabled: boolean): Promise<void> {
  await ext.storage.local.set({ [COMPUTE_TEXT_ENABLED_KEY]: enabled });
}
