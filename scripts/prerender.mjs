// Render every route to a real HTML document at build time.
//
// Each page arrives with its content, its own title and description, a canonical address,
// Open Graph and Twitter tags for link previews, and structured data for search engines — all
// readable without running a line of JavaScript. The bundle then hydrates that markup rather
// than replacing it (src/main.tsx).
//
// The pages are rendered in German, the site's first language; a visitor whose browser prefers
// English is switched right after hydration. Unknown paths still land on 404.html, which is the
// not-found page rendered the same way.
//
// The route list lives in routes.json rather than here, so the test that checks it against the
// router can read it without importing — and running — this script.
//
// It also writes what a static host cannot send as headers: a Content Security Policy and a
// referrer policy on every page (the JS-free /privacy page included), and the sitemap.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SITE = "https://silvra.net";
const dist = "dist";
const routes = JSON.parse(readFileSync(new URL("./routes.json", import.meta.url), "utf-8"));
const { render, dictionaries } = await import(pathToFileURL(resolve("dist-ssr/entry-server.js")).href);
const de = dictionaries.de;
const template = readFileSync(join(dist, "index.html"), "utf-8");
const NODE = "https://node.silvra.net";

/**
 * The policy for a page. Scripts run only from this origin, plus the inline scripts the page
 * itself carries, each allowed by the hash of its exact text — so the hash is computed here,
 * from the built file, and cannot drift from it. JSON-LD blocks are data, not scripts, and need
 * no entry. Styles may be inline: React sets style attributes, and the privacy page is one file.
 * Besides its own origin (robots.txt, which audit tools read from inside the page), the only
 * place the site fetches from is the Helix node. The web app manifest is named on its own,
 * although default-src already covers it, so the policy says plainly where it may come from.
 */
function csp(html, { connect = `'self' ${NODE}` } = {}) {
  const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
    (m) => `'sha256-${createHash("sha256").update(m[1], "utf8").digest("base64")}'`,
  );
  const policy = [
    "default-src 'self'",
    `script-src 'self' ${hashes.join(" ")}`.trim(),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    `connect-src ${connect}`,
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
  // The policy governs only what comes after it, so it goes straight after the charset.
  return html.replace(
    /^([ \t]*)(<meta charset="[^"]+"\s*\/?>)/im,
    `$1$2\n$1<meta http-equiv="Content-Security-Policy" content="${policy}" />` +
      `\n$1<meta name="referrer" content="strict-origin-when-cross-origin" />`,
  );
}

/**
 * The two faces the first screen is set in, requested with the HTML instead of after the
 * stylesheet has been parsed: Barlow Condensed 700 for the headline, Inter for the text. The
 * build manifest (vite.config.ts) maps each source file to its hashed name in dist/assets.
 */
const manifestFile = join(dist, ".vite", "manifest.json");
const manifest = JSON.parse(readFileSync(manifestFile, "utf-8"));
const PRELOAD = [
  "node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-700-normal.woff2",
  "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
].map((src) => {
  const file = manifest[src]?.file;
  if (!file) throw new Error(`prerender: ${src} is not in the build manifest`);
  return `<link rel="preload" href="/${file}" as="font" type="font/woff2" crossorigin />`;
});

/** Which dictionary entry and which preview image belong to which page. */
const PAGES = {
  "/": { meta: "home", og: "home", faq: "home.faq.items", live: true },
  "/messenger": { meta: "messenger", og: "messenger", faq: "messenger.faq.items" },
  "/helix": { meta: "helix", og: "helix", faq: "helix.faq.items", live: true },
  "/mission": { meta: "mission", og: "home" },
  "/contact": { meta: "contact", og: "home" },
  "/impressum": { meta: "impressum", og: "home" },
  "/barrierefreiheit": { meta: "accessibility", og: "home" },
};

const get = (path) => path.split(".").reduce((o, k) => (o ? o[k] : undefined), de);
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// JSON inside a script element must not be able to close it.
const ld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Silvra",
  url: `${SITE}/`,
  logo: `${SITE}/favicon.png`,
  email: "info@silvra.net",
  description: get("footer.description"),
  sameAs: ["https://github.com/silvra-net", "https://discord.gg/98gZj6TqVv"],
};

