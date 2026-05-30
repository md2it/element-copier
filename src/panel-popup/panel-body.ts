import { buildAboutListItems } from "../about";
import {
  COPY_FORMATS,
  type CopyFormatId,
} from "../formats/definitions";
import {
  createClipboardDefaultFormatSelect,
  createCopiedOtherOptionsRow,
  createCopiedPageOptionsSection,
} from "../formats/format-ui";
import type { Strings } from "../i18n";
import { PANEL_FOOTER_LINKEDIN_URL } from "../../../lib/src/panel-footer/constants";
import {
  ABOUT_PREFIX_CHORD_MAC_DISPLAY,
  ABOUT_PREFIX_CHORD_WIN_DISPLAY,
} from "../hotkeys/keys";
import { getSkipStartPage, setSkipStartPage } from "../settings/skip-start-page";
import { getEnabledFormats } from "../settings/format-settings";
import { getLastCopiedFormat, setLastCopiedFormat } from "../settings/copied-session";
import { copyPickedFormatFromPanel } from "./lifecycle";
import { createToggleRow } from "./toggle-row";

export const PANEL_BODY_CENTERED_CLASS = "ec-panel-body--centered";

export type PlaceholderPanelTab = "history";

export type StartPanelActions = {
  onStart: () => void;
};

function createSkipStartToggleRow(strings: Strings, enabled: boolean): HTMLElement {
  const row = createToggleRow(strings.skipStartPageToggleLabel, enabled, (next) => {
    void setSkipStartPage(next);
  });
  row.classList.add("ec-skip-start-toggle");
  return row;
}

function appendSkipStartToggle(page: HTMLElement, strings: Strings): void {
  void (async () => {
    const enabled = await getSkipStartPage();
    page.append(createSkipStartToggleRow(strings, enabled));
  })();
}

function createPageDivider(): HTMLDivElement {
  const divider = document.createElement("div");
  divider.className = "dd-panel-divider ec-panel-page-divider";
  return divider;
}

function createAboutIcon(iconHtml: string): HTMLSpanElement {
  const mark = document.createElement("span");
  mark.className = "ec-about-icon";
  mark.setAttribute("aria-hidden", "true");
  mark.innerHTML = iconHtml;
  return mark;
}

function createKbd(text: string): HTMLElement {
  const kbd = document.createElement("kbd");
  kbd.className = "ec-about-kbd";
  kbd.textContent = text;
  return kbd;
}

const SHORTCUTS_STEP_RELEASE_EMPHASIS = "Release";

function appendShortcutsStepRelease(step: HTMLLIElement, text: string): void {
  if (text.startsWith(SHORTCUTS_STEP_RELEASE_EMPHASIS)) {
    const emphasis = document.createElement("span");
    emphasis.className = "ec-shortcuts-step-emphasis";
    emphasis.textContent = SHORTCUTS_STEP_RELEASE_EMPHASIS;
    step.append(emphasis, document.createTextNode(text.slice(SHORTCUTS_STEP_RELEASE_EMPHASIS.length)));
    return;
  }
  step.textContent = text;
}

function createShortcutsSectionDivider(): HTMLDivElement {
  const divider = document.createElement("div");
  divider.className = "dd-panel-divider ec-shortcuts-divider";
  divider.setAttribute("aria-hidden", "true");
  return divider;
}

function buildShortcutsSteps(strings: Strings): HTMLOListElement {
  const steps = document.createElement("ol");
  steps.className = "ec-shortcuts-steps";

  const step1 = document.createElement("li");
  step1.className = "ec-shortcuts-step--press";

  const pressGrid = document.createElement("div");
  pressGrid.className = "ec-shortcuts-step-press-grid";

  const pressLabel = document.createElement("span");
  pressLabel.className = "ec-shortcuts-step-press-label";
  pressLabel.textContent = strings.shortcutsStepPress;

  const pressChords = document.createElement("div");
  pressChords.className = "ec-shortcuts-step-press-chords";
  pressChords.append(createKbd(ABOUT_PREFIX_CHORD_WIN_DISPLAY));

  const pressMacLabel = document.createElement("span");
  pressMacLabel.className = "ec-shortcuts-step-press-mac-label";
  pressMacLabel.textContent = strings.shortcutsStepOnMac;

  const pressMacChords = document.createElement("div");
  pressMacChords.className = "ec-shortcuts-step-press-mac-chords";
  pressMacChords.append(createKbd(ABOUT_PREFIX_CHORD_MAC_DISPLAY));

  pressGrid.append(pressLabel, pressChords, pressMacLabel, pressMacChords);
  step1.append(pressGrid);

  const step2 = document.createElement("li");
  appendShortcutsStepRelease(step2, strings.shortcutsStepRelease);

  const step3 = document.createElement("li");
  step3.append(
    document.createTextNode(`${strings.shortcutsStepThenPress} `),
    createKbd("D"),
  );

  steps.append(step1, step2, step3);
  return steps;
}

