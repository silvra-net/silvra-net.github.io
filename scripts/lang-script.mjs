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
//   - a language chosen with the switch (stored as "silvra-lang") wins;
//   - otherwise the browser's languages, in its order: the first that is German or English
//     decides, and a browser that names neither gets English, the language international
//     visitors read;
//   - crawlers and link previews stay, so both languages are indexed as what they are;
//   - location.replace, so the German address never enters the history and Back leaves the site
//     instead of landing on a page that sends the visitor forward again.
//
// The not-found page is not redirected: it has no counterpart. The script leaves its decision on
// <html data-lang-pref>, and src/main.tsx renders the not-found page in that language.

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
        var english = ${JSON.stringify(english)};
        var path = location.pathname.replace(/\\/index\\.html$/, "/");
        if (path.charAt(path.length - 1) !== "/") path += "/";
        if (path.indexOf("/en/") === 0) return;
        var hash = location.hash;
        var go;
        // The privacy page used to hold both languages and showed the English one at #en; links
        // to that half still exist, and they always mean English.
        if (path === "/privacy/" && hash === "#en") {
          go = true;
          hash = "";
        } else {
          if (/bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|quora|whatsapp|telegram/i.test(navigator.userAgent || "")) return;
          var lang = null;
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
          document.documentElement.setAttribute("data-lang-pref", lang);
          // A link to the German half of the old privacy page asked for German by name.
          go = lang === "en" && !(path === "/privacy/" && hash === "#de");
        }
        if (go && english[path]) {
          // Hidden until the English page replaces it, so the German one does not flash first.
          document.documentElement.style.visibility = "hidden";
          location.replace(english[path] + location.search + hash);
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
