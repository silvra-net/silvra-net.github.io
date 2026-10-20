// Render every route to a real HTML document at build time.
//
// Each page arrives with its content, its own title and description, a canonical address,
// Open Graph and Twitter tags for link previews, and structured data for search engines — all
// readable without running a line of JavaScript. The bundle then hydrates that markup rather
// than replacing it (src/main.tsx).
//
// Every page exists twice: in German at the address it always had, in English under /en/
// (src/routes.json, which the app reads as well). Each is rendered in its own language with its
// own head, and names the other as its alternate, so search engines index both and show each
// reader theirs. A visitor whose browser is not German is sent to the English page by a script in
// the head (scripts/lang-script.mjs). Unknown paths land on 404.html, the not-found page rendered
// once, in German; the bundle redraws it in English where that is the visitor's language.
//
// The privacy policy is a static page outside the app. Its one source, public/privacy/index.html,
// holds both languages; it is split here into /privacy/ and /en/privacy/.
//
// It also writes what a static host cannot send as headers: a Content Security Policy and a
// referrer policy on every page (the JS-free privacy pages and the three redirect pages
// included); and the files that must not go stale: the sitemap and security.txt.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { withLangScript } from "./lang-script.mjs";

const SITE = "https://silvra.net";
const dist = "dist";
const ROUTES = JSON.parse(readFileSync(new URL("../src/routes.json", import.meta.url), "utf-8"));
const LANGS = ["de", "en"];
const { render, dictionaries } = await import(pathToFileURL(resolve("dist-ssr/entry-server.js")).href);
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
    "font-src 'self'",
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
  home: { meta: "home", og: "home", faq: "home.faq.items", live: true },
  messenger: { meta: "messenger", og: "messenger", faq: "messenger.faq.items" },
  helix: { meta: "helix", og: "helix", faq: "helix.faq.items", live: true },
  mission: { meta: "mission", og: "home" },
  contact: { meta: "contact", og: "home" },
  impressum: { meta: "impressum", og: "home" },
  accessibility: { meta: "accessibility", og: "home" },
};
const LOCALE = { de: "de_DE", en: "en_GB" };
const other = (lang) => (lang === "de" ? "en" : "de");

// The dictionaries bind "ML-KEM" and "X-Wing" with an invisible word joiner so a line never
// breaks at the hyphen. Machines read these strings, not lines: a search for "ML-KEM" must find
// them, so the joiner is dropped from everything written into the head.
const plain = (s) => String(s).replace(/\u2060/g, "");
const get = (lang, path) => {
  const v = path.split(".").reduce((o, k) => (o ? o[k] : undefined), dictionaries[lang]);
  return typeof v === "string" ? plain(v) : v;
};
const esc = (s) =>
  plain(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// JSON inside a script element must not be able to close it.
const ld = (obj) =>
  `<script type="application/ld+json">${plain(JSON.stringify(obj)).replace(/</g, "\\u003c")}</script>`;

/** The structured data of a page, in the page's language. */
function structured(key, lang, page) {
  const home = `${SITE}${ROUTES.find((r) => r.key === "home")[lang]}`;
  const publisher = { "@type": "Organization", name: "Silvra", url: `${SITE}/` };
  const out = [];
  if (key === "home") {
    out.push({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Silvra",
      url: `${SITE}/`,
      logo: `${SITE}/favicon.png`,
      email: "info@silvra.net",
      description: get(lang, "footer.description"),
      sameAs: ["https://github.com/silvra-net", "https://discord.gg/98gZj6TqVv"],
    });
    out.push({ "@context": "https://schema.org", "@type": "WebSite", name: "Silvra", url: home, inLanguage: lang });
  }
  if (key === "messenger") {
    out.push({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Silvra Messenger",
      operatingSystem: "Android",
      applicationCategory: "CommunicationApplication",
      description: get(lang, "meta.messenger.description"),
      inLanguage: lang,
      installUrl: "https://play.google.com/store/apps/details?id=net.silvra.spark",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      publisher,
    });
  }
  if (key === "helix") {
    out.push({
      "@context": "https://schema.org",
      "@type": "SoftwareSourceCode",
      name: "Helix",
      description: get(lang, "meta.helix.description"),
      inLanguage: lang,
      codeRepository: "https://github.com/silvra-net/helix",
      license: "https://opensource.org/licenses/MIT",
      programmingLanguage: "Rust",
      publisher,
    });
  }
  if (page.faq) {
    out.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: lang,
      mainEntity: get(lang, page.faq).map((it) => ({
        "@type": "Question",
        name: it.q,
        acceptedAnswer: { "@type": "Answer", text: it.a },
      })),
    });
  }
  return out;
}

/** The colour world a page is painted in, as Layout's worldOf() decides it on the client. On the
 *  root element from the first byte, so the product pages do not paint in sand until the bundle
 *  runs, and stay in their colour without JavaScript. */
const worldFor = (key) => (key === "messenger" || key === "helix" ? key : "silvra");

/** The links that tie a page to its other language: each version names both, and x-default
 *  names the English one, the version every visitor not reading German is sent to. */
