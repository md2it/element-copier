/**
 * Author/cascade styles via DOM/CSSOM: inline + stylesheet rules with cascade,
 * inherited properties from ancestors, conditional grouping rules, and DevTools-like shorthand output.
 * Distinct from computed styles (`getElementComputedStyles`).
 */

const INHERITABLE_PROPERTIES = new Set([
  "azimuth",
  "border-collapse",
  "border-spacing",
  "caption-side",
  "color",
  "cursor",
  "direction",
  "elevation",
  "empty-cells",
  "font",
  "font-family",
  "font-size",
  "font-style",
  "font-variant",
  "font-weight",
  "letter-spacing",
  "line-height",
  "list-style",
  "list-style-image",
  "list-style-position",
  "list-style-type",
  "orphans",
  "quotes",
  "tab-size",
  "text-align",
  "text-indent",
  "text-size-adjust",
  "text-transform",
  "visibility",
  "white-space",
  "widows",
  "word-spacing",
  "writing-mode",
  "-webkit-font-smoothing",
  "-webkit-text-size-adjust",
]);

interface CascadeEntry {
  value: string;
  important: boolean;
  specificity: number;
  order: number;
  isInline: boolean;
}

interface StylesheetContext {
  sheets: CSSStyleSheet[];
  adopted: Set<CSSStyleSheet>;
}

export function getElementStyles(element: Element): string {
  const context = collectStylesheetContext(element);
  let order = 0;

  const inherited = new Map<string, CascadeEntry>();
  for (const ancestor of getAncestorsRootFirst(element)) {
    order = collectMatchingRules(ancestor, context, inherited, order, isInheritableProperty);
  }

  const own = new Map<string, CascadeEntry>();
  order = collectMatchingRules(element, context, own, order, () => true);
  collectInlineStyles(element, own, order);

  const merged = new Map<string, CascadeEntry>(inherited);
  for (const [name, entry] of own) {
    setCascadeProperty(merged, name, entry);
  }

  const output = new Map<string, string>();
  for (const [name, entry] of merged) {
    output.set(name, formatValue(entry));
  }

  collapseShorthands(output);

  return Array.from(output.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([prop, value]) => `${prop}: ${value};`)
    .join("\n");
}

function isInheritableProperty(name: string): boolean {
  if (name.startsWith("--")) return true;
  return INHERITABLE_PROPERTIES.has(name);
}

function getAncestorsRootFirst(element: Element): Element[] {
  const ancestors: Element[] = [];
  let parent = element.parentElement;
  while (parent) {
    ancestors.unshift(parent);
    parent = parent.parentElement;
  }
  return ancestors;
}

function collectStylesheetContext(element: Element): StylesheetContext {
  const sheets: CSSStyleSheet[] = [];
  const seen = new Set<CSSStyleSheet>();
  const adopted = new Set<CSSStyleSheet>();

  const addSheet = (sheet: CSSStyleSheet | null | undefined): void => {
    if (!sheet || seen.has(sheet)) return;
    seen.add(sheet);
    sheets.push(sheet);
  };

  const addAdoptedFromRoot = (root: Document | ShadowRoot): void => {
    const adoptedSheets = root.adoptedStyleSheets;
    if (!adoptedSheets) return;
    for (const sheet of adoptedSheets) {
      adopted.add(sheet);
      addSheet(sheet);
    }
  };

  const doc = element.ownerDocument;
  for (let i = 0; i < doc.styleSheets.length; i += 1) {
    addSheet(doc.styleSheets[i] ?? null);
  }
  addAdoptedFromRoot(doc);

  let node: Node | null = element;
  while (node) {
    if (node instanceof ShadowRoot) {
      addAdoptedFromRoot(node);
      const styleElements = node.querySelectorAll("style");
      for (let j = 0; j < styleElements.length; j += 1) {
        addSheet(styleElements[j]?.sheet ?? null);
      }
    }
    node = node.parentNode;
  }

  return { sheets, adopted };
}

