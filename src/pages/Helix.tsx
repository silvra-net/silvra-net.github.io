import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Section from "../components/Section";
import Split from "../components/Split";
import Cards from "../components/Cards";
import type { Item } from "../components/Cards";
import Testnet from "../components/Testnet";
import { useI18n } from "../i18n";
import { useSeo } from "../lib/seo";
import helixIcon from "../assets/helix-icon.png";

const DISCORD = "https://discord.gg/98gZj6TqVv";

export default function Helix() {
  const { t, list } = useI18n();
  useSeo(t("meta.helix.title"), t("meta.helix.description"));

  return (
    <>
      <PageHeader eyebrow={t("helix.eyebrow")} title={t("helix.title")} subtitle={t("helix.subtitle")}>
        <div className="btn-row">
          <a className="btn primary" href="https://explorer.silvra.net/">
            {t("nav.explorer")}
          </a>
          <a className="btn" href={DISCORD} rel="noreferrer noopener" target="_blank">
            {t("helix.cta.discord")}
          </a>
        </div>
      </PageHeader>

      <Split media={<img className="media contain" data-icon src={helixIcon} alt="" />}>
        <p className="eyebrow">{t("helix.intro.eyebrow")}</p>
        <h2>{t("helix.intro.title")}</h2>
        <p className="muted">{t("helix.intro.body")}</p>
      </Split>

      <Section title={t("helix.testnet.title")}>
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
        <p className="card" style={{ marginTop: 24, maxWidth: "70ch" }}>
          {t("helix.honesty.highlight")}
        </p>
      </Section>

      <Section eyebrow={t("helix.cta.eyebrow")} subtitle={t("helix.cta.body")}>
        <div className="btn-row">
          <a className="btn primary" href="https://explorer.silvra.net/">
            {t("nav.explorer")}
          </a>
          <a className="btn" href={`https://${t("helix.cta.link")}`} rel="noreferrer noopener" target="_blank">
            {t("helix.cta.link")}
          </a>
          <a className="btn" href="https://github.com/silvra-net" rel="noreferrer noopener" target="_blank">
            {t("helix.cta.github")}
          </a>
          <a className="btn" href={DISCORD} rel="noreferrer noopener" target="_blank">
            {t("helix.cta.discord")}
          </a>
          <Link className="btn" to="/messenger">
            {t("nav.messenger")}
          </Link>
        </div>
      </Section>
    </>
  );
}
