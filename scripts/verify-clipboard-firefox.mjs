import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const manifest = JSON.parse(
  readFileSync(new URL("../extension/manifest.json", import.meta.url), "utf8")
);
assert.ok(
  Array.isArray(manifest.permissions) && manifest.permissions.includes("clipboardWrite"),
  "manifest must request clipboardWrite so Firefox can copy after async pick/cache work"
);

const clipboardSource = readFileSync(
  new URL("../extension/app/element-copy/clipboard.js", import.meta.url),
  "utf8"
);
assert.match(
  clipboardSource,
  /isSecureContext === false/,
  "plain-text copy must prefer execCommand on insecure pages (Firefox content scripts on http:)"
);
assert.match(
  clipboardSource,
  /Promise\.resolve/,
  "ClipboardItem values must be Promise-wrapped for older Firefox"
);

const formattedSource = readFileSync(
  new URL("../extension/lib/our/copy/formatted-text/clipboard.js", import.meta.url),
  "utf8"
);
assert.match(
  formattedSource,
  /isSecureContext === false/,
  "formatted copy must prefer legacy execCommand on insecure pages"
);
assert.match(
  formattedSource,
  /Promise\.resolve\(new Blob/,
  "formatted ClipboardItem blobs must be Promise-wrapped for Firefox"
);

console.log("firefox clipboard fix checks passed");
