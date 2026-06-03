#!/usr/bin/env node
/**
 * Minify extension staging tree before zip (prod-only).
 * Dev bundles from scripts/build.mjs stay readable in the project root.
 *
 * Usage: node minify-extension.mjs <staging-dir>
 */
import { createRequire } from "node:module";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compactCssText, compactSvgText } from "./compact-text.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const libRoot = join(scriptDir, "..");

const require = createRequire(import.meta.url);
const esbuild = require(join(libRoot, "node_modules/esbuild"));

/** @param {string} dir @param {(abs: string) => void} visit */
function walkFiles(dir, visit) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".")) continue;
    const abs = join(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) walkFiles(abs, visit);
    else visit(abs);
  }
}

/** @param {string} abs */
function minifyJsFile(abs) {
  const code = readFileSync(abs, "utf8");
  const result = esbuild.transformSync(code, {
    loader: "js",
    minify: true,
    target: "es2022",
    legalComments: "none",
  });
  writeFileSync(abs, result.code);
}

/**
 * @param {string} stagingDir
 * @returns {{ js: number, css: number, svg: number }}
 */
export function minifyExtensionStaging(stagingDir) {
  const counts = { js: 0, css: 0, svg: 0 };

  walkFiles(stagingDir, (abs) => {
    const lower = abs.toLowerCase();
    if (lower.endsWith(".js")) {
      minifyJsFile(abs);
      counts.js++;
      return;
    }
    if (lower.endsWith(".css")) {
      writeFileSync(abs, compactCssText(readFileSync(abs, "utf8")));
      counts.css++;
      return;
    }
    if (lower.endsWith(".svg")) {
      writeFileSync(abs, compactSvgText(readFileSync(abs, "utf8")));
      counts.svg++;
    }
  });

  return counts;
}

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  const stagingDir = process.argv[2];
  if (!stagingDir) {
    console.error("Usage: minify-extension.mjs <staging-dir>");
    process.exit(1);
  }

  const counts = minifyExtensionStaging(stagingDir);
  console.log(
    `minify staging: ${counts.js} js, ${counts.css} css, ${counts.svg} svg`,
  );
}
