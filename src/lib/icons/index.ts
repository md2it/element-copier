import arrowUpSvg from "./lucide/arrow-up.svg";
import circlePowerSvg from "./lucide/circle-power.svg";
import copySvg from "./lucide/copy.svg";
import externalLinkSvg from "./lucide/external-link.svg";
import fileDownSvg from "./lucide/file-down.svg";
import filesSvg from "./lucide/files.svg";
import imageDownSvg from "./lucide/image-down.svg";
import imagesSvg from "./lucide/images.svg";
import heartSvg from "./lucide/heart.svg";
import historySvg from "./lucide/history.svg";
import cogSvg from "./lucide/cog.svg";
import infoSvg from "./lucide/info.svg";
import keyboardSvg from "./lucide/keyboard.svg";
import pinSvg from "./lucide/pin.svg";
import playSvg from "./lucide/play.svg";
import puzzleSvg from "./lucide/puzzle.svg";
import rotateCwSvg from "./lucide/rotate-cw.svg";
import settingsSvg from "./lucide/settings.svg";
import shieldCheckSvg from "./lucide/shield-check.svg";
import linkedinSvg from "./brands/linkedin.svg";

function stripComment(svg: string): string {
  return svg.replace(/<!--[\s\S]*?-->\s*/g, "").trim();
}

/** Lucide UI icons (toast/modal); stroke uses currentColor from parent. */
function lucideUiIcon(raw: string): string {
  return stripComment(raw);
}

/** Brand icons from SVG/companies; fill follows link color. */
function brandIcon(raw: string): string {
  return stripComment(raw).replace(/fill="#000000"/g, 'fill="currentColor"');
}

export const ARROW_UP = lucideUiIcon(arrowUpSvg);
export const CIRCLE_POWER = lucideUiIcon(circlePowerSvg);
export const COG = lucideUiIcon(cogSvg);
export const COPY = lucideUiIcon(copySvg);
export const EXTERNAL_LINK = lucideUiIcon(externalLinkSvg);
export const FILE_DOWN = lucideUiIcon(fileDownSvg);
export const FILES = lucideUiIcon(filesSvg);
export const IMAGE_DOWN = lucideUiIcon(imageDownSvg);
export const IMAGES = lucideUiIcon(imagesSvg);
export const HEART = lucideUiIcon(heartSvg);
export const HISTORY = lucideUiIcon(historySvg);
export const INFO = lucideUiIcon(infoSvg);
export const KEYBOARD = lucideUiIcon(keyboardSvg);
export const SETTINGS = lucideUiIcon(settingsSvg);
export const SHIELD_CHECK = lucideUiIcon(shieldCheckSvg);
export const PIN = lucideUiIcon(pinSvg);
export const PLAY = lucideUiIcon(playSvg);
export const PUZZLE = lucideUiIcon(puzzleSvg);
export const ROTATE_CW = lucideUiIcon(rotateCwSvg);
export const LINKEDIN = brandIcon(linkedinSvg);