function structured(route, page) {
  const out = [];
  if (route === "/") {
    out.push(organization);
    out.push({ "@context": "https://schema.org", "@type": "WebSite", name: "Silvra", url: `${SITE}/`, inLanguage: ["de", "en"] });
  }
  if (route === "/messenger") {
    out.push({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Silvra Messenger",
      operatingSystem: "Android",
      applicationCategory: "CommunicationApplication",
      description: get("meta.messenger.description"),
      installUrl: "https://play.google.com/store/apps/details?id=net.silvra.spark",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      publisher: { "@type": "Organization", name: "Silvra", url: `${SITE}/` },
    });
  }
  if (route === "/helix") {
    out.push({
      "@context": "https://schema.org",
      "@type": "SoftwareSourceCode",
      name: "Helix",
      description: get("meta.helix.description"),
      codeRepository: "https://github.com/silvra-net/helix",
      license: "https://opensource.org/licenses/MIT",
      programmingLanguage: "Rust",
      publisher: { "@type": "Organization", name: "Silvra", url: `${SITE}/` },
    });
  }
  if (page.faq) {
    out.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: get(page.faq).map((it) => ({
        "@type": "Question",
        name: it.q,
        acceptedAnswer: { "@type": "Answer", text: it.a },
      })),
    });
  }
  return out;
}

function documentFor(route, { title, description, og, ogAlt, canonical, noindex, live, structuredData }) {
  const head = [
    ...PRELOAD,
    // The live panels ask the node for its status as soon as the page runs; the connection is
    // opened while the bundle is still loading.
    live ? `<link rel="preconnect" href="${NODE}" crossorigin />` : "",
    // A page kept out of the index names no canonical address of its own.
    noindex ? "" : `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Silvra" />`,
    `<meta property="og:locale" content="de_DE" />`,
    `<meta property="og:locale:alternate" content="en_GB" />`,
    noindex ? "" : `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:image" content="${SITE}/og/${og}.jpg" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:type" content="image/jpeg" />`,
    `<meta property="og:image:alt" content="${esc(ogAlt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${SITE}/og/${og}.jpg" />`,
    `<meta name="twitter:image:alt" content="${esc(ogAlt)}" />`,
    noindex ? `<meta name="robots" content="noindex" />` : "",
    ...structuredData.map(ld),
  ]
    .filter(Boolean)
    .join("\n    ");

  return csp(template)
    .replace('<html lang="de">', '<html lang="de" data-prerendered="de">')
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${esc(description)}" />`)
    .replace("</head>", `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root" data-route="${route === "/404" ? "*" : route}">${render(route)}</div>`);
}

let count = 0;
for (const route of ["/", ...routes]) {
  const page = PAGES[route];
  if (!page) throw new Error(`prerender: no page entry for ${route}`);
  const html = documentFor(route, {
    title: get(`meta.${page.meta}.title`),
    description: get(`meta.${page.meta}.description`),
    og: page.og,
    ogAlt: get(`meta.${page.meta}.ogAlt`),
    canonical: route === "/" ? `${SITE}/` : `${SITE}${route}/`,
    live: page.live,
    structuredData: structured(route, page),
  });
  const dir = route === "/" ? dist : join(dist, route);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
  count++;
}

// Anything genuinely unknown lands here, still answered as a 404 by Pages.
writeFileSync(
  join(dist, "404.html"),
  documentFor("/404", {
    title: get("meta.notFound.title"),
    description: get("meta.notFound.description"),
    og: "home",
    ogAlt: get("meta.notFound.ogAlt"),
    noindex: true,
    structuredData: [],
  }),
);

// The static privacy page carries an inline script of its own (the theme), so it gets its own
// policy with that script's hash. It talks to nothing but its own origin.
const privacy = join(dist, "privacy", "index.html");
if (existsSync(privacy)) writeFileSync(privacy, csp(readFileSync(privacy, "utf-8"), { connect: "'self'" }));

// Every indexable page, with the address it is served at and the day this build was made.
const today = new Date().toISOString().slice(0, 10);
const urls = ["/", ...routes.map((r) => `${r}/`), "/privacy/"];
writeFileSync(
  join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`,
);

// The server bundle was only needed to render the pages above, the manifest only to find the
// fonts; neither belongs on the site.
rmSync("dist-ssr", { recursive: true, force: true });
rmSync(join(dist, ".vite"), { recursive: true, force: true });

console.log(`prerender: ${count} pages + 404.html, each with content, meta and structured data; sitemap with ${urls.length} URLs`);
