// The script that sends a visitor to the English site, written once and inlined into the head
// of every page by the build: into the app's template by vite.config.ts and into the static
// privacy page by scripts/prerender.mjs. Both put it where index.html and the privacy source say
// <!--lang-script-->, and the prerender then allows it by the hash of its exact text, as it does
// every inline script.
//
// German is the site's first language and keeps the addresses it always had; English lives under
// /en/. A static host cannot read Accept-Language, so the choice is made here, before the page
// paints:
//
//   - only on German addresses; nothing ever sends a visitor away from /en/;
//   - a language chosen with the switch wins: the script itself stores it as "silvra-lang" when
//     one of the switch's links is clicked, on every page, the static privacy pages included;
//   - otherwise the browser's languages, in its order: the first that is German or English
//     decides, and a browser that names neither gets English, the language international
//     visitors read;
//   - crawlers and link previews stay, so both languages are indexed as what they are;
//   - location.replace, so the German address never enters the history and Back leaves the site
//     instead of landing on a page that sends the visitor forward again.
//
// The not-found page is not redirected: it has no counterpart. The script leaves its decision on
// <html data-lang-pref>, and src/main.tsx renders the not-found page in that language; until it
// has, a not-found page built in the other language is held back (<html data-lang-wait>).

import { readFileSync } from "node:fs";

const ROUTES = JSON.parse(readFileSync(new URL("../src/routes.json", import.meta.url), "utf-8"));

/** The marker in a page's head that the script replaces. */
export const LANG_SCRIPT_MARKER = "<!--lang-script-->";

/** The script's text, without the <script> element around it. Plain ES5: it runs before anything
 *  else, in every browser that reaches the site. */
export function langScript() {
  const english = Object.fromEntries(ROUTES.map((r) => [r.de, r.en]));
  return `
      // Sends a visitor whose browser is not German to the English page (scripts/lang-script.mjs).
      (function () {
        var html = document.documentElement;
        // A language chosen with the switch is stored the moment it is chosen, here rather than
        // by the app: so it holds for a click made before the app has loaded, for a middle click
        // into a new tab, and on the privacy pages, which run no other script.
        function remember(e) {
          if (e.type === "auxclick" && e.button !== 1) return;
          var a = e.target && e.target.closest ? e.target.closest(".lang a[hreflang]") : null;
          var chosen = a && a.getAttribute("hreflang");
          if (chosen !== "de" && chosen !== "en") return;
          try {
            localStorage.setItem("silvra-lang", chosen);
          } catch (err) {
            /* storage blocked: the link still leads to the page in that language */
          }
        }
        document.addEventListener("click", remember, true);
        document.addEventListener("auxclick", remember, true);

        var english = ${JSON.stringify(english)};
        var path = location.pathname.replace(/\\/index\\.html$/, "/");
        if (path.charAt(path.length - 1) !== "/") path += "/";
        var page = !!english[path];
        for (var de in english) if (english[de] === path) page = true;
        var hash = location.hash;
        var lang = "en";
        var go = false;
        if (path.indexOf("/en/") === 0) {
          // Nothing ever sends a visitor away from an English address.
        } else if (path === "/privacy/" && hash === "#en") {
          // The privacy page used to hold both languages and showed the English one at #en; links
          // to that half still exist, and they always mean English.
          go = true;
          hash = "";
        } else {
          if (/bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|quora|whatsapp|telegram/i.test(navigator.userAgent || "")) return;
          lang = null;
          try {
            lang = localStorage.getItem("silvra-lang");
          } catch (e) {
            /* storage blocked: the browser's languages decide */
          }
          if (lang !== "de" && lang !== "en") {
            var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""];
            lang = "en";
            for (var i = 0; i < list.length; i++) {
              var primary = String(list[i]).toLowerCase().split("-")[0];
              if (primary === "de" || primary === "en") {
                lang = primary;
                break;
              }
            }
          }
          html.setAttribute("data-lang-pref", lang);
          // A link to the German privacy page by name (its own switch, an old link to its German
          // half) asked for German.
          go = lang === "en" && !(path === "/privacy/" && hash === "#de");
        }
        if (go && english[path]) {
          // Hidden until the English page replaces it, so the German one does not flash first.
          html.style.visibility = "hidden";
          location.replace(english[path] + location.search + hash);
        } else if (!page && html.getAttribute("data-prerendered") && html.getAttribute("data-prerendered") !== lang) {
          // The not-found page is built once, in German. Where it is to be read in English, it
          // stays hidden until the bundle has drawn it again (src/main.tsx), rather than showing
          // the German one first; and never for long, should the bundle not arrive.
          html.setAttribute("data-lang-wait", "");
          html.style.visibility = "hidden";
          setTimeout(function () {
            html.removeAttribute("data-lang-wait");
            html.style.visibility = "";
          }, 3000);
        }
      })();
    `;
}

/** Put the script in place of the marker; a page without the marker is a build error, not a
 *  page that silently never redirects. */
export function withLangScript(html, where) {
  if (!html.includes(LANG_SCRIPT_MARKER)) throw new Error(`${where}: no ${LANG_SCRIPT_MARKER} in the head`);
  return html.replace(LANG_SCRIPT_MARKER, `<script>${langScript()}</script>`);
}
