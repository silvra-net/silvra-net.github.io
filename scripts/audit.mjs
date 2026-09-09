import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = process.env.BASE ?? "https://silvra.net";
const PAGES = ["/", "/messenger", "/helix", "/mission", "/contact", "/impressum", "/privacy/"];
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "phone", width: 390, height: 844 },
];

/** Relative luminance per WCAG 2.1. */
function lum([r, g, b]) {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

const browser = await chromium.launch({ channel: "chromium" });
const findings = [];
const add = (kind, where, detail) => findings.push({ kind, where, detail });

for (const theme of ["dark", "light"]) {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: vp, colorScheme: theme });
    const page = await ctx.newPage();

    for (const path of PAGES) {
      const where = `${theme}/${vp.name}${path}`;
      const errs = [];
      page.on("pageerror", (e) => errs.push(e.message));
      page.on("console", (m) => m.type() === "error" && errs.push(m.text()));

      const t0 = Date.now();
      await page.goto(BASE + path, { waitUntil: "load" });
      const load = Date.now() - t0;
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += innerHeight) {
          scrollTo(0, y); await new Promise((r) => setTimeout(r, 80));
        }
        scrollTo(0, 0);
      });
      await page.waitForTimeout(1200);

      if (load > 3000) add("slow", where, `${load} ms bis load`);
      for (const e of errs.slice(0, 2)) add("console", where, e.slice(0, 140));

      const report = await page.evaluate(() => {
        const out = { overflow: false, small: [], unnamed: [], noAlt: [], headings: [], texts: [], focusless: [], unmeasured: 0 };
        out.overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;

        const vis = (el) => {
          const r = el.getBoundingClientRect();
          const s = getComputedStyle(el);
          return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
        };

        for (const el of document.querySelectorAll("a, button, input, select, [role=button]")) {
          if (!vis(el)) continue;
          const r = el.getBoundingClientRect();
          const name = (el.getAttribute("aria-label") || el.innerText || el.value || el.title || "").trim();
          const tag = `${el.tagName.toLowerCase()}${el.className ? "." + String(el.className).split(" ")[0] : ""}`;
          if (r.width < 24 || r.height < 24) out.small.push(`${tag} ${Math.round(r.width)}x${Math.round(r.height)} "${name.slice(0, 24)}"`);
          if (!name) out.unnamed.push(tag);
        }

        for (const img of document.querySelectorAll("img")) {
          if (vis(img) && img.getAttribute("alt") === null) out.noAlt.push(img.src.split("/").pop());
        }

        const hs = [...document.querySelectorAll("h1,h2,h3,h4")].filter(vis).map((h) => +h.tagName[1]);
        out.headings = hs;

        /*
          Resolving a colour by regex was wrong twice over: `color-mix()` and `color(srgb …)`
          come back in forms whose numbers are not 0-255 channels, and a background with alpha
          has to be composited onto what is behind it rather than read as opaque. Letting a
          canvas normalise the string fixes the first; walking the ancestors with alpha fixes
          the second.
        */
        const cvs = document.createElement("canvas").getContext("2d");
        /*
          Returns null when the string cannot be resolved, and null then skips the element.
          A canvas silently keeps its previous fillStyle for anything it does not understand,
          so an unsupported `color-mix()` reads back as whatever was set last — which is how a
          brand name on a white header measured 1.08:1 against black.
        */
        const rgba = (css) => {
          if (!css) return null;
          const srgb = css.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/);
          if (srgb) return [+srgb[1] * 255, +srgb[2] * 255, +srgb[3] * 255, srgb[4] === undefined ? 1 : +srgb[4]];
          const plain = css.match(/^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
          if (plain) return [+plain[1], +plain[2], +plain[3], plain[4] === undefined ? 1 : +plain[4]];
          const SENTINEL = "#123456";
          cvs.fillStyle = SENTINEL;
          cvs.fillStyle = css;
          if (cvs.fillStyle === SENTINEL) return null; // not understood, do not guess
          const v = cvs.fillStyle;
          if (v.startsWith("#")) {
            const h = v.slice(1);
            return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16), 1];
          }
          const n = (v.match(/[\d.]+/g) || []).map(Number);
          return [n[0]||0, n[1]||0, n[2]||0, n[3] ?? 1];
        };
        const bgOf = (el) => {
          const layers = [];
          for (let n = el; n; n = n.parentElement) {
            const c = rgba(getComputedStyle(n).backgroundColor);
            if (c === null) return null; // an unresolvable layer makes the whole stack a guess
            layers.push(c);
          }
          layers.push([255, 255, 255, 1]);
          let out = null;
          for (let i = layers.length - 1; i >= 0; i--) {
            const c = layers[i];
            if (c[3] === 0) continue;
            out = out === null ? c.slice(0, 3) : c.slice(0, 3).map((v, k) => v * c[3] + out[k] * (1 - c[3]));
          }
          return out.map(Math.round);
        };
        const seen = new Set();
        for (const el of document.querySelectorAll("p, span, a, li, dd, dt, h1, h2, h3, td, th, button, small")) {
          if (!vis(el) || !el.innerText || el.innerText.trim().length < 3) continue;
          if (el.children.length > 0 && el.innerText !== el.firstChild?.textContent) continue;
          // The hero and page headers paint their ground in a pseudo-element (scrim, dot grid)
          // and over video, none of which an ancestor walk can see. Measured by eye instead.
          if (el.closest(".hero, .page-header, .split-media")) continue;
          const s = getComputedStyle(el);
          const fill = rgba(s.color);
          // A transparent fill with a stroke is a drawn outline, not invisible text.
          const stroke = parseFloat(s.webkitTextStrokeWidth) || 0;
          const fg = fill[3] === 0 && stroke > 0 ? rgba(s.webkitTextStrokeColor) : fill;
          if (fg === null || fg[3] === 0) continue;
          const bg = bgOf(el);
          if (bg === null) { out.unmeasured = (out.unmeasured || 0) + 1; continue; }
          const key = `${fg}|${bg}|${s.fontSize}|${s.fontWeight}`;
          if (seen.has(key)) continue;
          seen.add(key);
          out.texts.push({ color: fg.slice(0, 3), bg, size: parseFloat(s.fontSize),
                           weight: +s.fontWeight || 400, sample: el.innerText.trim().slice(0, 32),
                           sel: el.tagName.toLowerCase() + (el.className ? "." + String(el.className).split(" ")[0] : "") });
        }
        return out;
      });

      if (report.overflow) add("overflow", where, "Seite scrollt seitwärts");
      if (report.unmeasured) add("nichtmessbar", where, `${report.unmeasured} Elemente mit nicht auflösbarem Hintergrund`);
      if (vp.name === "phone") for (const s of [...new Set(report.small)].slice(0, 8)) add("touch", where, s);
      for (const u of [...new Set(report.unnamed)].slice(0, 4)) add("unnamed", where, u);
      for (const a of [...new Set(report.noAlt)].slice(0, 4)) add("alt", where, a);

      const hs = report.headings;
      if (hs.length && hs[0] !== 1) add("heading", where, `beginnt mit h${hs[0]} statt h1`);
      if (hs.filter((h) => h === 1).length > 1) add("heading", where, `${hs.filter((h) => h === 1).length} h1 auf einer Seite`);
      for (let i = 1; i < hs.length; i++) if (hs[i] - hs[i - 1] > 1) add("heading", where, `h${hs[i - 1]} → h${hs[i]} übersprungen`);

      for (const t of report.texts) {
        const r = ratio(t.color, t.bg);
        const large = t.size >= 24 || (t.size >= 18.66 && t.weight >= 700);
        const need = large ? 3 : 4.5;
        if (r < need) add("contrast", where, `${r.toFixed(2)}:1 (nötig ${need}) ${t.size}px "${t.sample}"`);
      }
    }
    await ctx.close();
  }
}

await browser.close();
writeFileSync("audit.json", JSON.stringify(findings, null, 1));
const by = {};
for (const f of findings) (by[f.kind] ??= []).push(f);
for (const [k, v] of Object.entries(by).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n### ${k} (${v.length})`);
  for (const f of v.slice(0, 8)) console.log(`  ${f.where}: ${f.detail}`);
  if (v.length > 8) console.log(`  … ${v.length - 8} weitere`);
}
console.log(`\ngesamt: ${findings.length}`);
