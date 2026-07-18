import { ABOUT_PREFIX_CHORD_MAC_DISPLAY, ABOUT_PREFIX_CHORD_WIN_DISPLAY, getStartHotkeyActionLabel } from "../hotkeys/keys.js";
import { ABOUT_BULLET_ICONS } from "../icons.js";
import { COPY_FORMATS } from "../formats/definitions.js";
import { buildAboutListItems } from "../about.js";
import { copyPickedFormatFromPanel } from "./copy-picked-format.js";
import { createClipboardDefaultFormatSelect, createComputeFormatsSection, createCopiedOtherOptionsRow, createDarkThemeToggleRow, createDeveloperToolsToggleRow, createFrameLabelStyleSelect, createInlineImagesSelect, syncCopiedPanelFormatSelection } from "../formats/format-ui.js";
import { createLanguageSelectorRow } from "./language-selector.js";
import { defaultEnabledFormats, getDefaultAction, getEnabledFormats, isActiveDefaultAction } from "../settings/format-settings.js";
import { ext } from "../../lib/our/api.js";
import { getLastCopiedFormat, getLastCopiedPanelAction, getLastDownloadedFormat, markCopiedPanelShowStatus, resolveCopiedPanelSelection, setLastCopiedFormat, setLastDownloadedFormat, shouldShowCopiedPanelStatus } from "../settings/copied-session.js";
import { getLocale } from "../storage.js";
import { hasPickCopyCacheInStorage, readPickCopyCacheFromStorage, resolvePickCopyCacheStorageKey } from "../pick-mode/pick-copy-cache-storage.js";
import { savePickedFormatFromPanel } from "./save-picked-format.js";
import { maybeShowSupportSurveyAfterDownload } from "../support-survey/trigger.js";
import { readSupportSurveyState } from "../support-survey/state.js";

var PANEL_BODY_CENTERED_CLASS = "ec-panel-body--centered";
var ABOUT_AUTHOR_URL = "https://www.md2it.com/";

function createPageDivider() {
  const divider = document.createElement("div");
  divider.className = "dd-panel-divider ec-panel-page-divider";
  return divider;
}

function createSettingsSectionDivider() {
  const divider = document.createElement("div");
  divider.className = "ec-settings-section-divider";
  divider.setAttribute("aria-hidden", "true");
  return divider;
}

function createAboutIcon(iconHtml) {
  const mark = document.createElement("span");
  mark.className = "ec-about-icon";
  mark.setAttribute("aria-hidden", "true");
  mark.innerHTML = iconHtml;
  return mark;
}

function createCopiedElementsStatistic(strings) {
  const item = document.createElement("p");
  item.className = "ec-about-item";
  const label = document.createElement("span");
  label.className = "ec-about-text";
  label.textContent = strings.aboutCopiedElements.replace("{count}", "0");
  item.append(createAboutIcon(ABOUT_BULLET_ICONS[0]), label);
  void readSupportSurveyState().then((state) => {
    label.textContent = strings.aboutCopiedElements.replace("{count}", String(state.actionCount));
  });
  return item;
}

function createKbd(text) {
  const kbd = document.createElement("kbd");
  kbd.className = "ec-about-kbd";
  kbd.textContent = text;
  return kbd;
}

var SHORTCUTS_STEP_RELEASE_EMPHASIS = "Release";

function appendShortcutsStepRelease(step, text) {
  if (text.startsWith(SHORTCUTS_STEP_RELEASE_EMPHASIS)) {
    const emphasis = document.createElement("span");
    emphasis.className = "ec-shortcuts-step-emphasis";
    emphasis.textContent = SHORTCUTS_STEP_RELEASE_EMPHASIS;
    step.append(emphasis, document.createTextNode(text.slice(SHORTCUTS_STEP_RELEASE_EMPHASIS.length)));
    return;
  }
  step.textContent = text;
}

function createShortcutsSectionDivider() {
  const divider = document.createElement("div");
  divider.className = "dd-panel-divider ec-shortcuts-divider";
  divider.setAttribute("aria-hidden", "true");
  return divider;
}

function buildShortcutsSteps(strings) {
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
    createKbd(getStartHotkeyActionLabel())
  );
  steps.append(step1, step2, step3);
  return steps;
}

function createShortcutsWholePageLine(strings) {
  const line = document.createElement("p");
  line.className = "ec-shortcuts-note";
  line.append(
    strings.shortcutsWholePageBefore,
    createKbd(getStartHotkeyActionLabel()),
    strings.shortcutsWholePageAfter
  );
  return line;
}

function createAboutCredit(strings) {
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
  link.href = ABOUT_AUTHOR_URL;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = strings.aboutCreditAuthor;
  link.addEventListener("click", (e) => {
    e.stopPropagation();
  });
  copyrightLine.append("© ", link);
  credit.append(divider, productLine, copyrightLine);
  return credit;
}

