import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { LANG_SCRIPT_MARKER, langScript, withLangScript } from "../../scripts/lang-script.mjs";

const root = join(__dirname, "..", "..");

/**
 * The head script that sends a non-German browser to /en/ runs before anything else on every
 * German page, so it is tested as it ships: the exact text the build inlines, run against a fake
 * window per case.
 */
interface Visit {
  url: string;
  languages?: string[];
  language?: string;
  stored?: string | null;
  storageThrows?: boolean;
  userAgent?: string;
  /** The language the served page was built in (<html data-prerendered>). */
  prerendered?: string;
}

type Listener = (e: { type: string; button: number; target: unknown }) => void;

function visit({ url, languages, language, stored = null, storageThrows = false, userAgent, prerendered }: Visit) {
  const u = new URL(url, "https://silvra.net");
  const replaced: string[] = [];
  const attrs: Record<string, string> = prerendered ? { "data-prerendered": prerendered } : {};
  const listeners: Record<string, Listener[]> = {};
  const storage = { value: stored };
  const style: Record<string, string> = {};
  const timers: (() => void)[] = [];
  const sandbox = {
    location: {
      pathname: u.pathname,
      search: u.search,
      hash: u.hash,
      replace: (to: string) => replaced.push(to),
    },
    navigator: {
      languages,
      language: language ?? languages?.[0] ?? "",
      userAgent: userAgent ?? "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36",
    },
    document: {
      documentElement: {
        style,
        setAttribute: (k: string, v: string) => (attrs[k] = v),
        getAttribute: (k: string) => attrs[k] ?? null,
        removeAttribute: (k: string) => delete attrs[k],
      },
      addEventListener: (type: string, fn: Listener) => (listeners[type] ??= []).push(fn),
    },
    setTimeout: (fn: () => void) => timers.push(fn),
  };
  Object.defineProperty(sandbox, "localStorage", {
    get() {
      if (storageThrows) throw new Error("SecurityError: storage is blocked");
      return {
        getItem: (k: string) => (k === "silvra-lang" ? storage.value : null),
        setItem: (k: string, v: string) => k === "silvra-lang" && (storage.value = v),
      };
    },
  });
  runInNewContext(script, sandbox);
  expect(replaced.length).toBeLessThanOrEqual(1);
  /** A click on an element; `link` is what closest(".lang a[hreflang]") finds from it. */
  const click = (type: string, button: number, link: { hreflang: string } | null) => {
    const target = { closest: (sel: string) => (sel === ".lang a[hreflang]" && link ? { getAttribute: () => link.hreflang } : null) };
    for (const fn of listeners[type] ?? []) fn({ type, button, target });
    return storage.value;
  };
  return {
    to: replaced[0] ?? null,
    pref: attrs["data-lang-pref"] ?? null,
    held: "data-lang-wait" in attrs && style.visibility === "hidden",
    click,
    timers,
    attrs,
    style,
  };
}

// The script as the build writes it. That the build puts it in place is checked below, against
// the dev server's and the build's own transform and, where there is one, the built site.
const script = langScript();

