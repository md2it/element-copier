/**
 * Generate Chrome Web Store promo tiles for Element Copier:
 *   docs/publication/promo-small.png    — 440×280
 *   docs/publication/promo-marquee.png  — 1400×560
 *
 * Scene: a fake article page with one element highlighted in pick mode
 * (blue outline + fill + label — exact colors from the real app).
 * Marquee adds a real Playwright screenshot of the COPIED popup (light theme).
 */

import { createCanvas, loadImage } from 'canvas';
import { chromium } from 'playwright';
import { createServer } from 'http';
import { createReadStream, statSync } from 'fs';
import { extname } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ICON_PATH  = path.resolve(__dirname, '../extension/icons/icon-128.png');
const EXT_DIR    = path.resolve(__dirname, '../extension');
const OUT_DIR    = path.resolve(__dirname, '../docs/publication');

// ── Background ────────────────────────────────────────────────────────────────

function drawBackground(ctx, W, H, sceneX) {
  const base = ctx.createLinearGradient(0, 0, W, H);
  base.addColorStop(0, '#0b0f1a');
  base.addColorStop(1, '#131c2e');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  const gx = sceneX + (W - sceneX) * 0.5, gy = H * 0.42;
  const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(W, H) * 0.55);
  glow.addColorStop(0,   'rgba(1,34,146,0.14)');
  glow.addColorStop(0.5, 'rgba(1,34,146,0.05)');
  glow.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
}

// ── Primitives ─────────────────────────────────────────────────────────────────

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,   r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r,     r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y,     x + r, y,          r);
  ctx.closePath();
}

// ── Cursor ─────────────────────────────────────────────────────────────────────

