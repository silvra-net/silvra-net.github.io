import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App from "./App";
import { I18nProvider } from "./i18n";
import { BothLanguages } from "./pages/NotFound";
import de from "./i18n/de.json";
import en from "./i18n/en.json";

/**
 * Render one route to HTML at build time. The page arrives with its content already in it —
 * for search engines, for link previews, and for the first paint — and the bundle then hydrates
 * that markup instead of replacing it. The language follows from the address (/en/… is English).
 * A path that is no page is rendered in German unless it is under /en/. The build renders the
 * not-found page once, at /404, with `bothLanguages`: German and English side by side, for a
 * reader without JavaScript at any unknown address (src/pages/NotFound.tsx).
 */
export function render(url: string, { bothLanguages = false }: { bothLanguages?: boolean } = {}): string {
  return renderToString(
    <StaticRouter location={url}>
      <I18nProvider>
        <BothLanguages.Provider value={bothLanguages}>
          <App />
        </BothLanguages.Provider>
      </I18nProvider>
    </StaticRouter>,
  );
}

/** The dictionaries, for the prerender script to read titles, descriptions and FAQs from. */
export const dictionaries = { de, en };
