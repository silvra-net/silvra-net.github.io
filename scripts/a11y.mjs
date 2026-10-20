// Check every page against WCAG 2.2 A and AA with axe-core, in both themes, both languages, at
// desktop and phone width. Exits non-zero on any violation, so it can gate a release.
//
// Runs against a served build:
//
//   npm run build && npx vite preview &
//   node scripts/a11y.mjs                       (BASE defaults to http://127.0.0.1:4173)
//   CHROMIUM=/path/to/chrome node scripts/a11y.mjs
//
// Every page is checked twice. Once with motion reduced: content that fades in on scroll is then
// on screen from the start, so axe measures the colours a reader sees rather than a half-faded
// element. And once with motion on, as most visitors see the site: the page is scrolled through
// first, so every reveal has played, and axe then measures it with the canvases and the marquee
// running behind the text.
//
// Each language is visited at its own addresses (src/routes.json) by a browser set to that
// language: a German address opened by an English browser would be sent to /en/ by the head
// script, and the German pass would quietly check English pages twice.
//
// The pages carry a Content Security Policy that would refuse the injected axe script, so the
// browser is told to bypass it; the policy itself is not under test here.

import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf-8");
const BASE = process.env.BASE ?? "http://127.0.0.1:4173";
const ROUTES = JSON.parse(readFileSync(new URL("../src/routes.json", import.meta.url), "utf-8"));
// Every page of the table, the static privacy pages included, and the not-found page: Pages serves
// 404.html for any unknown path, and the bundle redraws it in English under /en/.
const PAGES = {
  de: [...ROUTES.map((r) => r.de), "/404.html"],
  en: [...ROUTES.map((r) => r.en), "/en/not-a-page/"],
};
const LOCALES = { de: "de-DE", en: "en-US" };
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "phone", width: 390, height: 844, isMobile: true, hasTouch: true },
];
const THEMES = ["dark", "light"];
const PASSES = [
  { name: "still", reducedMotion: "reduce" },
  { name: "moving", reducedMotion: "no-preference" },
];
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];
// Still marked experimental in axe, so off unless asked for: a control whose visible words are
// not part of its accessible name cannot be operated by voice (WCAG 2.5.3).
const RULES = { "label-content-name-mismatch": { enabled: true } };

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const found = new Map(); // rule id → { help, impact, where: Set }

async function check({ theme, viewport: { name, ...vp }, lang, pass }) {
  const locale = LOCALES[lang];
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: vp.isMobile,
    hasTouch: vp.hasTouch,
    colorScheme: theme,
    reducedMotion: pass.reducedMotion,
    locale,
    bypassCSP: true,
  });
  const page = await ctx.newPage();
  for (const path of PAGES[lang]) {
    await page.goto(BASE + path, { waitUntil: "load" });
    await page.waitForTimeout(600);
    // A page that sent the browser elsewhere was not the page meant to be checked.
    const landed = new URL(page.url()).pathname;
    if (landed !== new URL(BASE + path).pathname) throw new Error(`a11y: ${locale} ${path} was redirected to ${landed}`);
    if (pass.name === "moving") {
      // Down the page a screen-ish at a time, pausing long enough for each reveal to start.
      for (let y = 0; ; y += 600) {
        const end = await page.evaluate((top) => {
          window.scrollTo({ top, behavior: "instant" });
          return top >= document.documentElement.scrollHeight - window.innerHeight;
        }, y);
        await page.waitForTimeout(300);
        if (end) break;
      }
      await page.waitForTimeout(900);
      // Entrance animations that end (a reveal, a new block sliding in) are waited out, so axe
      // measures where they land rather than a frame in between. Endless loops are left running,
      // and so are scroll-driven ones, which only finish when scrolled through; a few seconds
      // cap the wait in any case.
      await page.evaluate(() =>
        Promise.race([
          Promise.all(
            document
              .getAnimations()
              .filter(
                (a) =>
                  a.playState === "running" &&
                  a.timeline instanceof DocumentTimeline &&
                  Number.isFinite(a.effect?.getTiming().iterations),
              )
              .map((a) => a.finished.catch(() => {})),
          ),
          new Promise((done) => setTimeout(done, 4000)),
        ]),
      );
    }
    await page.addScriptTag({ content: AXE });
    const result = await page.evaluate(
      ([tags, rules]) => window.axe.run(document, { runOnly: { type: "tag", values: tags }, rules, resultTypes: ["violations"] }),
      [TAGS, RULES],
    );
    for (const v of result.violations) {
      const entry = found.get(v.id) ?? { help: v.help, impact: v.impact, where: new Set() };
      for (const node of v.nodes) entry.where.add(`${pass.name}/${locale}/${theme}/${name}${path}  ${node.target.join(" ")}`);
      found.set(v.id, entry);
    }
  }
  await ctx.close();
}

// What axe cannot see, because it needs a resize: a phone menu left open when the window grows
// past the phone layout loses its only close button, and must close itself.
async function menuAfterResize() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: "de-DE" });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "load" });
  await page.click(".nav-toggle");
  await page.waitForTimeout(400);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(600);
  const state = await page.evaluate(() => ({
    menu: !!document.getElementById("mobile-menu")?.checkVisibility(),
    inert: !!document.querySelector("main")?.hasAttribute("inert"),
  }));
  if (state.menu || state.inert) {
    found.set("menu-after-resize", {
      help: "The phone menu stays open, or the page stays inert, after widening past the phone layout",
      impact: "serious",
      where: new Set([`/ 390 → 1280  menu visible: ${state.menu}, main inert: ${state.inert}`]),
    });
  }
  await ctx.close();
}

const runs = PASSES.flatMap((pass) =>
  ["de", "en"].flatMap((lang) => THEMES.flatMap((theme) => VIEWPORTS.map((viewport) => ({ pass, lang, theme, viewport })))),
);
// A few browser contexts at a time: the moving pass waits on every scroll step.
const queue = [...runs];
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (queue.length) await check(queue.shift());
  }),
);
await menuAfterResize();
await browser.close();

if (found.size === 0) {
  console.log(
    `a11y: ${PAGES.de.length} pages × 2 languages × ${THEMES.length} themes × ${VIEWPORTS.length} widths, ` +
      `motion reduced and on — no WCAG 2.2 A/AA violations`,
  );
} else {
  for (const [id, { help, impact, where }] of found) {
    console.log(`\n✗ ${id} (${impact}) — ${help}`);
    const limit = Number(process.env.SHOW ?? 12);
    for (const w of [...where].slice(0, limit)) console.log(`    ${w}`);
    if (where.size > limit) console.log(`    … ${where.size - limit} more`);
  }
  process.exitCode = 1;
}
