import type { CopyFormatId } from "../formats/definitions";

function downloadFilenameForFormat(formatId: CopyFormatId): string {
  switch (formatId) {
    case "markdownFile":
      return "element-copier.md";
    default:
      return "element-copier.txt";
  }
}

function mimeTypeForFormat(formatId: CopyFormatId): string {
  switch (formatId) {
    case "markdownFile":
      return "text/markdown;charset=utf-8";
    default:
      return "text/plain;charset=utf-8";
  }
}

/** Trigger a file download in the panel (requires a user gesture). */
export function downloadTextAsFile(
  formatId: CopyFormatId,
  text: string,
): boolean {
  if (!text) return false;
  try {
    const blob = new Blob([text], { type: mimeTypeForFormat(formatId) });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = downloadFilenameForFormat(formatId);
    anchor.style.display = "none";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}
