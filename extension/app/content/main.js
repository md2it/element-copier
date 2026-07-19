import { CopierPickUI, notifyElementPicked } from "../pick-mode/pick-ui.js";
import { PICK_ROOT_ID } from "../pick-mode/constants.js";
import { bindFormatSettingsCache, getCachedDefaultAction, getCachedInlineImagesMode, refreshFormatSettingsCache } from "../settings/format-settings-cache.js";
import { bootstrapPanelPopupPageIfNeeded, isPanelPopupPage } from "../panel-popup/page.js";
import { bootstrapPanelTabPageIfNeeded } from "../panel-tab/bootstrap.js";
import { copyToClipboardForFormat } from "../element-copy/clipboard.js";
import { downloadTextAsFile } from "../element-copy/download.js";
import { ext } from "../../lib/our/api.js";
import { getCachedCopyText, snapshotPickCopyCache } from "../pick-mode/pick-copy-cache.js";
import { isPanelTabMode } from "../../lib/our/panel-tab/index.js";
import { mountCopierContentHotkeys, registerCopierStartHotkey, unmountCopierContentHotkeys } from "../hotkeys/copier-content.js";
import { resolvePickCopyCacheStorageKey } from "../pick-mode/pick-copy-cache-storage.js";
import { registerDocumentOperabilityProbeListener } from "../../lib/our/page-operability/content-probe.js";
import { sendToBackground } from "../messages.js";
import { showMountedPopupTab } from "../panel-popup/mount-panel-surface.js";
import { incrementSupportSurveySuccessCount } from "../support-survey/state.js";

function getState() {
  if (!window.__ecState) {
    window.__ecState = { active: false, pick: null, pickInit: null };
  }
  return window.__ecState;
}

function resetState(state2) {
  unmountCopierContentHotkeys();
  state2.active = false;
  tearDownPick(state2);
}

function notifyBackgroundActive(isActive) {
  sendToBackground({ type: "ACTIVE_CHANGED", active: isActive });
}

function requestToggle() {
  sendToBackground({ type: "TOGGLE_REQUEST" });
}

function requestCopyPage() {
  sendToBackground({ type: "REQUEST_COPY_PAGE" });
}

function requestCopiedPanel(formatId, panelAction) {
  sendToBackground({ type: "OPEN_PANEL", tab: "copied", formatId, panelAction });
}

function createPickCopyMeta(element) {
  const hostname = element.ownerDocument.location?.hostname?.trim() || "unknown";
  return { tagName: element.tagName.toLowerCase(), hostname };
}

function notifyPickCopyFlowStarted(requestId, startedAtMs) {
  sendToBackground({ type: "PICK_COPY_FLOW_STARTED", requestId, startedAtMs });
}

function notifyPickCopyFlowFinished(requestId) {
  sendToBackground({ type: "PICK_COPY_FLOW_FINISHED", requestId });
}

function waitForDomRoot(timeoutMs = 5e3) {
  if (document.documentElement ?? document.body) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;
    const done = () => {
      observer.disconnect();
      resolve();
    };
    const observer = new MutationObserver(() => {
      if (document.documentElement ?? document.body) {
        done();
      } else if (Date.now() >= deadline) {
        done();
      }
    });
    observer.observe(document, { childList: true, subtree: true });
    if (document.documentElement ?? document.body) {
      done();
    }
  });
}

function waitForNextFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function tearDownPick(state2) {
  state2.pick?.dispose();
  state2.pick = null;
  state2.pickInit = null;
  document.getElementById(PICK_ROOT_ID)?.remove();
}

function isPickRootConnected() {
  return document.getElementById(PICK_ROOT_ID)?.isConnected === true;
}

