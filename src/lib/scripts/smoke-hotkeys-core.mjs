/**
 * Smoke: lib hotkeys infra (mirrors + source contracts). No browser APIs.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const libRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const libHotkeys = join(libRoot, "src/hotkeys");

/** Mirrors lib/src/hotkeys/platform.ts */
function isMacPlatform(ua, platform) {
  return (
    /Mac|iPhone|iPad|iPod/.test(ua) ||
    platform.toUpperCase().includes("MAC")
  );
}

/** Mirrors lib/src/hotkeys/keys.ts */
function letterToCode(letter) {
  return `Key${letter.toUpperCase()}`;
}

function isLetterKeyEvent(e, letter) {
  const expectedCode = letterToCode(letter);
  if (typeof e.code === "string" && e.code.length > 0) {
    return e.code === expectedCode;
  }
  return e.key.toLowerCase() === letter.toLowerCase();
}

function isModifierShiftKeyEvent(e, key, mac) {
  const modifier = mac ? e.metaKey : e.ctrlKey;
  return modifier && e.shiftKey && isLetterKeyEvent(e, key);
}

function isPrefixChordKeyEvent(e, mac) {
  return isModifierShiftKeyEvent(e, "x", mac);
}

function isPrefixActionKeyEvent(e, key) {
  if (e.ctrlKey || e.metaKey || e.altKey) return false;
  return isLetterKeyEvent(e, key);
}

function isModifierKeyEvent(e, key, options = {}, mac) {
  const modifier = mac ? e.metaKey : e.ctrlKey;
  const shift = options.shift ?? false;
  const alt = options.alt ?? false;
  return (
    modifier &&
    Boolean(e.shiftKey) === shift &&
    Boolean(e.altKey) === alt &&
    isLetterKeyEvent(e, key)
  );
}

function isEscapeKeyEvent(e) {
  return e.key === "Escape";
}

/** Mirrors lib/src/hotkeys/suppress.ts */
const DEFAULT_TOGGLE_COMMAND_SUPPRESS_MS = 300;

function shouldSuppressContentToggleAfterToggleCommand(
  lastAt,
  now,
  windowMs = DEFAULT_TOGGLE_COMMAND_SUPPRESS_MS,
) {
  return lastAt > 0 && now - lastAt < windowMs;
}

