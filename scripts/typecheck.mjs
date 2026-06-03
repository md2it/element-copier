#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogNodeModules = join(root, "../lib/node_modules");

function resolveBuildDependency(path) {
  try {
    return require.resolve(path, { paths: [root] });
  } catch (error) {
    if (error?.code !== "MODULE_NOT_FOUND") {
      throw error;
    }
    return join(catalogNodeModules, path);
  }
}

const tscPath = resolveBuildDependency("typescript/bin/tsc");
const result = spawnSync(process.execPath, [tscPath, "--noEmit", "-p", "tsconfig.json"], {
  cwd: root,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
