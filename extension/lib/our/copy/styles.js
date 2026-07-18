var INHERITABLE_PROPERTIES = /* @__PURE__ */ new Set([
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
  "-webkit-text-size-adjust"
]);

function getElementStyles(element) {
  const context = collectStylesheetContext(element);
  let order = 0;
  const inherited = /* @__PURE__ */ new Map();
  for (const ancestor of getAncestorsRootFirst(element)) {
    order = collectMatchingRules(ancestor, context, inherited, order, isInheritableProperty);
  }
  const own = /* @__PURE__ */ new Map();
  order = collectMatchingRules(element, context, own, order, () => true);
  collectInlineStyles(element, own, order);
  const merged = new Map(inherited);
  for (const [name, entry] of own) {
    setCascadeProperty(merged, name, entry);
  }
  const output = /* @__PURE__ */ new Map();
  for (const [name, entry] of merged) {
    output.set(name, formatValue(entry));
  }
  collapseShorthands(output);
  return Array.from(output.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([prop, value]) => `${prop}: ${value};`).join("\n");
}

function isInheritableProperty(name) {
  if (name.startsWith("--")) return true;
  return INHERITABLE_PROPERTIES.has(name);
}

function getAncestorsRootFirst(element) {
  const ancestors = [];
  let parent = element.parentElement;
  while (parent) {
    ancestors.unshift(parent);
    parent = parent.parentElement;
  }
  return ancestors;
}

