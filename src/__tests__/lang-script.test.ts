import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { LANG_SCRIPT_MARKER, langScript } from "../../scripts/lang-script.mjs";

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
}

function visit({ url, languages, language, stored = null, storageThrows = false, userAgent }: Visit) {
  const u = new URL(url, "https://silvra.net");
  const replaced: string[] = [];
  const attrs: Record<string, string> = {};
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
      documentElement: { style: {} as Record<string, string>, setAttribute: (k: string, v: string) => (attrs[k] = v) },
    },
  };
  Object.defineProperty(sandbox, "localStorage", {
    get() {
      if (storageThrows) throw new Error("SecurityError: storage is blocked");
      return { getItem: (k: string) => (k === "silvra-lang" ? stored : null) };
    },
  });
  runInNewContext(script, sandbox);
  expect(replaced.length).toBeLessThanOrEqual(1);
  return { to: replaced[0] ?? null, pref: attrs["data-lang-pref"] ?? null };
}

// The script as it ships: from the built page when there is one, else as the build would write it.
const built = join(root, "dist", "index.html");
const script = existsSync(built)
  ? readFileSync(built, "utf-8").match(/<script>(\s*\/\/ Sends a visitor[\s\S]*?)<\/script>/)![1]
  : langScript();

describe("the language script", () => {
  it("is the one the build inlines, everywhere", () => {
    expect(script).toBe(langScript());
    // One source, two places it is put: the app's template and the privacy page.
    expect(readFileSync(join(root, "index.html"), "utf-8")).toContain(LANG_SCRIPT_MARKER);
    expect(readFileSync(join(root, "public", "privacy", "index.html"), "utf-8")).toContain(LANG_SCRIPT_MARKER);
    for (const page of ["privacy/index.html", "en/privacy/index.html", "404.html", "en/index.html"]) {
      const file = join(root, "dist", page);
      if (existsSync(file)) expect(readFileSync(file, "utf-8")).toContain(`<script>${langScript()}</script>`);
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
    // A link to its German half asked for German by name.
    expect(visit({ url: "/privacy/#de", languages: ["en-US"] }).to).toBeNull();
  });

  it("does not redirect from a path that is no page, but leaves its choice for the not-found page", () => {
    expect(visit({ url: "/xyz", languages: ["en-US"] })).toEqual({ to: null, pref: "en" });
    expect(visit({ url: "/helix/xyz", languages: ["de-DE"] })).toEqual({ to: null, pref: "de" });
    expect(visit({ url: "/404.html", languages: ["fr-FR"], stored: "de" })).toEqual({ to: null, pref: "de" });
  });
});
