import { buildAboutListItems } from "../about";
import { ext } from "../api";
import {
  COPY_FORMATS,
  type CopyFormatId,
} from "../formats/definitions";
import {
  createClipboardDefaultFormatSelect,
  createComputeFormatsSection,
  createCopiedOtherOptionsRow,
  createDarkThemeToggleRow,
  createDeveloperToolsToggleRow,
  createFrameLabelStyleSelect,
  createInlineImagesSelect,
  syncCopiedPanelFormatSelection,
} from "../formats/format-ui";
import type { Locale, Strings } from "../i18n";
import { getLocale } from "../storage";
import { createLanguageSelectorRow } from "./language-selector";
import { PANEL_FOOTER_LINKEDIN_URL } from "../lib/our/panel-footer/constants";
import {
  ABOUT_PREFIX_CHORD_MAC_DISPLAY,
  ABOUT_PREFIX_CHORD_WIN_DISPLAY,
  getStartHotkeyActionLabel,
} from "../hotkeys/keys";
import {
  defaultEnabledFormats,
  getDefaultAction,
  getEnabledFormats,
  isActiveDefaultAction,
} from "../settings/format-settings";
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
  markCopiedPanelShowStatus,
  resolveCopiedPanelSelection,
  setLastCopiedFormat,
  setLastDownloadedFormat,
  shouldShowCopiedPanelStatus,
  type CopiedPanelLastAction,
} from "../settings/copied-session";
import { copyPickedFormatFromPanel, savePickedFormatFromPanel } from "./lifecycle";
import type { ContentToBg, OpenCachedUrlPanelResponse } from "../messages";

export const PANEL_BODY_CENTERED_CLASS = "ec-panel-body--centered";

export type StartPanelActions = {
  onStart: () => void;
  onCopyPage: () => void;
};

function createPageDivider(): HTMLDivElement {
  const divider = document.createElement("div");
  divider.className = "dd-panel-divider ec-panel-page-divider";
  return divider;
}

function createSettingsSectionDivider(): HTMLDivElement {
  const divider = document.createElement("div");
  divider.className = "ec-settings-section-divider";
  divider.setAttribute("aria-hidden", "true");
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
    createKbd(getStartHotkeyActionLabel()),
  );

  steps.append(step1, step2, step3);
  return steps;
}

function createShortcutsWholePageLine(strings: Strings): HTMLParagraphElement {
  const line = document.createElement("p");
  line.className = "ec-shortcuts-note";
  line.append(
    strings.shortcutsWholePageBefore,
    createKbd(getStartHotkeyActionLabel()),
    strings.shortcutsWholePageAfter,
  );
  return line;
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

  const copyPageBtn = document.createElement("button");
  copyPageBtn.type = "button";
  copyPageBtn.className = "ec-start-btn";
  copyPageBtn.textContent = strings.capturePageButtonLabel;
  copyPageBtn.addEventListener("click", () => {
    actions.onCopyPage();
  });

  const startBtn = document.createElement("button");
  startBtn.type = "button";
  startBtn.className = "ec-start-btn";
  startBtn.textContent = strings.pickElementButtonLabel;
  startBtn.addEventListener("click", () => {
    actions.onStart();
  });

  center.append(copyPageBtn, startBtn);
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

export type SettingsPanelLocaleOptions = {
  getLocale: () => Locale;
  onLocaleSelect: (locale: Locale) => void | Promise<void>;
};

export async function buildSettingsPanelBody(
  body: HTMLDivElement,
  strings: Strings,
  localeOptions?: SettingsPanelLocaleOptions,
): Promise<void> {
  body.replaceChildren();

  const [
    clipboardDefaultFormat,
    inlineImagesSelect,
    frameLabelStyleSelect,
    computeFormatsSection,
    developerToolsToggle,
    darkThemeToggle,
    storedLocale,
  ] = await Promise.all([
    createClipboardDefaultFormatSelect(strings),
    createInlineImagesSelect(strings),
    createFrameLabelStyleSelect(strings),
    createComputeFormatsSection(strings),
    createDeveloperToolsToggleRow(strings),
    createDarkThemeToggleRow(strings),
    localeOptions ? Promise.resolve(null) : getLocale(),
  ]);

  const getActiveLocale = (): Locale =>
    localeOptions?.getLocale() ?? storedLocale ?? "en";

  const languageRow = createLanguageSelectorRow(
    getActiveLocale,
    localeOptions?.onLocaleSelect ?? (() => {}),
  );

  const togglers = document.createElement("div");
  togglers.className = "ec-settings-togglers";
  togglers.append(computeFormatsSection, developerToolsToggle, darkThemeToggle);

  const page = document.createElement("div");
  page.className = "ec-panel-page ec-panel-page--settings";

  const title = document.createElement("h2");
  title.className = "ec-panel-page-title";
  title.textContent = strings.pageSettingsTitle;

  page.append(
    title,
    createPageDivider(),
    languageRow,
    createSettingsSectionDivider(),
    clipboardDefaultFormat,
    inlineImagesSelect,
    frameLabelStyleSelect,
    createSettingsSectionDivider(),
    togglers,
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
    createShortcutsWholePageLine(strings),
    createShortcutsSectionDivider(),
    stopLine,
    createShortcutsSectionDivider(),
  );
  body.append(page);
}

export type CopiedPanelActions = {
  onStartOver?: () => void;
  onNewPage?: () => void;
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
  startBtn.textContent = strings.pickElementButtonLabel;
  startBtn.addEventListener("click", onStart);

  page.append(message, startBtn);
  body.append(page);
}

function createCopiedAgainBlock(
  strings: Strings,
  onStartOver: () => void,
  onNewPage: () => void,
): HTMLElement {
  const again = document.createElement("div");
  again.className = "ec-copied-again";

  const newElementBtn = document.createElement("button");
  newElementBtn.type = "button";
  newElementBtn.className = "ec-start-btn";
  newElementBtn.textContent = strings.pickElementButtonLabel;
  newElementBtn.addEventListener("click", onStartOver);

  const newPageBtn = document.createElement("button");
  newPageBtn.type = "button";
  newPageBtn.className = "ec-start-btn";
  newPageBtn.textContent = strings.capturePageButtonLabel;
  newPageBtn.addEventListener("click", onNewPage);

  again.append(newElementBtn, newPageBtn);
  return again;
}

type CopiedSubtitleState = {
  action: CopiedPanelLastAction | null;
  copiedFormatId: CopyFormatId | null;
  downloadedFormatId: CopyFormatId | null;
};

function copiedFormatLabel(
  formatId: CopyFormatId | null,
  strings: Strings,
  action: CopiedPanelLastAction | null = null,
): string {
  if (formatId === null) return strings.settingsCopyDefaultNothing;
  if (formatId === "url") return strings.formatUrl;
  if (formatId === "png" && action !== "saved") return strings.formatImage;
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
    what.textContent = copiedFormatLabel(state.downloadedFormatId, strings, "saved");
    what.classList.remove("ec-copied-subtitle-what--nothing");
    return;
  }

  prefix.textContent = strings.copiedSubtitlePrefix;
  what.textContent = copiedFormatLabel(state.copiedFormatId, strings, "copied");
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
  record.url = COPIED_HEIGHT_PROBE_PREVIEW;
  return record;
}

