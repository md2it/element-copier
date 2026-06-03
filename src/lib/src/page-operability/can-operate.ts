import { ext } from "../api";
import { PROBE_DOCUMENT_OPERABILITY } from "./content-probe";
import { probeDocumentOperability } from "./probe";

function scriptingTarget(tabId: number, frameId?: number): chrome.scripting.InjectionTarget {
  return frameId !== undefined && frameId !== 0
    ? { tabId, frameIds: [frameId] }
    : { tabId };
}

function messageOptions(frameId?: number): chrome.tabs.MessageSendOptions | undefined {
  return frameId !== undefined && frameId !== 0 ? { frameId } : undefined;
}

/** True when the browser allows programmatic scripting on the tab (or frame). */
export async function canOperateOnTab(tabId: number, frameId?: number): Promise<boolean> {
  try {
    const options = messageOptions(frameId);
    const response =
      options === undefined
        ? await ext.tabs.sendMessage(tabId, { type: PROBE_DOCUMENT_OPERABILITY })
        : await ext.tabs.sendMessage(
            tabId,
            { type: PROBE_DOCUMENT_OPERABILITY },
            options,
          );
    if (response === true) return true;
    if (response === false) return false;
  } catch {
    // Content not injected in this frame yet.
  }

  try {
    const [result] = await ext.scripting.executeScript({
      target: scriptingTarget(tabId, frameId),
      func: probeDocumentOperability,
    });
    return result?.result === true;
  } catch {
    return false;
  }
}
