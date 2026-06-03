#!/usr/bin/env node
/**
 * Prepare AMO reviewer source tree at {project}/PUBLICATION/amo-source/.
 * Copies catalog layout (README.md, {project}/, lib/) and trims non-build files.
 *
 * Usage:
 *   From catalog root: node lib/scripts/pack-amo-source.mjs <project-name>
 *   From project root: node ../lib/scripts/pack-amo-source.mjs
 */
import {
  chmodSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const libDir = join(scriptDir, "..");
const catalogRootFromLib = join(libDir, "..");

/** esbuild outputs in project root — rebuilt by scripts/build.mjs */
const ESBUILD_BUNDLE_OUTPUTS = new Set([
  "background.js",
  "content.js",
  "welcome.js",
]);

const EXCLUDE_DIR_NAMES = new Set([
  "node_modules",
  "dist",
  ".git",
  "PUBLICATION",
  ".cursor",
  "build",
  "out",
  ".npm-cache",
  "cursor-rules",
]);

/** Lib scripts not required to rebuild dist/ + zip */
const LIB_SCRIPT_EXCLUDE = new Set([
  "pack-amo-source.mjs",
  "capture-pages.mjs",
  "crop-live-screenshots.mjs",
  "generate-manifest-icons.mjs",
  "smoke-extension-icon-state-core.mjs",
  "smoke-page-operability-core.mjs",
  "smoke-hotkeys-core.mjs",
  "pack-extension.zsh",
]);

function printUsage() {
  console.error(`Usage:
  From catalog root: node lib/scripts/pack-amo-source.mjs <project-name>
  From project root: node ../lib/scripts/pack-amo-source.mjs`);
}

/**
 * @param {string} srcRoot
 * @param {string} rel
 * @param {"project" | "lib"} kind
 */
function shouldExcludeRel(srcRoot, rel, kind) {
  const norm = rel.replace(/\\/g, "/");
  if (!norm || norm === ".") return false;

  const parts = norm.split("/");
  for (const part of parts) {
    if (EXCLUDE_DIR_NAMES.has(part)) return true;
    if (part.startsWith(".") && part !== "." && part !== "..") return true;
  }

  const base = parts[parts.length - 1];
  const abs = join(srcRoot, norm);
  let isDir = false;
  try {
    isDir = lstatSync(abs).isDirectory();
  } catch {
    return true;
  }

  if (isDir) return false;

  if (base.endsWith(".zip") || base.endsWith(".tsbuildinfo")) return true;

  if (kind === "project") {
    if (ESBUILD_BUNDLE_OUTPUTS.has(base)) return true;
    if (base.endsWith(".md")) return true;
    if (/^SPEC/i.test(base)) return true;
    if (base === "package-lock.json") return true;
    if (base.endsWith(".pem")) return true;
    if (/^smoke-/.test(base) && base.endsWith(".mjs")) return true;
    if (base === "manifest-icons-entry.ts") return true;
    return false;
  }

  if (base.endsWith(".md") || base.endsWith(".mdc")) return true;
  if (parts[0] === "scripts" && LIB_SCRIPT_EXCLUDE.has(base)) return true;
  return false;
}

/**
 * @param {string} srcRoot
 * @param {string} destRoot
 * @param {"project" | "lib"} kind
 */
function copyTrimmedTree(srcRoot, destRoot, kind) {
  cpSync(srcRoot, destRoot, {
    recursive: true,
    filter: (src) => {
      const rel = relative(srcRoot, src);
      if (!rel) return true;
      return !shouldExcludeRel(srcRoot, rel, kind);
    },
  });

  resolveSymlinksToFiles(destRoot);
}

/** @param {string} dir */
function resolveSymlinksToFiles(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = lstatSync(full);
    if (st.isSymbolicLink()) {
      const target = realpathSync(full);
      rmSync(full, { force: true });
      const targetSt = statSync(target);
      if (targetSt.isDirectory()) {
        cpSync(target, full, { recursive: true });
      } else {
        mkdirSync(dirname(full), { recursive: true });
        cpSync(target, full);
      }
      continue;
    }
    if (st.isDirectory()) resolveSymlinksToFiles(full);
  }
}

/**
 * @param {string} dir
 * @returns {Set<string>}
 */
