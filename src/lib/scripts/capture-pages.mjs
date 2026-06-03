#!/usr/bin/env node
/**
 * Store screenshot: welcome + settings + about on 1280×800 canvas.
 * Run from project root (directory with PUBLICATION/).
 *
 * Requires PUBLICATION/scripts/welcome-seed-entry.ts in the project.
 *
 * Usage: node ../lib/scripts/capture-pages.mjs ru
 * Output: PUBLICATION/{LANG}/{lang}-pages.png
 */
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const scriptDir = dirname(fileURLToPath(import.meta.url));
const libRoot = join(scriptDir, "..");
const esbuild = require(join(libRoot, "node_modules/esbuild"));

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
const welcomeSeedEntry = join(publicationDir, "scripts/welcome-seed-entry.ts");

const CANVAS_W = 1280;
const CANVAS_H = 800;
const BG = "#f3f4f6";
/** CSS width of panel in tab layout (matches panel-popup-page.html). */
const PANEL_CSS_W = 360;

const LOCALE_STORAGE_KEY = "locale";
const LOCALE_USER_SELECTED_KEY = "localeUserSelected";
const WELCOME_SESSION_DATA_KEY = "welcomeData";

/** CLI code → store listing folder (same as crop-live-screenshots.mjs). */
const LANG_DIRS = {
  ru: "RU",
  en: "EN",
  es: "ES",
  fr: "FR",
  de: "DE",
  zn: "ZN",
  ar: "AR",
};

const localeArg = process.argv[2]?.toLowerCase();
if (!localeArg || !LANG_DIRS[localeArg]) {
  console.error("Usage: node capture-pages.mjs <lang>");
  console.error("Languages:", Object.keys(LANG_DIRS).join(", "));
  process.exit(1);
}

if (!existsSync(welcomeSeedEntry)) {
  console.error(`Missing project seed: ${welcomeSeedEntry}`);
  process.exit(1);
}

const langDir = LANG_DIRS[localeArg];
const localeMap = {
  ru: "ru",
  en: "en",
  es: "es",
  fr: "fr",
  de: "de",
  zn: "zh_CN",
  zh: "zh_CN",
  ar: "ar",
};
const locale = localeMap[localeArg] ?? localeArg;
const outName = `${localeArg}-pages.png`;
const outPath = join(publicationDir, langDir, outName);

