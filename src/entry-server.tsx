import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App from "./App";
import { I18nProvider } from "./i18n";
import type { Lang } from "./i18n";
import de from "./i18n/de.json";
import en from "./i18n/en.json";

/**
 * Render one route to HTML at build time. The page arrives with its content already in it —
 * for search engines, for link previews, and for the first paint — and the bundle then hydrates
 * that markup instead of replacing it.
 */
export function render(url: string, lang: Lang = "de"): string {
  return renderToString(
    <I18nProvider initial={lang}>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </I18nProvider>,
  );
}

/** The dictionaries, for the prerender script to read titles, descriptions and FAQs from. */
export const dictionaries = { de, en };
