var COPY_FORMATS = [
  {
    id: "outerHTML",
    label: (s) => s.formatCode,
    actionIcon: "copy",
    settingsGroup: "devtools"
  },
  {
    id: "tagIdClass",
    label: (s) => s.formatTagIdClass,
    actionIcon: "copy",
    settingsGroup: "devtools"
  },
  {
    id: "selector",
    label: (s) => s.formatSelector,
    actionIcon: "copy",
    settingsGroup: "devtools"
  },
  {
    id: "jsPath",
    label: (s) => s.formatJsPath,
    actionIcon: "copy",
    settingsGroup: "devtools"
  },
  {
    id: "xpath",
    label: (s) => s.formatXPath,
    actionIcon: "copy",
    settingsGroup: "devtools"
  },
  {
    id: "fullXPath",
    label: (s) => s.formatFullXPath,
    actionIcon: "copy",
    settingsGroup: "devtools"
  },
  {
    id: "styles",
    label: (s) => s.formatStyles,
    actionIcon: "copy",
    settingsGroup: "devtools"
  },
  {
    id: "computedStyles",
    label: (s) => s.formatComputedStyles,
    actionIcon: "copy",
    settingsGroup: "devtools"
  },
  {
    id: "text",
    label: (s) => s.formatText,
    actionIcon: "copy",
    settingsGroup: "clipboard-copy"
  },
  {
    id: "markdown",
    label: (s) => s.formatMarkdown,
    actionIcon: "copy",
    settingsGroup: "clipboard-copy"
  },
  {
    id: "png",
    label: (s) => s.formatPng,
    actionIcon: "images",
    settingsGroup: "clipboard-copy"
  },
  {
    id: "markdownFile",
    label: (s) => s.formatMarkdown,
    actionIcon: "file-down",
    settingsGroup: "files"
  },
  {
    id: "htmlFile",
    label: (s) => s.formatHtml,
    actionIcon: "file-down",
    settingsGroup: "files"
  },
  {
    id: "jpeg",
    label: (s) => s.formatJpeg,
    actionIcon: "images",
    settingsGroup: "copy-images"
  }
];

function isClipboardCopyFormat(format) {
  return format.actionIcon === "copy";
}

var CLIPBOARD_COPY_FORMATS = COPY_FORMATS.filter(isClipboardCopyFormat);

var DEFAULT_CLIPBOARD_FORMAT_ID = "text";

var COPY_FORMAT_ID_VALUES = [
  ...COPY_FORMATS.map((format) => format.id),
  "url"
];

function isCopyFormatId(value) {
  return COPY_FORMAT_ID_VALUES.some((formatId) => formatId === value);
}

var LEGACY_COPY_FORMAT_ID_ALIASES = {
  declaredStyles: "styles"
};

function normalizeCopyFormatId(value) {
  if (isCopyFormatId(value)) return value;
  if (typeof value === "string") {
    const aliased = LEGACY_COPY_FORMAT_ID_ALIASES[value];
    if (aliased) return aliased;
  }
  return void 0;
}

export { CLIPBOARD_COPY_FORMATS, COPY_FORMATS, COPY_FORMAT_ID_VALUES, DEFAULT_CLIPBOARD_FORMAT_ID, LEGACY_COPY_FORMAT_ID_ALIASES, isClipboardCopyFormat, isCopyFormatId, normalizeCopyFormatId };
