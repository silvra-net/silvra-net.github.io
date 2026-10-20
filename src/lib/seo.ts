import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useI18n } from "../i18n";
import { routeOf } from "./routes";

const SITE = "https://silvra.net";
const LOCALE = { de: "de_DE", en: "en_GB" } as const;

/** A tag in the head, made if the page has none yet. */
function headTag<T extends HTMLElement>(selector: string, make: () => T): T {
  let tag = document.head.querySelector<T>(selector);
  if (!tag) {
    tag = make();
    document.head.appendChild(tag);
  }
  return tag;
}

const meta = (attr: "name" | "property", key: string) =>
  headTag<HTMLMetaElement>(`meta[${attr}="${key}"]`, () => {
    const tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    return tag;
  });

const link = (rel: string, hreflang?: string) =>
  headTag<HTMLLinkElement>(`link[rel="${rel}"]${hreflang ? `[hreflang="${hreflang}"]` : ""}`, () => {
    const tag = document.createElement("link");
    tag.rel = rel;
    if (hreflang) tag.hreflang = hreflang;
    return tag;
  });

/**
 * Set the document title and meta description for a page, and the head's address and language
 * tags with them.
 *
 * The prerendered head (scripts/prerender.mjs) is what crawlers read. After a navigation inside
 * the site — the language switch among them — the head would still describe the page first
 * loaded; anything that reads the live page (a share sheet, a read-later app) would take that
 * address. So the canonical address, og:url, the alternates and og:locale follow the page here,
 * as the prerender writes them; a path that is no page names no address of its own.
 */
export function useSeo(title: string, description: string): void {
  const { pathname } = useLocation();
  const { lang } = useI18n();
  useEffect(() => {
    document.title = title;
    meta("name", "description").content = description;
    meta("property", "og:locale").content = LOCALE[lang];
    meta("property", "og:locale:alternate").content = LOCALE[lang === "de" ? "en" : "de"];
    const route = routeOf(pathname)?.route;
    if (!route) {
      document.head
        .querySelectorAll('link[rel="canonical"], link[rel="alternate"][hreflang], meta[property="og:url"]')
        .forEach((tag) => tag.remove());
      return;
    }
    link("canonical").href = `${SITE}${route[lang]}`;
    meta("property", "og:url").content = `${SITE}${route[lang]}`;
    link("alternate", "de").href = `${SITE}${route.de}`;
    link("alternate", "en").href = `${SITE}${route.en}`;
    link("alternate", "x-default").href = `${SITE}${route.en}`;
  }, [title, description, pathname, lang]);
}