function isAuthorStylesheet(sheet: CSSStyleSheet, adopted: Set<CSSStyleSheet>): boolean {
  if (adopted.has(sheet)) return true;
  if (sheet.ownerNode) return true;
  if (sheet.href) return true;
  return false;
}

function collectMatchingRules(
  target: Element,
  context: StylesheetContext,
  properties: Map<string, CascadeEntry>,
  order: number,
  includeProperty: (name: string) => boolean,
): number {
  for (const sheet of context.sheets) {
    if (!isAuthorStylesheet(sheet, context.adopted)) continue;
    order = walkStylesheetRules(
      sheet,
      target,
      (rule, ruleOrder) => {
        const matchedSelector = findMatchingSelector(target, rule.selectorText);
        if (!matchedSelector) return;
        applyStyleDeclarations(rule.style, properties, {
          specificity: calculateSpecificity(matchedSelector),
          order: ruleOrder,
          isInline: false,
          includeProperty,
        });
      },
      order,
    );
  }
  return order;
}

function collectInlineStyles(
  element: Element,
  properties: Map<string, CascadeEntry>,
  order: number,
): void {
  if (!(element instanceof HTMLElement)) return;

  const inline = element.style;
  for (let i = 0; i < inline.length; i += 1) {
    const name = inline.item(i);
    if (!name) continue;
    const value = inline.getPropertyValue(name);
    if (!value) continue;
    setCascadeProperty(properties, name, {
      value,
      important: inline.getPropertyPriority(name) === "important",
      specificity: 0,
      order,
      isInline: true,
    });
    order += 1;
  }
}

function walkStylesheetRules(
  sheet: CSSStyleSheet,
  element: Element,
  onStyleRule: (rule: CSSStyleRule, order: number) => void,
  order: number,
): number {
  let rules: CSSRuleList;
  try {
    rules = sheet.cssRules;
  } catch {
    return order;
  }

  for (let i = 0; i < rules.length; i += 1) {
    order = walkRule(rules[i], element, onStyleRule, order, true);
  }
  return order;
}

function isMediaRule(rule: CSSRule): rule is CSSMediaRule {
  return rule.type === CSSRule.MEDIA_RULE;
}

function isSupportsRule(rule: CSSRule): rule is CSSSupportsRule {
  return rule.type === CSSRule.SUPPORTS_RULE;
}

function isContainerRule(rule: CSSRule): rule is CSSContainerRule {
  if (typeof CSSContainerRule !== "undefined" && rule instanceof CSSContainerRule) return true;
  return rule.constructor.name === "CSSContainerRule";
}

function doesMediaMatch(rule: CSSMediaRule, element: Element): boolean {
  const view = element.ownerDocument.defaultView;
  if (!view) return false;

  const ruleMatches = (rule as CSSMediaRule & { matches?: boolean }).matches;
  if (typeof ruleMatches === "boolean") return ruleMatches;

  const mediaText = rule.media?.mediaText;
  if (!mediaText) return true;

  const listMatches = (rule.media as MediaList & { matches?: boolean }).matches;
  if (typeof listMatches === "boolean") return listMatches;

  return view.matchMedia(mediaText).matches;
}

function doesSupportsMatch(rule: CSSSupportsRule): boolean {
  const ruleMatches = (rule as CSSSupportsRule & { matches?: boolean }).matches;
  if (typeof ruleMatches === "boolean") return ruleMatches;

  const condition = rule.conditionText;
  if (!condition) return false;
  if (typeof CSS === "undefined" || typeof CSS.supports !== "function") return false;

  return CSS.supports(condition);
}