const alternates = (route) =>
  [
    `<link rel="alternate" hreflang="de" href="${SITE}${route.de}" />`,
    `<link rel="alternate" hreflang="en" href="${SITE}${route.en}" />`,
    `<link rel="alternate" hreflang="x-default" href="${SITE}${route.en}" />`,
  ];

function documentFor({ key, lang, path, title, description, og, ogAlt, route, live, structuredData }) {
  const canonical = route ? `${SITE}${route[lang]}` : null;
  const image = `${SITE}/og/${lang === "en" ? "en/" : ""}${og}.jpg`;
  const head = [
    ...PRELOAD,
    // The live panels ask the node for its status as soon as the page runs; the connection is
    // opened while the bundle is still loading.
    live ? `<link rel="preconnect" href="${NODE}" crossorigin />` : "",
    // A page kept out of the index (the not-found page) names no address of its own.
    canonical ? `<link rel="canonical" href="${canonical}" />` : "",
    ...(route ? alternates(route) : []),
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Silvra" />`,
    `<meta property="og:locale" content="${LOCALE[lang]}" />`,
    `<meta property="og:locale:alternate" content="${LOCALE[other(lang)]}" />`,
    canonical ? `<meta property="og:url" content="${canonical}" />` : "",
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:type" content="image/jpeg" />`,
    `<meta property="og:image:alt" content="${esc(ogAlt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<meta name="twitter:image:alt" content="${esc(ogAlt)}" />`,
    route ? "" : `<meta name="robots" content="noindex" />`,
    ...structuredData.map(ld),
  ]
    .filter(Boolean)
    .join("\n    ");

  if (!template.includes('<html lang="de">')) throw new Error("prerender: the template's <html lang=\"de\"> has changed");
  return csp(template)
    .replace('<html lang="de">', `<html lang="${lang}" data-prerendered="${lang}" data-world="${worldFor(key)}">`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${esc(description)}" />`)
    .replace("</head>", `    ${head}\n  </head>`)
    // Rendered at the address the page is served from (/messenger/, not /messenger), so that the
    // header marks the same link as current as the client will: hydration does not correct an
    // attribute the server got wrong, and the page would never show where the visitor is.
    .replace('<div id="root"></div>', `<div id="root" data-route="${route ? path : "*"}">${render(path)}</div>`);
}

let count = 0;
for (const route of ROUTES.filter((r) => !r.static)) {
  const page = PAGES[route.key];
  if (!page) throw new Error(`prerender: no page entry for ${route.key}`);
  for (const lang of LANGS) {
    const path = route[lang];
    const html = documentFor({
      key: route.key,
      lang,
      path,
      title: get(lang, `meta.${page.meta}.title`),
      description: get(lang, `meta.${page.meta}.description`),
      og: page.og,
      ogAlt: get(lang, `meta.${page.meta}.ogAlt`),
      route,
      live: page.live,
      structuredData: structured(route.key, lang, page),
    });
    const dir = join(dist, path);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), html);
    count++;
  }
}

// Anything genuinely unknown lands here, still answered as a 404 by Pages.
writeFileSync(
  join(dist, "404.html"),
  documentFor({
    key: "notFound",
    lang: "de",
    path: "/404",
    title: get("de", "meta.notFound.title"),
    description: get("de", "meta.notFound.description"),
    og: "home",
    ogAlt: get("de", "meta.notFound.ogAlt"),
    structuredData: [],
  }),
);

// The privacy policy, from its one bilingual source (public/privacy/index.html), as two pages of
// one language each. The source marks what belongs to one language only with data-only="de|en";
// the other language's elements are dropped, and in the English page every link to a German page
// leads to its English counterpart instead. Title and description are the article's own heading
// and lead, so the head cannot say something the page does not.
const privacyRoute = ROUTES.find((r) => r.key === "privacy");
const privacySource = readFileSync(join(dist, "privacy", "index.html"), "utf-8");

/** The source with every element marked for the other language removed, nested ones included. */
function onlyLang(html, lang) {
  const start = new RegExp(`<(\\w+)\\b[^>]*\\sdata-only="${other(lang)}"[^>]*>`);
  for (let m = start.exec(html); m; m = start.exec(html)) {
    const tags = new RegExp(`<(/?)${m[1]}\\b[^>]*>`, "g");
    tags.lastIndex = m.index + m[0].length;
    for (let depth = 1; depth > 0; ) {
      const t = tags.exec(html);
      if (!t) throw new Error(`prerender: unclosed <${m[1]} data-only> in the privacy source`);
      depth += t[1] ? -1 : 1;
    }
    html = html.slice(0, m.index).replace(/\n[ \t]*$/, "") + html.slice(tags.lastIndex);
  }
  return html.replaceAll(` data-only="${lang}"`, "");
}

/** What the source says only about itself: the comment on how it is split, and the rule that
 *  hides its English half on the dev server. Neither means anything in a page of one language. */