describe("the language script", () => {
  it("is the one the build inlines, everywhere", async () => {
    // One source, two places it is put: the app's template, by the plugin in vite.config.ts (the
    // dev server's and the build's), and the privacy page, by the prerender.
    const template = readFileSync(join(root, "index.html"), "utf-8");
    expect(template).toContain(LANG_SCRIPT_MARKER);
    expect(readFileSync(join(root, "public", "privacy", "index.html"), "utf-8")).toContain(LANG_SCRIPT_MARKER);
    // By path, not by name: the config belongs to the node project (tsconfig.node.json).
    const config = (await import(/* @vite-ignore */ join(root, "vite.config.ts"))).default as { plugins: unknown[] };
    const plugin = config.plugins.flat().find((p) => (p as { name?: string })?.name === "lang-script") as {
      transformIndexHtml: (html: string) => string;
    };
    expect(plugin.transformIndexHtml(template)).toContain(`<script>${script}</script>`);
    expect(() => withLangScript("<head></head>", "a page")).toThrow();
    for (const page of ["privacy/index.html", "en/privacy/index.html", "404.html", "en/index.html"]) {
      const file = join(root, "dist", page);
      if (existsSync(file)) expect(readFileSync(file, "utf-8"), `dist/${page} is older than the script`).toContain(`<script>${script}</script>`);
    }
  });

  it("keeps a German browser on the German page", () => {
    expect(visit({ url: "/", languages: ["de-DE", "de", "en-US"] }).to).toBeNull();
    expect(visit({ url: "/helix/", languages: ["de-AT"] }).to).toBeNull();
    expect(visit({ url: "/helix/", languages: ["de-CH", "en"] }).to).toBeNull();
    expect(visit({ url: "/mission/", languages: ["de"] }).to).toBeNull();
  });

  it("sends every other browser to English", () => {
    expect(visit({ url: "/", languages: ["en-US", "en"] }).to).toBe("/en/");
    expect(visit({ url: "/messenger/", languages: ["en-GB"] }).to).toBe("/en/messenger/");
    expect(visit({ url: "/helix/", languages: ["fr-FR", "fr"] }).to).toBe("/en/helix/");
    expect(visit({ url: "/contact/", languages: ["ja-JP"] }).to).toBe("/en/contact/");
  });

  it("follows the browser's order: the first of German and English decides", () => {
    expect(visit({ url: "/", languages: ["fr-FR", "de-DE"] }).to).toBeNull();
    expect(visit({ url: "/", languages: ["en-US", "de-DE"] }).to).toBe("/en/");
  });

  it("falls back to navigator.language when there is no list", () => {
    expect(visit({ url: "/", languages: [], language: "de-DE" }).to).toBeNull();
    expect(visit({ url: "/", language: "en-US" }).to).toBe("/en/");
  });

  it("lets a stored choice win over the browser", () => {
    expect(visit({ url: "/", languages: ["en-US"], stored: "de" }).to).toBeNull();
    expect(visit({ url: "/helix/", languages: ["de-DE"], stored: "en" }).to).toBe("/en/helix/");
  });

  it("decides by the browser when storage is blocked", () => {
    expect(visit({ url: "/", languages: ["de-DE"], storageThrows: true }).to).toBeNull();
    expect(visit({ url: "/", languages: ["en-US"], storageThrows: true }).to).toBe("/en/");
  });

  it("leaves crawlers and link previews where they are", () => {
    for (const userAgent of [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
      "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
      "WhatsApp/2.23.20.0",
      "TelegramBot (like TwitterBot)",
      "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
    ]) {
      expect(visit({ url: "/messenger/", languages: ["en-US"], userAgent }).to, userAgent).toBeNull();
    }
  });

  it("never sends anyone away from an English page", () => {
    for (const url of ["/en/", "/en", "/en/helix/", "/en/legal-notice/", "/en/privacy/", "/en/xyz"]) {
      expect(visit({ url, languages: ["de-DE"], stored: "de" }).to, url).toBeNull();
      expect(visit({ url, languages: ["en-US"] }).to, url).toBeNull();
    }
  });

  it("keeps the query and the section", () => {
    expect(visit({ url: "/helix/?ref=x#tokenomics", languages: ["en-US"] }).to).toBe("/en/helix/?ref=x#tokenomics");
    expect(visit({ url: "/impressum/?a=1#x", languages: ["en-US"] }).to).toBe("/en/legal-notice/?a=1#x");
    expect(visit({ url: "/barrierefreiheit/", languages: ["en-US"] }).to).toBe("/en/accessibility/");
  });

  it("treats an address without the slash or with index.html as the page", () => {
    expect(visit({ url: "/messenger", languages: ["en-US"] }).to).toBe("/en/messenger/");
    expect(visit({ url: "/index.html", languages: ["en-US"] }).to).toBe("/en/");
  });

  it("sends the old English half of the privacy policy to the English page", () => {
    expect(visit({ url: "/privacy/#en", languages: ["de-DE"], stored: "de" }).to).toBe("/en/privacy/");
    expect(visit({ url: "/privacy/#en", languages: ["de-DE"], storageThrows: true }).to).toBe("/en/privacy/");
    expect(visit({ url: "/privacy/", languages: ["en-US"] }).to).toBe("/en/privacy/");
    expect(visit({ url: "/privacy/", languages: ["de-DE"] }).to).toBeNull();
    // A link to its German half asked for German by name; so does the English page's switch.
    expect(visit({ url: "/privacy/#de", languages: ["en-US"] }).to).toBeNull();
    expect(visit({ url: "/privacy/#de", languages: ["en-US"], stored: "en" }).to).toBeNull();
  });

  it("stores the language chosen with the switch, on every page", () => {
    for (const url of ["/en/privacy/", "/privacy/", "/en/helix/", "/", "/en/xyz"]) {
      expect(visit({ url, languages: ["en-US"] }).click("click", 0, { hreflang: "de" }), url).toBe("de");
      expect(visit({ url, languages: ["de-DE"] }).click("click", 0, { hreflang: "en" }), url).toBe("en");
    }
    // A middle click opens the page in a new tab, where this script runs again.
    expect(visit({ url: "/en/helix/", languages: ["en-US"] }).click("auxclick", 1, { hreflang: "de" })).toBe("de");
    // A right click only opens a menu; any other link is no choice of language.
    expect(visit({ url: "/en/helix/", languages: ["en-US"] }).click("auxclick", 2, { hreflang: "de" })).toBeNull();
    expect(visit({ url: "/en/helix/", languages: ["en-US"] }).click("click", 0, null)).toBeNull();
    expect(visit({ url: "/en/helix/", languages: ["en-US"] }).click("click", 0, { hreflang: "fr" })).toBeNull();
    // With storage blocked the click still goes through.
    expect(visit({ url: "/en/helix/", languages: ["en-US"], storageThrows: true }).click("click", 0, { hreflang: "de" })).toBeNull();
  });

  it("does not redirect from a path that is no page, but leaves its choice for the not-found page", () => {
    expect(visit({ url: "/xyz", languages: ["en-US"] })).toMatchObject({ to: null, pref: "en" });
    expect(visit({ url: "/helix/xyz", languages: ["de-DE"] })).toMatchObject({ to: null, pref: "de" });
    expect(visit({ url: "/404.html", languages: ["fr-FR"], stored: "de" })).toMatchObject({ to: null, pref: "de" });
  });

  it("holds back a not-found page built in the other language until the bundle redraws it", () => {
    expect(visit({ url: "/en/xyz", languages: ["de-DE"], prerendered: "de" }).held).toBe(true);
    expect(visit({ url: "/xyz", languages: ["en-US"], prerendered: "de" }).held).toBe(true);
    expect(visit({ url: "/helix/xyz", languages: ["de-DE"], prerendered: "de" }).held).toBe(false);
    expect(visit({ url: "/en/helix/", languages: ["de-DE"], prerendered: "en" }).held).toBe(false);
    expect(visit({ url: "/en/privacy/", languages: ["de-DE"] }).held).toBe(false);
    // Should the bundle never arrive, the page shows after all.
    const v = visit({ url: "/en/xyz", languages: ["en-US"], prerendered: "de" });
    v.timers.forEach((fn) => fn());
    expect("data-lang-wait" in v.attrs).toBe(false);
    expect(v.style.visibility).toBe("");
  });
});
