import TurndownService from "turndown";
import { relaxTurndownBracketEscapes, repairLinkedImageBreaks } from "./postprocess";
import { sanitizeMarkdownAltText } from "./sanitize-alt";

const TURNDOWN_OPTIONS: TurndownService.Options = {
  headingStyle: "atx",
  hr: "---",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  fence: "```",
  emDelimiter: "*",
  strongDelimiter: "**",
  linkStyle: "inlined",
};

function cleanAttribute(attribute: string | null): string {
  return attribute ? attribute.replace(/(\n+\s*)+/g, "\n") : "";
}

function escapeImageAlt(alt: string): string {
  return alt
    .replace(/\\/g, "\\\\")
    .replace(/\*/g, "\\*")
    .replace(/_/g, "\\_")
    .replace(/`/g, "\\`");
}

function escapeLinkDestination(destination: string): string {
  const escaped = destination.replace(/([<>()])/g, "\\$1");
  return escaped.includes(" ") ? `<${escaped}>` : escaped;
}

function escapeLinkTitle(title: string): string {
  return title.replace(/"/g, '\\"');
}

function createTurndownService(): TurndownService {
  const service = new TurndownService(TURNDOWN_OPTIONS);

  service.addRule("strikethrough", {
    filter: (node) => ["DEL", "S", "STRIKE"].includes(node.nodeName),
    replacement: (content) => `~~${content}~~`,
  });

  service.addRule("image", {
    filter: "img",
    replacement: (_content, node) => {
      const element = node as HTMLImageElement;
      const alt = escapeImageAlt(
        sanitizeMarkdownAltText(cleanAttribute(element.getAttribute("alt"))),
      );
      const src = escapeLinkDestination(element.getAttribute("src") || "");
      const title = cleanAttribute(element.getAttribute("title"));
      const titlePart = title ? ` "${escapeLinkTitle(title)}"` : "";
      return src ? `![${alt}](${src}${titlePart})` : "";
    },
  });

  return service;
}

let sharedService: TurndownService | undefined;

function getTurndownService(): TurndownService {
  sharedService ??= createTurndownService();
  return sharedService;
}

function finalizeMarkdown(markdown: string): string {
  return repairLinkedImageBreaks(relaxTurndownBracketEscapes(markdown));
}

/** Converts an HTML string to Markdown using the shared Turndown configuration. */
export function htmlToMarkdown(html: string): string {
  return finalizeMarkdown(getTurndownService().turndown(html));
}

/** Converts a DOM element to Markdown using the shared Turndown configuration. */
export function elementToMarkdown(element: Element): string {
  return finalizeMarkdown(getTurndownService().turndown(element as TurndownService.Node));
}
