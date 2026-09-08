import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Section from "../components/Section";
import Split from "../components/Split";
import Groups from "../components/Groups";
import Media from "../components/Media";
import { useI18n } from "../i18n";
import { useSeo } from "../lib/seo";
import craft from "../assets/silvra-craft.mp4";
import craftPoster from "../assets/silvra-craft-poster.jpg";

export default function Mission() {
  const { t, list } = useI18n();
  useSeo(t("meta.mission.title"), t("meta.mission.description"));

  return (
    <>
      <PageHeader eyebrow={t("mission.eyebrow")} title={t("mission.title")} subtitle={t("mission.subtitle")} />

      <Split media={<Media src={craft} poster={craftPoster} alt="" />} flip>
        <p className="eyebrow">{t("mission.approach.eyebrow")}</p>
        <h2>{t("mission.approach.title")}</h2>
        {list<string>("mission.approach.paragraphs").map((p) => (
          <p className="muted" key={p.slice(0, 40)}>
            {p}
          </p>
        ))}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 24 }}>
          {list<string>("mission.approach.badges").map((b) => (
            <span className="badge" key={b}>
              {b}
            </span>
          ))}
        </div>
      </Split>

      <Section eyebrow={t("mission.principles.eyebrow")} title={t("mission.principles.title")}>
        <Groups path="mission.principles" />
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
