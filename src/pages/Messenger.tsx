import CipherCanvas from "../components/CipherCanvas";
import CipherLoop from "../components/CipherLoop";
import CryptoDemo from "../components/CryptoDemo";
import Icon from "../components/Icon";
import Marquee from "../components/Marquee";
import MessageJourney from "../components/MessageJourney";
import NextWorld from "../components/NextWorld";
import Photo from "../components/Photo";
import Reveal from "../components/Reveal";
import Scramble from "../components/Scramble";
import SectionNav from "../components/SectionNav";
import AppTour from "../components/AppTour";
import type { TourStep } from "../components/AppTour";
import Faq from "../components/Faq";
import type { QA } from "../components/Faq";
import StickyCta from "../components/StickyCta";
import playQr from "../assets/play-qr.svg";
import { useI18n } from "../i18n";
import { useSeo } from "../lib/seo";
import { PLAY_STORE } from "../lib/links";
import welcomeDe from "../assets/Welcome_DE-portrait.webp";
import welcomeEn from "../assets/Welcome_EN.webp";
import profilDe from "../assets/Profil_DE.webp";
import profilEn from "../assets/Profil_EN.webp";
import settingsDe from "../assets/Settings_DE.webp";
import settingsEn from "../assets/setting_EN.webp";

interface Item {
  icon?: string;
  title: string;
  body: string;
}
interface Group {
  heading: string;
  items: Item[];
}
interface Spec {
  label: string;
  value: string;
}

function Label({ index, text }: { index: string; text: string }) {
  return (
    <p className="label">
      <span className="label-index">{index}</span>
      <Scramble text={text} />
    </p>
  );
}

function PlayButton({ label }: { label: string }) {
  return (
    <a className="btn primary magnetic" href={PLAY_STORE} rel="noreferrer noopener" target="_blank">
      <Icon name="play" size={16} />
      {label}
    </a>
  );
}

