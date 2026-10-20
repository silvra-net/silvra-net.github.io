import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import de from "./de.json";
import en from "./en.json";
import { langOf, pathFor, routeOf } from "../lib/routes";
import type { Lang, RouteKey } from "../lib/routes";

export type { Lang };

const DICTS: Record<Lang, unknown> = { de, en };

function lookup(dict: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[part];
    return undefined;
  }, dict);
}

function fill(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole,
  );
}

interface I18n {
  lang: Lang;
  /** A string at `path`. Returns the path itself when missing, so a gap is visible, not blank. */
  t: (path: string, vars?: Record<string, string | number>) => string;
  /** A list at `path`, for sections that render repeated content. */
  list: <T>(path: string) => T[];
  /** The raw value at `path`. For blocks whose sub-keys vary between sections. */
  raw: (path: string) => unknown;
  /** The address of a page in the language on screen, optionally at one of its sections. Every
   *  internal link goes through this, so an English page never leads back into German. */
  path: (key: RouteKey, hash?: string) => string;
}

const Ctx = createContext<I18n | null>(null);

/**
 * The language is read from the address — /en/… is English, everything else German — on the
 * server and in the browser alike, so a prerendered page and its hydration always agree. Only a
 * path that is no page has no language of its own: the not-found page is shown in `notFound`,
 * which the browser decides (src/main.tsx) and the build renders as German. Lives inside the
 * router, so it follows every client-side navigation, the language switch included.
 */
export function I18nProvider({ children, notFound = "de" }: { children: ReactNode; notFound?: Lang }) {
  const { pathname } = useLocation();
  const lang: Lang = langOf(pathname) === "en" ? "en" : routeOf(pathname) ? "de" : notFound;

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) => {
      const hit = lookup(DICTS[lang], path);
      if (typeof hit === "string") return fill(hit, vars);
      // Fall back to German before giving up: a missing translation should still read as text.
      const fallback = lookup(DICTS.de, path);
      return typeof fallback === "string" ? fill(fallback, vars) : path;
    },
    [lang],
  );

  const list = useCallback(
    <T,>(path: string): T[] => {
      const hit = lookup(DICTS[lang], path) ?? lookup(DICTS.de, path);
      return Array.isArray(hit) ? (hit as T[]) : [];
    },
    [lang],
  );

  const raw = useCallback(
    (path: string): unknown => lookup(DICTS[lang], path) ?? lookup(DICTS.de, path),
    [lang],
  );

  const path = useCallback(
    (key: RouteKey, hash?: string) => pathFor(key, lang) + (hash ? `#${hash}` : ""),
    [lang],
  );

  const value = useMemo(() => ({ lang, t, list, raw, path }), [lang, t, list, raw, path]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
