#!/usr/bin/env node
/**
 * Rasterize toolbar icons for manifest from project entry (canvas draw).
 * Run from project root (directory with manifest.json).
 *
 * Requires: scripts/manifest-icons-entry.ts
 *   export manifestIconOutputs — [{ prefix, getRasters }]
 *   or legacy getInactiveManifestRasters
 *
 * Usage: node ../lib/scripts/generate-manifest-icons.mjs
 *        node ../lib/scripts/generate-manifest-icons.mjs scripts/manifest-icons-entry.ts
 */
import { createRequire } from "node:module";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const libRoot = join(scriptDir, "..");
const require = createRequire(join(libRoot, "package.json"));

const { createCanvas, Path2D } = require("@napi-rs/canvas");
const { PNG } = require("pngjs");
const esbuild = require(join(libRoot, "node_modules/esbuild"));

function resolveProjectRoot() {
  const projectRoot = process.cwd();
  if (!existsSync(join(projectRoot, "manifest.json"))) {
    console.error("Run from project root (directory containing manifest.json).");
    process.exit(1);
  }
  return projectRoot;
}

function resolveOutputs(mod) {
  if (Array.isArray(mod.manifestIconOutputs) && mod.manifestIconOutputs.length > 0) {
    return mod.manifestIconOutputs.map(({ prefix, getRasters }) => ({
      prefix,
      getRasters,
    }));
  }
  const legacy = [];
  if (typeof mod.getInactiveManifestRasters === "function") {
    legacy.push({ prefix: "icon", getRasters: mod.getInactiveManifestRasters });
  }
  return legacy;
}

const projectRoot = resolveProjectRoot();
const entryRel = process.argv[2] ?? "scripts/manifest-icons-entry.ts";
const entryPath = join(projectRoot, entryRel);

if (!existsSync(entryPath)) {
  console.error(`Missing entry: ${entryPath}`);
  process.exit(1);
}

globalThis.Path2D = Path2D;
globalThis.OffscreenCanvas = class OffscreenCanvas {
  constructor(width, height) {
    this._canvas = createCanvas(width, height);
  }
  getContext(type) {
    if (type === "2d") return this._canvas.getContext("2d");
    return null;
  }
};

const tmp = mkdtempSync(join(tmpdir(), "manifest-icons-"));
const outfile = join(tmp, "run.mjs");

try {
  await esbuild.build({
    entryPoints: [entryPath],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
    target: "es2022",
    logLevel: "silent",
    loader: { ".svg": "text" },
    nodePaths: [join(libRoot, "node_modules")],
  });

  const mod = await import(pathToFileURL(outfile).href);
  const outputs = resolveOutputs(mod);
  if (outputs.length === 0) {
    console.error(
      "Entry must export manifestIconOutputs or getInactiveManifestRasters.",
    );
    process.exit(1);
  }

  const outDir = join(projectRoot, "icons");
  mkdirSync(outDir, { recursive: true });

  const writeRaster = (prefix, { size, data }) => {
    const png = new PNG({ width: size, height: size });
    png.data = data;
    const dest = join(outDir, `${prefix}-${size}.png`);
    writeFileSync(dest, PNG.sync.write(png));
    console.log("wrote", dest);
  };

  for (const { prefix, getRasters } of outputs) {
    for (const raster of getRasters()) {
      writeRaster(prefix, raster);
    }
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
