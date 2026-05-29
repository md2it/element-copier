import type { Strings } from "../i18n";
import {
  getClipboardDefaultFormat,
  getEnabledFormats,
  setClipboardDefaultFormat,
  setFormatEnabled,
  type EnabledFormatsMap,
} from "../settings/format-settings";
import {
  COPY_FORMATS,
  type CopyFormatId,
  type FormatDefinition,
} from "./definitions";
import { createFormatActionIcon } from "./format-icons";

function createFormatChip(
  format: FormatDefinition,
  strings: Strings,
  enabled: boolean,
  onToggle: (next: boolean) => void,
): HTMLButtonElement {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "ec-format-chip";
  chip.dataset.formatId = format.id;
  chip.setAttribute("aria-pressed", enabled ? "true" : "false");
  chip.setAttribute("aria-label", format.label(strings));

  const sync = (on: boolean): void => {
    chip.classList.toggle("is-enabled", on);
    chip.setAttribute("aria-pressed", on ? "true" : "false");
  };

  sync(enabled);

  chip.append(createFormatActionIcon(format.actionIcon));

  const labelText = format.label(strings);
  const label = document.createElement("span");
  label.className = "ec-format-chip-label";
  label.dataset.text = labelText;

  const labelContent = document.createElement("span");
  labelContent.className = "ec-format-chip-label-text";
  labelContent.textContent = labelText;
  label.append(labelContent);
  chip.append(label);

  chip.addEventListener("click", () => {
    const next = !chip.classList.contains("is-enabled");
    sync(next);
    onToggle(next);
  });

  return chip;
}

export async function createCopiedPageOptionsSection(strings: Strings): Promise<HTMLElement> {
  const enabled = await getEnabledFormats();

  const section = document.createElement("div");
  section.className = "ec-settings-copied-options";

  const headingId = "ec-settings-copied-options-label";
  const heading = document.createElement("p");
  heading.id = headingId;
  heading.className = "ec-settings-copied-options-label";
  heading.textContent = strings.settingsFormatsGroupLabel;

  const list = document.createElement("div");
  list.className = "ec-format-chip-list";
  list.setAttribute("role", "group");
  list.setAttribute("aria-labelledby", headingId);

  for (const format of COPY_FORMATS) {
    list.append(
      createFormatChip(format, strings, enabled[format.id], (next) => {
        enabled[format.id] = next;
        void setFormatEnabled(format.id, next);
      }),
    );
  }

  section.append(heading, list);
  return section;
}

export async function createClipboardDefaultFormatSelect(strings: Strings): Promise<HTMLElement> {
  const selectedFormatId = await getClipboardDefaultFormat();

  const field = document.createElement("div");
  field.className = "ec-format-field";

  const label = document.createElement("label");
  label.className = "ec-format-field-label";
  label.htmlFor = "ec-clipboard-default-format";
  label.textContent = strings.settingsClipboardDefaultFormatLabel;

  const select = document.createElement("select");
  select.id = "ec-clipboard-default-format";
  select.className = "ec-format-select";

  for (const format of COPY_FORMATS) {
    const option = document.createElement("option");
    option.value = format.id;
    option.textContent = format.label(strings);
    option.selected = format.id === selectedFormatId;
    select.append(option);
  }

  select.addEventListener("change", () => {
    const formatId = select.value as CopyFormatId;
    void setClipboardDefaultFormat(formatId);
  });

  field.append(label, select);
  return field;
}

function createFormatActionButton(
  format: FormatDefinition,
  strings: Strings,
  onCopy: (formatId: CopyFormatId) => void,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ec-format-action-btn";
  button.dataset.formatId = format.id;
  button.setAttribute("aria-label", format.label(strings));

  button.append(createFormatActionIcon(format.actionIcon));

  const label = document.createElement("span");
  label.className = "ec-format-action-btn-label";
  label.textContent = format.label(strings);
  button.append(label);

  button.addEventListener("click", () => {
    onCopy(format.id);
  });

  return button;
}

export type CopiedOtherOptionsOptions = {
  enabledFormats: EnabledFormatsMap;
  onCopyFormat: (formatId: CopyFormatId) => void;
  onOpenSettings?: () => void;
};

export function createCopiedOtherOptionsRow(
  strings: Strings,
  options: CopiedOtherOptionsOptions,
): HTMLElement {
  const row = document.createElement("div");
  row.className = "ec-copied-other-options";
  row.setAttribute("role", "group");
  row.setAttribute("aria-label", strings.copiedFormatsGroupLabel);

  const label = document.createElement("span");
  label.className = "ec-copied-other-options-label";
  label.textContent = strings.copiedFormatsGroupLabel;
  row.append(label);

  for (const format of COPY_FORMATS) {
    if (!options.enabledFormats[format.id]) continue;
    row.append(createFormatActionButton(format, strings, options.onCopyFormat));
  }

  if (options.onOpenSettings) {
    const settingsLink = document.createElement("button");
    settingsLink.type = "button";
    settingsLink.className = "ec-copied-settings-link";
    settingsLink.textContent = strings.copiedSettingsLink;
    settingsLink.addEventListener("click", () => {
      options.onOpenSettings!();
    });
    row.append(settingsLink);
  }

  return row;
}
