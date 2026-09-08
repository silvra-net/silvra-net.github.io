import Section from "../components/Section";
import Cards from "../components/Cards";
import type { Item } from "../components/Cards";
import Testnet from "../components/Testnet";
import { useI18n } from "../i18n";
import { useSeo } from "../lib/seo";

export default function Helix() {
  const { t, list } = useI18n();
  useSeo(t("meta.helix.title"), t("meta.helix.description"));

  return (
    <>
      <Section eyebrow={t("helix.eyebrow")} title={t("helix.title")} subtitle={t("helix.subtitle")} />

      <Section eyebrow={t("helix.intro.eyebrow")} title={t("helix.intro.title")}>
        <p className="muted" style={{ maxWidth: "70ch" }}>
          {t("helix.intro.body")}
        </p>
      </Section>

      <Section>
        <Testnet />
      </Section>

      <Section>
        <Cards items={list<Item>("helix.features")} />
      </Section>

      <Section eyebrow={t("helix.honesty.eyebrow")} title={t("helix.honesty.title")}>
        {list<string>("helix.honesty.paragraphs").map((p) => (
          <p className="muted" key={p.slice(0, 40)} style={{ maxWidth: "70ch" }}>
            {p}
          </p>
        ))}
        <p className="card" style={{ marginTop: 24 }}>
          {t("helix.honesty.highlight")}
        </p>
      </Section>

      <Section eyebrow={t("helix.cta.eyebrow")} subtitle={t("helix.cta.body")}>
        <div className="btn-row">
          <a className="btn primary" href="/explorer/">
            {t("nav.explorer")}
          </a>
          <a className="btn" href={`https://${t("helix.cta.link")}`} rel="noreferrer noopener" target="_blank">
            {t("helix.cta.link")}
          </a>
          <a
            className="btn"
            href="https://github.com/silvra-net"
            rel="noreferrer noopener"
            target="_blank"
          >
            {t("helix.cta.github")}
          </a>
          <a className="btn" href="https://discord.gg/98gZj6TqVv" rel="noreferrer noopener" target="_blank">
            {t("helix.cta.discord")}
          </a>
        </div>
      </Section>
    </>
  );
}
