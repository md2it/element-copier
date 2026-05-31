import type { CopyFormatId } from "../formats/definitions";

export type DownloadFileContext = {
  tagName?: string;
  hostname?: string;
};

const DOWNLOAD_FORMAT_IDS = new Set<CopyFormatId>([
  "markdownFile",
  "htmlFile",
  "png",
  "jpeg",
]);

export function isDownloadFileFormat(formatId: CopyFormatId): boolean {
  return DOWNLOAD_FORMAT_IDS.has(formatId);
}

function domainWithDashes(hostname: string): string {
  const normalized = hostname.trim() || "unknown";
  return normalized.replace(/\./g, "-");
}

function extensionForDownloadFormat(formatId: CopyFormatId): string {
  switch (formatId) {
    case "markdownFile":
      return "md";
    case "htmlFile":
      return "html";
    case "png":
      return "png";
    case "jpeg":
      return "jpeg";
    default:
      return "txt";
  }
}

export function buildDownloadFilename(
  formatId: CopyFormatId,
  context?: DownloadFileContext,
): string {
  const ext = extensionForDownloadFormat(formatId);
  const tagName = context?.tagName?.trim().toLowerCase() || "element";
  const domain = domainWithDashes(context?.hostname ?? "unknown");
  return `copied-${domain}-${tagName}.${ext}`;
}

export function mimeTypeForFormat(formatId: CopyFormatId): string {
  switch (formatId) {
    case "markdownFile":
      return "text/markdown;charset=utf-8";
    case "htmlFile":
      return "text/html;charset=utf-8";
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

export function dataUrlToBlob(dataUrl: string): Blob | undefined {
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
  context?: DownloadFileContext,
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
    anchor.download = buildDownloadFilename(formatId, context);
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