function createAboutCredit(strings: Strings): HTMLDivElement {
  const credit = document.createElement("div");
  credit.className = "ec-about-credit";

  const divider = document.createElement("div");
  divider.className = "dd-panel-divider ec-about-credit-divider";
  divider.setAttribute("aria-hidden", "true");

  const productLine = document.createElement("p");
  productLine.className = "ec-about-credit-line";
  productLine.textContent = strings.aboutProductName;

  const copyrightLine = document.createElement("p");
  copyrightLine.className = "ec-about-credit-line";

  const link = document.createElement("a");
  link.href = PANEL_FOOTER_LINKEDIN_URL;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = strings.aboutCreditAuthor;
  link.addEventListener("click", (e: MouseEvent) => {
    e.stopPropagation();
  });

  copyrightLine.append("© ", link);
  credit.append(divider, productLine, copyrightLine);
  return credit;
}

export function buildStartPanelBody(
  body: HTMLDivElement,
  strings: Strings,
  actions: StartPanelActions,
): void {
  body.replaceChildren();

  const page = document.createElement("div");
  page.className = "ec-panel-page ec-panel-page--start";

  const title = document.createElement("h2");
  title.className = "ec-panel-page-title";
  title.textContent = strings.titleSettings.toUpperCase();

  const center = document.createElement("div");
  center.className = "ec-start-center";

  const startBtn = document.createElement("button");
  startBtn.type = "button";
  startBtn.className = "ec-start-btn";
  startBtn.textContent = strings.startButtonLabel;
  startBtn.addEventListener("click", () => {
    actions.onStart();
  });

  center.append(startBtn);
  page.append(title, createPageDivider(), center);
  appendSkipStartToggle(page, strings);
  body.append(page);
}

export async function buildSettingsPanelBody(
  body: HTMLDivElement,
  strings: Strings,
): Promise<void> {
  body.replaceChildren();

  const [clipboardDefaultFormat, copiedPageOptions, skipStartEnabled] = await Promise.all([
    createClipboardDefaultFormatSelect(strings),
    createCopiedPageOptionsSection(strings),
    getSkipStartPage(),
  ]);

  const page = document.createElement("div");
  page.className = "ec-panel-page ec-panel-page--settings";

  const title = document.createElement("h2");
  title.className = "ec-panel-page-title";
  title.textContent = strings.pageSettingsTitle;

  page.append(
    title,
    createPageDivider(),
    createSkipStartToggleRow(strings, skipStartEnabled),
    clipboardDefaultFormat,
    createPageDivider(),
    copiedPageOptions,
  );
  body.append(page);
}

export function buildPlaceholderPanelBody(
  body: HTMLDivElement,
  tab: PlaceholderPanelTab,
  strings: Strings,
): void {
  body.replaceChildren();

  const page = document.createElement("div");
  page.className = "ec-panel-page";

  const title = document.createElement("h2");
  title.className = "ec-panel-page-title";
  title.textContent = strings.pageHistoryTitle;

  const text = document.createElement("p");
  text.className = "ec-panel-page-text";
  text.textContent = strings.pagePlaceholderTodo;

  page.append(title, createPageDivider(), text);
  body.append(page);
}

export function buildAboutPanelBody(body: HTMLDivElement, strings: Strings): void {
  body.replaceChildren();

  const page = document.createElement("div");
  page.className = "ec-panel-page ec-panel-page--about";

  const title = document.createElement("h2");
  title.className = "ec-panel-page-title";
  title.textContent = strings.tabAbout;

  const list = document.createElement("ul");
  list.className = "ec-about-list";
  list.setAttribute("aria-label", strings.tabAbout);

  for (const item of buildAboutListItems(strings)) {
    const li = document.createElement("li");
    li.className = "ec-about-item";

    const label = document.createElement("span");
    label.className = "ec-about-text";
    label.textContent = item.text;

    li.append(createAboutIcon(item.iconHtml), label);
    list.appendChild(li);
  }

  page.append(title, createPageDivider(), list, createAboutCredit(strings));
  body.append(page);
}

