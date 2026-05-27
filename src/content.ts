import { ext } from "./api";
import {
  mountCopierContentHotkeys,
  registerCopierStartHotkey,
  unmountCopierContentHotkeys,
} from "./hotkeys";
import { registerDocumentOperabilityProbeListener } from "../../lib/src/page-operability";
import { bootstrapPanelPopupPageIfNeeded } from "./panel-popup/page";
import { bootstrapPanelTabPageIfNeeded } from "./panel-tab";
import {
  copyElementToClipboard,
  CopierPickUI,
  notifyElementPicked,
  PICK_ROOT_ID,
} from "./pick-mode";
import type {
  BgToContent,
  ContentActivationResponse,
  ContentToBg,
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
      sendResponse: (response: ContentActivationResponse) => void,
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
  const msg: ContentToBg = { type: "ACTIVE_CHANGED", active: isActive };
  void ext.runtime.sendMessage(msg).catch(() => {
    /* extension reloaded */
  });
}

function requestToggle(): void {
  const msg: ContentToBg = { type: "TOGGLE_REQUEST" };
  void ext.runtime.sendMessage(msg).catch(() => {
    /* extension reloaded */
  });
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
  state.pick?.deactivate();
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

  const handleElementPicked = async (element: Element): Promise<void> => {
    if (pickCopyInFlight || !state.active) return;
    pickCopyInFlight = true;
    try {
      const copied = await copyElementToClipboard(element);
      if (!copied) {
        console.warn("[Element Copier] clipboard copy failed");
        return;
      }
      notifyElementPicked(element);
      deactivate();
    } finally {
      pickCopyInFlight = false;
    }
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
    sendResponse: (response: ContentActivationResponse) => void,
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
attachMessageHandler(state);
registerCopierStartHotkey(requestToggle);

void bootstrapPanelTabPageIfNeeded();
void bootstrapPanelPopupPageIfNeeded();