function withoutSourceNotes(html) {
  const notes = [
    /<!-- The source of both privacy pages[\s\S]*?-->\n/,
    /\n\/\* The build removes every element meant for the other language[\s\S]*?\[data-only="en"\] \{ display: none; \}/,
  ];
  for (const note of notes) {
    if (!note.test(html)) throw new Error(`prerender: the privacy source has changed, ${note} is gone`);
    html = html.replace(note, "");
  }
  return html;
}

/** In the English page, links to German pages lead to their English counterparts. The language
 *  pair (the links with hreflang) is left as written: it names both on purpose. */
function localLinks(html, lang) {
  if (lang === "de") return html;
  const english = Object.fromEntries(ROUTES.map((r) => [r.de, r.en]));
  return html.replace(/<a\b[^>]*>/g, (tag) =>
    tag.includes("hreflang=") ? tag : tag.replace(/href="(\/[^"#?]*)/, (whole, path) => (english[path] ? `href="${english[path]}` : whole)),
  );
}

for (const lang of LANGS) {
  let html = localLinks(onlyLang(withoutSourceNotes(privacySource), lang), lang);
  const text = (re) => {
    const hit = html.match(re);
    if (!hit) throw new Error(`prerender: the privacy page has no ${re}`);
    return hit[1].replace(/<[^>]+>/g, "").trim();
  };
  // The separator each language's titles use elsewhere (meta.*.title).
  const title = `${text(/<h1>([\s\S]*?)<\/h1>/)} ${lang === "de" ? "–" : "—"} Silvra`;
  const description = text(/<p class="lead">([\s\S]*?)<\/p>/);
  if (!html.includes('<html lang="de">')) throw new Error('prerender: the privacy source\'s <html lang="de"> has changed');
  html = withLangScript(html, "public/privacy/index.html")
    .replace('<html lang="de">', `<html lang="${lang}">`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(description)}">`)
    .replace(
      /<link rel="canonical"[^>]*>/,
      [`<link rel="canonical" href="${SITE}${privacyRoute[lang]}">`, ...alternates(privacyRoute).map((l) => l.replace(" />", ">"))].join("\n"),
    )
    // The source names the site's fonts by their unhashed copies in public/privacy/fonts, which
    // keep it readable on the dev server. On the built site it uses the app's own hashed files,
    // so a visitor going between the two downloads each font once; the copies are not deployed.
    .replace(/\/privacy\/fonts\/([\w.-]+\.woff2)/g, (_, name) => {
      const key = Object.keys(manifest).find((k) => k.endsWith(`/files/${name}`));
      if (!key) throw new Error(`prerender: the privacy page's font ${name} is not in the build manifest`);
      return `/${manifest[key].file}`;
    });
  const file = join(dist, privacyRoute[lang], "index.html");
  mkdirSync(dirname(file), { recursive: true });
  // It talks to nothing but its own origin.
  writeFileSync(file, csp(html, { connect: "'self'" }));
}
rmSync(join(dist, "privacy", "fonts"), { recursive: true, force: true });

// The redirect pages from public/ each carry an inline script, and talk to nothing at all.
for (const page of ["explorer", "datenschutz", "kontakt"]) {
  const file = join(dist, page, "index.html");
  if (!existsSync(file)) throw new Error(`prerender: ${file} is missing`);
  writeFileSync(file, csp(readFileSync(file, "utf-8"), { connect: "'none'" }));
}

// Every indexable page in both languages, with the address it is served at, and each with its
// counterpart named. No <lastmod>: the only date a build knows is its own, and a sitemap that
// calls every page changed on every deploy teaches search engines to ignore the field.
const entries = ROUTES.flatMap((route) =>
  LANGS.map((lang) =>
    [
      `  <url>`,
      `    <loc>${SITE}${route[lang]}</loc>`,
      `    <xhtml:link rel="alternate" hreflang="de" href="${SITE}${route.de}"/>`,
      `    <xhtml:link rel="alternate" hreflang="en" href="${SITE}${route.en}"/>`,
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${route.en}"/>`,
      `  </url>`,
    ].join("\n"),
  ),
);
writeFileSync(
  join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>
`,
);

// security.txt (RFC 9116) must carry an expiry no more than a year ahead; written at build time,
// every deploy renews it instead of someone having to remember the date.
const expires = new Date(Date.now() + 364 * 24 * 60 * 60 * 1000).toISOString();
mkdirSync(join(dist, ".well-known"), { recursive: true });
writeFileSync(
  join(dist, ".well-known", "security.txt"),
  [
    "Contact: mailto:info@silvra.net",
    `Expires: ${expires}`,
    "Preferred-Languages: de, en",
    `Policy: ${SITE}/contact/#sicherheit`,
    `Canonical: ${SITE}/.well-known/security.txt`,
    "",
  ].join("\n"),
);

// The server bundle was only needed to render the pages above, the manifest only to find the
// fonts; neither belongs on the site.
rmSync("dist-ssr", { recursive: true, force: true });
rmSync(join(dist, ".vite"), { recursive: true, force: true });

console.log(
  `prerender: ${count} pages + 404.html, each with content, meta and structured data; ` +
    `2 privacy pages; sitemap with ${entries.length} URLs`,
);