export function buildShortcutsPanelBody(body: HTMLDivElement, strings: Strings): void {
  body.replaceChildren();

  const page = document.createElement("div");
  page.className = "ec-panel-page ec-panel-page--shortcuts";

  const title = document.createElement("h2");
  title.className = "ec-panel-page-title";
  title.textContent = strings.tabShortcuts;

  const runStopHeading = document.createElement("p");
  runStopHeading.className = "ec-shortcuts-heading";
  runStopHeading.textContent = strings.shortcutsRunStopHeading;

  const stopLine = document.createElement("p");
  stopLine.className = "ec-shortcuts-stop";
  const stopLabel = document.createElement("strong");
  stopLabel.textContent = strings.shortcutsStopHeading;
  stopLine.append(stopLabel, " ", createKbd("Esc"));

  const safetyLine1 = document.createElement("p");
  safetyLine1.className = "ec-shortcuts-note";
  safetyLine1.textContent = strings.shortcutsSafetyLine1;

  const safetyLine2 = document.createElement("p");
  safetyLine2.className = "ec-shortcuts-note";
  safetyLine2.textContent = strings.shortcutsSafetyLine2;

  page.append(
    title,
    createPageDivider(),
    runStopHeading,
    buildShortcutsSteps(strings),
    safetyLine1,
    safetyLine2,
    createShortcutsSectionDivider(),
    stopLine,
    createShortcutsSectionDivider(),
  );
  body.append(page);
}

export function buildLanguagePanelBody(body: HTMLDivElement, strings: Strings): void {
  body.replaceChildren();

  const page = document.createElement("div");
  page.className = "ec-panel-page";

  const title = document.createElement("h2");
  title.className = "ec-panel-page-title";
  title.textContent = strings.tabLanguage;

  page.append(title, createPageDivider());
  body.append(page);
}

export type CopiedPanelActions = {
  onOpenSettings?: () => void;
};

function copiedFormatLabel(formatId: CopyFormatId | null, strings: Strings): string {
  if (formatId === null) return strings.settingsCopyDefaultNothing;
  const format = COPY_FORMATS.find((entry) => entry.id === formatId);
  return format ? format.label(strings) : strings.settingsCopyDefaultNothing;
}

function updateCopiedPageSubtitleWhat(
  header: HTMLElement,
  formatId: CopyFormatId | null,
  strings: Strings,
): void {
  const what = header.querySelector<HTMLElement>(".ec-copied-subtitle-what");
  if (!what) return;
  what.textContent = copiedFormatLabel(formatId, strings);
  what.classList.toggle("ec-copied-subtitle-what--nothing", formatId === null);
}

function createCopiedPageHeader(
  formatId: CopyFormatId | null,
  strings: Strings,
): HTMLElement {
  const header = document.createElement("div");
  header.className = "ec-copied-header";

  const title = document.createElement("h2");
  title.className = "ec-copied-title";
  title.textContent = strings.copiedTitle;

  const subtitle = document.createElement("p");
  subtitle.className = "ec-copied-subtitle";

  const prefix = document.createElement("span");
  prefix.className = "ec-copied-subtitle-prefix";
  prefix.textContent = strings.copiedSubtitlePrefix;

  const what = document.createElement("span");
  what.className = "ec-copied-subtitle-what";
  if (formatId === null) {
    what.classList.add("ec-copied-subtitle-what--nothing");
  }
  what.textContent = copiedFormatLabel(formatId, strings);

  subtitle.append(prefix, document.createTextNode(" "), what);
  header.append(title, subtitle);
  return header;
}

export async function buildCopiedPanelBody(
  body: HTMLDivElement,
  strings: Strings,
  actions: CopiedPanelActions = {},
): Promise<void> {
  body.replaceChildren();

  const [enabledFormats, lastCopiedFormatId] = await Promise.all([
    getEnabledFormats(),
    getLastCopiedFormat(),
  ]);

  const page = document.createElement("div");
  page.className = "ec-panel-page ec-panel-page--copied";

  const header = createCopiedPageHeader(lastCopiedFormatId, strings);

  const divider = createPageDivider();
  divider.classList.add("ec-copied-divider");

  const otherOptions = createCopiedOtherOptionsRow(strings, {
    enabledFormats,
    onCopyFormat: (formatId) => {
      void (async () => {
        const copied = await copyPickedFormatFromPanel(formatId);
        if (!copied) return;
        updateCopiedPageSubtitleWhat(header, formatId, strings);
        await setLastCopiedFormat(formatId);
      })();
    },
    onOpenSettings: actions.onOpenSettings,
  });

  page.append(header, divider, otherOptions);
  body.append(page);
}