function collectRelativeFiles(dir) {
  const out = new Set();
  /** @param {string} current @param {string} prefix */
  function walk(current, prefix) {
    for (const name of readdirSync(current)) {
      const rel = prefix ? `${prefix}/${name}` : name;
      const full = join(current, name);
      const st = statSync(full);
      if (st.isDirectory()) walk(full, rel);
      else out.add(rel.replace(/\\/g, "/"));
    }
  }
  walk(dir, "");
  return out;
}

/**
 * Keep only npm scripts whose entry files exist in the amo-source tree.
 * @param {Record<string, string>} scripts
 * @param {Set<string>} projectFiles
 */
export function trimPackageScripts(scripts, projectFiles) {
  /** @param {string} cmd */
  function scriptTargetExists(cmd) {
    const nodeMatch = /^\s*node\s+(\S+)/.exec(cmd);
    if (nodeMatch) {
      const scriptRel = nodeMatch[1].replace(/^\.\//, "");
      if (scriptRel.startsWith("../")) return false;
      return projectFiles.has(scriptRel.replace(/\\/g, "/"));
    }
    if (
      /^\s*node\s+\.\.\/lib\/node_modules\/typescript\/bin\/tsc/.test(cmd)
    ) {
      return projectFiles.has("tsconfig.json");
    }
    return false;
  }

  const kept = {};
  for (const [name, cmd] of Object.entries(scripts)) {
    if (typeof cmd !== "string") continue;
    if (scriptTargetExists(cmd)) kept[name] = cmd;
  }
  return kept;
}

/** @param {string} destProjectDir @param {Set<string>} projectFiles */
function writeProjectPackageJson(destProjectDir, projectFiles) {
  const pkgPath = join(destProjectDir, "package.json");
  if (!existsSync(pkgPath)) return;
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  if (pkg.scripts) {
    pkg.scripts = trimPackageScripts(pkg.scripts, projectFiles);
    if (Object.keys(pkg.scripts).length === 0) delete pkg.scripts;
  }
  if (pkg.devDependencies?.playwright) {
    const { playwright: _pw, ...restDev } = pkg.devDependencies;
    pkg.devDependencies = Object.keys(restDev).length ? restDev : undefined;
    if (!pkg.devDependencies) delete pkg.devDependencies;
  }
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

/** @param {string} amoRoot @param {string} projectName */
function writeReadme(amoRoot, projectName) {
  const readme = `# AMO source submission — ${projectName}

This archive mirrors the developer catalog layout: \`${projectName}/\` plus shared \`lib/\`.
Rebuild the extension from source before upload.

## Environment

- **OS:** Ubuntu on **ARM64** (Mozilla AMO build workers; local macOS/Windows also work for a smoke rebuild).
- **Node.js:** **24.x** (AMO default). **npm** 10+ (bundled with Node 24).
- **zip:** required for the final \`.zip\` artifact (\`apt install zip\` on Debian/Ubuntu).

## One-shot rebuild (from this directory)

\`\`\`bash
./rebuild.mjs
# or: node rebuild.mjs
\`\`\`

## Step by step

\`\`\`bash
cd lib && npm ci && cd ..
node lib/scripts/pack-extension.mjs ${projectName}
\`\`\`

Build only (no zip/dist pack):

\`\`\`bash
cd ${projectName} && node scripts/build.mjs
\`\`\`

## Outputs

| Artifact | Path |
|----------|------|
| Unpacked extension (store layout) | \`${projectName}/dist/\` |
| Uploadable archive | \`${projectName}/PUBLICATION/${projectName}-<version>.zip\` (version from \`manifest.json\`) |

Intermediate bundles (\`background.js\`, \`content.js\`, \`welcome.js\`) are produced in \`${projectName}/\` by \`scripts/build.mjs\` (esbuild, shared code from \`lib/src\`).

## Notes

- \`blocked-notice.js\` is a copy of \`lib/src/page-operability/blocked-notice-page.js\` (symlinks resolved in this tree).
- Dependencies install only under \`lib/\`; the extension project does not need \`npm ci\`.
`;
  writeFileSync(join(amoRoot, "README.md"), readme);
}

/** @param {string} amoRoot @param {string} projectName */
function writeRebuildScript(amoRoot, projectName) {
  const rebuild = `#!/usr/bin/env node
/** AMO one-shot: npm ci in lib/, then build + pack ${projectName}. */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const libDir = join(root, "lib");
const npmCache = join(root, ".npm-cache");

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: "inherit", ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log("▶ npm ci (lib/)...");
run("npm", ["ci"], {
  cwd: libDir,
  env: { ...process.env, NPM_CONFIG_CACHE: npmCache },
});

console.log("▶ pack-extension...");
run("node", [join(libDir, "scripts/pack-extension.mjs"), "${projectName}"], {
  cwd: root,
});

console.log("✅ Rebuild complete.");
`;
  const rebuildPath = join(amoRoot, "rebuild.mjs");
  writeFileSync(rebuildPath, rebuild);
  chmodSync(rebuildPath, 0o755);
}

/**
 * @returns {{ catalogRoot: string, projectName: string, projectDir: string, libDir: string, amoRoot: string }}
 */
export function resolvePaths() {
  const argProject = process.argv[2];
  const cwd = process.cwd();
  const cwdBase = basename(cwd);

  let projectName;
  let catalogRoot;
  let projectDir;

  if (existsSync(join(cwd, "manifest.json"))) {
    projectDir = cwd;
    if (argProject && argProject !== cwdBase) {
      console.error(
        `Project name "${argProject}" does not match cwd "${cwdBase}"`,
      );
      process.exit(1);
    }
    projectName = cwdBase;
    catalogRoot = dirname(cwd);
  } else {
    if (!argProject) {
      printUsage();
      process.exit(1);
    }
    projectName = argProject;
    if (existsSync(join(cwd, projectName, "manifest.json"))) {
      catalogRoot = cwd;
      projectDir = join(cwd, projectName);
    } else if (
      existsSync(join(catalogRootFromLib, projectName, "manifest.json"))
    ) {
      catalogRoot = catalogRootFromLib;
      projectDir = join(catalogRoot, projectName);
    } else {
      console.error(`Cannot find project "${projectName}".`);
      printUsage();
      process.exit(1);
    }
  }

  const lib = join(catalogRoot, "lib");
  if (!existsSync(join(lib, "scripts", "pack-extension-files.mjs"))) {
    console.error(`Catalog lib/ not found under ${catalogRoot}`);
    process.exit(1);
  }

  const amoRoot = join(projectDir, "PUBLICATION", "amo-source");
  return { catalogRoot, projectName, projectDir, libDir: lib, amoRoot };
}

/** @param {string} dir */
function countFilesRecursive(dir) {
  let n = 0;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) n += countFilesRecursive(full);
    else n += 1;
  }
  return n;
}

