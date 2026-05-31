import {
  CODE_XML,
  IMAGE_DOWN,
  IMAGES,
  LIST_MINUS,
  LIST_PLUS,
  MARKDOWN,
  MARKDOWN_FILE,
  TERMINAL,
  TEXT_INITIAL,
} from "../../../lib/src/icons";
import type { FormatIconId } from "./definitions";

const FORMAT_ICONS: Record<FormatIconId, string> = {
  "code-xml": CODE_XML,
  terminal: TERMINAL,
  "list-plus": LIST_PLUS,
  "list-minus": LIST_MINUS,
  "text-initial": TEXT_INITIAL,
  markdown: MARKDOWN,
  "markdown-file": MARKDOWN_FILE,
  images: IMAGES,
  "image-down": IMAGE_DOWN,
};

export function createFormatIcon(iconId: FormatIconId): HTMLSpanElement {
  const mark = document.createElement("span");
  mark.className = "ec-format-action-icon";
  mark.setAttribute("aria-hidden", "true");
  mark.innerHTML = FORMAT_ICONS[iconId];
  return mark;
}
