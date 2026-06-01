import { ext } from "./api";
import {
  mountCopierContentHotkeys,
  registerCopierStartHotkey,
  unmountCopierContentHotkeys,
} from "./hotkeys";
import { registerDocumentOperabilityProbeListener } from "../../lib/src/page-operability";
import { bootstrapPanelPopupPageIfNeeded, isPanelPopupPage } from "./panel-popup/page";
import { isPanelTabMode } from "./panel-tab";
import { showMountedPopupTab } from "./panel-popup/mount-panel-surface";
import { bootstrapPanelTabPageIfNeeded } from "./panel-tab";
import { copyToClipboardForFormat } from "./element-copy";
import { downloadTextAsFile } from "./element-copy/download";
import {
  CopierPickUI,
  getCachedCopyText,
  notifyElementPicked,
  PICK_ROOT_ID,
  snapshotPickCopyCache,
} from "./pick-mode";
import {
  bindFormatSettingsCache,
  getCachedDefaultAction,
  getCachedInlineImagesMode,
  refreshFormatSettingsCache,
} from "./settings/format-settings-cache";
import { readPickCopyMetaFromStorage } from "./pick-mode/pick-copy-cache-storage";
import type { CopiedPanelActionKind } from "./settings/copied-session";
import type { CopyFormatId } from "./formats/definitions";
import {
  sendToBackground,
  type BgToContent,
  type ContentActivationResponse,
  type GetPickCopyTextResponse,
  type SetPopupTabResponse,
} from "./messages";

type ContentState = {
  active: boolean;
  pick: CopierPickUI | null;
  pickInit: Promise<CopierPickUI> | null;
};

declare global {
  interface Window {
    __ecRuntimeId?: string;
    __ecMessageHandler?: (
      message: BgToContent,
      sender: chrome.runtime.MessageSender,
      sendResponse: (
        response: ContentActivationResponse | GetPickCopyTextResponse | SetPopupTabResponse,
      ) => void,
    ) => boolean | void;
    __ecState?: ContentState;
  }
}

function getState(): ContentState {
  if (!window.__ecState) {
    window.__ecState = { active: false, pick: null, pickInit: null };
  }
  return window.__ecState;
}

function resetState(state: ContentState): void {
  unmountCopierContentHotkeys();
  state.active = false;
  tearDownPick(state);
}

function notifyBackgroundActive(isActive: boolean): void {
  sendToBackground({ type: "ACTIVE_CHANGED", active: isActive });
}

function requestToggle(): void {
  sendToBackground({ type: "TOGGLE_REQUEST" });
}

function requestCopyPage(): void {
  sendToBackground({ type: "REQUEST_COPY_PAGE" });
}

function requestCopiedPanel(
  formatId: CopyFormatId | null,
  panelAction?: CopiedPanelActionKind,
): void {
  sendToBackground({ type: "OPEN_PANEL", tab: "copied", formatId, panelAction });
}

function notifyPickCopyFlowStarted(requestId: string, startedAtMs: number): void {
  sendToBackground({ type: "PICK_COPY_FLOW_STARTED", requestId, startedAtMs });
}

function notifyPickCopyFlowFinished(requestId: string): void {
  sendToBackground({ type: "PICK_COPY_FLOW_FINISHED", requestId });
}

