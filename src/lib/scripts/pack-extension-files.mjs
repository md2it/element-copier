#!/usr/bin/env node
/**
 * Copy only extension runtime files into staging (manifest + HTML deps + _locales).
 * Usage: node pack-extension-files.mjs <project-dir> <staging-dir>
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ASSET_RE =
  /\.(js|mjs|cjs|html|css|json|png|jpe?g|gif|svg|webp|woff2?|ttf|eot|mp3|wav)$/i;
const SKIP_STRING_RE = /^(https?:|data:|chrome-extension:|__MSG_)/;

/** @param {unknown} value @param {Set<string>} out */
function collectFromManifestValue(value, out) {
  if (typeof value === "string") {
    if (!SKIP_STRING_RE.test(value) && ASSET_RE.test(value)) out.add(value);
    return;
  }
  if (Array.isArray(value)) value.forEach((v) => collectFromManifestValue(v, out));
  else if (value && typeof value === "object") {
    Object.values(value).forEach((v) => collectFromManifestValue(v, out));
  }
}

/** @param {string} projectDir @param {string} rel @param {Set<string>} out */
function collectFromHtml(projectDir, rel, out) {
  const abs = join(projectDir, rel);
  const html = readFileSync(abs, "utf8");
  for (const re of [
    /\bsrc=["']([^"']+)["']/gi,
    /\bhref=["']([^"']+)["']/gi,
  ]) {
    for (const m of html.matchAll(re)) {
      const ref = m[1];
      if (
        ref.startsWith("http") ||
        ref.startsWith("//") ||
        ref.startsWith("/") ||
        ref.startsWith("#") ||
        ref.startsWith("data:")
      ) {
        continue;
      }
      out.add(ref);
    }
  }
}

/** @param {string} rel */
function normalizeRel(rel) {
  const trimmed = rel.replace(/\/+$/, "");
  assertSafeRel(trimmed);
  return trimmed;
}

/** @param {string} rel */
function assertSafeRel(rel) {
  if (rel.includes("..") || rel.startsWith("/") || rel.startsWith(".")) {
    throw new Error(`Unsafe path: ${rel}`);
  }
}

const cpFilter = (src) => {
  const parts = src.split(/[/\\]/);
  return !parts.some(
    (p) =>
      p === ".git" ||
      p === "node_modules" ||
      p === ".cursor" ||
      (p.startsWith(".") && p !== "." && p !== ".."),
  );
};

/** @param {string} projectDir @param {string} stagingDir @param {string} rel */
function copyRel(projectDir, stagingDir, rel) {
  rel = normalizeRel(rel);
  const src = join(projectDir, rel);
  if (!existsSync(src)) {
    throw new Error(`Missing file: ${rel}`);
  }
  const resolved = realpathSync(src);
  const dest = join(stagingDir, rel);
  mkdirSync(dirname(dest), { recursive: true });
  const st = statSync(resolved);
  if (st.isDirectory()) {
    cpSync(resolved, dest, { recursive: true, filter: cpFilter });
  } else {
    cpSync(resolved, dest);
  }
}

/** @param {string} dir */
function assertStagingClean(dir) {
  for (const name of readdirSync(dir)) {
    if (name === ".git" || name.startsWith(".")) {
      throw new Error(`Junk in package: ${join(dir, name)}`);
    }
    const full = join(dir, name);
    if (statSync(full).isDirectory()) assertStagingClean(full);
  }
}

const ICON_ASSET_IN_BUNDLE_RE =
  /["'](icons\/[^"']+\.(?:png|jpe?g|gif|webp|svg))["']/gi;

/** @param {string} projectDir @param {string} rel @param {Set<string>} out */
function collectFromBundledScript(projectDir, rel, out) {
  const abs = join(projectDir, rel);
  if (!existsSync(abs)) return;
  const src = readFileSync(abs, "utf8");
  for (const m of src.matchAll(ICON_ASSET_IN_BUNDLE_RE)) out.add(m[1]);
}

/** @param {string} projectDir @param {Record<string, unknown>} manifest @param {Set<string>} out */
function collectFromBundledScripts(projectDir, manifest, out) {
  const scripts = new Set();
  const sw = manifest.background?.service_worker;
  if (typeof sw === "string") scripts.add(sw);
  for (const rel of manifest.background?.scripts ?? []) {
    if (typeof rel === "string") scripts.add(rel);
  }
  for (const cs of manifest.content_scripts ?? []) {
    if (!cs || typeof cs !== "object") continue;
    for (const j of cs.js ?? []) {
      if (typeof j === "string") scripts.add(j);
    }
  }
  for (const rel of scripts) collectFromBundledScript(projectDir, rel, out);
}

/**
 * All runtime paths required in dist/ (relative to project root).
 * @param {string} projectDir
 * @returns {Set<string>}
 */
export function collectExtensionRuntimePaths(projectDir) {
  const manifest = JSON.parse(
    readFileSync(join(projectDir, "manifest.json"), "utf8"),
  );
  const paths = new Set(["manifest.json"]);
  collectFromManifestValue(manifest, paths);
  collectFromBundledScripts(projectDir, manifest, paths);

  for (const name of readdirSync(projectDir)) {
    if (name.endsWith(".html") && !name.startsWith(".")) paths.add(name);
  }

  if (manifest.default_locale) {
    const localesDir = "_locales";
    if (!existsSync(join(projectDir, localesDir))) {
      throw new Error("manifest.default_locale set but _locales/ missing");
    }
    paths.add(localesDir);
  }

  const seenHtml = new Set();
  const htmlQueue = [...paths].filter((p) => p.endsWith(".html"));
  while (htmlQueue.length > 0) {
    const html = htmlQueue.pop();
    if (seenHtml.has(html)) continue;
    seenHtml.add(html);
    collectFromHtml(projectDir, html, paths);
    for (const p of paths) {
      if (p.endsWith(".html") && !seenHtml.has(p)) htmlQueue.push(p);
    }
  }

  return paths;
}

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  const [projectDir, stagingDir] = process.argv.slice(2);
  if (!projectDir || !stagingDir) {
    console.error("Usage: pack-extension-files.mjs <project-dir> <staging-dir>");
    process.exit(1);
  }
  const paths = collectExtensionRuntimePaths(projectDir);
  mkdirSync(stagingDir, { recursive: true });
  for (const rel of [...paths].map(normalizeRel).sort()) {
    copyRel(projectDir, stagingDir, rel);
  }
  assertStagingClean(stagingDir);
  console.log(`pack files: ${paths.size} entries`);
}
