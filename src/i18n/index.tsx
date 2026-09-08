import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import de from "./de.json";
import en from "./en.json";

export type Lang = "de" | "en";

const DICTS: Record<Lang, unknown> = { de, en };
const KEY = "silvra-lang";

/** Follow the browser unless the visitor has chosen; German is the fallback, not English:
 *  the site is written in German first and translated second. */
function initialLang(): Lang {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === "de" || stored === "en") return stored;
  } catch {
    /* private mode: fall through to the browser preference */
  }
  return navigator.language?.toLowerCase().startsWith("en") ? "en" : "de";
}

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
  setLang: (l: Lang) => void;
  /** A string at `path`. Returns the path itself when missing, so a gap is visible, not blank. */
  t: (path: string, vars?: Record<string, string | number>) => string;
  /** A list at `path`, for sections that render repeated content. */
  list: <T>(path: string) => T[];
  /** The raw value at `path`. For blocks whose sub-keys vary between sections. */
  raw: (path: string) => unknown;
}

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* the choice still applies for this visit */
    }
  }, []);

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

  const value = useMemo(() => ({ lang, setLang, t, list, raw }), [lang, setLang, t, list, raw]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