function buildStartPanelBody(body, strings, actions) {
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

function buildLoadingPanelBody(body, strings) {
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

async function buildSettingsPanelBody(body, strings, localeOptions) {
  body.replaceChildren();
  const [
    clipboardDefaultFormat,
    inlineImagesSelect,
    frameLabelStyleSelect,
    computeFormatsSection,
    developerToolsToggle,
    darkThemeToggle,
    storedLocale
  ] = await Promise.all([
    createClipboardDefaultFormatSelect(strings),
    createInlineImagesSelect(strings),
    createFrameLabelStyleSelect(strings),
    createComputeFormatsSection(strings),
    createDeveloperToolsToggleRow(strings),
    createDarkThemeToggleRow(strings),
    localeOptions ? Promise.resolve(null) : getLocale()
  ]);
  const getActiveLocale = () => localeOptions?.getLocale() ?? storedLocale ?? "en";
  const languageRow = createLanguageSelectorRow(
    getActiveLocale,
    localeOptions?.onLocaleSelect ?? (() => {
    })
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
    togglers
  );
  body.append(page);
}

function buildAboutPanelBody(body, strings) {
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
    const label = document.createElement(item.href ? "a" : "span");
    label.className = "ec-about-text";
    label.textContent = item.text;
    if (item.href) {
      label.href = item.href;
      label.target = "_blank";
      label.rel = "noopener noreferrer";
      label.style.color = "inherit";
      label.addEventListener("click", (e) => e.stopPropagation());
    }
    li.append(createAboutIcon(item.iconHtml), label);
    list.appendChild(li);
  }
  page.append(title, createPageDivider(), createCopiedElementsStatistic(strings), createPageDivider(), list, createAboutCredit(strings));
  body.append(page);
}

function buildShortcutsPanelBody(body, strings) {
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
    createShortcutsSectionDivider()
  );
  body.append(page);
}

function buildCopiedEmptyPanelBody(body, strings, onStart) {
  const page = document.createElement("div");
  page.className = "ec-panel-page ec-panel-page--copied ec-panel-page--copied-empty";
  const message = document.createElement("p");
  message.className = "ec-copied-empty-text";
  message.append(
    document.createTextNode(strings.copiedEmptyLine1),
    document.createElement("br"),
    document.createTextNode(strings.copiedEmptyLine2)
  );
  const startBtn = document.createElement("button");
  startBtn.type = "button";
  startBtn.className = "ec-start-btn";
  startBtn.textContent = strings.pickElementButtonLabel;
  startBtn.addEventListener("click", onStart);
  page.append(message, startBtn);
  body.append(page);
}

