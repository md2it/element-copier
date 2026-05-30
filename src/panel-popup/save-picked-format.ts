import { downloadTextAsFile } from "../element-copy/download";
import type { CopyFormatId } from "../formats/definitions";
import { fetchPickedFormatText } from "./fetch-picked-format";

/** Save a cached pick format as a file from the panel (user-gesture context). */
export async function savePickedFormatFromPanel(formatId: CopyFormatId): Promise<boolean> {
  const text = await fetchPickedFormatText(formatId);
  if (text === undefined) return false;
  return downloadTextAsFile(formatId, text);
}
