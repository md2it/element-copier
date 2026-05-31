import { buildAboutListItems } from "../about";
import {
  COPY_FORMATS,
  type CopyFormatId,
} from "../formats/definitions";
import {
  createClipboardDefaultFormatSelect,
  createCopiedOtherOptionsRow,
  createDeveloperToolsToggleRow,
  createInlineImagesSelect,
} from "../formats/format-ui";
import type { Strings } from "../i18n";
import { PANEL_FOOTER_LINKEDIN_URL } from "../../../lib/src/panel-footer/constants";
import {
  ABOUT_PREFIX_CHORD_MAC_DISPLAY,
  ABOUT_PREFIX_CHORD_WIN_DISPLAY,
} from "../hotkeys/keys";
import { defaultEnabledFormats, getEnabledFormats } from "../settings/format-settings";
import {
  hasPickCopyCacheInStorage,
  readPickCopyCacheFromStorage,
  resolvePickCopyCacheStorageKey,
  type PickCopyCacheRecord,
} from "../pick-mode/pick-copy-cache-storage";
import {
  getLastCopiedFormat,
  getLastCopiedPanelAction,
  getLastDownloadedFormat,
  resolveCopiedPanelSelection,
  setLastCopiedFormat,
  setLastDownloadedFormat,
  type CopiedPanelLastAction,
} from "../settings/copied-session";
import { copyPickedFormatFromPanel, savePickedFormatFromPanel } from "./lifecycle";

export const PANEL_BODY_CENTERED_CLASS = "ec-panel-body--centered";

export type StartPanelActions = {
  onStart: () => void;
};

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
  body.append(page);
}

export function buildLoadingPanelBody(body: HTMLDivElement, strings: Strings): void {
  body.replaceChildren();

  const page = document.createElement("div");
  page.className = "ec-panel-page ec-panel-page--loading";

  const center = document.createElement("div");
  center.className = "ec-loading-center";

  const loader = document.createElement("div");
  loader.className = "ec-loading-spinner";
  loader.setAttribute("role", "status");
  loader.setAttribute("aria-label", strings.loadingDataProcessing);

  const label = document.createElement("p");
  label.className = "ec-loading-label";
  label.textContent = strings.loadingDataProcessing;

  center.append(loader, label);
  page.append(center);
  body.append(page);
}

export async function buildSettingsPanelBody(
  body: HTMLDivElement,
  strings: Strings,
): Promise<void> {
  body.replaceChildren();

  const [clipboardDefaultFormat, inlineImagesSelect, developerToolsToggle] = await Promise.all([
    createClipboardDefaultFormatSelect(strings),
    createInlineImagesSelect(strings),
    createDeveloperToolsToggleRow(strings),
  ]);

  const page = document.createElement("div");
  page.className = "ec-panel-page ec-panel-page--settings";

  const title = document.createElement("h2");
  title.className = "ec-panel-page-title";
  title.textContent = strings.pageSettingsTitle;

  page.append(
    title,
    createPageDivider(),
    developerToolsToggle,
    clipboardDefaultFormat,
    inlineImagesSelect,
  );
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
  onStartOver?: () => void;
};

function buildCopiedEmptyPanelBody(
  body: HTMLDivElement,
  strings: Strings,
  onStart: () => void,
): void {
  const page = document.createElement("div");
  page.className = "ec-panel-page ec-panel-page--copied ec-panel-page--copied-empty";

  const message = document.createElement("p");
  message.className = "ec-copied-empty-text";
  message.append(
    document.createTextNode(strings.copiedEmptyLine1),
    document.createElement("br"),
    document.createTextNode(strings.copiedEmptyLine2),
  );

  const startBtn = document.createElement("button");
  startBtn.type = "button";
  startBtn.className = "ec-start-btn";
  startBtn.textContent = strings.startButtonLabel;
  startBtn.addEventListener("click", onStart);

  page.append(message, startBtn);
  body.append(page);
}

function createCopiedAgainBlock(strings: Strings, onStartOver: () => void): HTMLElement {
  const again = document.createElement("div");
  again.className = "ec-copied-again";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "ec-start-btn";
  btn.textContent = strings.copiedStartOverButtonLabel;
  btn.addEventListener("click", onStartOver);

  again.append(btn);
  return again;
}

type CopiedSubtitleState = {
  action: CopiedPanelLastAction | null;
  copiedFormatId: CopyFormatId | null;
  downloadedFormatId: CopyFormatId | null;
};

function copiedFormatLabel(formatId: CopyFormatId | null, strings: Strings): string {
  if (formatId === null) return strings.settingsCopyDefaultNothing;
  const format = COPY_FORMATS.find((entry) => entry.id === formatId);
  return format ? format.label(strings) : strings.settingsCopyDefaultNothing;
}

function copiedSubtitleVisible(state: CopiedSubtitleState): boolean {
  if (state.action === "saved") return state.downloadedFormatId !== null;
  if (state.action === "copied") return true;
  return false;
}

