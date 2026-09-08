import Section from "../components/Section";
import { useI18n } from "../i18n";
import { useSeo } from "../lib/seo";

interface Card {
  title: string;
  body: string;
  detail?: string[];
}

export default function Contact() {
  const { t, list } = useI18n();
  useSeo(t("meta.contact.title"), t("meta.contact.description"));

  return (
    <>
      <Section eyebrow={t("contact.eyebrow")} title={t("contact.title")} subtitle={t("contact.subtitle")}>
        <div className="card">
          <h3>{t("contact.card.title")}</h3>
          <p className="muted">{t("contact.card.body")}</p>
          <div className="btn-row">
            <a className="btn primary" href={`mailto:${t("contact.email")}`}>
              {t("contact.email")}
            </a>
            <a className="btn" href={`https://${t("contact.helix")}`} rel="noreferrer noopener" target="_blank">
              {t("contact.helix")}
            </a>
            <a className="btn" href="https://discord.gg/98gZj6TqVv" rel="noreferrer noopener" target="_blank">
              {t("contact.discord")}
            </a>
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid two">
          {list<Card>("contact.cards").map((c) => (
            <article className="card" key={c.title}>
              <h3>{c.title}</h3>
              <p className="muted" style={{ marginTop: 0 }}>
                {c.body}
              </p>
              {c.detail?.map((d) => (
                <p className="muted small" key={d.slice(0, 40)}>
                  {d}
                </p>
              ))}
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
