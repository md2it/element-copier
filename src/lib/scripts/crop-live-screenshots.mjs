#!/usr/bin/env node
/**
 * Crop uncut live screenshots to 1280×800 for the Chrome Web Store.
 * Anchor: trim from the left and top; keep the bottom edge (no bottom crop).
 *
 * Run from project root (directory with PUBLICATION/).
 *
 * Input:  PUBLICATION/uncut-live-screenshots/{lang}1.png, {lang}2.png
 * Output: PUBLICATION/{LANG}/live-1.png, live-2.png (24-bit RGB PNG)
 *
 * Usage:
 *   node ../lib/scripts/crop-live-screenshots.mjs
 *   node ../lib/scripts/crop-live-screenshots.mjs ru en
 */
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const scriptDir = dirname(fileURLToPath(import.meta.url));
const libRoot = join(scriptDir, "..");
const { PNG } = require(join(libRoot, "node_modules/pngjs"));

function resolveProjectRoot() {
  const projectRoot = process.cwd();
  if (!existsSync(join(projectRoot, "PUBLICATION"))) {
    console.error("Run from project root (directory containing PUBLICATION/).");
    process.exit(1);
  }
  return projectRoot;
}

const projectRoot = resolveProjectRoot();
const publicationDir = join(projectRoot, "PUBLICATION");
const uncutDir = join(publicationDir, "uncut-live-screenshots");

const OUT_W = 1280;
const OUT_H = 800;

/** Input code (filename) → store listing folder. */
const LANG_DIRS = {
  ru: "RU",
  en: "EN",
  es: "ES",
  fr: "FR",
  de: "DE",
  zn: "ZN",
  ar: "AR",
};

function usage() {
  console.error("Usage: node crop-live-screenshots.mjs [lang ...]");
  console.error("Languages:", Object.keys(LANG_DIRS).join(", "));
  process.exit(1);
}

/**
 * sx = excess width removed from the left; sy = excess height removed from the top.
 * Bottom row of the source stays in the output (sy = srcH - OUT_H).
 */
function cropRect(src) {
  if (src.width < OUT_W || src.height < OUT_H) {
    throw new Error(
      `Image ${src.width}×${src.height} is smaller than required ${OUT_W}×${OUT_H}`,
    );
  }
  const sx = src.width - OUT_W;
  const sy = src.height - OUT_H;
  const dst = new PNG({ width: OUT_W, height: OUT_H, colorType: 2 });
  for (let y = 0; y < OUT_H; y++) {
    for (let x = 0; x < OUT_W; x++) {
      const si = ((sy + y) * src.width + (sx + x)) << 2;
      const di = (OUT_W * y + x) * 3;
      const a = src.data[si + 3] / 255;
      dst.data[di] = Math.round(src.data[si] * a + 255 * (1 - a));
      dst.data[di + 1] = Math.round(src.data[si + 1] * a + 255 * (1 - a));
      dst.data[di + 2] = Math.round(src.data[si + 2] * a + 255 * (1 - a));
    }
  }
  return dst;
}

async function cropFile(srcPath, dstPath) {
  const src = PNG.sync.read(await readFile(srcPath));
  const dst = cropRect(src);
  await writeFile(
    dstPath,
    PNG.sync.write(dst, { colorType: 2, inputColorType: 2 }),
  );
}

async function processLang(code) {
  const langDir = LANG_DIRS[code];
  if (!langDir) usage();

  const inputs = [
    { n: 1, out: "live-1.png" },
    { n: 2, out: "live-2.png" },
  ];

  for (const { n, out } of inputs) {
    const srcPath = join(uncutDir, `${code}${n}.png`);
    const dstPath = join(publicationDir, langDir, out);
    try {
      await cropFile(srcPath, dstPath);
      const src = PNG.sync.read(await readFile(srcPath));
      const sx = src.width - OUT_W;
      const sy = src.height - OUT_H;
      console.log(
        `${code}${n}.png → ${langDir}/${out} (${src.width}×${src.height}, crop sx=${sx} sy=${sy})`,
      );
    } catch (err) {
      if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
        throw new Error(`Missing ${srcPath}`);
      }
      throw err;
    }
  }
}

async function detectLangsFromUncut() {
  const names = await readdir(uncutDir);
  const codes = new Set();
  for (const name of names) {
    const m = /^([a-z]{2})([12])\.png$/i.exec(name);
    if (m) codes.add(m[1].toLowerCase());
  }
  return [...codes].sort();
}

async function main() {
  const args = process.argv.slice(2).map((a) => a.toLowerCase());
  const langs = args.length > 0 ? args : await detectLangsFromUncut();
  if (langs.length === 0) {
    console.error(`No {lang}1.png / {lang}2.png in ${uncutDir}`);
    process.exit(1);
  }

  let failed = false;
  for (const code of langs) {
    try {
      await processLang(code);
    } catch (err) {
      failed = true;
      console.error(`${code}: ${err instanceof Error ? err.message : err}`);
    }
  }
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
