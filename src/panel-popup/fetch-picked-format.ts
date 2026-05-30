import { ext } from "../api";
import type { CopyFormatId } from "../formats/definitions";
import type { CopyPickedFormatPanelResponse, ContentToBg } from "../messages";

/** Fetch cached pick text for a format from the target tab (via background). */
export async function fetchPickedFormatText(
  formatId: CopyFormatId,
): Promise<string | undefined> {
  try {
    const payload = await ext.runtime.sendMessage<ContentToBg, CopyPickedFormatPanelResponse>({
      type: "COPY_PICKED_FORMAT",
      formatId,
    });
    if (!payload?.ok || !payload.text) return undefined;
    return payload.text;
  } catch {
    return undefined;
  }
}
