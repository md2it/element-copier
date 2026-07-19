import { COPY, FILES, FILE_DOWN, GIT_FORK, HEART, HISTORY, IMAGES, SHIELD_CHECK } from "../lib/icons/index.js";
import { files_default } from "../lib/icons/lucide/files.js";

var INACTIVE_BG = "#012292";

var TOOLBAR_VIEWBOX = 24;

var TOOLBAR_RADIUS_RATIO = 0.18;

var TOOLBAR_PAD_RATIO = 0.1;

function stripComment3(svg) {
  return svg.replace(/<!--[\s\S]*?-->\s*/g, "").trim();
}

function innerSvgMarkup(svg) {
  const match = svg.match(/<svg[\s\S]*?>([\s\S]*)<\/svg>/i);
  return match ? match[1].trim() : svg;
}

var filesInner = innerSvgMarkup(stripComment3(files_default));

var ABOUT_BULLET_ICONS = [
  COPY,
  FILE_DOWN,
  HISTORY,
  FILES,
  IMAGES,
  FILES,
  FILES,
  SHIELD_CHECK,
  SHIELD_CHECK,
  GIT_FORK,
  HEART
];

var ABOUT_CHECK_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
var ABOUT_SECTION_ICONS = {
  overview: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
  capabilities: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  privacy: SHIELD_CHECK,
  code: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 17 6-6-6-6"/><path d="M12 19h8"/></svg>',
  statistics: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 17V9"/><path d="M18 17V5"/><path d="M8 17v-3"/><path d="M3 17v-1"/><path d="M3 21h18"/></svg>'
};

function toolbarWelcomeIconSvg(bg = INACTIVE_BG, size = 16) {
  const r = TOOLBAR_VIEWBOX * TOOLBAR_RADIUS_RATIO;
  const pad = TOOLBAR_VIEWBOX * TOOLBAR_PAD_RATIO;
  const scale = (TOOLBAR_VIEWBOX - pad * 2) / TOOLBAR_VIEWBOX;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${TOOLBAR_VIEWBOX} ${TOOLBAR_VIEWBOX}" aria-hidden="true"><rect width="${TOOLBAR_VIEWBOX}" height="${TOOLBAR_VIEWBOX}" rx="${r}" fill="${bg}"/><g fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(${pad} ${pad}) scale(${scale})">${filesInner}</g></svg>`;
}

export { ABOUT_BULLET_ICONS, ABOUT_CHECK_ICON, ABOUT_SECTION_ICONS, INACTIVE_BG, TOOLBAR_PAD_RATIO, TOOLBAR_RADIUS_RATIO, TOOLBAR_VIEWBOX, filesInner, innerSvgMarkup, stripComment3, toolbarWelcomeIconSvg };
