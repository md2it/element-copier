import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const esbuild = require(
  join(dirname(fileURLToPath(import.meta.url)), "../../lib/node_modules/esbuild"),
);

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const libSrc = join(root, "../lib/src");
const watch = process.argv.includes("--watch");

const stylesDir = join(root, "styles");
const panelHeaderCss = readFileSync(join(stylesDir, "panel-header.css"), "utf8");
const panelFooterCss = readFileSync(join(stylesDir, "panel-footer.css"), "utf8");
const panelCss = readFileSync(join(stylesDir, "panel-popup.css"), "utf8");
const pickModeCss = readFileSync(join(stylesDir, "pick-mode.css"), "utf8");
const panelSurfaceCss = `${panelHeaderCss}\n${panelFooterCss}\n${panelCss}`;

const define = {
  "process.env.PANEL_CSS_CONTENT": JSON.stringify(panelSurfaceCss),
  "process.env.PANEL_HEADER_CSS": JSON.stringify(panelHeaderCss),
  "process.env.PICK_CSS_CONTENT": JSON.stringify(pickModeCss),
};

const common = {
  bundle: true,
  platform: "browser",
  target: "es2022",
  charset: "utf8",
  define,
  logLevel: "info",
  loader: {
    ".svg": "text",
  },
  alias: {
    "@lib": libSrc,
    "modern-screenshot": join(root, "../lib/node_modules/modern-screenshot/dist/index.mjs"),
  },
};

const ctx = await esbuild.context({
  ...common,
  entryPoints: {
    background: join(root, "src/background.ts"),
    content: join(root, "src/content.ts"),
    welcome: join(root, "src/welcome/welcome.ts"),
  },
  outdir: root,
});

if (watch) {
  await ctx.watch();
  console.log("watching…");
} else {
  await ctx.rebuild();
  await ctx.dispose();
  console.log("build ok → dist/ updated (load unpacked from element-copier/dist)");
}