function createCopiedAgainBlock(strings, onStartOver, onNewPage) {
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

function copiedFormatLabel(formatId, strings, action = null) {
  if (formatId === null) return strings.settingsCopyDefaultNothing;
  if (formatId === "url") return strings.formatUrl;
  if (formatId === "png" && action !== "saved") return strings.formatImage;
  const format = COPY_FORMATS.find((entry) => entry.id === formatId);
  return format ? format.label(strings) : strings.settingsCopyDefaultNothing;
}

function copiedSubtitleVisible(state2) {
  if (state2.action === "saved") return state2.downloadedFormatId !== null;
  if (state2.action === "copied") return true;
  return false;
}

function updateCopiedPageSubtitle(header, state2, strings) {
  const slot = header.querySelector(".ec-copied-subtitle-slot");
  const subtitle = header.querySelector(".ec-copied-subtitle");
  const prefix = header.querySelector(".ec-copied-subtitle-prefix");
  const what = header.querySelector(".ec-copied-subtitle-what");
  if (!slot || !subtitle || !prefix || !what) return;
  const visible = copiedSubtitleVisible(state2);
  slot.classList.toggle("ec-copied-subtitle-slot--empty", !visible);
  subtitle.hidden = !visible;
  if (!visible) return;
  if (state2.action === "saved" && state2.downloadedFormatId !== null) {
    prefix.textContent = strings.copiedSubtitleDownloadPrefix;
    what.textContent = copiedFormatLabel(state2.downloadedFormatId, strings, "saved");
    what.classList.remove("ec-copied-subtitle-what--nothing");
    return;
  }
  prefix.textContent = strings.copiedSubtitlePrefix;
  what.textContent = copiedFormatLabel(state2.copiedFormatId, strings, "copied");
  what.classList.toggle("ec-copied-subtitle-what--nothing", state2.copiedFormatId === null);
}

function createCopiedPageHeader(state2, strings) {
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
  updateCopiedPageSubtitle(header, state2, strings);
  return header;
}

var COPIED_HEIGHT_PROBE_PREVIEW = '<div class="ec-probe-preview"><span>preview</span></div>';

function buildCopiedHeightProbeCacheRecord() {
  const record = {};
  for (const format of COPY_FORMATS) {
    record[resolvePickCopyCacheStorageKey(format.id)] = COPIED_HEIGHT_PROBE_PREVIEW;
  }
  record.url = COPIED_HEIGHT_PROBE_PREVIEW;
  return record;
}

async function openCachedUrlFromPanel(url) {
  if (!url.trim()) return false;
  try {
    const response = await ext.runtime.sendMessage({
      type: "OPEN_CACHED_URL",
      url
    });
    return response?.ok === true;
  } catch {
    return false;
  }
}

async function buildCopiedPanelBodyForHeightProbe(body, strings) {
  body.replaceChildren();
  const page = document.createElement("div");
  page.className = "ec-panel-page ec-panel-page--copied";
  const subtitleState = {
    action: "copied",
    copiedFormatId: "text",
    downloadedFormatId: null
  };
  const header = createCopiedPageHeader(subtitleState, strings);
  const { root: otherOptions, urlBlock } = createCopiedOtherOptionsRow(strings, {
    enabledFormats: defaultEnabledFormats(),
    pickCopyCacheRecord: buildCopiedHeightProbeCacheRecord(),
    selectionSyncRoot: page,
    onCopyFormat: () => {
    },
    onSaveFormat: () => {
    },
    onOpenUrl: () => {
    }
  });
  page.append(
    header,
    urlBlock,
    otherOptions,
    createCopiedAgainBlock(strings, () => {
    }, () => {
    })
  );
  syncCopiedPanelFormatSelection(page, { formatId: "text", action: "copy" });
  body.append(page);
}

async function buildCopiedPanelBody(body, strings, actions = {}) {
  body.replaceChildren();
  const [
    enabledFormats,
    lastCopiedFormatId,
    lastCopiedPanelAction,
    lastDownloadedFormatId,
    hasCache,
    pickCopyCacheRecord,
    defaultActionSetting,
    showCopiedStatus
  ] = await Promise.all([
    getEnabledFormats(),
    getLastCopiedFormat(),
    getLastCopiedPanelAction(),
    getLastDownloadedFormat(),
    hasPickCopyCacheInStorage(),
    readPickCopyCacheFromStorage(),
    getDefaultAction(),
    shouldShowCopiedPanelStatus()
  ]);
  if (!hasCache) {
    buildCopiedEmptyPanelBody(body, strings, actions.onStartOver ?? (() => {
    }));
    return;
  }
  const page = document.createElement("div");
  page.className = "ec-panel-page ec-panel-page--copied";
  const subtitleState = showCopiedStatus ? {
    action: lastCopiedPanelAction,
    copiedFormatId: lastCopiedFormatId,
    downloadedFormatId: lastDownloadedFormatId
  } : {
    action: null,
    copiedFormatId: null,
    downloadedFormatId: null
  };
  const header = createCopiedPageHeader(subtitleState, strings);
  const defaultActionForHighlight = isActiveDefaultAction(defaultActionSetting) ? defaultActionSetting : null;
  const selectedSelection = showCopiedStatus ? resolveCopiedPanelSelection(
    lastCopiedPanelAction,
    lastCopiedFormatId,
    lastDownloadedFormatId,
    defaultActionForHighlight
  ) : null;
  const { root: otherOptions, urlBlock, selectFormat } = createCopiedOtherOptionsRow(strings, {
    enabledFormats,
    pickCopyCacheRecord,
    selectionSyncRoot: page,
    onCopyFormat: async (formatId) => {
      const copied = await copyPickedFormatFromPanel(formatId);
      if (!copied) return false;
      const nextState = {
        action: "copied",
        copiedFormatId: formatId,
        downloadedFormatId: lastDownloadedFormatId
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
      const nextState = {
        action: "saved",
        copiedFormatId: lastCopiedFormatId,
        downloadedFormatId: formatId
      };
      updateCopiedPageSubtitle(header, nextState, strings);
      await setLastDownloadedFormat(formatId);
      await markCopiedPanelShowStatus();
      selectFormat(formatId, "download");
      const panelRoot = body.closest(".ec-panel");
      if (panelRoot && actions.enableSupportSurvey) {
        await maybeShowSupportSurveyAfterDownload(panelRoot, strings);
      }
      return true;
    },
    onOpenUrl: async (url) => {
      await openCachedUrlFromPanel(url);
    }
  });
  page.append(
    header,
    urlBlock,
    otherOptions,
    createCopiedAgainBlock(
      strings,
      actions.onStartOver ?? (() => {
      }),
      actions.onNewPage ?? (() => {
      })
    )
  );
  syncCopiedPanelFormatSelection(page, selectedSelection);
  body.append(page);
}

export { COPIED_HEIGHT_PROBE_PREVIEW, PANEL_BODY_CENTERED_CLASS, SHORTCUTS_STEP_RELEASE_EMPHASIS, appendShortcutsStepRelease, buildAboutPanelBody, buildCopiedEmptyPanelBody, buildCopiedHeightProbeCacheRecord, buildCopiedPanelBody, buildCopiedPanelBodyForHeightProbe, buildLoadingPanelBody, buildSettingsPanelBody, buildShortcutsPanelBody, buildShortcutsSteps, buildStartPanelBody, copiedFormatLabel, copiedSubtitleVisible, createAboutCredit, createAboutIcon, createCopiedAgainBlock, createCopiedPageHeader, createKbd, createPageDivider, createSettingsSectionDivider, createShortcutsSectionDivider, createShortcutsWholePageLine, openCachedUrlFromPanel, updateCopiedPageSubtitle };
