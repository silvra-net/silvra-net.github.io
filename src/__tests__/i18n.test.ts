import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import de from "../i18n/de.json";
import en from "../i18n/en.json";

/** Every leaf path in a nested object, as dotted keys. Arrays keep their index. */
function paths(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) return value.flatMap((v, i) => paths(v, `${prefix}[${i}]`));
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
      paths(v, prefix ? `${prefix}.${k}` : k),
    );
  }
  return [prefix];
}

/** Source files, so the tests can check what the components actually ask for. */
function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name);
    if (e.isDirectory()) return e.name === "__tests__" ? [] : sources(full);
    return /\.tsx?$/.test(e.name) ? [readFileSync(full, "utf-8")] : [];
  });
}

const dePaths = new Set(paths(de));
const enPaths = new Set(paths(en));

describe("translations", () => {
  it("cover the same keys in both languages", () => {
    // A key present in one language only is a gap a visitor sees as a raw path on screen.
    expect([...dePaths].filter((p) => !enPaths.has(p))).toEqual([]);
    expect([...enPaths].filter((p) => !dePaths.has(p))).toEqual([]);
  });

  it("no longer name the node's old hostname", () => {
    // helix.silvra.net has no record; the node answers on node.silvra.net. This appeared in
    // the privacy policy's account of which service receives a visitor's IP, so it is worth a
    // test rather than a memory.
    const all = JSON.stringify(de) + JSON.stringify(en);
    expect(all).not.toContain("helix.silvra.net");
  });
});

describe("keys the components ask for", () => {
  // Collect t("…") / list("…") / raw("…") literals from every component and page.
  const asked = new Set<string>();
  for (const src of sources(join(__dirname, ".."))) {
    for (const m of src.matchAll(/\b(?:t|list|raw)(?:<[^>]*>)?\(\s*"([a-zA-Z][\w.]*)"/g)) {
      asked.add(m[1]);
    }
  }

  it("finds call sites at all (the regex still matches the code)", () => {
    expect(asked.size).toBeGreaterThan(30);
  });

  it("all resolve to something in the dictionary", () => {
    // A path may name a leaf ("nav.home") or a subtree ("home.principles", read by <Groups>),
    // so a prefix match counts as resolved.
    const missing = [...asked].filter(
      (key) => !dePaths.has(key) && ![...dePaths].some((p) => p.startsWith(`${key}.`) || p.startsWith(`${key}[`)),
    );
    expect(missing).toEqual([]);
  });
});
