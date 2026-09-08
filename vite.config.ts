import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Published at the root of silvra.net, so no base path. Everything under public/ is copied
// verbatim — that is how /explorer (a separate build) and the JS-free /datenschutz survive
// a rebuild of this app untouched.
export default defineConfig({
  plugins: [react()],
  server: { port: 5273, strictPort: true },
  build: { target: "es2021", outDir: "dist" },
});
