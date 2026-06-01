import { INFO } from "../icons";
import {
  createInfoWindow,
  createInfoWindowClasses,
} from "../../../lib/src/info-window";
import type { Strings } from "../i18n";
import {
  CLIPBOARD_DEFAULT_NOTHING,
  getClipboardDefaultFormat,
  getDeveloperToolsEnabled,
  isDeveloperToolsGroup,
  setClipboardDefaultFormat,
  setDeveloperToolsEnabled,
  type EnabledFormatsMap,
} from "../settings/format-settings";
import {
  getInlineImagesMode,
  INLINE_IMAGES_MODES,
  setInlineImagesMode,
  type InlineImageMode,
} from "../settings/inline-images";
import type {
  CopiedPanelActionKind,
  CopiedPanelButtonSelection,
} from "../settings/copied-session";
import { createToggleRow } from "../panel-popup/toggle-row";
import {
  COPY,
  EXTERNAL_LINK,
  FILE_DOWN,
  IMAGE_DOWN,
  IMAGES,
} from "../../../lib/src/icons";
import {
  isPickCopyFormatAvailable,
  resolvePickCopyCacheStorageKey,
  type PickCopyCacheRecord,
} from "../pick-mode/pick-copy-cache-storage";
import {
  COPY_FORMATS,
  isClipboardCopyFormat,
  type CopyFormatId,
  type FormatDefinition,
  type SettingsChipGroup,
} from "./definitions";
import { isImageCopyFormat } from "../copy/screenshot";
import { canCopyFormatToClipboard } from "../element-copy";

const INFO_WINDOW_CLASSES = createInfoWindowClasses("ec");

function inlineImagesOptionLabel(mode: InlineImageMode, strings: Strings): string {
  switch (mode) {
    case "all":
      return strings.settingsInlineImagesUseAll;
    case "remove-large":
      return strings.settingsInlineImagesRemoveLarge;
    case "remove-small":
      return strings.settingsInlineImagesRemoveSmall;
    case "remove-all":
      return strings.settingsInlineImagesRemoveAll;
  }
}

function infoWindowContainer(anchor: HTMLElement): HTMLElement {
  return anchor.closest<HTMLElement>(".ec-panel") ?? document.body;
}

function openInlineImagesInfo(anchor: HTMLElement, strings: Strings): void {
  const container = infoWindowContainer(anchor);
  container.querySelector(`.${INFO_WINDOW_CLASSES.overlay}`)?.remove();

  const para = document.createElement("p");
  para.textContent = strings.settingsInlineImagesInfo;

  const { root } = createInfoWindow({
    classes: INFO_WINDOW_CLASSES,
    contentHtml: para.outerHTML,
    closeLabel: strings.infoWindowCloseLabel,
  });
  container.appendChild(root);
}

function createInlineImagesInfoButton(strings: Strings): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ec-inline-images-info";
  button.setAttribute("aria-label", strings.settingsInlineImagesInfoLabel);
  button.innerHTML = INFO;
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    openInlineImagesInfo(button, strings);
  });
  return button;
}

export async function createInlineImagesSelect(strings: Strings): Promise<HTMLElement> {
  const selectedMode = await getInlineImagesMode();

  const row = document.createElement("div");
  row.className = "ec-copy-default-row ec-inline-images-row";

  const label = document.createElement("label");
  label.className = "ec-copy-default-label ec-copy-default-label--with-info";
  label.htmlFor = "ec-inline-images-mode";

  const labelText = document.createElement("span");
  labelText.className = "ec-copy-default-label-text";
  labelText.textContent = strings.settingsInlineImagesLabel;

  const select = document.createElement("select");
  select.id = "ec-inline-images-mode";
  select.className = "ec-copy-default-select";

  for (const mode of INLINE_IMAGES_MODES) {
    const option = document.createElement("option");
    option.value = mode;
    option.textContent = inlineImagesOptionLabel(mode, strings);
    option.selected = mode === selectedMode;
    select.append(option);
  }

  select.addEventListener("change", () => {
    void setInlineImagesMode(select.value as InlineImageMode);
  });

  label.append(labelText, createInlineImagesInfoButton(strings));
  row.append(select, label);
  return row;
}

