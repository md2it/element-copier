import { COPY, EXTERNAL_LINK, INFO } from "../icons";
import {
  createInfoWindow,
  createInfoWindowClasses,
} from "../../../lib/src/info-window";
import type { Strings } from "../i18n";
import {
  getComputeFormatsSettings,
  setComputeImagesEnabled,
} from "../settings/compute-formats";
import {
  CLIPBOARD_DEFAULT_NOTHING,
  DEFAULT_ACTION_STORAGE_OPTIONS,
  ensureDefaultActionAllowsComputeImages,
  encodeDefaultAction,
  getDeveloperToolsEnabled,
  isComputeControlledFormat,
  isDeveloperToolsGroup,
  isImageDefaultActionStorageValue,
  parseStoredDefaultAction,
  setDefaultAction,
  setDeveloperToolsEnabled,
  type DefaultActionStorageValue,
  type EnabledFormatsMap,
} from "../settings/format-settings";
import {
  getInlineImagesMode,
  INLINE_IMAGES_MODES,
  setInlineImagesMode,
  type InlineImageMode,
} from "../settings/inline-images";
import {
  FRAME_LABEL_STYLES,
  getFrameLabelStyle,
  setFrameLabelStyle,
  type FrameLabelStyle,
} from "../settings/frame-label-style";
import type {
  CopiedPanelActionKind,
  CopiedPanelButtonSelection,
} from "../settings/copied-session";
import { PANEL_POPUP_ROOT_ID } from "../panel-popup/constants";
import { applyPanelTheme } from "../panel-popup/panel-theme";
import { createToggleRow } from "../panel-popup/toggle-row";
import { getDarkThemeEnabled, setDarkThemeEnabled } from "../settings/theme-settings";
import {
  isPickCopyFormatAvailable,
  resolvePickCopyCacheStorageKey,
  type PickCopyCacheRecord,
} from "../pick-mode/pick-copy-cache-storage";
import {
  COPY_FORMATS,
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

function openSettingsInfoWindow(anchor: HTMLElement, strings: Strings, message: string): void {
  const container = infoWindowContainer(anchor);
  container.querySelector(`.${INFO_WINDOW_CLASSES.overlay}`)?.remove();

  const para = document.createElement("p");
  para.textContent = message;

  const { root } = createInfoWindow({
    classes: INFO_WINDOW_CLASSES,
    contentHtml: para.outerHTML,
    closeLabel: strings.infoWindowCloseLabel,
  });
  container.appendChild(root);
}

function createSettingsInfoButton(
  ariaLabel: string,
  onOpen: (anchor: HTMLElement) => void,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ec-inline-images-info";
  button.setAttribute("aria-label", ariaLabel);
  button.innerHTML = INFO;
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    onOpen(button);
  });
  return button;
}

function attachInfoToToggleLabel(
  row: HTMLElement,
  labelText: string,
  infoAriaLabel: string,
  infoMessage: string,
  strings: Strings,
): void {
  const label = row.querySelector<HTMLLabelElement>(".ec-toggle-label");
  if (!label) return;

  label.classList.add("ec-toggle-label--with-info");
  const labelTextEl = document.createElement("span");
  labelTextEl.className = "ec-toggle-label-text";
  labelTextEl.textContent = labelText;
  label.replaceChildren(
    labelTextEl,
    createSettingsInfoButton(infoAriaLabel, (anchor) => {
      openSettingsInfoWindow(anchor, strings, infoMessage);
    }),
  );
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

  label.append(
    labelText,
    createSettingsInfoButton(strings.settingsInlineImagesInfoLabel, (anchor) => {
      openSettingsInfoWindow(anchor, strings, strings.settingsInlineImagesInfo);
    }),
  );
  row.append(label, select);
  return row;
}

function frameLabelStyleOptionLabel(style: FrameLabelStyle, strings: Strings): string {
  switch (style) {
    case "none":
      return strings.settingsFrameLabelNone;
    case "click-to-copy":
      return strings.settingsFrameLabelClickToCopy;
    case "tag-id-class":
      return strings.settingsFrameLabelTagIdClass;
    case "selector":
      return strings.settingsFrameLabelSelector;
    case "full-xpath":
      return strings.settingsFrameLabelFullXPath;
  }
}

