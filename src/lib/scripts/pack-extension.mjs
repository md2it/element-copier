#!/usr/bin/env node
/**
 * Build extension and produce dist/ + versioned .zip in PUBLICATION/ (portable, no zsh).
 * Usage: node pack-extension.mjs <project-name> [--no-build]
 * Run from catalog root (parent of lib/ and <project>/).
 */
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const catalogRoot = join(scriptDir, "../..");
const libDir = join(catalogRoot, "lib");

const [project, noBuildFlag] = process.argv.slice(2);
if (!project) {
  console.error("Usage: pack-extension.mjs <project-name> [--no-build]");
  process.exit(1);
}

const projectDir = join(catalogRoot, project);
if (!existsSync(projectDir)) {
  console.error(`Project not found: ${projectDir}`);
  process.exit(1);
}
if (!existsSync(join(projectDir, "manifest.json"))) {
  console.error(`manifest.json not found in ${projectDir}`);
  process.exit(1);
}

if (noBuildFlag !== "--no-build") {
  console.log(`▶ Building ${project}...`);
  const build = spawnSync("node", ["scripts/build.mjs"], {
    cwd: projectDir,
    stdio: "inherit",
  });
  if (build.status !== 0) process.exit(build.status ?? 1);
}

const manifest = JSON.parse(
  readFileSync(join(projectDir, "manifest.json"), "utf8"),
);
const version = manifest.version;
const zipName = `${project}-${version}.zip`;
const distDir = join(projectDir, "dist");

const staging = mkdtempSync(join(tmpdir(), `pack-${project}-`));
try {
  console.log("▶ Populating dist/ (manifest whitelist)...");
  const pack = spawnSync(
    "node",
    [join(libDir, "scripts/pack-extension-files.mjs"), projectDir, staging],
    { stdio: "inherit" },
  );
  if (pack.status !== 0) process.exit(pack.status ?? 1);

  console.log("▶ Minifying staging (store zip)...");
  const minify = spawnSync(
    "node",
    [join(libDir, "scripts/minify-extension.mjs"), staging],
    { stdio: "inherit" },
  );
  if (minify.status !== 0) process.exit(minify.status ?? 1);

  if (existsSync(distDir)) {
    const oldDist = `${distDir}.old.${process.pid}`;
    renameSync(distDir, oldDist);
    try {
      chmodSync(oldDist, 0o755);
      rmSync(oldDist, { recursive: true, force: true });
    } catch {
      console.warn(`⚠ Remove manually: ${oldDist}`);
    }
  }
  renameSync(staging, distDir);
} catch (err) {
  rmSync(staging, { recursive: true, force: true });
  throw err;
}

const publicationDir = join(projectDir, "PUBLICATION");
mkdirSync(publicationDir, { recursive: true });

console.log(`▶ Creating ${zipName}...`);
const zipPath = join(publicationDir, zipName);
rmSync(zipPath, { force: true });
const zip = spawnSync("zip", ["-qr", zipPath, "."], {
  cwd: distDir,
  stdio: "inherit",
});
if (zip.status !== 0) {
  console.error("zip failed — install zip(1) or create archive manually from dist/");
  process.exit(zip.status ?? 1);
}

console.log(`✅ Done: ${zipPath}`);
console.log(`   dist/ → ${projectDir}/dist/`);
