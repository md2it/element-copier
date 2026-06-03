const ext = typeof browser !== "undefined" ? browser : chrome;

const BLOCKED_NOTICE_DISMISSED = "BLOCKED_NOTICE_DISMISSED";

function noticeSessionKey() {
  return document.documentElement.dataset.noticeSessionKey || "restrictedNotice";
}

function noticeMinDismissMs() {
  const raw = document.documentElement.dataset.noticeMinMs;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 4000;
}

function notifyNoticeDismissed(tabId) {
  if (typeof tabId !== "number" || !Number.isFinite(tabId)) return;
  ext.runtime
    .sendMessage({ type: BLOCKED_NOTICE_DISMISSED, tabId })
    .catch(() => {});
}

async function main() {
  if (new URLSearchParams(location.search).get("mode") === "tab") {
    document.documentElement.classList.add("notice-page--tab");
  }

  const sessionKey = noticeSessionKey();
  const stored = await ext.storage.session.get(sessionKey);
  const payload = stored[sessionKey];
  const el = document.getElementById("msg");
  if (el && payload?.text) {
    el.textContent = payload.text;
  }
  const dismissMs =
    typeof payload?.dismissMs === "number" && payload.dismissMs > 0
      ? payload.dismissMs
      : noticeMinDismissMs();

  let dismissed = false;
  function dismissNotice() {
    if (dismissed) return;
    dismissed = true;
    notifyNoticeDismissed(payload?.tabId);
  }

  window.addEventListener("pagehide", dismissNotice);
  window.setTimeout(() => {
    dismissNotice();
    window.close();
  }, dismissMs);
}

void main();
