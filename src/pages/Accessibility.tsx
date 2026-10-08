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
 * work yet, and where to report a barrier. Set like the legal notice — one panel of headed
 * blocks — because it is a document people look things up in, not a page they browse.
 */
export default function Accessibility() {
  const { t, list } = useI18n();
  useSeo(t("meta.accessibility.title"), t("meta.accessibility.description"));

  return (
    <>
      <PageHero label={t("accessibility.eyebrow")} title={t("accessibility.title")} lead={t("accessibility.subtitle")} compact />
      <section className="section">
        <div className="container">
          <div className="legal">
            {list<Block>("accessibility.sections").map((s) => (
              <section className="legal-block" key={s.title}>
                <h2 className="legal-title">{s.title}</h2>
                <div className="legal-body">
                  {s.body}
                  {s.items && (
                    <ul className="legal-list">
                      {s.items.map((i) => (
                        <li key={i}>{i}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}
            <section className="legal-block">
              <h2 className="legal-title">{t("accessibility.reportTitle")}</h2>
              <div className="legal-body">
                {t("accessibility.reportBody")}{" "}
                <a href={`mailto:info@silvra.net?subject=${encodeURIComponent(t("accessibility.reportSubject"))}`}>
                  info@silvra.net
                </a>
              </div>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}
