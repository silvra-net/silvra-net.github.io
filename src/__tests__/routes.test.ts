import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import routes from "../../scripts/routes.json";

/**
 * The build writes one directory per route so Pages answers 200 instead of 404. That list lives
 * in scripts/routes.json and the real one lives in the router, so a page added to the app but
 * not to the list would quietly go back to answering 404 — which is exactly what this guards.
 */
describe("prerendered routes", () => {
  const app = readFileSync(join(__dirname, "..", "App.tsx"), "utf-8");
  const inRouter = [...app.matchAll(/<Route\s+path="([^"*]+)"/g)]
    .map((m) => m[1])
    .filter((p) => p !== "/");

  it("match the routes the router declares", () => {
    expect([...routes].sort()).toEqual([...inRouter].sort());
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
   * Pages serves every page at /page/ and answers /page with a redirect to it. A link without
   * the slash costs every visitor that extra round trip, and hands crawlers two addresses for one
   * page, so each one is written the way it is served.
   */
  it("end the path in a slash", () => {
    const bare: string[] = [];
    for (const [file, src] of sources(join(__dirname, ".."))) {
      for (const m of src.matchAll(/(?:\bto=\{?|\bto:\s*|navigate\(|href=\{?)["'`](\/[\w$\-{}]+)(?=["'`#?])/g)) {
        bare.push(`${file.split("src")[1]}: ${m[1]}`);
      }
    }
    expect(bare).toEqual([]);
  });
});
