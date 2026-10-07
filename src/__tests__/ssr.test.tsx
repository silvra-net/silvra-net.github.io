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
