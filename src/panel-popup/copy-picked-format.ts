import { ext } from "../api";
import { copyToClipboardForFormat } from "../element-copy";
import type { CopyFormatId } from "../formats/definitions";
import type { CopyPickedFormatPanelResponse, ContentToBg } from "../messages";

/** Copy a cached pick format from the panel (user-gesture context). */
export async function copyPickedFormatFromPanel(formatId: CopyFormatId): Promise<boolean> {
  let payload: CopyPickedFormatPanelResponse;
  try {
    payload = await ext.runtime.sendMessage<ContentToBg, CopyPickedFormatPanelResponse>({
      type: "COPY_PICKED_FORMAT",
      formatId,
    });
  } catch {
    return false;
  }
  if (!payload?.ok || !payload.text) return false;
  return copyToClipboardForFormat(formatId, payload.text);
}