export default function Messenger() {
  const { t, list, raw, lang } = useI18n();
  useSeo(t("meta.messenger.title"), t("meta.messenger.description"));

  // The screenshots are of the app in the visitor's language; German UI next to an English
  // caption is the kind of detail that makes a product look unfinished.
  const shots = lang === "de" ? [welcomeDe, profilDe, settingsDe] : [welcomeEn, profilEn, settingsEn];
  const screens = list<Item>("messenger.screens.items");
  const nav = [
    { id: "weg", label: t("messenger.nav.journey") },
    { id: "funktionen", label: t("messenger.nav.features") },
    { id: "schutz", label: t("messenger.nav.security") },
    { id: "app", label: t("messenger.nav.app") },
    { id: "transparenz", label: t("messenger.nav.transparency") },
    { id: "fragen", label: t("messenger.nav.faq") },
    { id: "download", label: t("messenger.nav.download") },
  ];
  const encrypted = raw("messenger.transparency.encrypted") as Group;
  const notEncrypted = raw("messenger.transparency.notEncrypted") as Group;

  return (
    <>
      <section className="p-hero p-hero-messenger dark-zone">
        <div className="p-hero-bg" aria-hidden="true">
          <div className="p-hero-aura" />
          <CipherCanvas phrases={list<string>("home.gate.messenger.phrases")} cell={22} />
        </div>
        <div className="container p-hero-grid">
          <div className="p-hero-text">
            <p className="label">
              <span className="dot ok pulse" aria-hidden="true" />
              <Scramble text={t("messenger.hero.label")} />
            </p>
            <h1 className="p-title">
              <span className="metal">Silvra</span> <span className="metal">Messenger</span>
            </h1>
            <p className="lead">{t("messenger.hero.lead")}</p>
            <div className="btn-row">
              <PlayButton label={t("messenger.playStore")} />
              <a className="btn" href="#weg">
                {t("messenger.hero.more")}
                <Icon name="arrowDown" size={16} />
              </a>
            </div>
            <ul className="chip-row">
              {list<string>("messenger.hero.badges").map((b) => (
                <li className="chip" key={b}>
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-hero-visual">
            <img className="phone-shot" src={shots[0]} alt={t("messenger.hero.shotAlt")} width={600} height={1182} />
            <CipherLoop className="float float-bubble" messages={list<string>("messenger.hero.bubbles")} />
            <span className="float float-chip chip-a" aria-hidden="true">
              <Icon name="key" size={14} />
              {t("messenger.hero.chips.handshake")}
            </span>
            <span className="float float-chip chip-b" aria-hidden="true">
              <Icon name="lock" size={14} />
              {t("messenger.hero.chips.e2e")}
            </span>
            <span className="float float-chip chip-c" aria-hidden="true">
              <Icon name="people" size={14} />
              {t("messenger.hero.chips.feed")}
            </span>
          </div>
        </div>
      </section>

      <Marquee items={list<string>("messenger.marquee")} />
      <SectionNav items={nav} label={t("nav.sections")} />

      {/* ---- 01 · The route of a message ---- */}
      <section className="section" id="weg">
        <div className="container">
          <Label index="01" text={t("messenger.journey.eyebrow")} />
          <div className="section-head">
            <h2>{t("messenger.journey.title")}</h2>
            <p className="lead">{t("messenger.journey.lead")}</p>
          </div>
          <Reveal>
            <MessageJourney />
          </Reveal>
        </div>
      </section>

      {/* ---- 02 · Three pillars ---- */}
      <section className="section">
        <div className="container">
          <Label index="02" text={t("messenger.pillars.eyebrow")} />
          <div className="section-head">
            <h2>{t("messenger.pillars.title")}</h2>
          </div>
          <div className="pillars">
            {list<Item>("messenger.pillars.items").map((p, i) => (
              <Reveal key={p.title} delay={i * 90} className="pillar spot">
                <span className="pillar-num mono">0{i + 1}</span>
                <span className="pillar-icon">
                  <Icon name={p.icon ?? "chat"} size={26} />
                </span>
                <h3>{p.title}</h3>
                <p className="muted">{p.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---- 03 · Everything else ---- */}
      <section className="section band" id="funktionen">
        <div className="container">
          <Label index="03" text={t("messenger.features.eyebrow")} />
          <div className="section-head">
            <h2>{t("messenger.features.title")}</h2>
            <p className="lead">{t("messenger.features.lead")}</p>
          </div>
          <ul className="features">
            {list<Item>("messenger.features.items").map((f, i) => (
              <Reveal as="li" key={f.title} delay={(i % 4) * 60} className="feature spot">
                <Icon name={f.icon ?? "check"} size={20} />
                <div>
                  <h3>{f.title}</h3>
                  <p className="muted">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- 04 · Against what ---- */}
      <section className="section photo-split">
        <div className="container photo-split-grid">
          <Reveal>
            <Photo slot="messenger" className="photo-frame" />
          </Reveal>
          <div>
            <Label index="04" text={t("messenger.intro.eyebrow")} />
            <h2>{t("messenger.intro.title")}</h2>
            <p className="lead">{t("messenger.intro.body")}</p>
          </div>
        </div>
      </section>

      <section className="section" id="schutz">
        <div className="container">
          <Label index="05" text={t("messenger.adversary.eyebrow")} />
          <div className="section-head wide">
            <h2>{t("messenger.adversary.title")}</h2>
          </div>
          <div className="adversary-grid">
            <div>
              {list<string>("messenger.adversary.paragraphs").map((p) => (
                <p className="muted" key={p.slice(0, 40)}>
                  {p}
                </p>
              ))}
              <dl className="spec">
                {list<Spec>("messenger.adversary.spec").map((s) => (
                  <div key={s.label}>
                    <dt>{s.label}</dt>
                    <dd className="mono">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <Reveal>
              <div className="hybrid" role="img" aria-label={t("messenger.adversary.diagramAlt")}>
                <div className="hybrid-in">
                  <span className="hybrid-box">
                    <span className="mono">X25519</span>
                    <small>{t("messenger.adversary.classicNote")}</small>
                  </span>
                  <span className="hybrid-plus" aria-hidden="true">
                    +
                  </span>
                  <span className="hybrid-box pq">
                    <span className="mono">ML-KEM-768</span>
                    <small>{t("messenger.adversary.pqNote")}</small>
                  </span>
                </div>
                <span className="hybrid-line" aria-hidden="true" />
                <span className="hybrid-out">
                  <Icon name="key" size={18} />
                  {t("messenger.adversary.result")}
                </span>
                <span className="hybrid-line short" aria-hidden="true" />
                <span className="hybrid-mls mono">MLS · RFC 9420</span>
                <p className="hybrid-note mono">{t("messenger.adversary.resultNote")}</p>
              </div>
            </Reveal>
          </div>
          <Reveal>
            <blockquote className="quote">{t("messenger.adversary.highlight")}</blockquote>
          </Reveal>
        </div>
      </section>

      <section className="section demo">
        <div className="container demo-grid">
          <div>
            <Label index="06" text={t("messenger.crypto.eyebrow")} />
            <h2>{t("messenger.crypto.title")}</h2>
            <p className="lead">{t("messenger.crypto.body")}</p>
          </div>
          <CryptoDemo />
        </div>
      </section>

      <section className="section band" id="app">
        <div className="container">
          <Label index="07" text={t("messenger.tour.eyebrow")} />
          <div className="section-head">
            <h2>{t("messenger.tour.title")}</h2>
            <p className="lead">{t("messenger.tour.lead")}</p>
          </div>
          <AppTour steps={list<TourStep>("messenger.tour.steps")} shots={shots} alts={screens.map((sc) => sc.title)} />
        </div>
      </section>

      <section className="section" id="transparenz">
        <div className="container">
          <Label index="08" text={t("messenger.transparency.eyebrow")} />
          <div className="section-head">
            <h2>{t("messenger.transparency.title")}</h2>
            <p className="lead">{t("messenger.transparency.subtitle")}</p>
          </div>
          <div className="ledger">
            {[
              { g: encrypted, kind: "yes", icon: "lock" },
              { g: notEncrypted, kind: "no", icon: "alert" },
            ].map(({ g, kind, icon }) => (
              <Reveal key={kind} className={`ledger-col ledger-${kind} spot`}>
                <h3>
                  <Icon name={icon} size={18} />
                  {g.heading}
                </h3>
                <ul>
                  {g.items.map((it) => (
                    <li key={it.title}>
                      <strong>{it.title}</strong>
                      <span className="muted">{it.body}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Label index="09" text={t("messenger.boundaries.eyebrow")} />
          <div className="section-head">
            <h2>{t("messenger.boundaries.title")}</h2>
          </div>
          <div className="nots">
            {list<Item>("messenger.boundaries.items").map((b, i) => (
              <Reveal key={b.title} delay={i * 70} className="not spot">
                <span className="not-icon">
                  <Icon name={b.icon ?? "ban"} size={22} />
                </span>
                <h3>{b.title}</h3>
                <p className="muted">{b.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section band" id="fragen">
        <div className="container faq-grid">
          <div>
            <Label index="10" text={t("messenger.faq.label")} />
            <h2>{t("messenger.faq.title")}</h2>
          </div>
          <Faq items={list<QA>("messenger.faq.items")} />
        </div>
      </section>

      <section className="section download" id="download">
        <div className="container">
          <div className="download-panel dark-zone">
            <div className="download-aura" aria-hidden="true" />
            <div className="download-text">
              <p className="label">{t("messenger.download.label")}</p>
              <h2>{t("messenger.download.title")}</h2>
              <p className="lead">{t("messenger.download.body")}</p>
              <div className="btn-row">
                <PlayButton label={t("messenger.playStore")} />
              </div>
              <p className="download-note">{t("messenger.download.platforms")}</p>
            </div>
            <figure className="download-qr">
              <img src={playQr} alt={t("messenger.download.qrAlt")} width={168} height={168} />
              <figcaption>{t("messenger.download.qr")}</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <StickyCta note={t("messenger.sticky.note")}>
        <a className="btn primary" href={PLAY_STORE} rel="noreferrer noopener" target="_blank">
          <Icon name="play" size={16} />
          {t("messenger.sticky.cta")}
        </a>
      </StickyCta>

      <NextWorld to="helix" />
    </>
  );
}
