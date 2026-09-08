import { Link } from "react-router-dom";
import Section from "../components/Section";
import Cards from "../components/Cards";
import type { Item } from "../components/Cards";
import Groups from "../components/Groups";
import Testnet from "../components/Testnet";
import Ticker from "../components/Ticker";
import { useI18n } from "../i18n";
import { useSeo } from "../lib/seo";

export default function Home() {
  const { t, list } = useI18n();
  useSeo(t("meta.home.title"), t("meta.home.description"));

  return (
    <>
      <section className="section hero-grid" style={{ paddingTop: 80 }}>
        <div className="container">
          <p className="eyebrow">{t("home.hero.eyebrow")}</p>
          <h1>
            {t("home.hero.titleLine1")} <span className="title-shadow">{t("home.hero.titleShadow")}</span>{" "}
            {t("home.hero.titleLine2")}
          </h1>
          <p className="lead">{t("home.hero.body")}</p>
          <div className="btn-row">
            <a className="btn primary" href="#projekte">
              {t("home.hero.ctaPrimary")}
            </a>
            <Link className="btn" to="/mission">
              {t("home.hero.ctaSecondary")}
            </Link>
          </div>
          <div style={{ marginTop: 40 }}>
            <Ticker items={list<string>("home.ticker.items")} />
          </div>
        </div>
      </section>

      <Section
        eyebrow={t("home.autopilot.eyebrow")}
        title={t("home.autopilot.title")}
        subtitle={t("home.autopilot.subtitle")}
      >
        <div className="btn-row">
          <Link className="btn primary" to="/messenger">
            {t("home.autopilot.ctaPrimary")}
          </Link>
          <Link className="btn" to="/helix">
            {t("home.autopilot.ctaSecondary")}
          </Link>
        </div>
      </Section>

      <Section>
        <Testnet />
      </Section>

      <Section
        id="projekte"
        eyebrow={t("home.projects.eyebrow")}
        title={t("home.projects.title")}
        subtitle={t("home.projects.lead")}
      >
        <Cards items={list<Item>("home.projects.items")} columns={2} />
      </Section>

      <Section eyebrow={t("home.why.eyebrow")} title={t("home.why.title")}>
        {list<string>("home.why.paragraphs").map((p) => (
          <p className="muted" key={p.slice(0, 40)} style={{ maxWidth: "70ch" }}>
            {p}
          </p>
        ))}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 24 }}>
          {list<string>("home.why.badges").map((b) => (
            <span className="badge" key={b}>
              {b}
            </span>
          ))}
        </div>
      </Section>

      <Section eyebrow={t("home.principles.eyebrow")} title={t("home.principles.title")}>
        <Groups path="home.principles" />
      </Section>

      <Section eyebrow={t("home.contact.eyebrow")} title={t("home.contact.title")}>
        <p className="lead">{t("home.contact.body")}</p>
        <div className="btn-row">
          <a className="btn primary" href={`mailto:${t("home.contact.email")}`}>
            {t("home.contact.email")}
          </a>
          <Link className="btn" to="/kontakt">
            {t("nav.contact")}
          </Link>
        </div>
      </Section>
    </>
  );
}
