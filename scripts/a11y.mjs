// Check every page against WCAG 2.2 A and AA with axe-core, in both themes, at desktop and phone
// width. Exits non-zero on any violation, so it can gate a release.
//
// Runs against a served build:
//
//   npm run build && npx vite preview &
//   node scripts/a11y.mjs                       (BASE defaults to http://127.0.0.1:4173)
//   CHROMIUM=/path/to/chrome node scripts/a11y.mjs
//
// Motion is reduced for the run: content that fades in on scroll is then on screen from the start,
// so axe measures the colours a reader sees rather than a half-faded element.

import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf-8");
const BASE = process.env.BASE ?? "http://127.0.0.1:4173";
const routes = JSON.parse(readFileSync(new URL("./routes.json", import.meta.url), "utf-8"));
const PAGES = ["/", ...routes.map((r) => `${r}/`), "/404.html"];
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "phone", width: 390, height: 844, isMobile: true, hasTouch: true },
];
const THEMES = ["dark", "light"];
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const found = new Map(); // rule id → { help, impact, where: Set }

for (const theme of THEMES) {
  for (const { name, ...vp } of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch, colorScheme: theme, reducedMotion: "reduce", locale: "de-DE" });
    const page = await ctx.newPage();
    for (const path of PAGES) {
      await page.goto(BASE + path, { waitUntil: "load" });
      await page.waitForTimeout(600);
      await page.addScriptTag({ content: AXE });
      const result = await page.evaluate(
        (tags) => window.axe.run(document, { runOnly: { type: "tag", values: tags }, resultTypes: ["violations"] }),
        TAGS,
      );
      for (const v of result.violations) {
        const entry = found.get(v.id) ?? { help: v.help, impact: v.impact, where: new Set() };
        for (const node of v.nodes) entry.where.add(`${theme}/${name}${path}  ${node.target.join(" ")}`);
        found.set(v.id, entry);
      }
    }
    await ctx.close();
  }
}
await browser.close();

if (found.size === 0) {
  console.log(`a11y: ${PAGES.length} pages × ${THEMES.length} themes × ${VIEWPORTS.length} widths — no WCAG 2.2 A/AA violations`);
} else {
  for (const [id, { help, impact, where }] of found) {
    console.log(`\n✗ ${id} (${impact}) — ${help}`);
    const limit = Number(process.env.SHOW ?? 12);
    for (const w of [...where].slice(0, limit)) console.log(`    ${w}`);
    if (where.size > limit) console.log(`    … ${where.size - limit} more`);
  }
  process.exitCode = 1;
}
