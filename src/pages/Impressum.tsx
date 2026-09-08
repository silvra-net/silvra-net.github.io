import Section from "../components/Section";
import { useI18n } from "../i18n";
import { useSeo } from "../lib/seo";

interface Block {
  title: string;
  body: string;
}

export default function Impressum() {
  const { t, list } = useI18n();
  useSeo(t("meta.impressum.title"), t("meta.impressum.description"));

  return (
    <Section eyebrow={t("impressum.eyebrow")} title={t("impressum.title")} subtitle={t("impressum.subtitle")}>
      <div className="grid two">
        {list<Block>("impressum.sections").map((s) => (
          <div className="card" key={s.title}>
            <h3>{s.title}</h3>
            {/* Addresses carry their own line breaks; preserving them is the whole point. */}
            <p className="muted" style={{ margin: 0, whiteSpace: "pre-line" }}>
              {s.body}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
