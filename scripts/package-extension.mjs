#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const extensionDir = join(root, "extension");
const manifestPath = join(extensionDir, "manifest.json");

if (!existsSync(manifestPath)) {
  console.error("extension/manifest.json not found");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const publicationDir = join(root, "PUBLICATION");
const zipPath = join(publicationDir, `element-copier-${manifest.version}.zip`);

mkdirSync(publicationDir, { recursive: true });
rmSync(zipPath, { force: true });

const zip = spawnSync("zip", ["-qr", zipPath, "."], {
  cwd: extensionDir,
  stdio: "inherit",
});

if (zip.status !== 0) {
  console.error("zip failed");
  process.exit(zip.status ?? 1);
}

console.log(`pack ok -> ${zipPath}`);
