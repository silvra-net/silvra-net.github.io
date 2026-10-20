import { afterEach, describe, expect, it, vi } from "vitest";
import { APP_ROUTES, LANGS, ROUTES, counterpart } from "../lib/routes";
import { render } from "../entry-server";
import de from "../i18n/de.json";
import en from "../i18n/en.json";

const DICTS = { de, en };
const get = (lang: "de" | "en", path: string) =>
  path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], DICTS[lang]) as string;
// React writes the attribute as hrefLang; HTML reads attribute names in any case.
const page = (url: string) => render(url).replace(/\bhrefLang=/g, "hreflang=");
const text = (html: string) => html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/⁠/g, "");

/**
 * The build renders every page to HTML in Node (scripts/prerender.mjs), with no window, no
 * document and no storage. A component that reaches for one of those while rendering — instead
 * of in an effect — breaks the build; one that renders differently on the server than in the
 * browser breaks hydration. This renders each page the way the build does, at both its addresses,
 * and fails on either a throw or a warning from React.
 */
describe("server rendering", () => {
  afterEach(() => vi.restoreAllMocks());

  for (const route of APP_ROUTES) {
    for (const lang of LANGS) {
      it(`renders ${route[lang]}`, () => {
        const errors = vi.spyOn(console, "error").mockImplementation(() => {});
        const html = render(route[lang]);
        expect(errors).not.toHaveBeenCalled();
        expect(html).toMatch(/<h1[\s>]/);
        expect(html).toContain("</footer>");
      });
    }
  }

  it("renders the not-found page", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(render("/404")).toContain(get("de", "notFound.cta"));
    expect(errors).not.toHaveBeenCalled();
  });
});

describe("each page in its language", () => {
  // What the h1 says, per page, in the dictionary. The messenger's h1 is its name alone, the same
  // in both languages, so the lead right under it stands in.
  const HEADING: Record<string, string> = {
    home: "home.gate.claim",
    messenger: "messenger.hero.lead",
    helix: "helix.titleSub",
    mission: "mission.title",
    contact: "contact.title",
    impressum: "impressum.title",
    accessibility: "accessibility.title",
  };

  for (const route of APP_ROUTES) {
    for (const lang of LANGS) {
      const html = page(route[lang]);
      const h1 = text(html.match(/<h1[\s\S]*?<\/h1>/)![0]);

      it(`${route[lang]} is written in ${lang}`, () => {
        const want = get(lang, HEADING[route.key]).replace(/⁠/g, "");
        const avoid = get(lang === "de" ? "en" : "de", HEADING[route.key]).replace(/⁠/g, "");
        const where = route.key === "messenger" ? text(html) : h1;
        expect(where).toContain(want);
        expect(where).not.toContain(avoid);
      });

      it(`${route[lang]} links only to pages in ${lang}, apart from the language switch`, () => {
        const links = [...html.matchAll(/<a\b[^>]*>/g)].map((m) => m[0]);
        const internal = links
          .filter((a) => !a.includes("hreflang="))
          .map((a) => a.match(/href="([^"]*)"/)?.[1] ?? "")
          .filter((href) => href.startsWith("/"));
        expect(internal.length).toBeGreaterThan(8);
        for (const href of internal) {
          if (lang === "en") expect(href, href).toMatch(/^\/en\//);
          else expect(href, href).not.toMatch(/^\/en(\/|$)/);
        }
        // The privacy policy is a static page, linked in the page's language as well.
        expect(internal).toContain(ROUTES.find((r) => r.key === "privacy")![lang]);
      });

      it(`${route[lang]} offers the same page in the other language`, () => {
        const pair = [...html.matchAll(/<a\b[^>]*hreflang="(de|en)"[^>]*>/g)].map((m) => m[0]);
        expect(pair).toHaveLength(2);
        for (const l of LANGS) {
          const a = pair.find((p) => p.includes(`hreflang="${l}"`))!;
          expect(a).toContain(`href="${route[l]}"`);
          expect(a).toContain(`lang="${l}"`);
          // The name starts with what is written on it (WCAG 2.5.3).
          expect(a).toMatch(new RegExp(`aria-label="${l.toUpperCase()}\\b`));
          if (l === lang) expect(a).toContain('aria-current="true"');
          else expect(a).not.toContain("aria-current");
        }
      });

      if (route.key !== "home") {
        it(`${route[lang]} is marked as the current page in the navigation`, () => {
          // Rendered at the address it is served from: hydration keeps whatever the server wrote.
          const current = [...html.matchAll(/<a\b[^>]*aria-current="page"[^>]*>/g)].map((m) => m[0]);
          if (["messenger", "helix", "mission", "contact"].includes(route.key)) {
            expect(current.some((a) => a.includes("nav-link") && a.includes(`href="${route[lang]}"`))).toBe(true);
          }
          for (const a of current) expect(a).toContain(`href="${route[lang]}"`);
        });
      }
    }
  }

  it("pairs the pages whose names differ between the languages", () => {
    const pair = (url: string, lang: string) =>
      page(url).match(new RegExp(`<a\\b[^>]*hreflang="${lang}"[^>]*>`))![0].match(/href="([^"]*)"/)![1];
    expect(pair("/impressum/", "en")).toBe("/en/legal-notice/");
    expect(pair("/en/legal-notice/", "de")).toBe("/impressum/");
    expect(pair("/barrierefreiheit/", "en")).toBe("/en/accessibility/");
    expect(pair("/en/accessibility/", "de")).toBe("/barrierefreiheit/");
    expect(counterpart("/en/legal-notice/", "de")).toBe("/impressum/");
  });
});

describe("the not-found page", () => {
  // Pages answers an unknown path below a product page (/helix/xyz) with 404.html, rendered as
  // /404. The client must render exactly that markup there, or hydration fails and the page
  // turns into Helix's colours with Helix marked as current.
  it("renders an unknown path below a product page like the not-found page", () => {
    for (const path of ["/helix/xyz", "/messenger/unbekannt/"]) {
      expect(render(path)).toBe(render("/404"));
    }
  });

  it("is English under /en/, with English links", () => {
    const html = render("/en/xyz");
    expect(html).toContain(get("en", "notFound.cta"));
    expect(html).toContain('href="/en/messenger/"');
    expect(html).not.toContain('href="/messenger/"');
  });
});
