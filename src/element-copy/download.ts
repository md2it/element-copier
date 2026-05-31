import type { CopyFormatId } from "../formats/definitions";

function downloadFilenameForFormat(formatId: CopyFormatId): string {
  switch (formatId) {
    case "markdownFile":
      return "element-copier.md";
    case "png":
      return "element-copier.png";
    case "jpeg":
      return "element-copier.jpeg";
    default:
      return "element-copier.txt";
  }
}

function mimeTypeForFormat(formatId: CopyFormatId): string {
  switch (formatId) {
    case "markdownFile":
      return "text/markdown;charset=utf-8";
    case "png":
      return "image/png";
    case "jpeg":
      return "image/jpeg";
    default:
      return "text/plain;charset=utf-8";
  }
}

function isDataUrl(value: string): boolean {
  return /^data:[^,]+,/i.test(value);
}

function dataUrlToBlob(dataUrl: string): Blob | undefined {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/i.exec(dataUrl);
  if (!match) return undefined;

  const mimeType = match[1] || "application/octet-stream";
  const isBase64 = match[2] !== undefined;
  const data = match[3];
  const binary = isBase64 ? atob(data) : decodeURIComponent(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mimeType });
}

/** Trigger a file download in the panel (requires a user gesture). */
export function downloadTextAsFile(
  formatId: CopyFormatId,
  text: string,
): boolean {
  if (!text) return false;
  try {
    const blob = isDataUrl(text)
      ? dataUrlToBlob(text)
      : new Blob([text], { type: mimeTypeForFormat(formatId) });
    if (!blob) return false;

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
