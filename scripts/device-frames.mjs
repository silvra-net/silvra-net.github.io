// Put the app's screenshots into a neutral Android frame.
//
// The captures in scripts/screens/ came out of an iPhone mock-up generator — Dynamic Island,
// iPhone side buttons — but Silvra Messenger is an Android app, and a picture of an iPhone says
// otherwise. This keeps every pixel of the app's screen as captured, covers the island with the
// status bar's own colour, and draws a plain graphite frame around it: a punch-hole camera,
// slimmer corners, the buttons on the right edge. No brand, no model.
//
// Run by hand when a screenshot changes; the results in src/assets/ are committed.
//
//   node scripts/device-frames.mjs
//   CHROMIUM=/path/to/chrome node scripts/device-frames.mjs

import { chromium } from "playwright";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

const SRC = "scripts/screens";
const OUT = "src/assets";

// Geometry of the source captures (600 × 1182): where the glass is, and the island on it.
const GLASS = { x: 33, y: 33, w: 534, h: 1115, r: 70 };
// The island, its black surround reaching into an app bar, and the earpiece slit above it.
const ISLAND = { x: 214, y: 33, w: 172, h: 84 };

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage();

for (const file of readdirSync(SRC).filter((f) => f.endsWith(".webp"))) {
  const src = `data:image/webp;base64,${readFileSync(`${SRC}/${file}`).toString("base64")}`;
  const out = await page.evaluate(
    async ({ src, GLASS, ISLAND }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const W = img.width;
      const H = img.height;
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const g = c.getContext("2d");
      const rr = (x, y, w, h, r) => {
        g.beginPath();
        g.roundRect(x, y, w, h, r);
      };

      // The screen, exactly as captured, clipped to the glass.
      g.save();
      rr(GLASS.x, GLASS.y, GLASS.w, GLASS.h, GLASS.r);
      g.clip();
      g.drawImage(img, 0, 0);

      // The island goes: each row of it takes the colour the status bar has just beside it.
      const probe = document.createElement("canvas");
      probe.width = W;
      probe.height = H;
      const p = probe.getContext("2d", { willReadFrequently: true });
      p.drawImage(img, 0, 0);
      for (let y = ISLAND.y; y < ISLAND.y + ISLAND.h; y++) {
        const [r, gg, b] = p.getImageData(ISLAND.x - 20, y, 1, 1).data;
        g.fillStyle = `rgb(${r},${gg},${b})`;
        g.fillRect(ISLAND.x, y, ISLAND.w, 1);
      }

      // A punch-hole camera, centred in the status bar.
      g.fillStyle = "#050505";
      g.beginPath();
      g.arc(W / 2, 58, 11, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "rgba(255,255,255,0.08)";
      g.lineWidth = 1.5;
      g.stroke();
      g.fillStyle = "rgba(90,110,140,0.35)";
      g.beginPath();
      g.arc(W / 2 - 3, 55, 3, 0, Math.PI * 2);
      g.fill();
      g.restore();

      // The frame: graphite, a lighter edge where light would catch it, buttons on the right.
      const fx = GLASS.x - 7;
      const fy = GLASS.y - 7;
      const fw = GLASS.w + 14;
      const fh = GLASS.h + 14;
      g.fillStyle = "#2b2f2a";
      g.fillRect(fx + fw - 2, 300, 6, 96);
      g.fillRect(fx + fw - 2, 430, 6, 58);
      g.lineWidth = 7;
      g.strokeStyle = "#2b2f2a";
      rr(fx + 3.5, fy + 3.5, fw - 7, fh - 7, GLASS.r + 4);
      g.stroke();
      g.lineWidth = 1.5;
      g.strokeStyle = "#5c6359";
      rr(fx + 0.75, fy + 0.75, fw - 1.5, fh - 1.5, GLASS.r + 7);
      g.stroke();
      g.strokeStyle = "#11130f";
      rr(GLASS.x - 0.75, GLASS.y - 0.75, GLASS.w + 1.5, GLASS.h + 1.5, GLASS.r + 1);
      g.stroke();

      return c.toDataURL("image/webp", 0.9);
    },
    { src, GLASS, ISLAND },
  );
  writeFileSync(`${OUT}/${file}`, Buffer.from(out.split(",")[1], "base64"));
  console.log(`frame: ${OUT}/${file}`);
}
await browser.close();
