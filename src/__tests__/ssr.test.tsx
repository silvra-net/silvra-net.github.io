import { afterEach, describe, expect, it, vi } from "vitest";
import routes from "../../scripts/routes.json";
import { render } from "../entry-server";

/**
 * The build renders every page to HTML in Node (scripts/prerender.mjs), with no window, no
 * document and no storage. A component that reaches for one of those while rendering — instead
 * of in an effect — breaks the build; one that renders differently on the server than in the
 * browser breaks hydration. This renders each page the way the build does, in both languages,
 * and fails on either a throw or a warning from React.
 */
describe("server rendering", () => {
  afterEach(() => vi.restoreAllMocks());

  for (const lang of ["de", "en"] as const) {
    for (const route of ["/", ...routes, "/404"]) {
      it(`renders ${route} in ${lang}`, () => {
        const errors = vi.spyOn(console, "error").mockImplementation(() => {});
        const html = render(route, lang);
        expect(errors).not.toHaveBeenCalled();
        expect(html).toMatch(/<h1[\s>]/);
        expect(html).toContain("</footer>");
      });
    }
  }
});

describe("server rendering, as the pages are served", () => {
  // Pages serves every page at /page/, and the build renders it at that address. The header
  // must mark the current page there already: hydration keeps whatever the server wrote.
  for (const route of routes) {
    it(`marks ${route}/ as the current page in the header`, () => {
      const html = render(`${route}/`);
      const link = html.match(new RegExp(`<a[^>]*class="nav-link[^"]*"[^>]*href="${route}/"[^>]*>`))?.[0];
      if (!["/impressum", "/barrierefreiheit"].includes(route)) expect(link).toContain('aria-current="page"');
    });
  }

  // Pages answers an unknown path below a product page (/helix/xyz) with 404.html, rendered as
  // /404. The client must render exactly that markup there, or hydration fails and the page
  // turns into Helix's colours with Helix marked as current.
  it("renders an unknown path below a product page like the not-found page", () => {
    for (const path of ["/helix/xyz", "/messenger/unbekannt/"]) {
      expect(render(path)).toBe(render("/404"));
    }
  });
});