function collectStylesheetContext(element) {
  const sheets = [];
  const seen = /* @__PURE__ */ new Set();
  const adopted = /* @__PURE__ */ new Set();
  const addSheet = (sheet) => {
    if (!sheet || seen.has(sheet)) return;
    seen.add(sheet);
    sheets.push(sheet);
  };
  const addAdoptedFromRoot = (root2) => {
    // Firefox content scripts: for...of on adoptedStyleSheets can throw
    // TypeError: adoptedSheets is not iterable (bug 1770592).
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1770592
    // Indexed access matches doc.styleSheets handling and works in Chrome.
    let adoptedSheets;
    try {
      adoptedSheets = root2.adoptedStyleSheets;
    } catch {
      return;
    }
    if (!adoptedSheets) return;
    try {
      for (let i = 0; i < adoptedSheets.length; i += 1) {
        const sheet = adoptedSheets[i] ?? null;
        if (sheet) adopted.add(sheet);
        addSheet(sheet);
      }
    } catch {
      // Skip adopted sheets when the host exposes a non-usable list.
    }
  };
  const doc = element.ownerDocument;
  for (let i = 0; i < doc.styleSheets.length; i += 1) {
    addSheet(doc.styleSheets[i] ?? null);
  }
  addAdoptedFromRoot(doc);
  let node = element;
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

function isAuthorStylesheet(sheet, adopted) {
  if (adopted.has(sheet)) return true;
  if (sheet.ownerNode) return true;
  if (sheet.href) return true;
  return false;
}

function collectMatchingRules(target, context, properties2, order, includeProperty) {
  for (const sheet of context.sheets) {
    if (!isAuthorStylesheet(sheet, context.adopted)) continue;
    order = walkStylesheetRules(
      sheet,
      target,
      (rule, ruleOrder) => {
        const matchedSelector = findMatchingSelector(target, rule.selectorText);
        if (!matchedSelector) return;
        applyStyleDeclarations(rule.style, properties2, {
          specificity: calculateSpecificity(matchedSelector),
          order: ruleOrder,
          isInline: false,
          includeProperty
        });
      },
      order
    );
  }
  return order;
}

function collectInlineStyles(element, properties2, order) {
  if (!(element instanceof HTMLElement)) return;
  const inline = element.style;
  for (let i = 0; i < inline.length; i += 1) {
    const name = inline.item(i);
    if (!name) continue;
    const value = inline.getPropertyValue(name);
    if (!value) continue;
    setCascadeProperty(properties2, name, {
      value,
      important: inline.getPropertyPriority(name) === "important",
      specificity: 0,
      order,
      isInline: true
    });
    order += 1;
  }
}

function walkStylesheetRules(sheet, element, onStyleRule, order) {
  let rules2;
  try {
    rules2 = sheet.cssRules;
  } catch {
    return order;
  }
  for (let i = 0; i < rules2.length; i += 1) {
    order = walkRule(rules2[i], element, onStyleRule, order, true);
  }
  return order;
}

function isMediaRule(rule) {
  return rule.type === CSSRule.MEDIA_RULE;
}

function isSupportsRule(rule) {
  return rule.type === CSSRule.SUPPORTS_RULE;
}

function isContainerRule(rule) {
  if (typeof CSSContainerRule !== "undefined" && rule instanceof CSSContainerRule) return true;
  return rule.constructor.name === "CSSContainerRule";
}

function doesMediaMatch(rule, element) {
  const view = element.ownerDocument.defaultView;
  if (!view) return false;
  const ruleMatches = rule.matches;
  if (typeof ruleMatches === "boolean") return ruleMatches;
  const mediaText = rule.media?.mediaText;
  if (!mediaText) return true;
  const listMatches = rule.media.matches;
  if (typeof listMatches === "boolean") return listMatches;
  return view.matchMedia(mediaText).matches;
}

function doesSupportsMatch(rule) {
  const ruleMatches = rule.matches;
  if (typeof ruleMatches === "boolean") return ruleMatches;
  const condition = rule.conditionText;
  if (!condition) return false;
  if (typeof CSS === "undefined" || typeof CSS.supports !== "function") return false;
  return CSS.supports(condition);
}

function findNamedContainer(element, name) {
  const view = element.ownerDocument.defaultView;
  if (!view) return null;
  let current = element;
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

function evaluateContainerQuery(queryText, containerEl) {
  const width = containerEl.getBoundingClientRect().width;
  const minMatch = queryText.match(/\(min-width:\s*([\d.]+)px\)/);
  if (minMatch) return width >= Number.parseFloat(minMatch[1]);
  const maxMatch = queryText.match(/\(max-width:\s*([\d.]+)px\)/);
  if (maxMatch) return width <= Number.parseFloat(maxMatch[1]);
  return false;
}

function doesContainerMatch(rule, element) {
  const ruleMatches = rule.matches;
  if (typeof ruleMatches === "boolean") return ruleMatches;
  const query = rule.containerQuery;
  if (typeof query === "object" && query !== null && typeof query.matches === "boolean") {
    return query.matches;
  }
  const queryText = typeof query === "string" ? query : String(query);
  const containerEl = findNamedContainer(element, rule.containerName ?? "");
  if (!containerEl) return false;
  return evaluateContainerQuery(queryText, containerEl);
}

function isGroupingRuleActive(rule, parentActive, element) {
  if (!parentActive) return false;
  if (isMediaRule(rule)) return doesMediaMatch(rule, element);
  if (isContainerRule(rule)) return doesContainerMatch(rule, element);
  if (isSupportsRule(rule)) return doesSupportsMatch(rule);
  return true;
}

function walkRule(rule, element, onStyleRule, order, active) {
  if (rule.type === CSSRule.STYLE_RULE) {
    if (!active) return order;
    onStyleRule(rule, order);
    return order + 1;
  }
  const grouping = rule;
  if (grouping.cssRules) {
    const childActive = isGroupingRuleActive(rule, active, element);
    for (let i = 0; i < grouping.cssRules.length; i += 1) {
      order = walkRule(grouping.cssRules[i], element, onStyleRule, order, childActive);
    }
  }
  return order;
}

function findMatchingSelector(element, selectorText) {
  if (!selectorText) return null;
  const selectors = selectorText.split(",").map((part) => part.trim()).filter(Boolean);
  let best = null;
  for (const selector of selectors) {
    try {
      if (!element.matches(selector)) continue;
      const specificity = calculateSpecificity(selector);
      if (!best || specificity >= best.specificity) {
        best = { selector, specificity };
      }
    } catch {
    }
  }
  return best?.selector ?? null;
}

function calculateSpecificity(selector) {
  const withoutPseudoElements = selector.replace(/::[\w-]+/g, "");
  const ids = withoutPseudoElements.match(/#[\w-]+/g)?.length ?? 0;
  const classes = withoutPseudoElements.match(/(\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+(?:\([^)]*\))?)/g)?.length ?? 0;
  let elements = 0;
  const parts = selector.split(/[\s>+~]/).filter(Boolean);
  for (const part of parts) {
    const tag = part.replace(/(\.[\w-]+|#[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+(?:\([^)]*\))?|::[\w-]+)/g, "");
    if (/^([a-zA-Z][\w-]*|\*)/.test(tag.trim())) elements += 1;
  }
  elements += selector.match(/::[\w-]+/g)?.length ?? 0;
  return ids * 1e4 + classes * 100 + elements;
}

function applyStyleDeclarations(style, properties2, context) {
  for (let i = 0; i < style.length; i += 1) {
    const name = style.item(i);
    if (!name || !context.includeProperty(name)) continue;
    const value = style.getPropertyValue(name);
    if (!value) continue;
    setCascadeProperty(properties2, name, {
      value,
      important: style.getPropertyPriority(name) === "important",
      specificity: context.specificity,
      order: context.order,
      isInline: context.isInline
    });
  }
}

function setCascadeProperty(properties2, name, next2) {
  const current = properties2.get(name);
  if (!current || cascadeEntryWins(next2, current)) {
    properties2.set(name, next2);
  }
}

function cascadeEntryWins(next2, current) {
  if (next2.important !== current.important) return next2.important;
  if (next2.isInline !== current.isInline) return next2.isInline;
  if (next2.specificity !== current.specificity) return next2.specificity > current.specificity;
  return next2.order >= current.order;
}

function formatValue(entry) {
  return entry.important ? `${entry.value} !important` : entry.value;
}

function collapseShorthands(properties2) {
  collapseBoxShorthand(properties2, "padding");
  collapseBoxShorthand(properties2, "margin");
  collapseOverflow(properties2);
  collapseWhiteSpace(properties2);
}

function collapseBoxShorthand(properties2, prefix) {
  if (properties2.has(prefix)) return;
  const top = properties2.get(`${prefix}-top`);
  const right = properties2.get(`${prefix}-right`);
  const bottom = properties2.get(`${prefix}-bottom`);
  const left = properties2.get(`${prefix}-left`);
  if (top === void 0 || right === void 0 || bottom === void 0 || left === void 0) {
    return;
  }
  let shorthand;
  if (top === right && right === bottom && bottom === left) {
    shorthand = top;
  } else if (top === bottom && right === left) {
    shorthand = `${top} ${right}`;
  } else if (right === left) {
    shorthand = `${top} ${right} ${bottom}`;
  } else {
    shorthand = `${top} ${right} ${bottom} ${left}`;
  }
  properties2.delete(`${prefix}-top`);
  properties2.delete(`${prefix}-right`);
  properties2.delete(`${prefix}-bottom`);
  properties2.delete(`${prefix}-left`);
  properties2.set(prefix, shorthand);
}

function collapseOverflow(properties2) {
  if (properties2.has("overflow")) return;
  const x = properties2.get("overflow-x");
  const y = properties2.get("overflow-y");
  if (x === void 0 || y === void 0) return;
  properties2.delete("overflow-x");
  properties2.delete("overflow-y");
  properties2.set("overflow", x === y ? x : `${x} ${y}`);
}

var WHITE_SPACE_LONGHANDS = {
  "collapse|nowrap": "nowrap",
  "collapse|wrap": "normal",
  "preserve|wrap": "pre-wrap",
  "preserve|nowrap": "pre",
  "preserve-breaks|wrap": "pre-line",
  "collapse|balance": "balance"
};

function collapseWhiteSpace(properties2) {
  if (properties2.has("white-space")) return;
  const collapse = properties2.get("white-space-collapse");
  const wrap = properties2.get("text-wrap-mode");
  if (!collapse || !wrap) return;
  const shorthand = WHITE_SPACE_LONGHANDS[`${collapse}|${wrap}`];
  if (!shorthand) return;
  properties2.delete("white-space-collapse");
  properties2.delete("text-wrap-mode");
  properties2.set("white-space", shorthand);
}

export { INHERITABLE_PROPERTIES, WHITE_SPACE_LONGHANDS, applyStyleDeclarations, calculateSpecificity, cascadeEntryWins, collapseBoxShorthand, collapseOverflow, collapseShorthands, collapseWhiteSpace, collectInlineStyles, collectMatchingRules, collectStylesheetContext, doesContainerMatch, doesMediaMatch, doesSupportsMatch, evaluateContainerQuery, findMatchingSelector, findNamedContainer, formatValue, getAncestorsRootFirst, getElementStyles, isAuthorStylesheet, isContainerRule, isGroupingRuleActive, isInheritableProperty, isMediaRule, isSupportsRule, setCascadeProperty, walkRule, walkStylesheetRules };
