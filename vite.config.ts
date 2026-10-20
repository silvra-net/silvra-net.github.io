import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { withLangScript } from "./scripts/lang-script.mjs";

// Published at the root of silvra.net, so no base path. Everything under public/ is copied
// verbatim — that is how the /explorer and /datenschutz redirects survive a rebuild, and how the
// source of the JS-free privacy pages reaches scripts/prerender.mjs, which splits it in two.
export default defineConfig({
  plugins: [
    react(),
    // The head script that sends a non-German browser to /en/ (scripts/lang-script.mjs), in the
    // dev server's page as in the built one.
    { name: "lang-script", transformIndexHtml: (html) => withLangScript(html, "index.html") },
  ],
  server: { port: 5273, strictPort: true },
  // The footer's copyright year as of the build, for the prerender and the first client render
  // alike, so hydration never compares two different years; the footer then reads the clock.
  define: { __BUILD_YEAR__: JSON.stringify(new Date().getFullYear()) },
  // The manifest tells scripts/prerender.mjs which hashed font files to preload.
  build: { target: "es2021", outDir: "dist", manifest: true },
});
