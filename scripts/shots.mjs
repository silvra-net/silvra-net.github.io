// Drive a headless Chromium over the built site and write one screenshot per page per viewport.
//
// A layout cannot be judged from the one window you happen to be sitting at, and neither can a
// theme: the site is dark by default and light from the OS preference, so both are shot. Also
// fails loudly on console errors, because a page that throws still renders something and the
// screenshot alone would not show it.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://127.0.0.1:4173";
const OUT = process.env.OUT ?? "shots";

const PAGES = ["/", "/messenger", "/helix", "/mission", "/contact", "/impressum"];
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "narrow", width: 900, height: 800 },
  { name: "phone", width: 390, height: 844 },
];
const THEMES = ["dark", "light"];

mkdirSync(OUT, { recursive: true });

// The default is chrome-headless-shell, which is a separate download; the full Chromium is
// already here and its new headless mode renders the same page.
const browser = await chromium.launch({ channel: "chromium" });
const problems = [];

for (const theme of THEMES) {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      colorScheme: theme,
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    page.on("console", (m) => {
      if (m.type() === "error") problems.push(`${theme}/${vp.name} console: ${m.text()}`);
    });
    page.on("pageerror", (e) => problems.push(`${theme}/${vp.name} pageerror: ${e.message}`));

    for (const path of PAGES) {
      await page.goto(BASE + path, { waitUntil: "load" });
      // Long enough for Reveal's failsafe: a full-page shot never scrolls, so nothing intersects
      // and only the timer makes the lower sections visible.
      await page.waitForTimeout(3500);

      const name = path === "/" ? "home" : path.slice(1).replace(/\//g, "-");
      await page.screenshot({ path: `${OUT}/${theme}-${vp.name}-${name}.png`, fullPage: true });

      // A page wider than its viewport is a layout bug, not a style choice.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      if (overflow) problems.push(`${theme}/${vp.name} ${path}: scrolls sideways`);
    }
    await ctx.close();
  }
}

await browser.close();

if (problems.length) {
  console.error("PROBLEME:\n" + problems.map((p) => "  - " + p).join("\n"));
  process.exit(1);
}
console.log(`ok: ${PAGES.length * VIEWPORTS.length * THEMES.length} shots in ${OUT}/`);
