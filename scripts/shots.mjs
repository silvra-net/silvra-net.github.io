// Drive a headless Chromium over the built site and write one screenshot per page per viewport.
//
// A layout cannot be judged from the one window you happen to be sitting at, and neither can a
// theme: the site is dark by default and light from the OS preference, so both are shot. Also
// fails loudly on console errors, because a page that throws still renders something and the
// screenshot alone would not show it.

import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://127.0.0.1:4173";
const OUT = process.env.OUT ?? "shots";

// Every page in both languages (src/routes.json), each shot by a browser set to its language, so
// the head script leaves a German page German instead of sending it to /en/.
const ROUTES = JSON.parse(readFileSync(new URL("../src/routes.json", import.meta.url), "utf-8"));
const LANGS = [
  { lang: "de", locale: "de-DE" },
  { lang: "en", locale: "en-US" },
];
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "narrow", width: 900, height: 800 },
  { name: "phone", width: 390, height: 844 },
];
const THEMES = ["dark", "light"];

mkdirSync(OUT, { recursive: true });

// The default is chrome-headless-shell, which is a separate download; the full Chromium is
// already here and its new headless mode renders the same page.
// CHROMIUM points at a specific browser binary, for machines whose preinstalled Chromium does
// not match the Playwright version in package.json.
const browser = await chromium.launch(
  process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : { channel: "chromium" },
);
const problems = [];

let count = 0;
for (const theme of THEMES) {
  for (const vp of VIEWPORTS) {
    for (const { lang, locale } of LANGS) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: theme,
        deviceScaleFactor: 1,
        locale,
      });
      const page = await ctx.newPage();
      page.on("console", (m) => {
        if (m.type() === "error") problems.push(`${theme}/${vp.name} console: ${m.text()}`);
      });
      page.on("pageerror", (e) => problems.push(`${theme}/${vp.name} pageerror: ${e.message}`));

      for (const path of ROUTES.map((r) => r[lang])) {
        await page.goto(BASE + path, { waitUntil: "load" });

        // Walk the page so lazy images load and Reveal fires; then return to the top for the shot.
        await page.evaluate(async () => {
          const step = window.innerHeight;
          for (let y = 0; y < document.body.scrollHeight; y += step) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 120));
          }
          window.scrollTo(0, 0);
        });
        await page.waitForLoadState("load");
        // Long enough for Reveal's failsafe: a full-page shot never scrolls, so nothing intersects
        // and only the timer makes the lower sections visible.
        await page.waitForTimeout(3500);

        const name = path === "/" ? "home" : path.slice(1, -1).replace(/\//g, "-") || "home";
        await page.screenshot({ path: `${OUT}/${theme}-${vp.name}-${lang}-${name}.png`, fullPage: true });
        count++;

        // A page wider than its viewport is a layout bug, not a style choice.
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        );
        if (overflow) problems.push(`${theme}/${vp.name} ${path}: scrolls sideways`);
      }
      await ctx.close();
    }
  }
}

await browser.close();

if (problems.length) {
  console.error("PROBLEME:\n" + problems.map((p) => "  - " + p).join("\n"));
  process.exit(1);
}
console.log(`ok: ${count} shots in ${OUT}/`);
