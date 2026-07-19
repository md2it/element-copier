import { INFO, SHIELD_CHECK } from "../lib/vendor/icons/index.js";
import { chart_column_increasing_default } from "../lib/vendor/icons/lucide/chart-column-increasing.js";
import { files_default } from "../lib/vendor/icons/lucide/files.js";
import { square_check_default } from "../lib/vendor/icons/lucide/square-check.js";
import { terminal_default } from "../lib/vendor/icons/lucide/terminal.js";

var INACTIVE_BG = "#012292";

var TOOLBAR_VIEWBOX = 24;

var TOOLBAR_RADIUS_RATIO = 0.18;

var TOOLBAR_PAD_RATIO = 0.1;

function stripComment3(svg) {
  return svg.replace(/<!--[\s\S]*?-->\s*/g, "").trim();
}

function lucideUiIcon(raw) {
  return stripComment3(raw);
}

function innerSvgMarkup(svg) {
  const match = svg.match(/<svg[\s\S]*?>([\s\S]*)<\/svg>/i);
  return match ? match[1].trim() : svg;
}

var filesInner = innerSvgMarkup(stripComment3(files_default));

var ABOUT_SECTION_ICONS = {
  overview: INFO,
  capabilities: lucideUiIcon(square_check_default),
  privacy: SHIELD_CHECK,
  code: lucideUiIcon(terminal_default),
  statistics: lucideUiIcon(chart_column_increasing_default),
};

function toolbarWelcomeIconSvg(bg = INACTIVE_BG, size = 16) {
  const r = TOOLBAR_VIEWBOX * TOOLBAR_RADIUS_RATIO;
  const pad = TOOLBAR_VIEWBOX * TOOLBAR_PAD_RATIO;
  const scale = (TOOLBAR_VIEWBOX - pad * 2) / TOOLBAR_VIEWBOX;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${TOOLBAR_VIEWBOX} ${TOOLBAR_VIEWBOX}" aria-hidden="true"><rect width="${TOOLBAR_VIEWBOX}" height="${TOOLBAR_VIEWBOX}" rx="${r}" fill="${bg}"/><g fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(${pad} ${pad}) scale(${scale})">${filesInner}</g></svg>`;
}

export { ABOUT_SECTION_ICONS, INACTIVE_BG, TOOLBAR_PAD_RATIO, TOOLBAR_RADIUS_RATIO, TOOLBAR_VIEWBOX, filesInner, innerSvgMarkup, stripComment3, toolbarWelcomeIconSvg };
