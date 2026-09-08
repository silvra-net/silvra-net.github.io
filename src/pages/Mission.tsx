import Section from "../components/Section";
import Groups from "../components/Groups";
import { useI18n } from "../i18n";
import { useSeo } from "../lib/seo";

export default function Mission() {
  const { t, list } = useI18n();
  useSeo(t("meta.mission.title"), t("meta.mission.description"));

  return (
    <>
      <Section eyebrow={t("mission.eyebrow")} title={t("mission.title")} subtitle={t("mission.subtitle")} />

      <Section eyebrow={t("mission.approach.eyebrow")} title={t("mission.approach.title")}>
        {list<string>("mission.approach.paragraphs").map((p) => (
          <p className="muted" key={p.slice(0, 40)} style={{ maxWidth: "70ch" }}>
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
      </Section>

      <Section eyebrow={t("mission.principles.eyebrow")} title={t("mission.principles.title")}>
        <Groups path="mission.principles" />
      </Section>
    </>
  );
}
