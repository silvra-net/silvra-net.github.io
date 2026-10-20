import React from "react";
import { flushSync } from "react-dom";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { I18nProvider } from "./i18n";
import { langOf, pagePath, routeOf } from "./lib/routes";
import type { Lang } from "./lib/routes";
import "./styles/fonts.css";
import "./styles.css";

const root = document.getElementById("root")!;
const { pathname } = window.location;
const html = document.documentElement;

// A path that is no page has no language in its address. Under /en/ the not-found page is English;
// elsewhere it is in the language the head script chose for this visitor (scripts/lang-script.mjs
// leaves it on <html>), or German where the script made no choice — for a crawler, say.
const page = routeOf(pathname);
const notFound: Lang = langOf(pathname) === "en" || html.dataset.langPref === "en" ? "en" : "de";
const lang: Lang = page ? page.lang : notFound;

// A prerendered page carries its markup, the route it was rendered for and the language it was
// rendered in; it is hydrated, so nothing on screen is thrown away and redrawn. Markup for another
// route or another language is replaced instead: a host that answers an unknown path with the home
// page, the not-found page (built once, in both languages, for a reader without JavaScript), or
// an empty root (the dev server). The not-found page is rendered for any path that is not a page,
// hence "*".
const route = root.dataset.route;
const matches = route === "*" ? !page : route !== undefined && pagePath(route) === pagePath(pathname);
const hydrate = root.hasChildNodes() && matches && html.dataset.prerendered === lang;

const app = (
  <React.StrictMode>
    <BrowserRouter>
      <I18nProvider notFound={notFound}>
        <App />
      </I18nProvider>
    </BrowserRouter>
  </React.StrictMode>
);

if (hydrate) ReactDOM.hydrateRoot(root, app);
else {
  // Drawn at once, and only then shown: the head script holds back the not-found page as built
  // (<html data-lang-wait>), so its two-language version never flashes up first.
  const fresh = ReactDOM.createRoot(root);
  flushSync(() => fresh.render(app));
  if (html.hasAttribute("data-lang-wait")) {
    html.removeAttribute("data-lang-wait");
    html.style.visibility = "";
  }
}
// The bundle is running: from here the reveals are driven by their own observers, so the
// stylesheet's timed fallback (for a bundle that never arrives) stands down.
html.classList.add("app");
