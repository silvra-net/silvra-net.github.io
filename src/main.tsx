import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { I18nProvider } from "./i18n";
// Self-hosted, bundled with the site: no request to a font service, so nothing about a visit
// reaches a third party just to draw the letters.
import "@fontsource-variable/unbounded";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./styles.css";

const root = document.getElementById("root")!;
// A prerendered page carries its markup, the route it was rendered for and the language it was
// rendered in; it is hydrated, so nothing on screen is thrown away and redrawn. Markup for another
// route — a host that answers an unknown path with the home page — is replaced instead, as is an
// empty root (the dev server). The not-found page is rendered for any path, hence "*".
const trim = (path: string) => path.replace(/\/+$/, "") || "/";
const route = root.dataset.route;
const matches = route === "*" || (route !== undefined && trim(route) === trim(window.location.pathname));
const prerendered =
  root.hasChildNodes() && matches ? (document.documentElement.dataset.prerendered as "de" | "en" | undefined) : undefined;

const app = (
  <React.StrictMode>
    <I18nProvider initial={prerendered}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </I18nProvider>
  </React.StrictMode>
);

if (prerendered) ReactDOM.hydrateRoot(root, app);
else ReactDOM.createRoot(root).render(app);
// The bundle is running: from here the reveals are driven by their own observers, so the
// stylesheet's timed fallback (for a bundle that never arrives) stands down.
document.documentElement.classList.add("app");