export async function createDeveloperToolsToggleRow(strings: Strings): Promise<HTMLElement> {
  const enabled = await getDeveloperToolsEnabled();
  const row = createToggleRow(strings.settingsDeveloperToolsToggleLabel, enabled, (next) => {
    void setDeveloperToolsEnabled(next);
  });
  row.classList.add("ec-developer-tools-toggle");
  return row;
}

const COPIED_CHIP_GROUPS: ReadonlyArray<{
  group: SettingsChipGroup;
  label: (strings: Strings) => string;
}> = [
  { group: "clipboard-copy", label: (strings) => strings.copiedCopyLabel },
  { group: "files", label: (strings) => strings.copiedFilesLabel },
];

export async function createClipboardDefaultFormatSelect(strings: Strings): Promise<HTMLElement> {
  const selectedFormatId = await getClipboardDefaultFormat();

  const row = document.createElement("div");
  row.className = "ec-copy-default-row";

  const label = document.createElement("label");
  label.className = "ec-copy-default-label";
  label.htmlFor = "ec-clipboard-default-format";
  label.textContent = strings.settingsCopyDefaultLabel;

  const select = document.createElement("select");
  select.id = "ec-clipboard-default-format";
  select.className = "ec-copy-default-select";

  const syncNothingSelectedStyle = (): void => {
    select.classList.toggle("ec-copy-default-select--nothing", select.value === CLIPBOARD_DEFAULT_NOTHING);
  };

  const nothingOption = document.createElement("option");
  nothingOption.className = "ec-copy-default-option-nothing";
  nothingOption.value = CLIPBOARD_DEFAULT_NOTHING;
  nothingOption.textContent = strings.settingsCopyDefaultNothing;
  nothingOption.selected = selectedFormatId === CLIPBOARD_DEFAULT_NOTHING;
  select.append(nothingOption);

  for (const format of COPY_FORMATS) {
    if (!isClipboardCopyFormat(format)) continue;
    const option = document.createElement("option");
    option.value = format.id;
    option.textContent = format.label(strings);
    option.selected = format.id === selectedFormatId;
    select.append(option);
  }

  syncNothingSelectedStyle();

  select.addEventListener("change", () => {
    syncNothingSelectedStyle();
    const value = select.value;
    if (value === CLIPBOARD_DEFAULT_NOTHING) {
      void setClipboardDefaultFormat(CLIPBOARD_DEFAULT_NOTHING);
      return;
    }
    void setClipboardDefaultFormat(value as CopyFormatId);
  });

  row.append(select, label);
  return row;
}

function isCopiedButtonSelected(
  element: HTMLButtonElement,
  selection: CopiedPanelButtonSelection | null,
): boolean {
  if (element.disabled || selection === null) return false;
  const action: CopiedPanelActionKind =
    element.dataset.actionKind === "download" ? "download" : "copy";
  return (
    element.dataset.formatId === selection.formatId && selection.action === action
  );
}

