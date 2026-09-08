import Section from "../components/Section";
import { useI18n } from "../i18n";
import { useSeo } from "../lib/seo";

interface Block {
  title: string;
  body: string;
}

/**
 * Three short facts. Cards would give each of them the weight of a feature and leave the last
 * one alone in a two-column grid — a legal notice is a list of details, so it is set as one:
 * a single panel, label above value, at reading measure rather than full width.
 */
export default function Impressum() {
  const { t, list } = useI18n();
  useSeo(t("meta.impressum.title"), t("meta.impressum.description"));

  return (
    <Section eyebrow={t("impressum.eyebrow")} title={t("impressum.title")} subtitle={t("impressum.subtitle")}>
      <dl className="card" style={{ margin: 0, maxWidth: "56ch" }}>
        {list<Block>("impressum.sections").map((s, i) => (
          <div key={s.title} style={{ marginTop: i === 0 ? 0 : 24 }}>
            <dt className="eyebrow" style={{ margin: "0 0 4px" }}>
              {s.title}
            </dt>
            {/* Addresses and multi-line details keep their own line breaks. */}
            <dd style={{ margin: 0, whiteSpace: "pre-line" }}>{s.body}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
