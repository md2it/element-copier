import arrowUpSvg from "../icons/lucide/arrow-up.svg";
import circlePowerSvg from "../icons/lucide/circle-power.svg";
import copySvg from "../icons/lucide/copy.svg";
import externalLinkSvg from "../icons/lucide/external-link.svg";
import fileDownSvg from "../icons/lucide/file-down.svg";
import filesSvg from "../icons/lucide/files.svg";
import imageDownSvg from "../icons/lucide/image-down.svg";
import imagesSvg from "../icons/lucide/images.svg";
import heartSvg from "../icons/lucide/heart.svg";
import historySvg from "../icons/lucide/history.svg";
import cogSvg from "../icons/lucide/cog.svg";
import infoSvg from "../icons/lucide/info.svg";
import keyboardSvg from "../icons/lucide/keyboard.svg";
import pinSvg from "../icons/lucide/pin.svg";
import playSvg from "../icons/lucide/play.svg";
import puzzleSvg from "../icons/lucide/puzzle.svg";
import rotateCwSvg from "../icons/lucide/rotate-cw.svg";
import settingsSvg from "../icons/lucide/settings.svg";
import shieldCheckSvg from "../icons/lucide/shield-check.svg";
import linkedinSvg from "../icons/brands/linkedin.svg";
import md2itSvg from "../icons/brands/md2it.svg";

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
export const MD2IT = brandIcon(md2itSvg);