export function runSmokeHotkeysCore() {
  const ev = (partial) => ({ ...partial, key: partial.key ?? "", code: partial.code ?? "" });

  assert.equal(isPrefixChordKeyEvent(ev({ ctrlKey: true, shiftKey: true, code: "KeyX", key: "X" }), false), true);
  assert.equal(isPrefixChordKeyEvent(ev({ metaKey: true, shiftKey: true, code: "KeyX", key: "x" }), true), true);
  assert.equal(isPrefixChordKeyEvent(ev({ ctrlKey: true, shiftKey: false, code: "KeyX", key: "X" }), false), false);
  assert.equal(isPrefixChordKeyEvent(ev({ metaKey: true, shiftKey: true, code: "KeyX", key: "ч" }), true), true);

  assert.equal(isPrefixActionKeyEvent(ev({ code: "KeyD", key: "d" }), "D"), true);
  assert.equal(isPrefixActionKeyEvent(ev({ ctrlKey: true, code: "KeyD", key: "d" }), "D"), false);
  assert.equal(isPrefixActionKeyEvent(ev({ code: "KeyD", key: "в" }), "D"), true);
  assert.equal(isPrefixActionKeyEvent(ev({ code: "KeyL", key: "d" }), "D"), false);
  assert.equal(isPrefixActionKeyEvent(ev({ key: "d" }), "D"), true);

  assert.equal(isModifierKeyEvent(ev({ ctrlKey: true, code: "KeyZ", key: "z" }), "z", {}, false), true);
  assert.equal(isModifierKeyEvent(ev({ ctrlKey: true, shiftKey: true, code: "KeyZ", key: "z" }), "z", {}, false), false);
  assert.equal(isModifierKeyEvent(ev({ metaKey: true, code: "KeyZ", key: "я" }), "z", {}, true), true);

  assert.equal(isEscapeKeyEvent(ev({ key: "Escape" })), true);

  assert.equal(isMacPlatform("Mozilla/5.0 (Macintosh)", "MacIntel"), true);
  assert.equal(isMacPlatform("Mozilla/5.0 (Windows NT 10.0)", "Win32"), false);

  assert.equal(shouldSuppressContentToggleAfterToggleCommand(1000, 1200), true);
  assert.equal(shouldSuppressContentToggleAfterToggleCommand(1000, 1400), false);
  assert.equal(shouldSuppressContentToggleAfterToggleCommand(0, 100), false);

  const libIndexSrc = readFileSync(join(libHotkeys, "index.ts"), "utf8");
  assert.match(libIndexSrc, /registerPrefixBackgroundHotkeys/);
  assert.match(libIndexSrc, /registerPrefixHintOperabilityListeners/);
  assert.match(libIndexSrc, /queryPrefixHintCanShowInContent/);
  assert.match(libIndexSrc, /PREFIX_HINT_CAN_SHOW/);
  assert.match(libIndexSrc, /registerPrefixStartHotkey/);
  assert.match(libIndexSrc, /formatPrefixHotkeyLabel/);
  assert.match(libIndexSrc, /PREFIX_ACTION_TIMEOUT_MS/);
  assert.match(libIndexSrc, /PREFIX_DOUBLE_ACTION_WINDOW_MS/);
  assert.match(libIndexSrc, /showPrefixBadge/);
  assert.match(libIndexSrc, /PREFIX_HINT_SHOW/);

  const prefixHintSrc = readFileSync(join(libHotkeys, "prefix-hint.ts"), "utf8");
  assert.doesNotMatch(prefixHintSrc, /document\./);
  assert.doesNotMatch(prefixHintSrc, /data-shared-prefix-hint/);

  const prefixHintBadgeSrc = readFileSync(join(libHotkeys, "prefix-hint-badge.ts"), "utf8");
  assert.match(prefixHintBadgeSrc, /setBadgeText/);
  assert.match(prefixHintBadgeSrc, /registerPrefixHintBadgeListeners/);

  const libKeysSrc = readFileSync(join(libHotkeys, "keys.ts"), "utf8");
  assert.match(libKeysSrc, /letterToCode/);
  assert.match(libKeysSrc, /isLetterKeyEvent/);
  assert.match(libKeysSrc, /e\.code === expectedCode/);

  const prefixBackgroundSrc = readFileSync(join(libHotkeys, "prefix-background.ts"), "utf8");
  assert.match(prefixBackgroundSrc, /EXECUTE_ACTION_COMMAND/);
  assert.match(
    prefixBackgroundSrc,
    /command === EXECUTE_ACTION_COMMAND[\s\S]*stampToggleCommand/,
  );
  assert.match(
    prefixBackgroundSrc,
    /command === EXECUTE_ACTION_COMMAND[\s\S]*onToggleRequest/,
  );
  assert.doesNotMatch(prefixBackgroundSrc, /prefixCommands/);
  assert.doesNotMatch(prefixBackgroundSrc, /shouldSuppressContentToggle/);

  const prefixContentSrc = readFileSync(join(libHotkeys, "prefix-content.ts"), "utf8");
  assert.doesNotMatch(prefixContentSrc, /isEditableKeyboardTarget/);

  const prefixModeSrc = readFileSync(join(libHotkeys, "prefix-mode.ts"), "utf8");
  const keyDownBlock = prefixModeSrc.match(
    /const onPrefixChordKeyDown = \(e[\s\S]*?\n  };/,
  );
  assert.ok(keyDownBlock, "onPrefixChordKeyDown block");
  assert.doesNotMatch(keyDownBlock[0], /hint\.show/);
  assert.match(prefixModeSrc, /canShowPrefixHint/);
  assert.match(prefixModeSrc, /onPrefixHintBlocked/);
  assert.match(prefixModeSrc, /onDoubleAction/);
  assert.match(prefixModeSrc, /e\.repeat/);
}
