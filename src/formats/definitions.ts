import type { Strings } from "../i18n";

/** Routing/semantics for COPIED buttons (copy to clipboard vs download a file). */
export type FormatActionIconId = "copy" | "files" | "images" | "file-down" | "image-down";

/** Per-format icon shown on chips and COPIED buttons (SPEC/fr-copy-save.md). */
export type FormatIconId =
  | "code-xml"
  | "terminal"
  | "list-plus"
  | "list-minus"
  | "text-initial"
  | "markdown"
  | "markdown-file";

export type CopyFormatId =
  | "outerHTML"
  | "selector"
  | "jsPath"
  | "computedStyles"
  | "styles"
  | "xpath"
  | "fullXPath"
  | "text"
  | "markdown"
  | "markdownFile";

export type SettingsChipGroup = "files" | "clipboard-text" | "devtools";

export type FormatDefinition = {
  id: CopyFormatId;
  label: (strings: Strings) => string;
  icon: FormatIconId;
  actionIcon: FormatActionIconId;
  settingsGroup: SettingsChipGroup;
};

/** Copy-only formats from fr-copy.md (ДОСТУПНЫЕ ФОРМАТЫ). Devtools order matches SPEC/fr-copy-save.md. */
export const COPY_FORMATS: readonly FormatDefinition[] = [
  {
    id: "outerHTML",
    label: (s) => s.formatCode,
    icon: "code-xml",
    actionIcon: "copy",
    settingsGroup: "devtools",
  },
  {
    id: "computedStyles",
    label: (s) => s.formatComputedStyles,
    icon: "list-plus",
    actionIcon: "copy",
    settingsGroup: "devtools",
  },
  {
    id: "styles",
    label: (s) => s.formatStyles,
    icon: "list-minus",
    actionIcon: "copy",
    settingsGroup: "devtools",
  },
  {
    id: "selector",
    label: (s) => s.formatSelector,
    icon: "terminal",
    actionIcon: "copy",
    settingsGroup: "devtools",
  },
  {
    id: "jsPath",
    label: (s) => s.formatJsPath,
    icon: "terminal",
    actionIcon: "copy",
    settingsGroup: "devtools",
  },
  {
    id: "xpath",
    label: (s) => s.formatXPath,
    icon: "terminal",
    actionIcon: "copy",
    settingsGroup: "devtools",
  },
  {
    id: "fullXPath",
    label: (s) => s.formatFullXPath,
    icon: "terminal",
    actionIcon: "copy",
    settingsGroup: "devtools",
  },
  {
    id: "text",
    label: (s) => s.formatText,
    icon: "text-initial",
    actionIcon: "copy",
    settingsGroup: "clipboard-text",
  },
  {
    id: "markdown",
    label: (s) => s.formatMarkdown,
    icon: "markdown",
    actionIcon: "copy",
    settingsGroup: "clipboard-text",
  },
  {
    id: "markdownFile",
    label: (s) => s.formatMarkdown,
    icon: "markdown-file",
    actionIcon: "file-down",
    settingsGroup: "files",
  },
] as const;

/** Formats that write plain text to the clipboard (excludes file/image download actions). */
export function isClipboardCopyFormat(format: FormatDefinition): boolean {
  return format.actionIcon === "copy";
}

export const CLIPBOARD_COPY_FORMATS = COPY_FORMATS.filter(isClipboardCopyFormat);

export const DEFAULT_CLIPBOARD_FORMAT_ID: CopyFormatId = "text";

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
