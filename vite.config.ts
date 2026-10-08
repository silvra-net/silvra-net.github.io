import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Published at the root of silvra.net, so no base path. Everything under public/ is copied
// verbatim — that is how the /explorer and /datenschutz redirects and the JS-free /privacy page
// survive a rebuild.
export default defineConfig({
  plugins: [react()],
  server: { port: 5273, strictPort: true },
  // The footer's copyright year, fixed at build time for the client and the prerender alike, so
  // hydration never compares two different years. The deploy workflow rebuilds every 1 January.
  define: { __BUILD_YEAR__: JSON.stringify(new Date().getFullYear()) },
  // The manifest tells scripts/prerender.mjs which hashed font files to preload.
  build: { target: "es2021", outDir: "dist", manifest: true },
});
