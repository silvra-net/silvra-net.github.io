// Render the link-preview images (1200×630, JPEG — small enough for every messenger) into public/og/.
//
// Run by hand when the brand or the copy changes — not part of the build, so a deploy never
// depends on a headless browser. The images use the site's own fonts, marks and screenshots, so
// a link shared anywhere looks like the page it opens.
//
//   node scripts/og.mjs                 (uses Playwright's Chromium)
//   CHROMIUM=/path/to/chrome node scripts/og.mjs

import { chromium } from "playwright";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(".");
const url = (p) => pathToFileURL(resolve(root, p)).href;
const font = (pkg, file) => url(`node_modules/@fontsource-variable/${pkg}/files/${file}`);
const asset = (name) => url(`src/assets/${name}`);

const base = `
@font-face { font-family: U; src: url(${font("unbounded", "unbounded-latin-wght-normal.woff2")}); font-weight: 200 900; }
@font-face { font-family: I; src: url(${font("inter", "inter-latin-wght-normal.woff2")}); font-weight: 100 900; }
@font-face { font-family: T; src: url(${font("inter-tight", "inter-tight-latin-wght-normal.woff2")}); font-weight: 100 900; }
@font-face { font-family: M; src: url(${font("jetbrains-mono", "jetbrains-mono-latin-wght-normal.woff2")}); font-weight: 100 800; }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; overflow: hidden; background: #050506; color: #f4f4f5; font-family: I; position: relative; }
.brand { position: absolute; left: 64px; top: 56px; display: flex; align-items: center; gap: 14px; z-index: 5; }
.brand img { width: 44px; height: 44px; border-radius: 11px; box-shadow: 0 0 0 1px rgba(255,255,255,.22); }
.brand span { font-family: U; font-weight: 500; font-size: 20px; letter-spacing: .3em; }
.label { font-family: M; font-size: 16px; letter-spacing: .18em; text-transform: uppercase; color: #a1a1aa; }
.title { font-family: T; font-weight: 500; letter-spacing: -.025em; line-height: 1.02; }
.metal { background: linear-gradient(100deg,#9aa0a8 0%,#fff 25%,#b9bec6 45%,#f3f4f6 62%,#8a9098 85%,#e9ebee 100%); -webkit-background-clip: text; color: transparent; }
.gold { background: linear-gradient(100deg,#c08328 0%,#ffd892 30%,#e0a44a 55%,#fff0cf 72%,#c8903a 100%); -webkit-background-clip: text; color: transparent; }
.foot { position: absolute; left: 64px; bottom: 52px; font-family: M; font-size: 17px; color: #a1a1aa; letter-spacing: .04em; z-index: 5; text-shadow: 0 0 10px #050506, 0 0 3px #050506; }
canvas { position: absolute; inset: 0; }
`;

// The helix and the cipher field, drawn once — the same geometry as the site's canvases.
const drawing = `
function helix(ctx, cx, cy, R, len, tilt, n) {
  const up = { x: Math.sin(tilt), y: -Math.cos(tilt) }, ac = { x: Math.cos(tilt), y: Math.sin(tilt) };
  const pts = [[], []];
  for (let i = 0; i < n; i++) {
    const s = len / 2 - i * (len / (n - 1));
    for (let k = 0; k < 2; k++) {
      const th = i * 0.36 + 0.9 + k * Math.PI, d = Math.cos(th) * R;
      pts[k].push({ x: cx + up.x * s + ac.x * d, y: cy + up.y * s + ac.y * d, z: Math.sin(th) });
    }
  }
  for (let i = 0; i < n; i++) {
    const a = pts[0][i], b = pts[1][i], f = 1 - Math.abs(a.z);
    ctx.globalAlpha = 0.12 + 0.3 * f; ctx.strokeStyle = "#e0a44a"; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  for (const list of pts) for (let i = 1; i < list.length; i++) {
    const p = list[i - 1], q = list[i], z = (p.z + q.z) / 2;
    ctx.globalAlpha = 0.18 + 0.6 * ((z + 1) / 2); ctx.lineWidth = 1.5 + (z + 1);
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
  }
  for (const list of pts) for (const p of list) {
    const r = 3 + (p.z + 1) * 3.2;
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
    g.addColorStop(0, "rgba(255,214,140,0.95)"); g.addColorStop(0.3, "rgba(224,164,74,0.5)"); g.addColorStop(1, "rgba(224,164,74,0)");
    ctx.globalAlpha = 0.35 + 0.6 * ((p.z + 1) / 2); ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(p.x, p.y, r * 3, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function cipher(ctx, x0, x1, W, H, seed) {
  const G = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  ctx.font = "500 14px M"; ctx.fillStyle = "#d6dbe4"; ctx.textAlign = "center";
  for (let y = 12; y < H; y += 22) for (let x = x0; x < x1; x += 22) {
    if (rnd() < 0.5) continue;
    ctx.globalAlpha = 0.04 + Math.pow(rnd(), 3) * 0.3;
    ctx.fillText(G[(rnd() * G.length) | 0], x, y);
  }
  ctx.globalAlpha = 1;
}
`;