function drawCursor(ctx, cx, cy, size = 20, alpha = 1) {
  const s = size / 24;
  const ox = cx - 4 * s, oy = cy - 4 * s;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle   = '#ff6060';
  ctx.strokeStyle = 'rgba(255,140,140,0.55)';
  ctx.lineWidth   = 1.0 * (size / 20);
  ctx.beginPath();
  ctx.moveTo(ox +  4    * s, oy +  4    * s);
  ctx.lineTo(ox + 11.07 * s, oy + 21    * s);
  ctx.lineTo(ox + 13.58 * s, oy + 13.61 * s);
  ctx.lineTo(ox + 21    * s, oy + 11.07 * s);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

// ── Brand zone ─────────────────────────────────────────────────────────────────

function drawBrand(ctx, iconImg, cx, cy, iconSize, nameFontSize, textGap) {
  const cr = iconSize * 0.20;

  const glowLayers = [
    { expand: 22, alpha: 0.04, color: '150,170,255' },
    { expand: 15, alpha: 0.09, color: '150,170,255' },
    { expand:  9, alpha: 0.17, color: '160,180,255' },
    { expand:  4, alpha: 0.28, color: '170,190,255' },
    { expand:  1, alpha: 0.42, color: '180,200,255' },
  ];
  for (const { expand: ex, alpha, color } of glowLayers) {
    ctx.save();
    ctx.fillStyle = `rgba(${color},${alpha})`;
    roundRect(ctx,
      cx - iconSize / 2 - ex, cy - iconSize / 2 - ex,
      iconSize + ex * 2,      iconSize + ex * 2,
      cr + ex * 0.7
    );
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  roundRect(ctx, cx - iconSize / 2, cy - iconSize / 2, iconSize, iconSize, cr);
  ctx.clip();
  ctx.drawImage(iconImg, cx - iconSize / 2, cy - iconSize / 2, iconSize, iconSize);
  ctx.restore();

  const textY = cy + iconSize / 2 + textGap;
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${nameFontSize}px Arial`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('ELEMENT', cx, textY);
  ctx.fillText('COPIER',  cx, textY + nameFontSize + 3);
  ctx.restore();
}

// ── Fake article page ─────────────────────────────────────────────────────────
// Returns absolute coords of the content block to be highlighted.

function drawArticlePage(ctx, x, y, w, h, scale = 1) {
  const r = 12, s = scale;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 32; ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#f8fafc';
  roundRect(ctx, x, y, w, h, r); ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, x, y, w, h, r); ctx.clip();

  const barH = Math.round(36 * s);
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(x, y, w, barH);
  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x, y + barH); ctx.lineTo(x + w, y + barH); ctx.stroke();

  const urlX = x + Math.round(48 * s), urlW = Math.round(w * 0.60),
        urlH  = Math.round(18 * s),    urlY = y + (barH - urlH) / 2;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, urlX, urlY, urlW, urlH, 4); ctx.fill();
  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
  roundRect(ctx, urlX, urlY, urlW, urlH, 4); ctx.stroke();
  ctx.fillStyle = '#94a3b8'; ctx.font = `${Math.round(9 * s)}px Arial`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('https://example.com/article', urlX + 6, urlY + urlH / 2);

  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = ['#ef4444','#f59e0b','#22c55e'][i];
    ctx.beginPath();
    ctx.arc(x + Math.round((12 + i * 13) * s), y + barH / 2, Math.round(4.5 * s), 0, Math.PI * 2);
    ctx.fill();
  }

  const pad     = Math.round(16 * s);
  const titleFs = Math.round(13 * s);
  const subFs   = Math.round(9  * s);
  const lineH   = Math.round(9  * s);
  const lineGap = Math.round(6  * s);

  let curY = y + barH + Math.round(10 * s);

  ctx.fillStyle = '#1e293b';
  ctx.font = `bold ${titleFs}px Arial`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('How to Get Started', x + pad, curY);
  curY += titleFs + Math.round(5 * s);

  ctx.fillStyle = '#64748b'; ctx.font = `${subFs}px Arial`;
  ctx.fillText('Published · 5 min read', x + pad, curY);
  curY += subFs + Math.round(10 * s);

  // ── Paragraph block (to be highlighted) ──────────────────────────────────
  const paraStartY = curY;
  const paraTopPad = Math.round(6 * s);
  curY += paraTopPad;

  const lineWidths = [0.88, 0.92, 0.75, 0.85, 0.60];
  for (const lw of lineWidths) {
    ctx.fillStyle = '#cbd5e1';
    roundRect(ctx, x + pad, curY, Math.round((w - pad * 2) * lw), lineH, 3);
    ctx.fill();
    curY += lineH + lineGap;
  }

  const imgGap = Math.round(8 * s), imgH = Math.round(46 * s);
  curY += imgGap;
  if (curY + imgH < y + h - Math.round(8 * s)) {
    ctx.fillStyle = '#e2e8f0';
    roundRect(ctx, x + pad, curY, w - pad * 2, imgH, 6); ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(x + pad + Math.round((w - pad * 2) / 2), curY + imgH / 2, Math.round(10 * s), 0, Math.PI * 2);
    ctx.fill();
    curY += imgH;
  }

  const paraEndY = curY + Math.round(6 * s);
  // ─────────────────────────────────────────────────────────────────────────

  ctx.restore();

  return {
    hx: x + pad - Math.round(4 * s),
    hy: paraStartY,
    hw: w - pad * 2 + Math.round(8 * s),
    hh: paraEndY - paraStartY,
  };
}

// ── Pick-mode highlight (exact colors from real app) ──────────────────────────

function drawPickHighlight(ctx, hx, hy, hw, hh, label, fontSize = 10) {
  ctx.save();
  ctx.fillStyle = 'rgba(1,34,146,0.18)';
  roundRect(ctx, hx, hy, hw, hh, 4); ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(1,34,146,0.22)'; ctx.lineWidth = 12;
  roundRect(ctx, hx - 2, hy - 2, hw + 4, hh + 4, 6); ctx.stroke();
  ctx.strokeStyle = 'rgba(1,34,146,0.45)'; ctx.lineWidth = 5;
  roundRect(ctx, hx - 2, hy - 2, hw + 4, hh + 4, 6); ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(1,34,146,0.95)'; ctx.lineWidth = 1.5;
  roundRect(ctx, hx - 2, hy - 2, hw + 4, hh + 4, 6); ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.font = `600 ${fontSize}px ui-monospace, monospace`;
  const labelW = ctx.measureText(label).width + 10;
  const labelH = fontSize + 6;
  const lx = hx - 1, ly = hy - labelH - 2;

  ctx.fillStyle = 'rgba(1,34,146,0.96)';
  roundRect(ctx, lx, ly, labelW, labelH, 4); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.38)'; ctx.lineWidth = 1;
  roundRect(ctx, lx, ly, labelW, labelH, 4); ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(label, lx + 5, ly + labelH / 2);
  ctx.restore();
}

// ── Real COPIED popup via Playwright + local HTTP server ─────────────────────
// Serves the project directory over HTTP so ES modules load without CORS issues.
// popup-screenshot.html mocks chrome and mounts only the COPIED panel surface.

const SCRIPTS_DIR = path.resolve(__dirname);
const PROJECT_DIR = path.resolve(__dirname, '..');
const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.json': 'application/json',
};

function startStaticServer(root, port) {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      // Strip query string for cache-busting imports
      let urlPath = req.url.split('?')[0];
      // serve-style clean URLs: try with .js then .html
      const candidates = [urlPath, urlPath + '.js', urlPath + '.html'];
      for (const candidate of candidates) {
        const filePath = path.join(root, candidate);
        try {
          const stat = statSync(filePath);
          if (stat.isFile()) {
            const mime = MIME[extname(filePath)] ?? 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': mime });
            createReadStream(filePath).pipe(res);
            return;
          }
        } catch {}
      }
      res.writeHead(404); res.end('Not found');
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

async function screenshotCopiedPopup() {
  const PORT   = 14321;
  const server = await startStaticServer(PROJECT_DIR, PORT);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const page    = await context.newPage();
  await page.setViewportSize({ width: 560, height: 900 });

  const url = `http://127.0.0.1:${PORT}/scripts/popup-screenshot.html`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // Wait until the module script sets data-ready="true"
  await page.waitForFunction(
    () => document.documentElement.dataset.ready === 'true',
    { timeout: 15000 }
  );
  // Extra tick for async URL/tab data to populate
  await page.waitForTimeout(300);

  // Clip to the shadow host which wraps the popup
  const host = page.locator('#element-copier-root').first();
  const box  = await host.boundingBox();
  if (!box) throw new Error('element-copier-root not found after ready signal');

  const buffer = await page.screenshot({
    clip: { x: box.x, y: box.y, width: box.width, height: box.height },
  });

  await browser.close();
  server.close();
  return buffer;
}

// ── Draw popup screenshot with shadow ─────────────────────────────────────────

function drawPopupScreenshot(ctx, popupImg, destX, destY, destW, destH) {
  const r = 12;
  ctx.save();
  ctx.shadowColor  = 'rgba(0,0,0,0.60)';
  ctx.shadowBlur   = 44;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, destX, destY, destW, destH, r); ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, destX, destY, destW, destH, r); ctx.clip();
  ctx.drawImage(popupImg, destX, destY, destW, destH);
  ctx.restore();
}

