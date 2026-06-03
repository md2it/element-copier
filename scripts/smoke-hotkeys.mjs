/**
 * Smoke: lib hotkeys + element-copier wiring (no browser APIs).
 * Run: node scripts/smoke-hotkeys.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runSmokeHotkeysCore } from "../src/lib/scripts/smoke-hotkeys-core.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

runSmokeHotkeysCore();

const copierKeysSrc = readFileSync(join(root, "src/hotkeys/keys.ts"), "utf8");
assert.match(copierKeysSrc, /formatPrefixChordLabel/);
assert.match(copierKeysSrc, /isEscapeKeyEvent/);
assert.match(copierKeysSrc, /isEscHotkeyEvent/);

const copierRegistrySrc = readFileSync(join(root, "src/hotkeys/registry.ts"), "utf8");
assert.match(copierRegistrySrc, /registerLibContentHotkey/);
assert.match(copierRegistrySrc, /elementCopier/);

const copierContentSrc = readFileSync(join(root, "src/hotkeys/copier-content.ts"), "utf8");
assert.match(copierContentSrc, /registerPrefixStartHotkey/);
assert.match(copierContentSrc, /onDoubleAction: requestCopyPage/);
assert.match(copierContentSrc, /if \(!host\.isActive\(\)\) return/);
assert.match(copierContentSrc, /mountCopierContentHotkeys/);
assert.match(copierContentSrc, /unmountCopierContentHotkeys/);
assert.match(copierContentSrc, /window\.top !== window/);
assert.doesNotMatch(copierContentSrc, /undo/);

const contentSrc = readFileSync(join(root, "src/content.ts"), "utf8");
assert.match(contentSrc, /mountCopierContentHotkeys/);
assert.match(contentSrc, /REQUEST_COPY_PAGE/);
assert.match(contentSrc, /unmountCopierContentHotkeys/);

const commandsSrc = readFileSync(join(root, "src/hotkeys/commands.ts"), "utf8");
assert.match(commandsSrc, /activate-deactivate/);
assert.match(commandsSrc, /_execute_action/);

const manifestSrc = readFileSync(join(root, "extension/manifest.json"), "utf8");
assert.match(manifestSrc, /"_execute_action"/);
assert.match(manifestSrc, /"activate-deactivate"/);
assert.match(manifestSrc, /__MSG_commandToggleCopy__/);
assert.match(manifestSrc, /"deactivate-copy-mode"/);
assert.match(manifestSrc, /__MSG_commandDeactivateCopy__/);
const deactivateCopyBlock = manifestSrc.match(/"deactivate-copy-mode"\s*:\s*\{([^}]*)\}/);
assert.ok(deactivateCopyBlock, "deactivate-copy-mode command block");
assert.doesNotMatch(deactivateCopyBlock[1], /suggested_key/);
assert.doesNotMatch(manifestSrc, /suggested_key/);

console.log("smoke-hotkeys: ok");
