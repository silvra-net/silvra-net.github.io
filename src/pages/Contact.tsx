import PageHero from "../components/PageHero";
import Photo from "../components/Photo";
import Reveal from "../components/Reveal";
import Icon from "../components/Icon";
import MailText from "../components/MailText";
import { useI18n } from "../i18n";
import { useSeo } from "../lib/seo";
import { DISCORD, EXPLORER, GITHUB, NODE_HOST } from "../lib/links";

interface Card {
  /** Which line of work the card is for; it picks the colour of the card's top rule. */
  kind: "dev" | "validator" | "security";
  icon: string;
  title: string;
  body: string;
  detail?: string[];
  /** Pre-fills the subject when the body's address is used. */
  subject?: string;
}

export default function Contact() {
  const { t, list } = useI18n();
  useSeo(t("meta.contact.title"), t("meta.contact.description"));

  return (
    <>
      <PageHero label={t("contact.eyebrow")} title={t("contact.title")} lead={t("contact.subtitle")} media={<Photo slot="contact" eager />}>
        <div className="btn-row">
          <a className="btn primary" href={`mailto:${t("contact.email")}`}>
            <Icon name="mail" size={16} />
            {t("contact.email")}
          </a>
          <a className="btn" href={DISCORD} rel="noreferrer noopener" target="_blank">
            <Icon name="people" size={16} />
            Discord
          </a>
        </div>
      </PageHero>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>{t("contact.card.title")}</h2>
            <p className="lead">{t("contact.card.body")}</p>
          </div>
          <div className="contact-grid">
            {list<Card>("contact.cards").map((c, i) => (
              <Reveal key={c.title} delay={i * 90} as="article" className={`contact-card contact-${c.kind}`}>
                <span className="contact-icon">
                  <Icon name={c.icon} size={24} />
                </span>
                <h3>{c.title}</h3>
                <p>
                  <MailText text={c.body} subject={c.subject} />
                </p>
                {c.detail?.map((d) => (
                  <p className="muted small" key={d.slice(0, 40)}>
                    {d}
                  </p>
                ))}
              </Reveal>
            ))}
          </div>
          <div className="btn-row contact-links">
            <a className="btn" href={EXPLORER}>
              Helix {t("nav.explorer")}
              <Icon name="arrowUpRight" size={14} />
            </a>
            <a className="btn" href={`https://${NODE_HOST}`} rel="noreferrer noopener" target="_blank">
              {NODE_HOST}
              <Icon name="arrowUpRight" size={14} />
            </a>
            <a className="btn" href={GITHUB} rel="noreferrer noopener" target="_blank">
              GitHub
              <Icon name="arrowUpRight" size={14} />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
