// Give every route a real file, so Pages answers 200 instead of 404.
//
// A single-page app on GitHub Pages normally survives deep links through 404.html: the file
// Pages serves for a path that was never built. The content is right, but the status is 404 —
// which is fine for an app and wrong for a public site, because a page that answers 404 is not
// indexed. Writing dist/<route>/index.html makes each route an actual document.
//
// This is not pre-rendering: the HTML is the same shell for every route and the content still
// comes from the bundle. It fixes the status code, not the crawlability of a JS-only page.
//
// The route list lives in routes.json rather than here, so the test that checks it against the
// router can read it without importing — and running — this script.

import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const routes = JSON.parse(readFileSync(new URL("./routes.json", import.meta.url), "utf-8"));
const dist = "dist";
const source = join(dist, "index.html");

for (const route of routes) {
  const dir = join(dist, route);
  mkdirSync(dir, { recursive: true });
  copyFileSync(source, join(dir, "index.html"));
}

// Anything genuinely unknown still lands here, and should still be a 404.
copyFileSync(source, join(dist, "404.html"));

console.log(`prerender: ${routes.length} routes + 404.html`);