function updateCopiedPageSubtitle(
  header: HTMLElement,
  state: CopiedSubtitleState,
  strings: Strings,
): void {
  const slot = header.querySelector<HTMLElement>(".ec-copied-subtitle-slot");
  const subtitle = header.querySelector<HTMLElement>(".ec-copied-subtitle");
  const prefix = header.querySelector<HTMLElement>(".ec-copied-subtitle-prefix");
  const what = header.querySelector<HTMLElement>(".ec-copied-subtitle-what");
  if (!slot || !subtitle || !prefix || !what) return;

  const visible = copiedSubtitleVisible(state);
  slot.classList.toggle("ec-copied-subtitle-slot--empty", !visible);
  subtitle.hidden = !visible;
  if (!visible) return;

  if (state.action === "saved" && state.downloadedFormatId !== null) {
    prefix.textContent = strings.copiedSubtitleDownloadPrefix;
    what.textContent = copiedFormatLabel(state.downloadedFormatId, strings);
    what.classList.remove("ec-copied-subtitle-what--nothing");
    return;
  }

  prefix.textContent = strings.copiedSubtitlePrefix;
  what.textContent = copiedFormatLabel(state.copiedFormatId, strings);
  what.classList.toggle("ec-copied-subtitle-what--nothing", state.copiedFormatId === null);
}

function createCopiedPageHeader(state: CopiedSubtitleState, strings: Strings): HTMLElement {
  const header = document.createElement("div");
  header.className = "ec-copied-header";

  const title = document.createElement("h2");
  title.className = "ec-copied-title";
  title.textContent = strings.copiedTitle;

  const slot = document.createElement("div");
  slot.className = "ec-copied-subtitle-slot";

  const subtitle = document.createElement("p");
  subtitle.className = "ec-copied-subtitle";

  const prefix = document.createElement("span");
  prefix.className = "ec-copied-subtitle-prefix";

  const what = document.createElement("span");
  what.className = "ec-copied-subtitle-what";

  subtitle.append(prefix, document.createTextNode(" "), what);
  slot.append(subtitle);
  header.append(title, slot);
  updateCopiedPageSubtitle(header, state, strings);
  return header;
}

const COPIED_HEIGHT_PROBE_PREVIEW =
  '<div class="ec-probe-preview"><span>preview</span></div>';

function buildCopiedHeightProbeCacheRecord(): PickCopyCacheRecord {
  const record: PickCopyCacheRecord = {};
  for (const format of COPY_FORMATS) {
    record[resolvePickCopyCacheStorageKey(format.id)] = COPIED_HEIGHT_PROBE_PREVIEW;
  }
  return record;
}

/** Tallest COPIED layout for toolbar popup height probing (ignores storage). */
export async function buildCopiedPanelBodyForHeightProbe(
  body: HTMLDivElement,
  strings: Strings,
): Promise<void> {
  body.replaceChildren();

  const page = document.createElement("div");
  page.className = "ec-panel-page ec-panel-page--copied";

  const subtitleState: CopiedSubtitleState = {
    action: "copied",
    copiedFormatId: "text",
    downloadedFormatId: null,
  };
  const header = createCopiedPageHeader(subtitleState, strings);

  const { root: otherOptions } = createCopiedOtherOptionsRow(strings, {
    enabledFormats: defaultEnabledFormats(),
    pickCopyCacheRecord: buildCopiedHeightProbeCacheRecord(),
    selectedSelection: { formatId: "text", action: "copy" },
    onCopyFormat: () => {},
    onSaveFormat: () => {},
  });

  page.append(
    header,
    otherOptions,
    createCopiedAgainBlock(strings, () => {}),
  );
  body.append(page);
}

export async function buildCopiedPanelBody(
  body: HTMLDivElement,
  strings: Strings,
  actions: CopiedPanelActions = {},
): Promise<void> {
  body.replaceChildren();

  const [
    enabledFormats,
    lastCopiedFormatId,
    lastCopiedPanelAction,
    lastDownloadedFormatId,
    hasCache,
    pickCopyCacheRecord,
  ] = await Promise.all([
    getEnabledFormats(),
    getLastCopiedFormat(),
    getLastCopiedPanelAction(),
    getLastDownloadedFormat(),
    hasPickCopyCacheInStorage(),
    readPickCopyCacheFromStorage(),
  ]);

  if (!hasCache) {
    buildCopiedEmptyPanelBody(body, strings, actions.onStartOver ?? (() => {}));
    return;
  }

  const page = document.createElement("div");
  page.className = "ec-panel-page ec-panel-page--copied";

  const subtitleState: CopiedSubtitleState = {
    action: lastCopiedPanelAction,
    copiedFormatId: lastCopiedFormatId,
    downloadedFormatId: lastDownloadedFormatId,
  };
  const header = createCopiedPageHeader(subtitleState, strings);

  const selectedSelection = resolveCopiedPanelSelection(
    lastCopiedPanelAction,
    lastCopiedFormatId,
    lastDownloadedFormatId,
  );

  const { root: otherOptions } = createCopiedOtherOptionsRow(strings, {
    enabledFormats,
    pickCopyCacheRecord,
    selectedSelection,
    onCopyFormat: async (formatId) => {
      const copied = await copyPickedFormatFromPanel(formatId);
      if (!copied) return false;
      const nextState: CopiedSubtitleState = {
        action: "copied",
        copiedFormatId: formatId,
        downloadedFormatId: lastDownloadedFormatId,
      };
      updateCopiedPageSubtitle(header, nextState, strings);
      await setLastCopiedFormat(formatId);
      return true;
    },
    onSaveFormat: async (formatId) => {
      const saved = await savePickedFormatFromPanel(formatId);
      if (!saved) return false;
      const nextState: CopiedSubtitleState = {
        action: "saved",
        copiedFormatId: lastCopiedFormatId,
        downloadedFormatId: formatId,
      };
      updateCopiedPageSubtitle(header, nextState, strings);
      await setLastDownloadedFormat(formatId);
      return true;
    },
  });

  page.append(
    header,
    otherOptions,
    createCopiedAgainBlock(strings, actions.onStartOver ?? (() => {})),
  );
  body.append(page);
}
