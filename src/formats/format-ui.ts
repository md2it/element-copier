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
import { createToggleRow } from "../panel-popup/toggle-row";
import {
  isPickCopyFormatAvailable,
  type PickCopyCacheRecord,
} from "../pick-mode/pick-copy-cache-storage";
import {
  COPY_FORMATS,
  isClipboardCopyFormat,
  type CopyFormatId,
  type FormatDefinition,
  type FormatIconId,
  type SettingsChipGroup,
} from "./definitions";
import { isImageCopyFormat } from "../copy/screenshot";
import { createFormatIcon } from "./format-icons";

const INFO_WINDOW_CLASSES = createInfoWindowClasses("ec");

function inlineImagesOptionLabel(mode: InlineImageMode, strings: Strings): string {
  switch (mode) {
    case "all":
      return strings.settingsInlineImagesUseAll;
    case "remove-large":
      return strings.settingsInlineImagesRemoveLarge;
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
  label.className = "ec-copy-default-label";
  label.htmlFor = "ec-inline-images-mode";
  label.textContent = strings.settingsInlineImagesLabel;

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

  row.append(label, createInlineImagesInfoButton(strings), select);
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
  { group: "clipboard-text", label: (strings) => strings.copiedCopyTextLabel },
  { group: "copy-images", label: (strings) => strings.copiedCopyImagesLabel },
  { group: "files", label: (strings) => strings.copiedFilesLabel },
  { group: "devtools", label: (strings) => strings.copiedDeveloperToolsLabel },
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

  row.append(label, select);
  return row;
}

function syncSelectedFormatActionButton(
  container: HTMLElement,
  formatId: CopyFormatId | null,
): void {
  for (const button of Array.from(
    container.querySelectorAll<HTMLButtonElement>(".ec-format-action-btn"),
  )) {
    const unavailable = button.disabled;
    const selected =
      !unavailable && formatId !== null && button.dataset.formatId === formatId;
    button.classList.toggle("ec-format-action-btn--selected", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  }
}

function createFormatActionButton(
  format: FormatDefinition,
  strings: Strings,
  available: boolean,
  onActivate: (formatId: CopyFormatId) => void,
  iconId: FormatIconId = format.icon,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ec-format-action-btn";
  button.dataset.formatId = format.id;
  button.setAttribute("aria-pressed", "false");
  button.setAttribute("aria-label", format.label(strings));

  button.append(createFormatIcon(iconId));

  const label = document.createElement("span");
  label.className = "ec-format-action-btn-label";
  label.textContent = format.label(strings);
  button.append(label);

  if (!available) {
    button.disabled = true;
    button.classList.add("ec-format-action-btn--unavailable");
    return button;
  }

  button.addEventListener("click", () => {
    onActivate(format.id);
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
  selectedFormatId?: CopyFormatId | null;
  onCopyFormat: (formatId: CopyFormatId) => void;
  onSaveFormat?: (formatId: CopyFormatId) => void;
};

function createCopiedFormatGroupDivider(): HTMLDivElement {
  const divider = document.createElement("div");
  divider.className = "dd-panel-divider ec-copied-format-group-divider";
  divider.setAttribute("aria-hidden", "true");
  return divider;
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

function createCopiedFormatInlineList(
  group: SettingsChipGroup,
  labelText: string,
  strings: Strings,
  options: CopiedOtherOptionsOptions,
  onSelectFormat: (formatId: CopyFormatId) => void,
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
    const onActivate = isDownloadFormatAction(format.actionIcon)
      ? options.onSaveFormat
      : options.onCopyFormat;
    if (!onActivate) continue;
    const available = isPickCopyFormatAvailable(
      format.id,
      options.pickCopyCacheRecord,
      document,
    );
    row.append(
      createFormatActionButton(format, strings, available, (formatId) => {
        onSelectFormat(formatId);
        onActivate(formatId);
      }),
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
          (formatId) => {
            onSelectFormat(formatId);
            options.onSaveFormat?.(formatId);
          },
          "image-down",
        ),
      );
    }
  }

  return row;
}

export function createCopiedOtherOptionsRow(
  strings: Strings,
  options: CopiedOtherOptionsOptions,
): HTMLElement {
  const section = document.createElement("div");
  section.className = "ec-copied-other-options";
  section.setAttribute("role", "group");
  section.setAttribute("aria-label", strings.copiedFormatsGroupLabel);

  const selectFormat = (formatId: CopyFormatId): void => {
    syncSelectedFormatActionButton(section, formatId);
  };

  let hasPreviousGroup = false;
  for (const { group, label: groupLabel } of COPIED_CHIP_GROUPS) {
    if (!copiedGroupHasFormats(group, options)) continue;
    if (hasPreviousGroup) {
      section.append(createCopiedFormatGroupDivider());
    }
    hasPreviousGroup = true;
    section.append(
      createCopiedFormatInlineList(
        group,
        groupLabel(strings),
        strings,
        options,
        selectFormat,
      ),
    );
  }

  syncSelectedFormatActionButton(section, options.selectedFormatId ?? null);

  return section;
}
