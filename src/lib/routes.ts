import table from "../routes.json";

/**
 * Every page of the site in both languages, from src/routes.json. German keeps the addresses the
 * site has always had; English lives under /en/ with English names. The build scripts read the
 * same file (prerender, sitemap, the language script in the head, the checks), so a page exists
 * in one place only.
 */
export type Lang = "de" | "en";
export const LANGS: Lang[] = ["de", "en"];

export type RouteKey =
  | "home"
  | "messenger"
  | "helix"
  | "mission"
  | "contact"
  | "impressum"
  | "accessibility"
  | "privacy";

export interface Route {
  key: RouteKey;
  de: string;
  en: string;
  /** Served as a static page from public/, not by the app; linked with a plain <a>. */
  static?: boolean;
}

export const ROUTES = table as Route[];

/** The pages the app renders itself. */
export const APP_ROUTES = ROUTES.filter((r) => !r.static);

/** The visitor's stored language choice: the head script reads it, the language switch writes it. */
export const LANG_KEY = "silvra-lang";

/** A path without its trailing slash. Pages answers and links every page as /page/, the dev server
 *  and an old bookmark may say /page; both are the same page. */
export const pagePath = (pathname: string) => pathname.replace(/\/+$/, "") || "/";

/** English is everything under /en/; the language comes from the address alone. */
export const langOf = (pathname: string): Lang => (/^\/en(\/|$)/.test(pathname) ? "en" : "de");

/** The page at a path, in either language, with or without the trailing slash. Unknown paths —
 *  /helix/xyz included, which Pages answers with 404.html — have none. */
export function routeOf(pathname: string): { route: Route; lang: Lang } | undefined {
  const page = pagePath(pathname);
  for (const route of ROUTES) {
    if (pagePath(route.de) === page) return { route, lang: "de" };
    if (pagePath(route.en) === page) return { route, lang: "en" };
  }
  return undefined;
}

/** The address of a page in a language. */
export function pathFor(key: RouteKey, lang: Lang): string {
  const route = ROUTES.find((r) => r.key === key);
  if (!route) throw new Error(`no route ${key}`);
  return route[lang];
}

/** The same page in another language; from a page that does not exist, that language's home. */
export function counterpart(pathname: string, lang: Lang): string {
  return routeOf(pathname)?.route[lang] ?? pathFor("home", lang);
}

/** Keep a language the visitor chose, so the head script does not overrule it on the next visit. */
export function rememberLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* storage blocked: the choice still holds for every page reached by a link from here */
  }
}
