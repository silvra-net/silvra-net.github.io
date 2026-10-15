import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROUTES, counterpart, langOf, routeOf } from "../lib/routes";

/**
 * src/routes.json is the one list of pages: the router, every link, the language switch, the
 * prerender, the sitemap, the head script and the checks all read it. A page missing a language,
 * or an address written differently from how Pages serves it, would break all of them at once.
 */
describe("the route table", () => {
  it("gives every page a German and an English address, each ending in a slash", () => {
    expect(ROUTES.length).toBeGreaterThanOrEqual(8);
    for (const r of ROUTES) {
      expect(r.key).toMatch(/^[a-z]+$/);
      expect(r.de, r.key).toMatch(/^\/([\w-]+\/)*$/);
      expect(r.en, r.key).toMatch(/^\/en\/([\w-]+\/)*$/);
      expect(r.de.startsWith("/en/"), r.key).toBe(false);
    }
  });

  it("has no key or address twice", () => {
    const all = ROUTES.flatMap((r) => [r.de, r.en]);
    expect(new Set(all).size).toBe(all.length);
    expect(new Set(ROUTES.map((r) => r.key)).size).toBe(ROUTES.length);
  });

  it("keeps the German addresses the site has always had", () => {
    expect(ROUTES.map((r) => r.de)).toEqual([
      "/",
      "/messenger/",
      "/helix/",
      "/mission/",
      "/contact/",
      "/impressum/",
      "/barrierefreiheit/",
      "/privacy/",
    ]);
  });

  it("finds the page and its language at any address, with or without the slash", () => {
    expect(routeOf("/en/legal-notice")?.route.key).toBe("impressum");
    expect(routeOf("/en/legal-notice/")?.lang).toBe("en");
    expect(routeOf("/barrierefreiheit")?.route.key).toBe("accessibility");
    expect(routeOf("/en")?.route.key).toBe("home");
    expect(routeOf("/helix/xyz")).toBeUndefined();
    expect(routeOf("/en/impressum/")).toBeUndefined();
    expect(langOf("/en/xyz")).toBe("en");
    expect(langOf("/english/")).toBe("de");
    expect(counterpart("/impressum/", "en")).toBe("/en/legal-notice/");
    expect(counterpart("/en/accessibility/", "de")).toBe("/barrierefreiheit/");
    expect(counterpart("/en/xyz", "de")).toBe("/");
  });
});

/** Source files outside the tests, with their paths, so a failure names the file. */
function sources(dir: string): [string, string][] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e): [string, string][] => {
    const full = join(dir, e.name);
    if (e.isDirectory()) return e.name === "__tests__" ? [] : sources(full);
    return /\.tsx?$/.test(e.name) ? [[full, readFileSync(full, "utf-8")]] : [];
  });
}

describe("internal links", () => {
  /**
   * Every page exists in two languages, at different addresses, so a path written into a
   * component is right in one of them at most: an English page would lead back into German.
   * Links take their address from the route table through path() (src/i18n), which knows the
   * language on screen.
   */
  it("are never written as a literal path", () => {
    const literal: string[] = [];
    for (const [file, src] of sources(join(__dirname, ".."))) {
      for (const m of src.matchAll(/(?:\bto=\{?|\bto:\s*|navigate\(|href=\{?)["'`](\/[^"'`]*)/g)) {
        literal.push(`${file.split("src")[1]}: ${m[1]}`);
      }
    }
    expect(literal).toEqual([]);
  });
});

describe("the redirect pages for old addresses", () => {
  // Links already in the wild — the Play Store listing among them — must keep working.
  const page = (name: string) => readFileSync(join(__dirname, "..", "..", "public", name, "index.html"), "utf-8");
  it("send /datenschutz to the privacy policy and /kontakt to the contact page", () => {
    expect(page("datenschutz")).toContain('url=/privacy/"');
    expect(page("kontakt")).toContain('url=/contact/"');
  });
});