export function syncCopiedPanelFormatSelection(
  container: HTMLElement,
  selection: CopiedPanelButtonSelection | null,
): void {
  for (const button of Array.from(
    container.querySelectorAll<HTMLButtonElement>(".ec-format-action-btn"),
  )) {
    const selected = isCopiedButtonSelected(button, selection);
    button.classList.toggle("ec-format-action-btn--selected", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  }

  for (const row of Array.from(
    container.querySelectorAll<HTMLButtonElement>(".ec-copied-devtools-row"),
  )) {
    const selected = isCopiedButtonSelected(row, selection);
    row.classList.toggle("ec-copied-devtools-row--selected", selected);
    row.setAttribute("aria-pressed", selected ? "true" : "false");
  }

  for (const button of Array.from(
    container.querySelectorAll<HTMLButtonElement>(".ec-copied-url-copy"),
  )) {
    const selected = isCopiedButtonSelected(button, selection);
    button.classList.toggle("ec-copied-url-copy--selected", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  }
}

function formatActionIconMarkup(
  actionIcon: FormatDefinition["actionIcon"],
  actionKind: CopiedPanelActionKind,
): string {
  if (actionIcon === "file-down") return FILE_DOWN;
  if (actionIcon === "images") {
    return actionKind === "download" ? IMAGE_DOWN : IMAGES;
  }
  return COPY;
}

function formatActionButtonLabel(
  format: FormatDefinition,
  strings: Strings,
  actionKind: CopiedPanelActionKind,
): string {
  if (format.id === "png" && actionKind === "copy") {
    return strings.formatImage;
  }
  return format.label(strings);
}

function createFormatActionButton(
  format: FormatDefinition,
  strings: Strings,
  available: boolean,
  actionKind: CopiedPanelActionKind,
  onActivate: (formatId: CopyFormatId, actionKind: CopiedPanelActionKind) => void,
  unavailableTooltip?: string,
): HTMLButtonElement {
  const buttonLabel = formatActionButtonLabel(format, strings, actionKind);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ec-format-action-btn";
  button.dataset.formatId = format.id;
  button.dataset.actionKind = actionKind;
  button.setAttribute("aria-pressed", "false");
  button.setAttribute("aria-label", buttonLabel);

  const icon = document.createElement("span");
  icon.className = "ec-format-action-btn-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = formatActionIconMarkup(format.actionIcon, actionKind);
  button.append(icon);

  const label = document.createElement("span");
  label.className = "ec-format-action-btn-label";
  label.textContent = buttonLabel;
  button.append(label);

  if (!available) {
    button.disabled = true;
    button.classList.add("ec-format-action-btn--unavailable");
    if (unavailableTooltip) button.title = unavailableTooltip;
    return button;
  }

  button.addEventListener("click", () => {
    onActivate(format.id, actionKind);
  });

  return button;
}

function isDownloadFormatAction(actionIcon: FormatDefinition["actionIcon"]): boolean {
  return actionIcon === "file-down";
}

function copiedGroupHasImageDownloads(options: CopiedOtherOptionsOptions): boolean {
  if (!options.onSaveFormat) return false;
  return COPY_FORMATS.some(
    (format) =>
      isImageCopyFormat(format.id) &&
      options.enabledFormats[format.id],
  );
}

export type CopiedOtherOptionsOptions = {
  enabledFormats: EnabledFormatsMap;
  pickCopyCacheRecord: PickCopyCacheRecord | undefined;
  /** COPIED page root; sync format highlights within this subtree after the page is assembled. */
  selectionSyncRoot?: HTMLElement;
  onCopyFormat: (formatId: CopyFormatId) => void | boolean | Promise<boolean>;
  onSaveFormat?: (formatId: CopyFormatId) => void | boolean | Promise<boolean>;
  onOpenUrl?: (url: string) => void | Promise<void>;
};

function createCopiedBlock(): HTMLDivElement {
  const block = document.createElement("div");
  block.className = "ec-copied-block";
  return block;
}

function copiedGroupHasFormats(
  group: SettingsChipGroup,
  options: CopiedOtherOptionsOptions,
): boolean {
  if (isDeveloperToolsGroup(group) && !options.enabledFormats.outerHTML) {
    return false;
  }

  if (group === "files" && copiedGroupHasImageDownloads(options)) {
    return true;
  }

  return COPY_FORMATS.some((format) => {
    if (format.settingsGroup !== group) return false;
    if (!options.enabledFormats[format.id]) return false;
    const onActivate = isDownloadFormatAction(format.actionIcon)
      ? options.onSaveFormat
      : options.onCopyFormat;
    return Boolean(onActivate);
  });
}

function copiedFormatActionKind(
  format: FormatDefinition,
  imageDownloadButton: boolean,
): CopiedPanelActionKind {
  if (imageDownloadButton) return "download";
  return isDownloadFormatAction(format.actionIcon) ? "download" : "copy";
}

function createCopiedFormatInlineList(
  group: SettingsChipGroup,
  labelText: string,
  strings: Strings,
  options: CopiedOtherOptionsOptions,
  onSelectFormat: (formatId: CopyFormatId, actionKind: CopiedPanelActionKind) => void,
): HTMLElement {
  const row = document.createElement("div");
  row.className = "ec-settings-format-inline-list";
  row.setAttribute("role", "group");

  const labelId = `ec-copied-formats-${group}`;
  row.setAttribute("aria-labelledby", labelId);

  const label = document.createElement("span");
  label.id = labelId;
  label.className = "ec-settings-format-inline-list-label";
  label.textContent = labelText;
  row.append(label);

  for (const format of COPY_FORMATS) {
    if (format.settingsGroup !== group) continue;
    if (!options.enabledFormats[format.id]) continue;
    const isDownload = isDownloadFormatAction(format.actionIcon);
    const onActivate = isDownload ? options.onSaveFormat : options.onCopyFormat;
    if (!onActivate) continue;
    const inCache = isPickCopyFormatAvailable(
      format.id,
      options.pickCopyCacheRecord,
      document,
    );
    const clipboardWritable = isDownload || canCopyFormatToClipboard(format.id);
    const available = inCache && clipboardWritable;
    const unavailableTooltip =
      inCache && !clipboardWritable
        ? strings.copiedImageClipboardUnsupportedTooltip
        : undefined;
    const actionKind = copiedFormatActionKind(format, false);
    row.append(
      createFormatActionButton(
        format,
        strings,
        available,
        actionKind,
        (formatId, kind) => {
          void Promise.resolve(onActivate(formatId)).then((copied) => {
            if (copied) onSelectFormat(formatId, kind);
          });
        },
        unavailableTooltip,
      ),
    );
  }

  if (group === "files" && options.onSaveFormat) {
    for (const format of COPY_FORMATS) {
      if (!isImageCopyFormat(format.id)) continue;
      if (!options.enabledFormats[format.id]) continue;
      const available = isPickCopyFormatAvailable(
        format.id,
        options.pickCopyCacheRecord,
        document,
      );
      row.append(
        createFormatActionButton(
          format,
          strings,
          available,
          "download",
          (formatId, kind) => {
            void Promise.resolve(options.onSaveFormat?.(formatId)).then((saved) => {
              if (saved) onSelectFormat(formatId, kind);
            });
          },
        ),
      );
    }
  }

  return row;
}

function createCopiedUrlInlineRow(
  strings: Strings,
  options: CopiedOtherOptionsOptions,
  onSelectFormat: (formatId: CopyFormatId, actionKind: CopiedPanelActionKind) => void,
): HTMLElement {
  const row = document.createElement("div");
  row.className = "ec-settings-format-inline-list ec-copied-url-inline";
  row.setAttribute("role", "group");
  row.setAttribute("aria-label", strings.formatUrl);

  const available = isPickCopyFormatAvailable("url", options.pickCopyCacheRecord, document);
  const urlValue = options.pickCopyCacheRecord?.url ?? "";

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "ec-copied-url-copy";
  copyButton.dataset.formatId = "url";
  copyButton.dataset.actionKind = "copy";
  copyButton.setAttribute("aria-pressed", "false");
  copyButton.setAttribute("aria-label", strings.formatUrl);
  copyButton.disabled = !available;
  if (!available) {
    copyButton.classList.add("ec-copied-url-copy--unavailable");
  }

  const field = document.createElement("span");
  field.className = "ec-copied-devtools-row-field";

  const value = document.createElement("span");
  value.className = "ec-copied-devtools-row-value";
  value.textContent = urlValue;
  field.append(value);

  const copyIcon = document.createElement("span");
  copyIcon.className = "ec-copied-devtools-row-copy-icon";
  copyIcon.setAttribute("aria-hidden", "true");
  copyIcon.innerHTML = COPY;
  field.append(copyIcon);

  copyButton.append(field);
  copyButton.addEventListener("click", () => {
    if (!available) return;
    void Promise.resolve(options.onCopyFormat("url")).then((copied) => {
      if (copied) onSelectFormat("url", "copy");
    });
  });

  const openUrlButton = document.createElement("button");
  openUrlButton.type = "button";
  openUrlButton.className = "ec-copied-url-open";
  openUrlButton.innerHTML = EXTERNAL_LINK;
  openUrlButton.setAttribute("aria-label", strings.copiedOpenUrlIconLabel);
  openUrlButton.title = strings.copiedOpenUrlLabel;
  openUrlButton.disabled = !available || !options.onOpenUrl;
  openUrlButton.addEventListener("click", () => {
    if (!available || !options.onOpenUrl) return;
    void options.onOpenUrl(urlValue);
  });

  row.append(openUrlButton, copyButton);
  return row;
}

function createCopiedDeveloperToolsRows(
  strings: Strings,
  options: CopiedOtherOptionsOptions,
  onSelectFormat: (formatId: CopyFormatId, actionKind: CopiedPanelActionKind) => void,
): HTMLElement | null {
  const formats = COPY_FORMATS.filter(
    (format) =>
      format.settingsGroup === "devtools" &&
      options.enabledFormats[format.id] &&
      options.onCopyFormat,
  );
  if (formats.length === 0) return null;

  const block = createCopiedBlock();

  const rows = document.createElement("div");
  rows.className = "ec-copied-devtools-rows";

  for (const format of formats) {
    const available = isPickCopyFormatAvailable(
      format.id,
      options.pickCopyCacheRecord,
      document,
    );
    const cacheKey = resolvePickCopyCacheStorageKey(format.id);
    const preview = options.pickCopyCacheRecord?.[cacheKey] ?? "";

    const row = document.createElement("button");
    row.type = "button";
    row.className = "ec-copied-devtools-row";
    row.dataset.formatId = format.id;
    row.setAttribute("aria-pressed", "false");
    row.disabled = !available;
    if (!available) {
      row.classList.add("ec-copied-devtools-row--unavailable");
    }

    const label = document.createElement("span");
    label.className = "ec-copied-devtools-row-label";
    label.textContent = format.label(strings);

    const field = document.createElement("span");
    field.className = "ec-copied-devtools-row-field";

    const value = document.createElement("span");
    value.className = "ec-copied-devtools-row-value";
    value.textContent = preview;
    field.append(value);

    const copyIcon = document.createElement("span");
    copyIcon.className = "ec-copied-devtools-row-copy-icon";
    copyIcon.setAttribute("aria-hidden", "true");
    copyIcon.innerHTML = COPY;
    field.append(copyIcon);

    row.append(label, field);
    row.dataset.actionKind = "copy";
    row.addEventListener("click", () => {
      if (!available) return;
      void Promise.resolve(options.onCopyFormat(format.id)).then((copied) => {
        if (copied) onSelectFormat(format.id, "copy");
      });
    });

    rows.append(row);
  }

  block.append(rows);
  return block;
}

export type CopiedOtherOptionsRow = {
  root: HTMLElement;
  urlBlock: HTMLDivElement;
  selectFormat: (formatId: CopyFormatId, actionKind: CopiedPanelActionKind) => void;
};

export function createCopiedOtherOptionsRow(
  strings: Strings,
  options: CopiedOtherOptionsOptions,
): CopiedOtherOptionsRow {
  const section = document.createElement("div");
  section.className = "ec-copied-other-options";
  section.setAttribute("role", "group");
  section.setAttribute("aria-label", strings.copiedFormatsGroupLabel);

  const urlBlock = document.createElement("div");
  urlBlock.className = "ec-copied-url-block";

  const selectionSyncRoot = options.selectionSyncRoot ?? section;

  const selectFormat = (
    formatId: CopyFormatId,
    actionKind: CopiedPanelActionKind,
  ): void => {
    syncCopiedPanelFormatSelection(selectionSyncRoot, {
      formatId,
      action: actionKind,
    });
  };

  urlBlock.append(createCopiedUrlInlineRow(strings, options, selectFormat));

  for (const { group, label: groupLabel } of COPIED_CHIP_GROUPS) {
    if (!copiedGroupHasFormats(group, options)) continue;
    const block = createCopiedBlock();
    block.append(
      createCopiedFormatInlineList(group, groupLabel(strings), strings, options, selectFormat),
    );
    section.append(block);
  }

  const devtoolsBlock = createCopiedDeveloperToolsRows(strings, options, selectFormat);
  if (devtoolsBlock) {
    section.append(devtoolsBlock);
  }

  return { root: section, urlBlock, selectFormat };
}
