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

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SITE = "https://silvra.net";
const dist = "dist";
const routes = JSON.parse(readFileSync(new URL("./routes.json", import.meta.url), "utf-8"));
const { render, dictionaries } = await import(pathToFileURL(resolve("dist-ssr/entry-server.js")).href);
const de = dictionaries.de;
const template = readFileSync(join(dist, "index.html"), "utf-8");

/** Which dictionary entry and which preview image belong to which page. */
const PAGES = {
  "/": { meta: "home", og: "home", faq: "home.faq.items" },
  "/messenger": { meta: "messenger", og: "messenger", faq: "messenger.faq.items" },
  "/helix": { meta: "helix", og: "helix", faq: "helix.faq.items" },
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

function documentFor(route, { title, description, og, canonical, noindex, structuredData }) {
  const head = [
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Silvra" />`,
    `<meta property="og:locale" content="de_DE" />`,
    `<meta property="og:locale:alternate" content="en_GB" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:image" content="${SITE}/og/${og}.jpg" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:type" content="image/jpeg" />`,
    `<meta property="og:image:alt" content="${esc(title)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${SITE}/og/${og}.jpg" />`,
    noindex ? `<meta name="robots" content="noindex" />` : "",
    ...structuredData.map(ld),
  ]
    .filter(Boolean)
    .join("\n    ");

  return template
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
    canonical: route === "/" ? `${SITE}/` : `${SITE}${route}/`,
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
    canonical: `${SITE}/`,
    noindex: true,
    structuredData: [],
  }),
);

// The server bundle was only needed to render the pages above.
rmSync("dist-ssr", { recursive: true, force: true });

console.log(`prerender: ${count} pages + 404.html, each with content, meta and structured data`);