export async function createFrameLabelStyleSelect(strings: Strings): Promise<HTMLElement> {
  const selectedStyle = await getFrameLabelStyle();

  const row = document.createElement("div");
  row.className = "ec-copy-default-row ec-frame-label-style-row";

  const label = document.createElement("label");
  label.className = "ec-copy-default-label";
  label.htmlFor = "ec-frame-label-style";
  label.textContent = strings.settingsFrameLabelStyleLabel;

  const select = document.createElement("select");
  select.id = "ec-frame-label-style";
  select.className = "ec-copy-default-select";

  for (const style of FRAME_LABEL_STYLES) {
    const option = document.createElement("option");
    option.value = style;
    option.textContent = frameLabelStyleOptionLabel(style, strings);
    option.selected = style === selectedStyle;
    select.append(option);
  }

  select.addEventListener("change", () => {
    void setFrameLabelStyle(select.value as FrameLabelStyle);
  });

  row.append(label, select);
  return row;
}

export async function createComputeFormatsSection(strings: Strings): Promise<HTMLElement> {
  const settings = await getComputeFormatsSettings();

  const section = document.createElement("div");
  section.className = "ec-compute-formats-section";

  const imagesRow = createToggleRow(strings.settingsComputeImagesLabel, settings.computeImages, (next) => {
    void (async () => {
      await setComputeImagesEnabled(next);
      await syncDefaultActionSelect(strings);
    })();
  });
  imagesRow.classList.add("ec-compute-formats-toggle");
  attachInfoToToggleLabel(
    imagesRow,
    strings.settingsComputeImagesLabel,
    strings.settingsComputeImagesInfoLabel,
    strings.settingsComputeImagesInfo,
    strings,
  );

  section.append(imagesRow);
  return section;
}

export async function createDeveloperToolsToggleRow(strings: Strings): Promise<HTMLElement> {
  const enabled = await getDeveloperToolsEnabled();
  const row = createToggleRow(strings.settingsDeveloperToolsToggleLabel, enabled, (next) => {
    void setDeveloperToolsEnabled(next);
  });
  row.classList.add("ec-developer-tools-toggle");
  return row;
}

export async function createDarkThemeToggleRow(strings: Strings): Promise<HTMLElement> {
  const enabled = await getDarkThemeEnabled();
  const row = createToggleRow(strings.settingsDarkThemeToggleLabel, enabled, (next) => {
    void setDarkThemeEnabled(next);
    applyPanelTheme(next);
  });
  row.classList.add("ec-dark-theme-toggle");
  return row;
}

const COPIED_CHIP_GROUPS: ReadonlyArray<{
  group: SettingsChipGroup;
  label: (strings: Strings) => string;
}> = [
  { group: "clipboard-copy", label: (strings) => strings.copiedCopyLabel },
  { group: "files", label: (strings) => strings.copiedFilesLabel },
];

function defaultActionOptionLabel(
  storageValue: DefaultActionStorageValue,
  strings: Strings,
): string {
  switch (storageValue) {
    case CLIPBOARD_DEFAULT_NOTHING:
      return strings.settingsDefaultActionNothing;
    case "copy:text":
      return strings.settingsDefaultActionCopyText;
    case "copy:markdown":
      return strings.settingsDefaultActionCopyMarkdown;
    case "copy:png":
      return strings.settingsDefaultActionCopyImage;
    case "download:markdownFile":
      return strings.settingsDefaultActionDownloadMarkdown;
    case "download:htmlFile":
      return strings.settingsDefaultActionDownloadHtml;
    case "download:png":
      return strings.settingsDefaultActionDownloadPng;
    case "download:jpeg":
      return strings.settingsDefaultActionDownloadJpeg;
    case "copy:outerHTML":
      return strings.settingsDefaultActionCopyCode;
    case "copy:selector":
      return strings.settingsDefaultActionCopySelector;
    case "copy:jsPath":
      return strings.settingsDefaultActionCopyJsPath;
    case "copy:xpath":
      return strings.settingsDefaultActionCopyXPath;
    case "copy:fullXPath":
      return strings.settingsDefaultActionCopyFullXPath;
    case "copy:styles":
      return strings.settingsDefaultActionCopyStyles;
    case "copy:computedStyles":
      return strings.settingsDefaultActionCopyComputedStyles;
  }
}

function applyDefaultActionNothingStyle(select: HTMLSelectElement): void {
  select.classList.toggle("ec-copy-default-select--nothing", select.value === CLIPBOARD_DEFAULT_NOTHING);
}