const pages = {
  home: `
    <canvas id="c" width="1200" height="630"></canvas>
    <div class="brand"><img src="${asset("silvra-icon.png")}"><span>SILVRA</span></div>
    <div style="position:absolute;left:64px;top:190px;z-index:5;width:560px">
      <p class="label" style="margin-bottom:22px">Messenger · Helix</p>
      <h1 class="title" style="font-size:60px">Digitale<br>Infrastruktur<br><span class="metal">aus Europa.</span></h1>
    </div>
    <p class="foot">silvra.net · Post-Quanten · Entwickelt in der EU</p>
    <script>
      ${drawing}
      window.ready = document.fonts.load("500 14px M").then(() => {
      const c = document.getElementById("c").getContext("2d");
      const a = 730, b = 610;
      c.fillStyle = "#08090b"; c.beginPath(); c.moveTo(0,0); c.lineTo(a,0); c.lineTo(b,630); c.lineTo(0,630); c.fill();
      const g1 = c.createRadialGradient(300, 420, 0, 300, 420, 520); g1.addColorStop(0,"rgba(200,215,235,.10)"); g1.addColorStop(1,"rgba(0,0,0,0)");
      c.fillStyle = g1; c.fillRect(0,0,700,630);
      cipher(c, 20, 700, 1200, 630, 7);
      c.fillStyle = "#0b0804"; c.beginPath(); c.moveTo(a,0); c.lineTo(1200,0); c.lineTo(1200,630); c.lineTo(b,630); c.fill();
      const g2 = c.createRadialGradient(950, 300, 0, 950, 300, 460); g2.addColorStop(0,"rgba(224,164,74,.28)"); g2.addColorStop(1,"rgba(224,164,74,0)");
      c.fillStyle = g2; c.fillRect(600,0,600,630);
      helix(c, 945, 315, 92, 760, 0.22, 26);
      c.save(); c.filter = "blur(18px)"; c.globalAlpha = .55;
      c.fillStyle = "rgba(205,220,240,.6)"; c.beginPath(); c.moveTo(a-50,0); c.lineTo(a,0); c.lineTo(b,630); c.lineTo(b-50,630); c.fill();
      c.fillStyle = "rgba(224,164,74,.8)"; c.beginPath(); c.moveTo(a,0); c.lineTo(a+50,0); c.lineTo(b+50,630); c.lineTo(b,630); c.fill();
      c.restore();
      c.fillStyle = "#fff"; c.beginPath(); c.moveTo(a-4,0); c.lineTo(a+4,0); c.lineTo(b+4,630); c.lineTo(b-4,630); c.fill();
      });
    </script>`,
  messenger: `
    <canvas id="c" width="1200" height="630"></canvas>
    <div class="brand"><img src="${asset("silvra-icon.png")}"><span>SILVRA</span></div>
    <div style="position:absolute;left:64px;top:178px;z-index:5;width:640px">
      <p class="label" style="margin-bottom:22px">Silvra Messenger</p>
      <h1 class="title metal" style="font-size:52px">Ende-zu-Ende<br>verschlüsselt.<br>Post-Quanten-sicher.</h1>
    </div>
    <p class="foot">MLS · X-Wing (X25519 + ML-KEM-768) · ohne Telefonnummer</p>
    <img src="${asset("Welcome_DE-portrait.webp")}" style="position:absolute;right:70px;top:70px;width:300px;transform:rotate(-6deg);filter:drop-shadow(0 40px 80px rgba(0,0,0,.7)) drop-shadow(0 0 60px rgba(200,215,235,.15));z-index:4">
    <script>
      ${drawing}
      window.ready = document.fonts.load("500 14px M").then(() => {
      const c = document.getElementById("c").getContext("2d");
      const g = c.createRadialGradient(900, 300, 0, 900, 300, 520); g.addColorStop(0,"rgba(200,215,235,.16)"); g.addColorStop(1,"rgba(0,0,0,0)");
      c.fillStyle = g; c.fillRect(0,0,1200,630);
      cipher(c, 640, 1200, 1200, 630, 11);
      });
    </script>`,
  helix: `
    <canvas id="c" width="1200" height="630"></canvas>
    <div class="brand"><img src="${asset("helix-icon.png")}"><span>HELIX</span></div>
    <div style="position:absolute;left:64px;top:186px;z-index:5;width:640px">
      <p class="label" style="margin-bottom:22px;color:#e8b15c">● Mainnet · seit 1.0.0</p>
      <h1 class="title" style="font-size:64px">Post-Quanten-<br><span class="gold">Blockchain.</span></h1>
    </div>
    <p class="foot">ML-DSA-65 auf jeder Signatur · BFT-Finalität ≈ 2 s · Open Source (MIT)</p>
    <script>
      ${drawing}
      window.ready = document.fonts.load("500 14px M").then(() => {
      const c = document.getElementById("c").getContext("2d");
      c.fillStyle = "#070503"; c.fillRect(0,0,1200,630);
      const g = c.createRadialGradient(920, 315, 0, 920, 315, 480); g.addColorStop(0,"rgba(224,164,74,.30)"); g.addColorStop(1,"rgba(224,164,74,0)");
      c.fillStyle = g; c.fillRect(0,0,1200,630);
      helix(c, 930, 315, 118, 820, 0.22, 28);
      });
    </script>`,
};

mkdirSync("public/og", { recursive: true });
// Each template is opened from a file of its own, so it may load the fonts and images from disk.
const scratch = mkdtempSync(join(tmpdir(), "silvra-og-"));
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
for (const [name, body] of Object.entries(pages)) {
  const file = join(scratch, `${name}.html`);
  writeFileSync(file, `<!doctype html><html><head><meta charset="utf-8"><style>${base}</style></head><body>${body}</body></html>`);
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto(pathToFileURL(file).href, { waitUntil: "load" });
  await page.evaluate(() => Promise.all([document.fonts.ready, window.ready]));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `public/og/${name}.jpg`, type: "jpeg", quality: 88 });
  await page.close();
  console.log(`og: public/og/${name}.jpg`);
}
await browser.close();
rmSync(scratch, { recursive: true, force: true });
