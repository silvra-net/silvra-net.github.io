import { Link } from "react-router-dom";
import Section from "../components/Section";
import Cards from "../components/Cards";
import type { Item } from "../components/Cards";
import Groups from "../components/Groups";
import Testnet from "../components/Testnet";
import Ticker from "../components/Ticker";
import Split from "../components/Split";
import Media from "../components/Media";
import { useI18n } from "../i18n";
import { useSeo } from "../lib/seo";
import intro from "../assets/silvra-intro.mp4";
import introPoster from "../assets/silvra-intro-poster.jpg";
import craft from "../assets/silvra-craft.mp4";
import craftPoster from "../assets/silvra-craft-poster.jpg";
import showcase from "../assets/showcase-phone.webp";

export default function Home() {
  const { t, list } = useI18n();
  useSeo(t("meta.home.title"), t("meta.home.description"));

  return (
    <>
      <section className="hero">
        <div className="hero-media">
          <Media src={intro} poster={introPoster} alt="" />
        </div>
        <div className="container hero-body">
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
        </div>
      </section>

      <div className="section" style={{ paddingTop: 32, paddingBottom: 32 }}>
        <div className="container">
          <Ticker items={list<string>("home.ticker.items")} />
        </div>
      </div>

      <Split media={<img className="media" src={showcase} alt="" />}>
        <p className="eyebrow">{t("home.autopilot.eyebrow")}</p>
        <h2>{t("home.autopilot.title")}</h2>
        <p className="lead">{t("home.autopilot.subtitle")}</p>
        <div className="btn-row">
          <Link className="btn primary" to="/messenger">
            {t("home.autopilot.ctaPrimary")}
          </Link>
          <Link className="btn" to="/helix">
            {t("home.autopilot.ctaSecondary")}
          </Link>
        </div>
      </Split>

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

      <Split media={<Media src={craft} poster={craftPoster} alt="" />} flip>
        <p className="eyebrow">{t("home.why.eyebrow")}</p>
        <h2>{t("home.why.title")}</h2>
        {list<string>("home.why.paragraphs").map((p) => (
          <p className="muted" key={p.slice(0, 40)}>
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
      </Split>

      <Section eyebrow={t("home.principles.eyebrow")} title={t("home.principles.title")}>
        <Groups path="home.principles" />
      </Section>

      <Section eyebrow={t("home.contact.eyebrow")} title={t("home.contact.title")}>
        <p className="lead">{t("home.contact.body")}</p>
        <div className="btn-row">
          <a className="btn primary" href={`mailto:${t("home.contact.email")}`}>
            {t("home.contact.email")}
          </a>
          <Link className="btn" to="/contact">
            {t("nav.contact")}
          </Link>
        </div>
      </Section>
    </>
  );
}
