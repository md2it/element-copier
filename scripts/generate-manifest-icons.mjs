#!/usr/bin/env node
import { createRequire } from "node:module";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogNodeModules = join(root, "../lib/node_modules");

function requireBuildDependency(name) {
  try {
    return require(require.resolve(name, { paths: [root] }));
  } catch (error) {
    if (error?.code !== "MODULE_NOT_FOUND") {
      throw error;
    }
    return require(join(catalogNodeModules, name));
  }
}

const { createCanvas, Path2D } = requireBuildDependency("@napi-rs/canvas");
const { PNG } = requireBuildDependency("pngjs");
const esbuild = requireBuildDependency("esbuild");

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

const extensionDir = join(root, "extension");
const manifestPath = join(extensionDir, "manifest.json");

if (!existsSync(manifestPath)) {
  console.error("extension/manifest.json not found");
  process.exit(1);
}

const entryPath = join(root, process.argv[2] ?? "scripts/manifest-icons-entry.ts");

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
    nodePaths: [join(root, "node_modules"), catalogNodeModules],
  });

  const mod = await import(pathToFileURL(outfile).href);
  const outputs = resolveOutputs(mod);
  if (outputs.length === 0) {
    console.error("Entry must export manifestIconOutputs or getInactiveManifestRasters.");
    process.exit(1);
  }

  const outDir = join(extensionDir, "icons");
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
