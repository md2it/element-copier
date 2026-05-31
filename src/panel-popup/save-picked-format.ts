import { downloadTextAsFile } from "../element-copy/download";
import type { CopyFormatId } from "../formats/definitions";
import { readPickCopyMetaFromStorage } from "../pick-mode/pick-copy-cache-storage";
import { fetchPickedFormatText } from "./fetch-picked-format";

/** Save a cached pick format as a file from the panel (user-gesture context). */
export async function savePickedFormatFromPanel(formatId: CopyFormatId): Promise<boolean> {
  const [text, meta] = await Promise.all([
    fetchPickedFormatText(formatId),
    readPickCopyMetaFromStorage(),
  ]);
  if (text === undefined) return false;
  return downloadTextAsFile(formatId, text, meta);
}