async function openCachedUrlFromPanel(url: string): Promise<boolean> {
  if (!url.trim()) return false;
  try {
    const response = await ext.runtime.sendMessage<ContentToBg, OpenCachedUrlPanelResponse>({
      type: "OPEN_CACHED_URL",
      url,
    });
    return response?.ok === true;
  } catch {
    return false;
  }
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

  const { root: otherOptions, urlBlock } = createCopiedOtherOptionsRow(strings, {
    enabledFormats: defaultEnabledFormats(),
    pickCopyCacheRecord: buildCopiedHeightProbeCacheRecord(),
    selectionSyncRoot: page,
    onCopyFormat: () => {},
    onSaveFormat: () => {},
    onOpenUrl: () => {},
  });

  page.append(
    header,
    urlBlock,
    otherOptions,
    createCopiedAgainBlock(strings, () => {}, () => {}),
  );
  syncCopiedPanelFormatSelection(page, { formatId: "text", action: "copy" });
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
    defaultActionSetting,
    showCopiedStatus,
  ] = await Promise.all([
    getEnabledFormats(),
    getLastCopiedFormat(),
    getLastCopiedPanelAction(),
    getLastDownloadedFormat(),
    hasPickCopyCacheInStorage(),
    readPickCopyCacheFromStorage(),
    getDefaultAction(),
    shouldShowCopiedPanelStatus(),
  ]);

  if (!hasCache) {
    buildCopiedEmptyPanelBody(body, strings, actions.onStartOver ?? (() => {}));
    return;
  }

  const page = document.createElement("div");
  page.className = "ec-panel-page ec-panel-page--copied";

  const subtitleState: CopiedSubtitleState = showCopiedStatus
    ? {
        action: lastCopiedPanelAction,
        copiedFormatId: lastCopiedFormatId,
        downloadedFormatId: lastDownloadedFormatId,
      }
    : {
        action: null,
        copiedFormatId: null,
        downloadedFormatId: null,
      };
  const header = createCopiedPageHeader(subtitleState, strings);

  const defaultActionForHighlight = isActiveDefaultAction(defaultActionSetting)
    ? defaultActionSetting
    : null;
  const selectedSelection = showCopiedStatus
    ? resolveCopiedPanelSelection(
        lastCopiedPanelAction,
        lastCopiedFormatId,
        lastDownloadedFormatId,
        defaultActionForHighlight,
      )
    : null;

  const { root: otherOptions, urlBlock, selectFormat } = createCopiedOtherOptionsRow(strings, {
    enabledFormats,
    pickCopyCacheRecord,
    selectionSyncRoot: page,
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
      await markCopiedPanelShowStatus();
      selectFormat(formatId, "copy");
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
      await markCopiedPanelShowStatus();
      selectFormat(formatId, "download");
      return true;
    },
    onOpenUrl: async (url) => {
      await openCachedUrlFromPanel(url);
    },
  });

  page.append(
    header,
    urlBlock,
    otherOptions,
    createCopiedAgainBlock(
      strings,
      actions.onStartOver ?? (() => {}),
      actions.onNewPage ?? (() => {}),
    ),
  );
  syncCopiedPanelFormatSelection(page, selectedSelection);
  body.append(page);
}
