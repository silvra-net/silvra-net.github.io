import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
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