function attachMessageHandler(state2) {
  const prev = window.__ecMessageHandler;
  if (prev) {
    try {
      ext.runtime.onMessage.removeListener(prev);
    } catch {
    }
  }
  const deactivate = () => {
    const wasActive = state2.active;
    state2.active = false;
    unmountCopierContentHotkeys();
    tearDownPick(state2);
    if (wasActive) {
      notifyBackgroundActive(false);
    }
  };
  let pickCopyInFlight = false;
  let pickCopyFlowSeq = 0;
  const runPickCopyFlow = async (element) => {
    if (pickCopyInFlight) return;
    pickCopyInFlight = true;
    const requestId = `pick-copy-${Date.now()}-${++pickCopyFlowSeq}`;
    try {
      notifyPickCopyFlowStarted(requestId, Date.now());
      deactivate();
      await refreshFormatSettingsCache();
      const defaultAction = getCachedDefaultAction();
      let copiedFormatId = null;
      let panelAction;
      let defaultActionAttempted = false;
      const defaultCacheKey = defaultAction ? resolvePickCopyCacheStorageKey(defaultAction.formatId) : null;
      const meta = createPickCopyMeta(element);
      const performDefaultAction = async (key, value) => {
        if (defaultAction === null || defaultActionAttempted || key !== defaultCacheKey) return;
        defaultActionAttempted = true;
        const { formatId, action } = defaultAction;
        if (action === "copy") {
          const copied = await copyToClipboardForFormat(formatId, value);
          if (copied) {
            copiedFormatId = formatId;
            panelAction = "copy";
          } else {
            console.debug("[Element Copier] clipboard copy failed");
          }
        } else {
          const saved = downloadTextAsFile(formatId, value, meta);
          if (saved) {
            copiedFormatId = formatId;
            panelAction = "download";
          } else {
            console.debug("[Element Copier] default download failed");
          }
        }
      };
      await snapshotPickCopyCache(element, getCachedInlineImagesMode(), {
        onCacheEntry: performDefaultAction,
        priorityFormatId: defaultAction?.formatId
      });
      void incrementSupportSurveySuccessCount();
      if (defaultAction !== null && !defaultActionAttempted) {
        const { formatId } = defaultAction;
        const defaultText = getCachedCopyText(formatId);
        if (defaultText !== void 0) {
          await performDefaultAction(defaultCacheKey, defaultText);
        } else {
          console.debug("[Element Copier] default format not cached (disabled?)");
        }
      }
      notifyElementPicked(element);
      requestCopiedPanel(copiedFormatId, panelAction);
    } finally {
      notifyPickCopyFlowFinished(requestId);
      pickCopyInFlight = false;
    }
  };
  const handleElementPicked = async (element) => {
    if (!state2.active) return;
    await runPickCopyFlow(element);
  };
  const ensurePick = async () => {
    if (state2.pick?.isHostConnected() && isPickRootConnected()) {
      return state2.pick;
    }
    tearDownPick(state2);
    if (!state2.pickInit) {
      state2.pickInit = (async () => {
        await waitForDomRoot();
        await waitForNextFrame();
        const pick = new CopierPickUI((element) => {
          void handleElementPicked(element);
        });
        state2.pick = pick;
        return pick;
      })();
    }
    try {
      return await state2.pickInit;
    } catch (error) {
      state2.pickInit = null;
      throw error;
    }
  };
  const hotkeysHost = {
    isActive: () => state2.active,
    deactivate
  };
  const activate = async () => {
    if (typeof window !== "undefined" && window.top !== window) return false;
    if (pickCopyInFlight) {
      notifyBackgroundActive(false);
      return true;
    }
    if (state2.active) {
      if (state2.pick?.isHostConnected() && isPickRootConnected()) {
        state2.pick.activate();
        mountCopierContentHotkeys(hotkeysHost);
        notifyBackgroundActive(true);
        return true;
      }
      state2.active = false;
      tearDownPick(state2);
    }
    try {
      await refreshFormatSettingsCache();
      const pick = await ensurePick();
      state2.active = true;
      mountCopierContentHotkeys(hotkeysHost);
      pick.activate();
      const ok = pick.isHostConnected() && isPickRootConnected();
      if (!ok) {
        deactivate();
        return false;
      }
      notifyBackgroundActive(true);
      return true;
    } catch (err) {
      console.debug("[Element Copier] activate failed:", err);
      deactivate();
      return false;
    }
  };
  const handler = (message, _sender, sendResponse) => {
    if (message.type === "SET_ACTIVE") {
      if (typeof window !== "undefined" && window.top !== window) {
        return;
      }
      if (message.active) {
        void activate().then((ok) => sendResponse({ ok }));
        return true;
      }
      deactivate();
      return;
    }
    if (message.type === "GET_PICK_COPY_TEXT") {
      if (typeof window !== "undefined" && window.top !== window) {
        sendResponse({ ok: false });
        return;
      }
      const text = getCachedCopyText(message.formatId);
      if (text === void 0) {
        sendResponse({ ok: false });
        return;
      }
      sendResponse({ ok: true, text });
      return;
    }
    if (message.type === "SET_POPUP_TAB") {
      if (typeof window !== "undefined" && window.top !== window) {
        sendResponse({ ok: false });
        return;
      }
      if (!isPanelPopupPage(location.href) || isPanelTabMode()) {
        sendResponse({ ok: false });
        return;
      }
      void showMountedPopupTab(message.tab).then((ok) => sendResponse({ ok }));
      return true;
    }
    if (message.type === "COPY_PAGE") {
      if (typeof window !== "undefined" && window.top !== window) {
        sendResponse({ ok: false });
        return;
      }
      const root2 = document.documentElement;
      if (!root2) {
        sendResponse({ ok: false });
        return;
      }
      void runPickCopyFlow(root2).then(() => sendResponse({ ok: true }));
      return true;
    }
  };
  window.__ecMessageHandler = handler;
  ext.runtime.onMessage.addListener(handler);
}

var state = getState();

var runtimeId = ext.runtime.id;

if (window.__ecRuntimeId !== void 0 && window.__ecRuntimeId !== runtimeId) {
  resetState(state);
}

window.__ecRuntimeId = runtimeId;

registerDocumentOperabilityProbeListener();

bindFormatSettingsCache();

attachMessageHandler(state);

registerCopierStartHotkey(requestToggle, requestCopyPage);

void bootstrapPanelTabPageIfNeeded();

void bootstrapPanelPopupPageIfNeeded();