function findNamedContainer(element: Element, name: string): Element | null {
  const view = element.ownerDocument.defaultView;
  if (!view) return null;

  let current: Element | null = element;
  while (current) {
    const style = view.getComputedStyle(current);
    const names = style.containerName.split(",").map((part) => part.trim()).filter(Boolean);
    const type = style.containerType;
    const isContainer = type !== "" && type !== "normal";
    if (isContainer && (name === "" || names.includes(name))) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

function evaluateContainerQuery(queryText: string, containerEl: Element): boolean {
  const width = containerEl.getBoundingClientRect().width;
  const minMatch = queryText.match(/\(min-width:\s*([\d.]+)px\)/);
  if (minMatch) return width >= Number.parseFloat(minMatch[1]);
  const maxMatch = queryText.match(/\(max-width:\s*([\d.]+)px\)/);
  if (maxMatch) return width <= Number.parseFloat(maxMatch[1]);
  return false;
}

function doesContainerMatch(rule: CSSContainerRule, element: Element): boolean {
  const ruleMatches = (rule as CSSContainerRule & { matches?: boolean }).matches;
  if (typeof ruleMatches === "boolean") return ruleMatches;

  const query = rule.containerQuery as { matches?: boolean } | string;
  if (typeof query === "object" && query !== null && typeof query.matches === "boolean") {
    return query.matches;
  }

  const queryText = typeof query === "string" ? query : String(query);
  const containerEl = findNamedContainer(element, rule.containerName ?? "");
  if (!containerEl) return false;

  return evaluateContainerQuery(queryText, containerEl);
}

function isGroupingRuleActive(rule: CSSRule, parentActive: boolean, element: Element): boolean {
  if (!parentActive) return false;
  if (isMediaRule(rule)) return doesMediaMatch(rule, element);
  if (isContainerRule(rule)) return doesContainerMatch(rule, element);
  if (isSupportsRule(rule)) return doesSupportsMatch(rule);
  return true;
}

function walkRule(
  rule: CSSRule,
  element: Element,
  onStyleRule: (rule: CSSStyleRule, order: number) => void,
  order: number,
  active: boolean,
): number {
  if (rule.type === CSSRule.STYLE_RULE) {
    if (!active) return order;
    onStyleRule(rule as CSSStyleRule, order);
    return order + 1;
  }

  const grouping = rule as CSSGroupingRule;
  if (grouping.cssRules) {
    const childActive = isGroupingRuleActive(rule, active, element);
    for (let i = 0; i < grouping.cssRules.length; i += 1) {
      order = walkRule(grouping.cssRules[i], element, onStyleRule, order, childActive);
    }
  }
  return order;
}

function findMatchingSelector(element: Element, selectorText: string): string | null {
  if (!selectorText) return null;

  const selectors = selectorText.split(",").map((part) => part.trim()).filter(Boolean);
  let best: { selector: string; specificity: number } | null = null;

  for (const selector of selectors) {
    try {
      if (!element.matches(selector)) continue;
      const specificity = calculateSpecificity(selector);
      if (!best || specificity >= best.specificity) {
        best = { selector, specificity };
      }
    } catch {
      // Unsupported or invalid selector for this element.
    }
  }

  return best?.selector ?? null;
}

function calculateSpecificity(selector: string): number {
  const withoutPseudoElements = selector.replace(/::[\w-]+/g, "");
  const ids = withoutPseudoElements.match(/#[\w-]+/g)?.length ?? 0;
  const classes =
    withoutPseudoElements.match(/(\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+(?:\([^)]*\))?)/g)?.length ?? 0;

  let elements = 0;
  const parts = selector.split(/[\s>+~]/).filter(Boolean);
  for (const part of parts) {
    const tag = part.replace(/(\.[\w-]+|#[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+(?:\([^)]*\))?|::[\w-]+)/g, "");
    if (/^([a-zA-Z][\w-]*|\*)/.test(tag.trim())) elements += 1;
  }
  elements += selector.match(/::[\w-]+/g)?.length ?? 0;

  return ids * 10_000 + classes * 100 + elements;
}

function applyStyleDeclarations(
  style: CSSStyleDeclaration,
  properties: Map<string, CascadeEntry>,
  context: {
    specificity: number;
    order: number;
    isInline: boolean;
    includeProperty: (name: string) => boolean;
  },
): void {
  for (let i = 0; i < style.length; i += 1) {
    const name = style.item(i);
    if (!name || !context.includeProperty(name)) continue;
    const value = style.getPropertyValue(name);
    if (!value) continue;
    setCascadeProperty(properties, name, {
      value,
      important: style.getPropertyPriority(name) === "important",
      specificity: context.specificity,
      order: context.order,
      isInline: context.isInline,
    });
  }
}

function setCascadeProperty(
  properties: Map<string, CascadeEntry>,
  name: string,
  next: CascadeEntry,
): void {
  const current = properties.get(name);
  if (!current || cascadeEntryWins(next, current)) {
    properties.set(name, next);
  }
}

function cascadeEntryWins(next: CascadeEntry, current: CascadeEntry): boolean {
  if (next.important !== current.important) return next.important;
  if (next.isInline !== current.isInline) return next.isInline;
  if (next.specificity !== current.specificity) return next.specificity > current.specificity;
  return next.order >= current.order;
}

function formatValue(entry: CascadeEntry): string {
  return entry.important ? `${entry.value} !important` : entry.value;
}

function collapseShorthands(properties: Map<string, string>): void {
  collapseBoxShorthand(properties, "padding");
  collapseBoxShorthand(properties, "margin");
  collapseOverflow(properties);
  collapseWhiteSpace(properties);
}

function collapseBoxShorthand(properties: Map<string, string>, prefix: "padding" | "margin"): void {
  if (properties.has(prefix)) return;

  const top = properties.get(`${prefix}-top`);
  const right = properties.get(`${prefix}-right`);
  const bottom = properties.get(`${prefix}-bottom`);
  const left = properties.get(`${prefix}-left`);
  if (top === undefined || right === undefined || bottom === undefined || left === undefined) {
    return;
  }

  let shorthand: string;
  if (top === right && right === bottom && bottom === left) {
    shorthand = top;
  } else if (top === bottom && right === left) {
    shorthand = `${top} ${right}`;
  } else if (right === left) {
    shorthand = `${top} ${right} ${bottom}`;
  } else {
    shorthand = `${top} ${right} ${bottom} ${left}`;
  }

  properties.delete(`${prefix}-top`);
  properties.delete(`${prefix}-right`);
  properties.delete(`${prefix}-bottom`);
  properties.delete(`${prefix}-left`);
  properties.set(prefix, shorthand);
}

function collapseOverflow(properties: Map<string, string>): void {
  if (properties.has("overflow")) return;

  const x = properties.get("overflow-x");
  const y = properties.get("overflow-y");
  if (x === undefined || y === undefined) return;

  properties.delete("overflow-x");
  properties.delete("overflow-y");
  properties.set("overflow", x === y ? x : `${x} ${y}`);
}

const WHITE_SPACE_LONGHANDS: Record<string, string> = {
  "collapse|nowrap": "nowrap",
  "collapse|wrap": "normal",
  "preserve|wrap": "pre-wrap",
  "preserve|nowrap": "pre",
  "preserve-breaks|wrap": "pre-line",
  "collapse|balance": "balance",
};

function collapseWhiteSpace(properties: Map<string, string>): void {
  if (properties.has("white-space")) return;

  const collapse = properties.get("white-space-collapse");
  const wrap = properties.get("text-wrap-mode");
  if (!collapse || !wrap) return;

  const shorthand = WHITE_SPACE_LONGHANDS[`${collapse}|${wrap}`];
  if (!shorthand) return;

  properties.delete("white-space-collapse");
  properties.delete("text-wrap-mode");
  properties.set("white-space", shorthand);
}
