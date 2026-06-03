function unescapeBracketEscapesInLabel(label: string): string {
  return label.replace(/\\\[/g, "[").replace(/\\\]/g, "]");
}

/** Turndown may insert whitespace between `![alt](src)` and `](href)` of a linked image. */
export function repairLinkedImageBreaks(markdown: string): string {
  return markdown.replace(
    /\[(\s*!\[(?:\\.|[^\]])*?\]\((?:\\.|[^)])*?\))\s*\]\(/g,
    (_match, inner: string) => `[${inner.trim()}](`,
  );
}

/**
 * Turndown escapes `[` `]` inside link/image labels (`\\[`). Many Markdown viewers
 * render that literally and break layout.
 */
export function relaxTurndownBracketEscapes(markdown: string): string {
  return markdown.replace(
    /(!?)\[((?:\\.|[^\]])*?)\]\(/g,
    (match, bang, label) => {
      const plain = unescapeBracketEscapesInLabel(label);
      return plain === label ? match : `${bang}[${plain}](`;
    },
  );
}
