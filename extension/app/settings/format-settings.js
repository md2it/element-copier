import { CLIPBOARD_DEFAULT_FORMAT_KEY, DEVELOPER_TOOLS_ENABLED_KEY, ENABLED_FORMATS_KEY } from "../messages.js";
import { COPY_FORMATS, DEFAULT_CLIPBOARD_FORMAT_ID, normalizeCopyFormatId } from "../formats/definitions.js";
import { ext } from "../../lib/our/api.js";
import { getComputeFormatsSettings, isFormatEnabledByComputeSettings } from "./compute-formats.js";

var DEVTOOLS_FORMAT_IDS = COPY_FORMATS.filter(
  (format) => format.settingsGroup === "devtools"
).map((format) => format.id);

function buildEnabledFormatsMap(developerToolsEnabled, compute) {
  return Object.fromEntries(
    COPY_FORMATS.map((format) => {
      if (format.settingsGroup === "devtools") {
        return [format.id, developerToolsEnabled];
      }
      return [format.id, isFormatEnabledByComputeSettings(format.id, compute)];
    })
  );
}

function defaultEnabledFormats() {
  return buildEnabledFormatsMap(true, {
    computeImages: true
  });
}

function migrateDeveloperToolsFromLegacyEnabledFormats(raw) {
  if (typeof raw !== "object" || raw === null) {
    return void 0;
  }
  const stored = raw;
  if (DEVTOOLS_FORMAT_IDS.some((id) => stored[id] === true)) {
    return true;
  }
  if (DEVTOOLS_FORMAT_IDS.every((id) => stored[id] === false)) {
    return false;
  }
  if (typeof stored.declaredStyles === "boolean" && typeof stored.styles !== "boolean") {
    if (stored.declaredStyles) return true;
  }
  return void 0;
}

async function getDeveloperToolsEnabled() {
  const data = await ext.storage.local.get([
    DEVELOPER_TOOLS_ENABLED_KEY,
    ENABLED_FORMATS_KEY
  ]);
  const stored = data[DEVELOPER_TOOLS_ENABLED_KEY];
  if (typeof stored === "boolean") {
    return stored;
  }
  const migrated = migrateDeveloperToolsFromLegacyEnabledFormats(
    data[ENABLED_FORMATS_KEY]
  );
  return migrated ?? true;
}

async function setDeveloperToolsEnabled(enabled) {
  await ext.storage.local.set({ [DEVELOPER_TOOLS_ENABLED_KEY]: enabled });
}

async function getEnabledFormats() {
  const [developerToolsEnabled, compute] = await Promise.all([
    getDeveloperToolsEnabled(),
    getComputeFormatsSettings()
  ]);
  return buildEnabledFormatsMap(developerToolsEnabled, compute);
}

function isDeveloperToolsGroup(group) {
  return group === "devtools";
}

var CLIPBOARD_DEFAULT_NOTHING = "nothing";

var DEFAULT_ACTION_STORAGE_OPTIONS = [
  CLIPBOARD_DEFAULT_NOTHING,
  "copy:text",
  "copy:markdown",
  "copy:png",
  "download:markdownFile",
  "download:htmlFile",
  "download:png",
  "download:jpeg",
  "copy:outerHTML",
  "copy:tagIdClass",
  "copy:selector",
  "copy:jsPath",
  "copy:xpath",
  "copy:fullXPath",
  "copy:styles",
  "copy:computedStyles",
  "copy:qaDetails"
];

var IMAGE_DEFAULT_ACTION_STORAGE_VALUES = [
  "copy:png",
  "download:png",
  "download:jpeg"
];

function isImageDefaultActionStorageValue(value) {
  return IMAGE_DEFAULT_ACTION_STORAGE_VALUES.includes(value);
}

function isImageDefaultAction(action) {
  return isImageDefaultActionStorageValue(encodeDefaultAction(action));
}

function isActiveDefaultAction(action) {
  return action !== CLIPBOARD_DEFAULT_NOTHING;
}

function encodeDefaultAction(action) {
  if (action === CLIPBOARD_DEFAULT_NOTHING) return CLIPBOARD_DEFAULT_NOTHING;
  return `${action.action}:${action.formatId}`;
}

function parseStoredDefaultAction(raw) {
  if (raw === CLIPBOARD_DEFAULT_NOTHING) {
    return CLIPBOARD_DEFAULT_NOTHING;
  }
  if (typeof raw === "string") {
    const colon = raw.indexOf(":");
    if (colon > 0) {
      const kind = raw.slice(0, colon);
      const formatId = normalizeCopyFormatId(raw.slice(colon + 1));
      if (formatId && (kind === "copy" || kind === "download")) {
        return { formatId, action: kind };
      }
    }
    const legacyFormatId = normalizeCopyFormatId(raw);
    if (legacyFormatId) {
      return { formatId: legacyFormatId, action: "copy" };
    }
  }
  return { formatId: DEFAULT_CLIPBOARD_FORMAT_ID, action: "copy" };
}

function defaultDefaultAction() {
  return { formatId: DEFAULT_CLIPBOARD_FORMAT_ID, action: "copy" };
}

async function getDefaultAction() {
  const data = await ext.storage.local.get(CLIPBOARD_DEFAULT_FORMAT_KEY);
  const raw = data[CLIPBOARD_DEFAULT_FORMAT_KEY];
  if (raw === void 0) {
    return defaultDefaultAction();
  }
  return parseStoredDefaultAction(raw);
}

async function setDefaultAction(action) {
  await ext.storage.local.set({
    [CLIPBOARD_DEFAULT_FORMAT_KEY]: encodeDefaultAction(action)
  });
}

async function ensureDefaultActionAllowsComputeImages() {
  const [compute, action] = await Promise.all([
    getComputeFormatsSettings(),
    getDefaultAction()
  ]);
  if (compute.computeImages || !isImageDefaultAction(action)) {
    return action;
  }
  const reset = defaultDefaultAction();
  await setDefaultAction(reset);
  return reset;
}

export { CLIPBOARD_DEFAULT_NOTHING, DEFAULT_ACTION_STORAGE_OPTIONS, DEVTOOLS_FORMAT_IDS, IMAGE_DEFAULT_ACTION_STORAGE_VALUES, buildEnabledFormatsMap, defaultDefaultAction, defaultEnabledFormats, encodeDefaultAction, ensureDefaultActionAllowsComputeImages, getDefaultAction, getDeveloperToolsEnabled, getEnabledFormats, isActiveDefaultAction, isDeveloperToolsGroup, isImageDefaultAction, isImageDefaultActionStorageValue, migrateDeveloperToolsFromLegacyEnabledFormats, parseStoredDefaultAction, setDefaultAction, setDeveloperToolsEnabled };
