#!/usr/bin/env node
/**
 * Measure how much JS a npm package adds to a browser bundle (esbuild + minify).
 *
 * Usage:
 *   node lib/scripts/measure-bundle-size.mjs <package> [package...]
 *   node lib/scripts/measure-bundle-size.mjs --import <package> '<entry code>'
 *
 * Package must exist in lib/node_modules:
 *   cd lib && npm install <package>
 *
 * "Bundle size" = minified JS that esbuild would inline into dist/*.js (not node_modules folder size).
 */
import { createRequire } from "node:module";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const libRoot = join(scriptDir, "..");
const libNodeModules = join(libRoot, "node_modules");

const require = createRequire(import.meta.url);
const esbuild = require(join(libNodeModules, "esbuild"));

/** Packages that need a non-default import shape. */
const KNOWN_ENTRY = {
  html2canvas: 'import html2canvas from "html2canvas"; export default html2canvas;',
  "modern-screenshot":
    'import * as modernScreenshot from "modern-screenshot"; export default modernScreenshot;',
  turndown: 'import TurndownService from "turndown"; export default TurndownService;',
  "node-html-markdown":
    'import { NodeHtmlMarkdown } from "node-html-markdown"; export default NodeHtmlMarkdown;',
  "html-to-image": 'import * as htmlToImage from "html-to-image"; export default htmlToImage;',
  "dom-to-image-more":
    'import domToImage from "dom-to-image-more"; export default domToImage;',
};

function usage() {
  console.error(`Usage:
  node lib/scripts/measure-bundle-size.mjs <package> [package...]
  node lib/scripts/measure-bundle-size.mjs --import <package> '<entry code>'

Install missing packages:
  cd lib && npm install <package>`);
}

function parseArgs(argv) {
  const packages = [];
  const customImports = new Map();

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    }
    if (arg === "--import") {
      const pkg = argv[i + 1];
      const code = argv[i + 2];
      if (!pkg || !code) {
        console.error("--import requires <package> and <entry code>");
        process.exit(1);
      }
      customImports.set(pkg, code);
      i += 2;
      continue;
    }
    packages.push(arg);
  }

  return { packages, customImports };
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function dirSizeBytes(rootPath) {
  let total = 0;

  function walk(currentPath) {
    let stat;
    try {
      stat = statSync(currentPath);
    } catch {
      return;
    }

    if (stat.isFile()) {
      total += stat.size;
      return;
    }

    if (!stat.isDirectory()) return;

    let entries;
    try {
      entries = readdirSync(currentPath);
    } catch {
      return;
    }

    for (const entry of entries) {
      walk(join(currentPath, entry));
    }
  }

  walk(rootPath);
  return total;
}

function packageFolderSize(packageName) {
  const folder = join(libNodeModules, packageName);
  try {
    statSync(folder);
  } catch {
    return null;
  }
  return dirSizeBytes(folder);
}

function entryAttempts(packageName, customCode) {
  if (customCode) return [customCode];

  const known = KNOWN_ENTRY[packageName];
  const quoted = JSON.stringify(packageName);

  return [
    known,
    `import pkg from ${quoted}; export default pkg;`,
    `import * as pkg from ${quoted}; export default pkg;`,
  ].filter(Boolean);
}

async function measurePackage(packageName, customCode) {
  const packageJsonPath = join(libNodeModules, packageName, "package.json");
  try {
    readFileSync(packageJsonPath);
  } catch {
    throw new Error(
      `Package "${packageName}" not found in lib/node_modules.\n  Install: cd lib && npm install ${packageName}`,
    );
  }

  const tmpDir = mkdtempSync(join(tmpdir(), "measure-bundle-"));
  const entryPath = join(tmpDir, "entry.mjs");

  try {
    let lastError;

    for (const code of entryAttempts(packageName, customCode)) {
      writeFileSync(entryPath, code, "utf8");

      try {
        const result = await esbuild.build({
          entryPoints: [entryPath],
          bundle: true,
          minify: true,
          platform: "browser",
          target: "es2022",
          format: "esm",
          write: false,
          logLevel: "silent",
          nodePaths: [libNodeModules],
        });

        const text = result.outputFiles[0].text;
        const minifiedBytes = Buffer.byteLength(text, "utf8");
        const gzipBytes = gzipSync(text).length;
        const onDiskBytes = packageFolderSize(packageName);

        return {
          packageName,
          importUsed: code,
          minifiedBytes,
          gzipBytes,
          onDiskBytes,
        };
      } catch (error) {
        lastError = error;
      }
    }

    throw new Error(
      `Could not bundle "${packageName}". Try a custom entry:\n` +
        `  node lib/scripts/measure-bundle-size.mjs --import ${packageName} 'import ... from "${packageName}"; export default ...;'`,
      { cause: lastError },
    );
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

function printResult(result) {
  console.log(result.packageName);
  console.log(`  bundle (minified): ${formatKb(result.minifiedBytes)}  ← goes into dist/*.js`);
  console.log(`  bundle (gzip):     ${formatKb(result.gzipBytes)}`);
  if (result.onDiskBytes != null) {
    console.log(`  package on disk:   ${formatKb(result.onDiskBytes)}  ← lib/node_modules only, not full dist`);
  }
  console.log(`  import used:       ${result.importUsed.replace(/\s+/g, " ")}`);
  console.log("");
}

const { packages, customImports } = parseArgs(process.argv.slice(2));

if (packages.length === 0) {
  usage();
  process.exit(1);
}

let failed = false;

for (const packageName of packages) {
  try {
    const result = await measurePackage(packageName, customImports.get(packageName));
    printResult(result);
  } catch (error) {
    failed = true;
    console.error(error instanceof Error ? error.message : String(error));
    console.error("");
  }
}

process.exit(failed ? 1 : 0);
