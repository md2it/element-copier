import { arrow_up_default } from "./lucide/arrow-up.js";
import { circle_power_default } from "./lucide/circle-power.js";
import { cog_default } from "./lucide/cog.js";
import { copy_default } from "./lucide/copy.js";
import { external_link_default } from "./lucide/external-link.js";
import { file_down_default } from "./lucide/file-down.js";
import { files_default } from "./lucide/files.js";
import { git_fork_default } from "./lucide/git-fork.js";
import { heart_default } from "./lucide/heart.js";
import { history_default } from "./lucide/history.js";
import { image_down_default } from "./lucide/image-down.js";
import { images_default } from "./lucide/images.js";
import { info_default } from "./lucide/info.js";
import { keyboard_default } from "./lucide/keyboard.js";
import { pin_default } from "./lucide/pin.js";
import { play_default } from "./lucide/play.js";
import { puzzle_default } from "./lucide/puzzle.js";
import { rotate_cw_default } from "./lucide/rotate-cw.js";
import { settings_default } from "./lucide/settings.js";
import { shield_check_default } from "./lucide/shield-check.js";

function stripComment(svg) {
  return svg.replace(/<!--[\s\S]*?-->\s*/g, "").trim();
}

function lucideUiIcon(raw) {
  return stripComment(raw);
}

var ARROW_UP = lucideUiIcon(arrow_up_default);
var CIRCLE_POWER = lucideUiIcon(circle_power_default);
var COG = lucideUiIcon(cog_default);
var COPY = lucideUiIcon(copy_default);
var EXTERNAL_LINK = lucideUiIcon(external_link_default);
var FILE_DOWN = lucideUiIcon(file_down_default);
var FILES = lucideUiIcon(files_default);
var GIT_FORK = lucideUiIcon(git_fork_default);
var HEART = lucideUiIcon(heart_default);
var HISTORY = lucideUiIcon(history_default);
var IMAGE_DOWN = lucideUiIcon(image_down_default);
var IMAGES = lucideUiIcon(images_default);
var INFO = lucideUiIcon(info_default);
var KEYBOARD = lucideUiIcon(keyboard_default);
var PIN = lucideUiIcon(pin_default);
var PLAY = lucideUiIcon(play_default);
var PUZZLE = lucideUiIcon(puzzle_default);
var ROTATE_CW = lucideUiIcon(rotate_cw_default);
var SETTINGS = lucideUiIcon(settings_default);
var SHIELD_CHECK = lucideUiIcon(shield_check_default);

export { stripComment, lucideUiIcon, ARROW_UP, CIRCLE_POWER, COG, COPY, EXTERNAL_LINK, FILE_DOWN, FILES, GIT_FORK, HEART, HISTORY, IMAGE_DOWN, IMAGES, INFO, KEYBOARD, PIN, PLAY, PUZZLE, ROTATE_CW, SETTINGS, SHIELD_CHECK };
