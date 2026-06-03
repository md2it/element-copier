import { ext } from "../api";
import { probeDocumentOperability } from "./probe";

/** Background → content: run {@link probeDocumentOperability} in this frame. */
export const PROBE_DOCUMENT_OPERABILITY = "PROBE_DOCUMENT_OPERABILITY" as const;

export type ProbeDocumentOperabilityMessage = {
  type: typeof PROBE_DOCUMENT_OPERABILITY;
};

export function isProbeDocumentOperabilityMessage(
  message: unknown,
): message is ProbeDocumentOperabilityMessage {
  if (typeof message !== "object" || message === null) return false;
  return (message as ProbeDocumentOperabilityMessage).type === PROBE_DOCUMENT_OPERABILITY;
}

let probeListenerRegistered = false;

/** Answers {@link PROBE_DOCUMENT_OPERABILITY} from the injected content script. */
export function registerDocumentOperabilityProbeListener(): void {
  if (probeListenerRegistered) return;
  probeListenerRegistered = true;

  ext.runtime.onMessage.addListener((message, _sender, sendResponse): boolean | void => {
    if (!isProbeDocumentOperabilityMessage(message)) return;
    sendResponse(probeDocumentOperability());
    return true;
  });
}
