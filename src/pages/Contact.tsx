import PageHeader from "../components/PageHeader";
import Section from "../components/Section";
import { useI18n } from "../i18n";
import { useSeo } from "../lib/seo";

const DISCORD = "https://discord.gg/98gZj6TqVv";

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
      <PageHeader eyebrow={t("contact.eyebrow")} title={t("contact.title")} subtitle={t("contact.subtitle")}>
        <div className="btn-row">
          <a className="btn primary" href={`mailto:${t("contact.email")}`}>
            {t("contact.email")}
          </a>
          <a className="btn" href={DISCORD} rel="noreferrer noopener" target="_blank">
            {t("contact.discord")}
          </a>
        </div>
      </PageHeader>

      <Section title={t("contact.card.title")} subtitle={t("contact.card.body")}>
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

      <Section>
        <div className="btn-row">
          <a className="btn" href={`https://${t("contact.helix")}`} rel="noreferrer noopener" target="_blank">
            {t("contact.helix")}
          </a>
          <a className="btn" href="https://explorer.silvra.net/">
            {t("nav.explorer")}
          </a>
          <a className="btn" href="https://github.com/silvra-net" rel="noreferrer noopener" target="_blank">
            {t("helix.cta.github")}
          </a>
        </div>
      </Section>
    </>
  );
}
