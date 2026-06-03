/**
 * Smoke: copy format modules (lib) + element-copier extract/barrels/infra contracts.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const libRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogRoot = join(libRoot, "..");
const copierCopy = join(catalogRoot, "element-copier/src/copy");
const copierElementCopy = join(catalogRoot, "element-copier/src/element-copy");

function escapeCssIdent(value) {
  return value.replace(/([^\w-])/g, "\\$1");
}

function nthChild(element) {
  const parent = element.parentElement;
  if (!parent) return 1;
  return Array.prototype.indexOf.call(parent.children, element) + 1;
}

function siblingDisambiguation(element) {
  const parent = element.parentElement;
  if (!parent) return { needsClassNames: false, needsNthChild: false };

  const tag = element.tagName;
  const ownClasses = Array.from(element.classList ?? []);
  let needsClassNames = false;
  let needsNthChild = false;

  for (const sibling of parent.children) {
    if (sibling === element || sibling.tagName !== tag) continue;

    needsClassNames = true;

    if (ownClasses.length === 0) {
      needsNthChild = true;
      continue;
    }

    let remaining = ownClasses.length;
    for (const cls of sibling.classList ?? []) {
      if (ownClasses.includes(cls)) remaining -= 1;
      if (remaining === 0) {
        needsNthChild = true;
        break;
      }
    }
  }

  return { needsClassNames, needsNthChild };
}

function buildCssSegment(element) {
  if (element.id) return `#${escapeCssIdent(element.id)}`;
  const tag = element.tagName.toLowerCase();
  const { needsClassNames, needsNthChild } = siblingDisambiguation(element);

  if (needsNthChild) {
    return `${tag}:nth-child(${nthChild(element)})`;
  }

  if (needsClassNames && element.classList?.length > 0) {
    const classPart = Array.from(element.classList)
      .map((name) => `.${escapeCssIdent(name)}`)
      .join("");
    return `${tag}${classPart}`;
  }

  return tag;
}

function matchesOnly(selector, element, doc) {
  try {
    const found = doc.querySelectorAll(selector);
    return found.length === 1 && found[0] === element;
  } catch {
    return false;
  }
}

function getCssSelector(element) {
  const doc = element.ownerDocument;
  if (element.id) {
    const byId = `#${escapeCssIdent(element.id)}`;
    if (matchesOnly(byId, element, doc)) return byId;
  }
  const parts = [];
  let node = element;
  while (node && node.nodeType === 1) {
    parts.unshift(buildCssSegment(node));
    const candidate = parts.join(" > ");
    const hasIdAnchor = parts.some((part) => part.startsWith("#"));
    if (
      matchesOnly(candidate, element, doc)
      && (hasIdAnchor || !node.parentElement)
    ) {
      return candidate;
    }
    node = node.parentElement;
  }
  return parts.join(" > ");
}

function xpathSegment(element) {
  const tag = element.tagName.toLowerCase();
  const parent = element.parentElement;
  if (!parent) return tag;

  let sameTagCount = 0;
  for (const child of parent.children) {
    if (child.tagName === element.tagName) sameTagCount += 1;
  }
  if (sameTagCount <= 1) return tag;

  let index = 1;
  for (const child of parent.children) {
    if (child === element) break;
    if (child.tagName === element.tagName) index += 1;
  }
  return `${tag}[${index}]`;
}

function escapeXPathLiteral(value) {
  if (!value.includes('"')) return `"${value}"`;
  if (!value.includes("'")) return `'${value}'`;
  return `'${value.replace(/'/g, "', \"'\", '")}'`;
}

function getXPath(element) {
  if (element.id) {
    return `//*[@id=${escapeXPathLiteral(element.id)}]`;
  }

  const parts = [];
  let node = element;
  while (node) {
    parts.unshift(xpathSegment(node));
    if (node.id && node !== element) {
      const tail = parts.slice(1).join("/");
      return tail
        ? `//*[@id=${escapeXPathLiteral(node.id)}]/${tail}`
        : `//*[@id=${escapeXPathLiteral(node.id)}]`;
    }
    node = node.parentElement;
  }
  return `//${parts.join("/")}`;
}

function escapeJsString(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function getJsPath(element) {
  const selector = getCssSelector(element);
  if (matchesOnly(selector, element, element.ownerDocument)) {
    return `document.querySelector("${escapeJsString(selector)}")`;
  }
  return "document.body";
}

function getFullXPath(element) {
  const parts = [];
  let node = element;
  while (node) {
    parts.unshift(xpathSegment(node));
    node = node.parentElement;
  }
  return `/${parts.join("/")}`;
}

function createMockElement({
  tagName = "DIV",
  id = "",
  classList = [],
  parent = null,
  children = [],
} = {}) {
  const el = {
    nodeType: 1,
    tagName,
    id,
    classList,
    parentElement: parent,
    previousElementSibling: null,
    children,
    ownerDocument: null,
    getAttribute() {
      return null;
    },
  };
  for (let i = 0; i < children.length; i += 1) {
    const child = children[i];
    child.parentElement = el;
    child.ownerDocument = el.ownerDocument;
    if (i > 0) child.previousElementSibling = children[i - 1];
  }
  return el;
}

function createMockDocument(tree) {
  const doc = {
    documentElement: tree,
    body: null,
    querySelectorAll(selector) {
      const all = [];
      walk(tree, (node) => all.push(node));
      return all.filter((node) => matchSelector(node, selector));
    },
  };
  tree.ownerDocument = doc;
  walk(tree, (node) => {
    node.ownerDocument = doc;
  });
  doc.body = findBody(tree);
  return doc;
}

function walk(node, fn) {
  fn(node);
  for (const child of node.children) walk(child, fn);
}

function findBody(root) {
  let found = null;
  walk(root, (node) => {
    if (node.tagName === "BODY") found = node;
  });
  return found;
}

function matchSelector(node, selector) {
  const parts = selector.split(" > ");
  if (parts.length === 1 && selector.startsWith("#")) {
    return node.id === selector.slice(1);
  }
  return matchPath(node, parts);
}

function matchPath(node, parts) {
  if (parts.length === 0) return false;
  const part = parts[parts.length - 1];
  if (!matchSegment(node, part)) return false;
  if (parts.length === 1) return true;
  return node.parentElement && matchPath(node.parentElement, parts.slice(0, -1));
}

function matchSegment(node, part) {
  if (part.startsWith("#")) return node.id === part.slice(1);

  const nthMatch = part.match(/^(\w+):nth-child\((\d+)\)$/);
  if (nthMatch) {
    return (
      node.tagName.toLowerCase() === nthMatch[1]
      && nthChild(node) === Number(nthMatch[2])
    );
  }

  const classMatch = part.match(/^(\w+)((?:\.[^.]+)+)$/);
  if (classMatch) {
    if (node.tagName.toLowerCase() !== classMatch[1]) return false;
    const expected = classMatch[2].slice(1).split(".");
    const actual = Array.from(node.classList ?? []);
    return (
      expected.length === actual.length
      && expected.every((name) => actual.includes(name))
    );
  }

  return node.tagName.toLowerCase() === part;
}

export function runSmokeElementCopyCore() {
  const indexSrc = readFileSync(join(copierCopy, "index.ts"), "utf8");
  const infraSrc = readFileSync(join(copierElementCopy, "index.ts"), "utf8");
  assert.match(indexSrc, /extractElementCopyText/);
  assert.match(indexSrc, /getCssSelector/);
  assert.match(indexSrc, /getFullXPath/);
  assert.doesNotMatch(indexSrc, /element-copy/);
  assert.match(infraSrc, /createStringCache/);
  assert.match(infraSrc, /copyTextToClipboard/);
  assert.doesNotMatch(infraSrc, /copyElementFormatToClipboard/);

  const html = createMockElement({ tagName: "HTML", id: "root" });
  const body = createMockElement({ tagName: "BODY", parent: html, children: [] });
  const div = createMockElement({ tagName: "DIV", parent: body, children: [] });
  const span = createMockElement({
    tagName: "SPAN",
    id: "target",
    parent: div,
    children: [],
  });
  html.children = [body];
  body.children = [div];
  div.children = [span];

  createMockDocument(html);

  assert.equal(getCssSelector(span), "#target");
  assert.equal(getFullXPath(span), "/html/body/div/span");
  assert.equal(getXPath(span), '//*[@id="target"]');
  assert.equal(
    getJsPath(span),
    'document.querySelector("#target")',
  );

  const cnt = createMockElement({
    tagName: "DIV",
    id: "cnt",
    parent: body,
    children: [],
  });
  const siblingDiv = createMockElement({
    tagName: "DIV",
    classList: ["shared"],
    parent: cnt,
    children: [],
  });
  const targetDiv = createMockElement({
    tagName: "DIV",
    classList: ["shared", "unique"],
    parent: cnt,
    children: [],
  });
  body.children = [cnt];
  cnt.children = [siblingDiv, targetDiv];
  createMockDocument(html);

  assert.equal(getCssSelector(targetDiv), "#cnt > div.shared.unique");
  assert.equal(getXPath(targetDiv), '//*[@id="cnt"]/div[2]');
  assert.equal(
    getJsPath(targetDiv),
    'document.querySelector("#cnt > div.shared.unique")',
  );

  const outerDiv = createMockElement({
    tagName: "DIV",
    parent: body,
    children: [],
  });
  const firstInner = createMockElement({
    tagName: "DIV",
    parent: outerDiv,
    children: [],
  });
  const secondInner = createMockElement({
    tagName: "DIV",
    parent: outerDiv,
    children: [],
  });
  body.children = [outerDiv];
  outerDiv.children = [firstInner, secondInner];
  createMockDocument(html);

  assert.equal(getFullXPath(secondInner), "/html/body/div/div[2]");

  console.log("smoke element-copy ok");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSmokeElementCopyCore();
}