function findDefaultActionSelect(): HTMLSelectElement | null {
  const select = document
    .getElementById(PANEL_POPUP_ROOT_ID)
    ?.shadowRoot?.querySelector("#ec-clipboard-default-format");
  return select instanceof HTMLSelectElement ? select : null;
}

function findComputeImagesToggle(): HTMLButtonElement | null {
  const toggle = document
    .getElementById(PANEL_POPUP_ROOT_ID)
    ?.shadowRoot?.querySelector(".ec-compute-formats-toggle .ec-toggle");
  return toggle instanceof HTMLButtonElement ? toggle : null;
}

function syncComputeImagesToggleUi(enabled: boolean): void {
  const toggle = findComputeImagesToggle();
  if (!toggle) return;
  toggle.classList.toggle("is-on", enabled);
  toggle.setAttribute("aria-checked", enabled ? "true" : "false");
}

async function populateDefaultActionSelect(
  select: HTMLSelectElement,
  strings: Strings,
): Promise<void> {
  const selectedAction = await ensureDefaultActionAllowsComputeImages();
  const selectedValue = encodeDefaultAction(selectedAction);

  select.replaceChildren();
  for (const storageValue of DEFAULT_ACTION_STORAGE_OPTIONS) {
    const option = document.createElement("option");
    option.value = storageValue;
    option.textContent = defaultActionOptionLabel(storageValue, strings);
    option.selected = storageValue === selectedValue;
    if (storageValue === CLIPBOARD_DEFAULT_NOTHING) {
      option.className = "ec-copy-default-option-nothing";
    }
    select.append(option);
  }

  select.value = selectedValue;
  applyDefaultActionNothingStyle(select);
}

export async function syncDefaultActionSelect(strings: Strings): Promise<void> {
  const select = findDefaultActionSelect();
  if (!select) return;
  await populateDefaultActionSelect(select, strings);
}

export async function createClipboardDefaultFormatSelect(strings: Strings): Promise<HTMLElement> {
  const row = document.createElement("div");
  row.className = "ec-copy-default-row";

  const label = document.createElement("label");
  label.className = "ec-copy-default-label";
  label.htmlFor = "ec-clipboard-default-format";
  label.textContent = strings.settingsDefaultActionLabel;

  const select = document.createElement("select");
  select.id = "ec-clipboard-default-format";
  select.className = "ec-copy-default-select";

  await populateDefaultActionSelect(select, strings);

  select.addEventListener("change", () => {
    applyDefaultActionNothingStyle(select);
    void (async () => {
      await setDefaultAction(parseStoredDefaultAction(select.value));
      if (isImageDefaultActionStorageValue(select.value)) {
        const settings = await getComputeFormatsSettings();
        if (!settings.computeImages) {
          await setComputeImagesEnabled(true);
          syncComputeImagesToggleUi(true);
        }
      }
    })();
  });

  row.append(label, select);
  return row;
}

function isInactiveFormatActionButton(element: HTMLButtonElement): boolean {
  return (
    element.classList.contains("ec-format-action-btn--unavailable") ||
    element.classList.contains("ec-format-action-btn--settings-off")
  );
}

const FORMAT_ACTION_TOOLTIP_VISIBLE_CLASS = "ec-format-action-btn--show-tooltip";

let visibleFormatActionTooltipButton: HTMLButtonElement | null = null;
let formatActionTooltipDismissBound = false;

function hideAllFormatActionTooltips(): void {
  visibleFormatActionTooltipButton?.classList.remove(FORMAT_ACTION_TOOLTIP_VISIBLE_CLASS);
  visibleFormatActionTooltipButton = null;
}

function isInactiveFormatActionButtonElement(element: EventTarget | null): element is HTMLButtonElement {
  return (
    element instanceof HTMLButtonElement &&
    isInactiveFormatActionButton(element)
  );
}

function bindFormatActionTooltipDismiss(): void {
  if (formatActionTooltipDismissBound) return;
  formatActionTooltipDismissBound = true;

  window.addEventListener(
    "click",
    (event) => {
      const inactiveButton =
        event.composedPath().find(isInactiveFormatActionButtonElement) ?? null;
      const wasSameButton =
        inactiveButton !== null && inactiveButton === visibleFormatActionTooltipButton;

      hideAllFormatActionTooltips();

      if (inactiveButton && !wasSameButton) {
        inactiveButton.classList.add(FORMAT_ACTION_TOOLTIP_VISIBLE_CLASS);
        visibleFormatActionTooltipButton = inactiveButton;
      }
    },
    true,
  );
}