function waitForDomRoot(timeoutMs = 5000): Promise<void> {
  if (document.documentElement ?? document.body) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;
    const done = (): void => {
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

function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function tearDownPick(state: ContentState): void {
  state.pick?.dispose();
  state.pick = null;
  state.pickInit = null;
  document.getElementById(PICK_ROOT_ID)?.remove();
}

function isPickRootConnected(): boolean {
  return document.getElementById(PICK_ROOT_ID)?.isConnected === true;
}

function attachMessageHandler(state: ContentState): void {
  const prev = window.__ecMessageHandler;
  if (prev) {
    try {
      ext.runtime.onMessage.removeListener(prev);
    } catch {
      /* previous extension instance */
    }
  }

  const deactivate = (): void => {
    const wasActive = state.active;
    state.active = false;
    unmountCopierContentHotkeys();
    tearDownPick(state);
    if (wasActive) {
      notifyBackgroundActive(false);
    }
  };

  let pickCopyInFlight = false;
  let pickCopyFlowSeq = 0;

  const runPickCopyFlow = async (element: Element): Promise<void> => {
    if (pickCopyInFlight) return;
    pickCopyInFlight = true;
    const requestId = `pick-copy-${Date.now()}-${++pickCopyFlowSeq}`;
    try {
      notifyPickCopyFlowStarted(requestId, Date.now());
      deactivate();

      await refreshFormatSettingsCache();
      await snapshotPickCopyCache(element, getCachedInlineImagesMode());

      const defaultAction = getCachedDefaultAction();
      let copiedFormatId: CopyFormatId | null = null;
      let panelAction: CopiedPanelActionKind | undefined;

      if (defaultAction !== null) {
        const { formatId, action } = defaultAction;
        const defaultText = getCachedCopyText(formatId);
        if (defaultText !== undefined) {
          if (action === "copy") {
            const copied = await copyToClipboardForFormat(formatId, defaultText);
            if (copied) {
              copiedFormatId = formatId;
              panelAction = "copy";
            } else {
              console.warn("[Element Copier] clipboard copy failed");
            }
          } else {
            const meta = await readPickCopyMetaFromStorage();
            const saved = downloadTextAsFile(formatId, defaultText, meta);
            if (saved) {
              copiedFormatId = formatId;
              panelAction = "download";
            } else {
              console.warn("[Element Copier] default download failed");
            }
          }
        } else {
          console.warn("[Element Copier] default format not cached (disabled?)");
        }
      }

      notifyElementPicked(element);
      requestCopiedPanel(copiedFormatId, panelAction);
    } finally {
      notifyPickCopyFlowFinished(requestId);
      pickCopyInFlight = false;
    }
  };

  const handleElementPicked = async (element: Element): Promise<void> => {
    if (!state.active) return;
    await runPickCopyFlow(element);
  };

  const ensurePick = async (): Promise<CopierPickUI> => {
    if (state.pick?.isHostConnected() && isPickRootConnected()) {
      return state.pick;
    }
    tearDownPick(state);
    if (!state.pickInit) {
      state.pickInit = (async () => {
        await waitForDomRoot();
        await waitForNextFrame();
        const pick = new CopierPickUI((element) => {
          void handleElementPicked(element);
        });
        state.pick = pick;
        return pick;
      })();
    }
    try {
      return await state.pickInit;
    } catch (error) {
      state.pickInit = null;
      throw error;
    }
  };

  const hotkeysHost = {
    isActive: () => state.active,
    deactivate,
  };

  const activate = async (): Promise<boolean> => {
    if (typeof window !== "undefined" && window.top !== window) return false;
    if (pickCopyInFlight) {
      notifyBackgroundActive(false);
      return true;
    }

    if (state.active) {
      if (state.pick?.isHostConnected() && isPickRootConnected()) {
        state.pick.activate();
        mountCopierContentHotkeys(hotkeysHost);
        notifyBackgroundActive(true);
        return true;
      }
      state.active = false;
      tearDownPick(state);
    }

    try {
      await refreshFormatSettingsCache();
      const pick = await ensurePick();
      state.active = true;
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
      console.warn("[Element Copier] activate failed:", err);
      deactivate();
      return false;
    }
  };

  const handler = (
    message: BgToContent,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (
      response: ContentActivationResponse | GetPickCopyTextResponse | SetPopupTabResponse
    ) => void,
  ): boolean | void => {
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
      if (text === undefined) {
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
      const root = document.documentElement;
      if (!root) {
        sendResponse({ ok: false });
        return;
      }
      void runPickCopyFlow(root).then(() => sendResponse({ ok: true }));
      return true;
    }

  };

  window.__ecMessageHandler = handler;
  ext.runtime.onMessage.addListener(handler);
}

const state = getState();
const runtimeId = ext.runtime.id;

if (window.__ecRuntimeId !== undefined && window.__ecRuntimeId !== runtimeId) {
  resetState(state);
}

window.__ecRuntimeId = runtimeId;
registerDocumentOperabilityProbeListener();
bindFormatSettingsCache();
attachMessageHandler(state);
registerCopierStartHotkey(requestToggle, requestCopyPage);

void bootstrapPanelTabPageIfNeeded();
void bootstrapPanelPopupPageIfNeeded();
