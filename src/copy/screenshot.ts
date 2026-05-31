import { domToJpeg, domToPng, type Options } from "modern-screenshot";
import type { CopyFormatId } from "../formats/definitions";

export type ImageCopyFormatId = Extract<CopyFormatId, "png" | "jpeg">;

const IMAGE_FORMATS = new Set<CopyFormatId>(["png", "jpeg"]);

function screenshotOptions(formatId: ImageCopyFormatId): Options {
  return {
    backgroundColor: formatId === "jpeg" ? "#ffffff" : null,
    fetch: {
      requestInit: { cache: "force-cache" },
    },
  };
}

export function isImageCopyFormat(formatId: CopyFormatId): formatId is ImageCopyFormatId {
  return IMAGE_FORMATS.has(formatId);
}

export function captureElementImage(
  element: Element,
  formatId: ImageCopyFormatId,
): Promise<string> {
  const options = screenshotOptions(formatId);
  if (formatId === "jpeg") {
    return domToJpeg(element, options);
  }
  return domToPng(element, options);
}
