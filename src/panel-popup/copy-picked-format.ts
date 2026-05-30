import { copyToClipboardForFormat } from "../element-copy";
import type { CopyFormatId } from "../formats/definitions";
import { fetchPickedFormatText } from "./fetch-picked-format";

/** Copy a cached pick format from the panel (user-gesture context). */
export async function copyPickedFormatFromPanel(formatId: CopyFormatId): Promise<boolean> {
  const text = await fetchPickedFormatText(formatId);
  if (text === undefined) return false;
  return copyToClipboardForFormat(formatId, text);
}