// ── Save as 24-bit RGB PNG ─────────────────────────────────────────────────────

function saveRGB(canvas, outPath) {
  const rgb  = createCanvas(canvas.width, canvas.height);
  const rctx = rgb.getContext('2d');
  rctx.fillStyle = '#0b0f1a'; rctx.fillRect(0, 0, canvas.width, canvas.height);
  rctx.drawImage(canvas, 0, 0);
  fs.writeFileSync(outPath, rgb.toBuffer('image/png'));
  console.log(`Saved ${outPath}`);
}

// ── Small tile: 440×280 ───────────────────────────────────────────────────────

async function genSmall(iconImg, outPath) {
  const W = 440, H = 280;
  const BRAND_W = 164, SCENE_X = BRAND_W + 8;

  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  drawBackground(ctx, W, H, SCENE_X);

  const iconSz = 80, textGap = 24, fontSize = 15;
  const brandH = iconSz + textGap + fontSize * 2 + 3;
  const brandCY = Math.round((H - brandH) / 2 + iconSz / 2);
  drawBrand(ctx, iconImg, Math.round(BRAND_W / 2), brandCY, iconSz, fontSize, textGap);

  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(SCENE_X - 3, 22); ctx.lineTo(SCENE_X - 3, H - 22); ctx.stroke();

  const sceneW = W - SCENE_X;
  const block = drawArticlePage(ctx, SCENE_X + 6, 18, sceneW - 18, H - 36, 0.84);

  drawPickHighlight(ctx, block.hx, block.hy, block.hw, block.hh, 'Click to copy', 9);
  drawCursor(ctx, block.hx + block.hw * 0.65, block.hy + block.hh * 0.55, 18);

  saveRGB(canvas, outPath);
}

// ── Marquee tile: 1400×560 ────────────────────────────────────────────────────

async function genMarquee(iconImg, popupBuffer, outPath) {
  const W = 1400, H = 560;
  const BRAND_W = 340, SCENE_X = BRAND_W + 14;

  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  drawBackground(ctx, W, H, SCENE_X);

  const iconSz = 130, textGap = 28, fontSize = 28;
  const brandH = iconSz + textGap + fontSize * 2 + 3;
  const brandCY = Math.round((H - brandH) / 2 + iconSz / 2);
  drawBrand(ctx, iconImg, Math.round(BRAND_W / 2), brandCY, iconSz, fontSize, textGap);

  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(SCENE_X - 6, 34); ctx.lineTo(SCENE_X - 6, H - 34); ctx.stroke();

  const RIGHT_PAD = 28, interGap = 50;
  const available = W - SCENE_X - 8 - RIGHT_PAD - interGap;
  const pageW  = Math.round(available * 49 / 95);
  const popupW = available - pageW;
  const pageX  = SCENE_X + 8, pageY = 28, pageH = H - 56;
  const popupX = pageX + pageW + interGap, popupY = 28, popupH = H - 56;

  const block = drawArticlePage(ctx, pageX, pageY, pageW, pageH, 1.6);
  drawPickHighlight(ctx, block.hx, block.hy, block.hw, block.hh, 'Click to copy', 14);
  drawCursor(ctx, block.hx + block.hw * 0.68, block.hy + block.hh * 0.52, 30);

  const popupImg = await loadImage(popupBuffer);
  drawPopupScreenshot(ctx, popupImg, popupX, popupY, popupW, popupH);

  saveRGB(canvas, outPath);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const iconImg = await loadImage(ICON_PATH);

  console.log('Generating promo-small.png (440×280)…');
  await genSmall(iconImg, path.join(OUT_DIR, 'promo-small.png'));

  console.log('Taking Playwright screenshot of COPIED popup…');
  const popupBuffer = await screenshotCopiedPopup();

  console.log('Generating promo-marquee.png (1400×560)…');
  await genMarquee(iconImg, popupBuffer, path.join(OUT_DIR, 'promo-marquee.png'));

  console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
