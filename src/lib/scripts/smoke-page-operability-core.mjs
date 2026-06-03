/**
 * Smoke: lib page-operability probe + notice shell contracts.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const libRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const libOperability = join(libRoot, "src/page-operability");

/** Mirrors lib/src/page-operability/probe.ts */
function probeDocumentOperability(document) {
  try {
    const root = document.documentElement ?? document.body;
    if (!root) return false;
    const probe = document.createElement("div");
    probe.style.display = "none";
    root.appendChild(probe);
    const ok = probe.isConnected;
    probe.remove();
    return ok;
  } catch {
    return false;
  }
}

export function runSmokePageOperabilityCore() {
  const libIndexSrc = readFileSync(join(libOperability, "index.ts"), "utf8");
  assert.match(libIndexSrc, /showBlockedNotice/);
  assert.match(libIndexSrc, /probeDocumentOperability/);
  assert.match(libIndexSrc, /registerDocumentOperabilityProbeListener/);

  const canOperateSrc = readFileSync(join(libOperability, "can-operate.ts"), "utf8");
  assert.match(canOperateSrc, /PROBE_DOCUMENT_OPERABILITY/);
  assert.match(canOperateSrc, /tabs\.sendMessage/);
  assert.match(canOperateSrc, /executeScript/);

  const libShowSrc = readFileSync(join(libOperability, "show-notice.ts"), "utf8");
  assert.match(libShowSrc, /setPopup/);
  assert.match(libShowSrc, /tabId/);

  const shellHtml = readFileSync(
    join(libOperability, "blocked-notice-shell.html"),
    "utf8",
  );
  assert.match(shellHtml, /notice-page--tab/);
  assert.match(shellHtml, /id="msg"/);

  const libPageJs = readFileSync(
    join(libOperability, "blocked-notice-page.js"),
    "utf8",
  );
  assert.match(libPageJs, /noticeSessionKey/);
  assert.match(libPageJs, /BLOCKED_NOTICE_DISMISSED/);
  assert.match(libPageJs, /pagehide/);

  const docOk = {
    documentElement: {},
    body: null,
    createElement() {
      return { style: {}, isConnected: true, remove() {} };
    },
  };
  docOk.documentElement = docOk.body = {
    appendChild(el) {
      el.isConnected = true;
    },
  };
  assert.equal(probeDocumentOperability(docOk), true);

  const docBlocked = {
    documentElement: {
      appendChild() {
        throw new Error("Permission denied");
      },
    },
    body: null,
    createElement() {
      return { style: {}, isConnected: false, remove() {} };
    },
  };
  assert.equal(probeDocumentOperability(docBlocked), false);
}
