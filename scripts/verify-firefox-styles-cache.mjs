import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const stylesSource = readFileSync(
  new URL("../extension/lib/our/copy/styles.js", import.meta.url),
  "utf8"
);
const cacheSource = readFileSync(
  new URL("../extension/app/pick-mode/pick-copy-cache.js", import.meta.url),
  "utf8"
);
const manifest = JSON.parse(
  readFileSync(new URL("../extension/manifest.json", import.meta.url), "utf8")
);
const changelog = readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8");

assert.equal(manifest.version, "1.1.4", "manifest PATCH version must be 1.1.4");
assert.match(changelog, /### 1\.1\.4/, "CHANGELOG must include release 1.1.4");
assert.match(
  changelog,
  /bugzilla\.mozilla\.org\/show_bug\.cgi\?id=1770592/,
  "CHANGELOG 1.1.4 must cite Firefox bug 1770592"
);

assert.doesNotMatch(
  stylesSource,
  /for\s*\(\s*const\s+\w+\s+of\s+adoptedSheets\s*\)/,
  "styles.js must not for...of adoptedStyleSheets (Firefox bug 1770592)"
);
assert.match(
  stylesSource,
  /for\s*\(\s*let\s+i\s*=\s*0;\s*i\s*<\s*adoptedSheets\.length/,
  "styles.js must iterate adoptedStyleSheets by index"
);
assert.match(
  stylesSource,
  /1770592/,
  "styles.js should document the Firefox bug id"
);

assert.match(
  cacheSource,
  /format snapshot failed:\s*",\s*formatId/,
  "pick-copy-cache must log failing format id"
);
assert.match(
  cacheSource,
  /for\s*\(\s*const\s+formatId\s+of\s+prioritizeSnapshotFormats[\s\S]*?try\s*\{[\s\S]*?\}\s*catch\s*\(\s*error\s*\)/,
  "each format snapshot must be wrapped in try/catch"
);

globalThis.ShadowRoot ??= class ShadowRoot {};

const stylesUrl = new URL("../extension/lib/our/copy/styles.js", import.meta.url).href;
const { collectStylesheetContext } = await import(`${stylesUrl}?t=${Date.now()}`);

function makeNonIterableAdoptedSheets(sheets) {
  const list = {
    length: sheets.length,
    [Symbol.iterator]() {
      throw new TypeError("adoptedSheets is not iterable");
    }
  };
  for (let i = 0; i < sheets.length; i += 1) {
    list[i] = sheets[i];
  }
  return list;
}

const fakeSheet = { cssRules: [], ownerNode: {}, href: null };
const fakeDoc = {
  styleSheets: { length: 0 },
  adoptedStyleSheets: makeNonIterableAdoptedSheets([fakeSheet])
};
const fakeElement = {
  ownerDocument: fakeDoc,
  parentNode: null
};

const context = collectStylesheetContext(fakeElement);
assert.equal(context.sheets.length, 1, "indexed adopted sheets must still be collected");
assert.equal(context.adopted.has(fakeSheet), true, "adopted set must include indexed sheets");

const emptyDoc = {
  styleSheets: { length: 0 },
  get adoptedStyleSheets() {
    throw new TypeError("adoptedStyleSheets unavailable");
  }
};
const emptyContext = collectStylesheetContext({
  ownerDocument: emptyDoc,
  parentNode: null
});
assert.equal(emptyContext.sheets.length, 0, "getter failure must not throw");

console.log("firefox styles + pick-copy-cache isolation checks passed");
