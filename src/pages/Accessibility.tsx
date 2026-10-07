import PageHero from "../components/PageHero";
import { useI18n } from "../i18n";
import { useSeo } from "../lib/seo";

interface Block {
  title: string;
  body: string;
  items?: string[];
}

/**
 * The accessibility statement: what the site aims for, how that is checked, what is known not to
 * work yet, and where to report a barrier. Set like the legal notice — one panel, label above
 * value — because it is a document people look things up in, not a page they browse.
 */
export default function Accessibility() {
  const { t, list } = useI18n();
  useSeo(t("meta.accessibility.title"), t("meta.accessibility.description"));

  return (
    <>
      <PageHero label={t("accessibility.eyebrow")} title={t("accessibility.title")} lead={t("accessibility.subtitle")} />
      <section className="section">
        <div className="container">
          <dl className="legal">
            {list<Block>("accessibility.sections").map((s) => (
              <div key={s.title}>
                <dt>{s.title}</dt>
                <dd>
                  {s.body}
                  {s.items && (
                    <ul className="legal-list">
                      {s.items.map((i) => (
                        <li key={i}>{i}</li>
                      ))}
                    </ul>
                  )}
                </dd>
              </div>
            ))}
            <div>
              <dt>{t("accessibility.reportTitle")}</dt>
              <dd>
                {t("accessibility.reportBody")}{" "}
                <a href={`mailto:info@silvra.net?subject=${encodeURIComponent(t("accessibility.reportSubject"))}`}>
                  info@silvra.net
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </>
  );
}