function bindInactiveFormatButtonTooltip(button: HTMLButtonElement, tooltip: string): void {
  button.dataset.tooltip = tooltip;
  bindFormatActionTooltipDismiss();
}

function isCopiedButtonSelected(
  element: HTMLButtonElement,
  selection: CopiedPanelButtonSelection | null,
): boolean {
  if (element.disabled || isInactiveFormatActionButton(element) || selection === null) return false;
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
  options?: {
    unavailableTooltip?: string;
    settingsOff?: boolean;
    settingsOffTooltip?: string;
  },
): HTMLButtonElement {
  const buttonLabel = formatActionButtonLabel(format, strings, actionKind);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ec-format-action-btn";
  button.dataset.formatId = format.id;
  button.dataset.actionKind = actionKind;
  button.setAttribute("aria-pressed", "false");
  button.setAttribute("aria-label", buttonLabel);
  button.textContent = buttonLabel;

  if (options?.settingsOff) {
    button.classList.add("ec-format-action-btn--unavailable", "ec-format-action-btn--settings-off");
    bindInactiveFormatButtonTooltip(
      button,
      options.settingsOffTooltip ?? strings.copiedFormatTurnedOffInSettings,
    );
    return button;
  }

  if (!available) {
    button.classList.add("ec-format-action-btn--unavailable");
    bindInactiveFormatButtonTooltip(
      button,
      options?.unavailableTooltip ?? strings.copiedFormatNothingInCache,
    );
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
    (format) => isImageCopyFormat(format.id) && shouldShowCopiedFormat(format.id, options),
  );
}

function shouldShowCopiedFormat(
  formatId: CopyFormatId,
  options: CopiedOtherOptionsOptions,
): boolean {
  if (options.enabledFormats[formatId]) return true;
  return isComputeControlledFormat(formatId);
}

function isCopiedFormatSettingsOff(
  formatId: CopyFormatId,
  options: CopiedOtherOptionsOptions,
): boolean {
  return !options.enabledFormats[formatId] && isComputeControlledFormat(formatId);
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
    if (!shouldShowCopiedFormat(format.id, options)) return false;
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
    if (!shouldShowCopiedFormat(format.id, options)) continue;
    const isDownload = isDownloadFormatAction(format.actionIcon);
    const onActivate = isDownload ? options.onSaveFormat : options.onCopyFormat;
    if (!onActivate) continue;
    const settingsOff = isCopiedFormatSettingsOff(format.id, options);
    const inCache = isPickCopyFormatAvailable(
      format.id,
      options.pickCopyCacheRecord,
      document,
    );
    const clipboardWritable = isDownload || canCopyFormatToClipboard(format.id);
    const available = !settingsOff && inCache && clipboardWritable;
    const unavailableTooltip =
      !settingsOff && inCache && !clipboardWritable
        ? strings.copiedImageClipboardUnsupportedTooltip
        : !settingsOff && !inCache
          ? strings.copiedFormatNothingInCache
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
        {
          unavailableTooltip,
          settingsOff,
          settingsOffTooltip: strings.copiedFormatTurnedOffInSettings,
        },
      ),
    );
  }

  if (group === "files" && options.onSaveFormat) {
    for (const format of COPY_FORMATS) {
      if (!isImageCopyFormat(format.id)) continue;
      if (!shouldShowCopiedFormat(format.id, options)) continue;
      const settingsOff = isCopiedFormatSettingsOff(format.id, options);
      const inCache = isPickCopyFormatAvailable(
        format.id,
        options.pickCopyCacheRecord,
        document,
      );
      const available = !settingsOff && inCache;
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
          {
            unavailableTooltip: !settingsOff && !inCache
              ? strings.copiedFormatNothingInCache
              : undefined,
            settingsOff,
            settingsOffTooltip: strings.copiedFormatTurnedOffInSettings,
          },
        ),
      );
    }
  }

  return row;
}

function appendCopiedFieldCopyIcon(field: HTMLElement): void {
  const icon = document.createElement("span");
  icon.className = "ec-copied-devtools-row-copy-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = COPY;
  field.append(icon);
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
  appendCopiedFieldCopyIcon(field);

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
    appendCopiedFieldCopyIcon(field);

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
