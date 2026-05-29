import type { Strings } from "../i18n";

/** Action icon shown on format chips and COPIED buttons (fr-copy.md). */
export type FormatActionIconId = "copy" | "files" | "images" | "file-down" | "image-down";

export type CopyFormatId =
  | "outerHTML"
  | "selector"
  | "jsPath"
  | "computedStyles"
  | "styles"
  | "xpath"
  | "fullXPath";

export type FormatDefinition = {
  id: CopyFormatId;
  label: (strings: Strings) => string;
  actionIcon: FormatActionIconId;
};

/** Copy-only formats from fr-copy.md (ДОСТУПНЫЕ ФОРМАТЫ). */
export const COPY_FORMATS: readonly FormatDefinition[] = [
  {
    id: "outerHTML",
    label: (s) => s.formatOuterHtml,
    actionIcon: "copy",
  },
  {
    id: "selector",
    label: (s) => s.formatSelector,
    actionIcon: "copy",
  },
  {
    id: "jsPath",
    label: (s) => s.formatJsPath,
    actionIcon: "copy",
  },
  {
    id: "computedStyles",
    label: (s) => s.formatComputedStyles,
    actionIcon: "copy",
  },
  {
    id: "styles",
    label: (s) => s.formatStyles,
    actionIcon: "copy",
  },
  {
    id: "xpath",
    label: (s) => s.formatXPath,
    actionIcon: "copy",
  },
  {
    id: "fullXPath",
    label: (s) => s.formatFullXPath,
    actionIcon: "copy",
  },
] as const;

export const DEFAULT_CLIPBOARD_FORMAT_ID: CopyFormatId = "outerHTML";

export function isCopyFormatId(value: unknown): value is CopyFormatId {
  return COPY_FORMATS.some((format) => format.id === value);
}

const LEGACY_COPY_FORMAT_ID_ALIASES: Readonly<Record<string, CopyFormatId>> = {
  declaredStyles: "styles",
};

export function normalizeCopyFormatId(value: unknown): CopyFormatId | undefined {
  if (isCopyFormatId(value)) return value;
  if (typeof value === "string") {
    const aliased = LEGACY_COPY_FORMAT_ID_ALIASES[value];
    if (aliased) return aliased;
  }
  return undefined;
}
