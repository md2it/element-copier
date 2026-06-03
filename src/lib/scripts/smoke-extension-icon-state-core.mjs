/**
 * Smoke: lib extension toolbar icon state contracts.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const libRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

export function runSmokeExtensionIconStateCore() {
  const libIndexSrc = readFileSync(
    join(libRoot, "src/extension-icon-state/index.ts"),
    "utf8",
  );
  assert.match(libIndexSrc, /createExtensionIconState/);
  assert.match(libIndexSrc, /getTabActiveState/);
  assert.match(libIndexSrc, /createIconSync/);
  assert.match(libIndexSrc, /registerExtensionIconStateListeners/);

  const libIconSyncSrc = readFileSync(
    join(libRoot, "src/extension-icon-state/icon-sync.ts"),
    "utf8",
  );
  assert.match(libIconSyncSrc, /syncedTabIdsStorageKey/);
  assert.match(libIconSyncSrc, /ext\.action\.setIcon/);
  assert.doesNotMatch(libIconSyncSrc, /TOOLBAR_ICON_PATHS/);

  const libListenersSrc = readFileSync(
    join(libRoot, "src/extension-icon-state/listeners.ts"),
    "utf8",
  );
  assert.match(libListenersSrc, /onActivated/);
  assert.match(libListenersSrc, /onUpdated/);
  assert.match(libListenersSrc, /onRemoved/);
}
