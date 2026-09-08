import PageHeader from "../components/PageHeader";
import Section from "../components/Section";
import Split from "../components/Split";
import Cards from "../components/Cards";
import type { Item } from "../components/Cards";
import Groups from "../components/Groups";
import CryptoDemo from "../components/CryptoDemo";
import { useI18n } from "../i18n";
import { useSeo } from "../lib/seo";
import chatPreview from "../assets/chat-preview.webp";
import messengerLogo from "../assets/messenger-logo.webp";
import welcomeDe from "../assets/Welcome_DE-portrait.webp";
import welcomeEn from "../assets/Welcome_EN.webp";
import profilDe from "../assets/Profil_DE.webp";
import profilEn from "../assets/Profil_EN.webp";
import settingsDe from "../assets/Settings_DE.webp";
import settingsEn from "../assets/setting_EN.webp";

export default function Messenger() {
  const { t, list, lang } = useI18n();
  useSeo(t("meta.messenger.title"), t("meta.messenger.description"));

  // The screenshots are of the app in the visitor's language; showing German UI next to an
  // English caption is the kind of detail that makes a product look unfinished.
  const shots = lang === "de" ? [welcomeDe, profilDe, settingsDe] : [welcomeEn, profilEn, settingsEn];
  const screens = list<Item>("messenger.screens.items");

  return (
    <>
      <PageHeader
        eyebrow={t("messenger.eyebrow")}
        title={t("messenger.title")}
        subtitle={t("messenger.subtitle")}
      >
        <div className="btn-row">
          <a
            className="btn primary"
            href="https://play.google.com/store/apps/details?id=net.silvra.spark"
            rel="noreferrer noopener"
            target="_blank"
          >
            {t("messenger.playStore")}
          </a>
        </div>
      </PageHeader>

      <Split media={<img className="media contain" src={messengerLogo} alt="" />}>
        <h2>{t("messenger.status.title")}</h2>
        <p className="muted">{t("messenger.status.body")}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
          {list<string>("messenger.status.badges").map((b) => (
            <span className="badge" key={b}>
              {b}
            </span>
          ))}
        </div>
      </Split>

      <Split media={<img className="media" src={chatPreview} alt="" />} flip>
        <p className="eyebrow">{t("messenger.intro.eyebrow")}</p>
        <h2>{t("messenger.intro.title")}</h2>
        <p className="muted">{t("messenger.intro.body")}</p>
      </Split>

      <Section eyebrow={t("messenger.pillars.eyebrow")} title={t("messenger.pillars.title")}>
        <Cards items={list<Item>("messenger.pillars.items")} />
      </Section>

      <Section eyebrow={t("messenger.adversary.eyebrow")} title={t("messenger.adversary.title")}>
        {list<string>("messenger.adversary.paragraphs").map((p) => (
          <p className="muted" key={p.slice(0, 40)} style={{ maxWidth: "70ch" }}>
            {p}
          </p>
        ))}
        <p className="card" style={{ marginTop: 24 }}>
          {t("messenger.adversary.highlight")}
        </p>
      </Section>

      <Section
        eyebrow={t("messenger.screens.eyebrow")}
        title={t("messenger.screens.title")}
        subtitle={t("messenger.screens.subtitle")}
      >
        <div className="shot-row">
          {screens.map((s, i) => (
            <figure className="card" key={s.title} style={{ margin: 0 }}>
              <img src={shots[i]} alt={s.title} loading="lazy" style={{ borderRadius: 8 }} />
              <figcaption style={{ marginTop: 16 }}>
                <h3 style={{ marginBottom: 4 }}>{s.title}</h3>
                <p className="muted small" style={{ margin: 0 }}>
                  {s.body}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section
        eyebrow={t("messenger.transparency.eyebrow")}
        title={t("messenger.transparency.title")}
        subtitle={t("messenger.transparency.subtitle")}
      >
        <Groups path="messenger.transparency" />
      </Section>

      <Section eyebrow={t("messenger.boundaries.eyebrow")} title={t("messenger.boundaries.title")}>
        <Cards items={list<Item>("messenger.boundaries.items")} columns={2} />
      </Section>

      <Section
        eyebrow={t("messenger.crypto.eyebrow")}
        title={t("messenger.crypto.title")}
        subtitle={t("messenger.crypto.body")}
      >
        <CryptoDemo />
      </Section>

      <Section title={t("messenger.download.title")} subtitle={t("messenger.download.body")}>
        <div className="btn-row">
          <a className="btn primary" href="https://play.google.com/store/apps/details?id=net.silvra.spark" rel="noreferrer noopener" target="_blank">
            {t("messenger.playStore")}
          </a>
        </div>
      </Section>
    </>
  );
}