async function main() {
  const { projectName, projectDir, libDir, amoRoot } = resolvePaths();

  const beforeCount = existsSync(amoRoot) ? countFilesRecursive(amoRoot) : 0;

  console.log(`▶ AMO source: ${amoRoot}`);
  console.log(`   project: ${projectName}`);

  const stagingRoot = mkdtempSync(join(tmpdir(), `amo-source-${projectName}-`));
  const stagingLib = join(stagingRoot, "lib");
  const stagingProject = join(stagingRoot, projectName);

  try {
    console.log("▶ Copying lib/…");
    copyTrimmedTree(libDir, stagingLib, "lib");

    console.log(`▶ Copying ${projectName}/…`);
    copyTrimmedTree(projectDir, stagingProject, "project");

    const projectFiles = collectRelativeFiles(stagingProject);
    writeProjectPackageJson(stagingProject, projectFiles);

    writeReadme(stagingRoot, projectName);
    writeRebuildScript(stagingRoot, projectName);

    mkdirSync(dirname(amoRoot), { recursive: true });
    if (existsSync(amoRoot)) {
      rmSync(amoRoot, { recursive: true, force: true });
    }
    renameSync(stagingRoot, amoRoot);
  } catch (err) {
    rmSync(stagingRoot, { recursive: true, force: true });
    throw err;
  }

  const destLib = join(amoRoot, "lib");
  const destProject = join(amoRoot, projectName);
  const projectFiles = collectRelativeFiles(destProject);

  const afterCount = countFilesRecursive(amoRoot);
  console.log(
    `✅ amo-source ready (lib/: ${collectRelativeFiles(destLib).size} files, ${projectName}/: ${projectFiles.size} files, README.md, rebuild.mjs)`,
  );
  if (beforeCount > 0) {
    console.log(`   files: ${beforeCount} → ${afterCount}`);
  } else {
    console.log(`   files: ${afterCount}`);
  }
}

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