async function seedWelcomeJson() {
  const tmp = await mkdtemp(join(tmpdir(), "pub-seed-"));
  const modPath = join(tmp, "seed.cjs");
  try {
    await esbuild.build({
      entryPoints: [welcomeSeedEntry],
      bundle: true,
      platform: "node",
      format: "cjs",
      outfile: modPath,
      absWorkingDir: projectRoot,
      alias: { "@lib": join(libRoot, "src") },
      loader: { ".svg": "text" },
      define: {
        "process.env.PANEL_HEADER_CSS": '""',
        "process.env.CSS_CONTENT": '""',
        "process.env.PANEL_CSS_CONTENT": '""',
      },
    });
    const { execFileSync } = await import("node:child_process");
    const stdout = execFileSync("node", [modPath, locale], { encoding: "utf8" });
    return JSON.parse(stdout.trim());
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

async function getPlaywright() {
  try {
    return await import("playwright");
  } catch {
    const playwrightPath = join(projectRoot, "node_modules/playwright");
    return import(playwrightPath);
  }
}

async function waitForExtensionId(context) {
  let [sw] = context.serviceWorkers();
  if (!sw) {
    sw = await context.waitForEvent("serviceworker", { timeout: 30_000 });
  }
  const match = sw.url().match(/chrome-extension:\/\/([^/]+)/);
  if (!match) throw new Error(`Cannot parse extension id from ${sw.url()}`);
  return match[1];
}

async function getExtensionWorker(context, extensionId) {
  const sw = context.serviceWorkers().find((w) => w.url().includes(extensionId));
  if (!sw) throw new Error("Extension service worker not found");
  return sw;
}

async function seedStorage(context, extensionId, welcomeData) {
  const sw = await getExtensionWorker(context, extensionId);
  await sw.evaluate(
    async ({ welcomeData, locale, keys }) => {
      await chrome.storage.local.set({
        [keys.locale]: locale,
        [keys.localeUserSelected]: true,
      });
      await chrome.storage.session.set({
        [keys.welcome]: welcomeData,
      });
    },
    {
      welcomeData,
      locale,
      keys: {
        locale: LOCALE_STORAGE_KEY,
        localeUserSelected: LOCALE_USER_SELECTED_KEY,
        welcome: WELCOME_SESSION_DATA_KEY,
      },
    },
  );
}

async function compositeInBrowser(page, panelPaths) {
  const [welcomeB64, settingsB64, aboutB64] = await Promise.all(
    panelPaths.map(async (p) => (await readFile(p)).toString("base64")),
  );
  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${CANVAS_W}px; height: ${CANVAS_H}px; overflow: hidden; }
  body {
    background: ${BG};
    display: flex;
    align-items: center;
    justify-content: space-evenly;
    padding: 0;
  }
  img {
    width: ${PANEL_CSS_W}px;
    height: auto;
    display: block;
    flex: 0 0 auto;
    image-rendering: auto;
  }
</style>
</head>
<body>
  <img src="data:image/png;base64,${welcomeB64}" alt="" />
  <img src="data:image/png;base64,${settingsB64}" alt="" />
  <img src="data:image/png;base64,${aboutB64}" alt="" />
</body>
</html>`;
  await page.setViewportSize({ width: CANVAS_W, height: CANVAS_H });
  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({
    path: outPath,
    type: "png",
    clip: { x: 0, y: 0, width: CANVAS_W, height: CANVAS_H },
    scale: "css",
  });
}

async function main() {
  const { execFileSync } = await import("node:child_process");
  console.log("Building extension…");
  execFileSync("npm", ["run", "build"], { cwd: projectRoot, stdio: "inherit" });

  console.log(`Building welcome seed for ${locale}…`);
  const welcomeData = await seedWelcomeJson();

  const { chromium } = await getPlaywright();
  const userDataDir = await mkdtemp(join(tmpdir(), "pub-capture-"));
  const shotsDir = await mkdtemp(join(publicationDir, ".shots-"));

  let context;
  try {
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 2,
      args: [
        `--disable-extensions-except=${projectRoot}`,
        `--load-extension=${projectRoot}`,
      ],
    });

    const boot = context.pages()[0] ?? (await context.newPage());
    await boot.goto("about:blank");

    const extensionId = await waitForExtensionId(context);
    await new Promise((r) => setTimeout(r, 800));
    await seedStorage(context, extensionId, welcomeData);

    for (const p of context.pages()) {
      if (p.url().includes("/welcome.html")) await p.close();
    }

    const base = `chrome-extension://${extensionId}`;

    const page = await context.newPage();

    // Welcome — main card only, no pin arrow
    await seedStorage(context, extensionId, welcomeData);
    await page.goto(`${base}/welcome.html`, { waitUntil: "networkidle" });
    await page.waitForSelector(".welcome");
    await page.locator("#pin-heading").getByText(/под рукой|handy/i).waitFor({
      timeout: 10_000,
    });
    await page.evaluate(() => {
      const hint = document.getElementById("pin-hint");
      if (hint) {
        hint.hidden = true;
        hint.setAttribute("aria-hidden", "true");
      }
    });
    const welcomePath = join(shotsDir, "welcome.png");
    await page.locator(".welcome").screenshot({ path: welcomePath, type: "png" });

    // Settings
    await seedStorage(context, extensionId, welcomeData);
    await page.goto(`${base}/panel-popup-page.html?mode=tab&tab=settings`, {
      waitUntil: "networkidle",
    });
    await page.waitForSelector("#element-deleter-root");
    await page
      .locator("#element-deleter-root")
      .locator(".dd-tab.is-active")
      .filter({ hasText: /НАСТРОЙКИ|SETTINGS/ })
      .waitFor({ timeout: 10_000 });
    const settingsPath = join(shotsDir, "settings.png");
    await page.locator("#element-deleter-root").screenshot({ path: settingsPath, type: "png" });

    // About
    await seedStorage(context, extensionId, welcomeData);
    await page.goto(`${base}/panel-popup-page.html?mode=tab&tab=info`, {
      waitUntil: "networkidle",
    });
    await page.waitForSelector("#element-deleter-root");
    await page
      .locator("#element-deleter-root")
      .locator(".dd-tab.is-active")
      .filter({ hasText: /РАСШИРЕНИИ|ABOUT/i })
      .waitFor({ timeout: 10_000 });
    const aboutPath = join(shotsDir, "about.png");
    await page.locator("#element-deleter-root").screenshot({ path: aboutPath, type: "png" });

    await mkdir(join(publicationDir, langDir), { recursive: true });
    await compositeInBrowser(page, [welcomePath, settingsPath, aboutPath]);
    console.log(`Wrote ${outPath}`);
  } finally {
    if (context) await context.close();
    await rm(userDataDir, { recursive: true, force: true });
    await rm(shotsDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
