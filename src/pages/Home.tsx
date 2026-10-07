import { Link } from "react-router-dom";
import Gate from "../components/Gate";
import Marquee from "../components/Marquee";
import ScrollWords from "../components/ScrollWords";
import Reveal from "../components/Reveal";
import Scramble from "../components/Scramble";
import Timeline from "../components/Timeline";
import Testnet from "../components/Testnet";
import BlockStream from "../components/BlockStream";
import Bento from "../components/Bento";
import Faq from "../components/Faq";
import CryptoInventory from "../components/CryptoInventory";
import type { QA } from "../components/Faq";
import Photo from "../components/Photo";
import Icon from "../components/Icon";
import { useI18n } from "../i18n";
import { useSeo } from "../lib/seo";
import { DISCORD } from "../lib/links";

interface Point {
  title: string;
  body: string;
}
interface Step {
  when: string;
  title: string;
  body: string;
}

/** A section's small mono label: an index, a slash, a name — decrypted on first sight. */
function Label({ index, text }: { index: string; text: string }) {
  return (
    <p className="label">
      <span className="label-index">{index}</span>
      <Scramble text={text} />
    </p>
  );
}

export default function Home() {
  const { t, list } = useI18n();
  useSeo(t("meta.home.title"), t("meta.home.description"));

  return (
    <>
      <Gate />

      {/* ---- 00 · Who we are ---- */}
      <section className="section about" id="about">
        <div className="container">
          <Label index="00" text={t("home.about.label")} />
          <ScrollWords className="statement" text={t("home.about.statement")} />
          <div className="about-grid">
            <p className="lead">{t("home.about.body")}</p>
            <div className="btn-row">
              <Link className="btn primary magnetic" to="/mission">
                {t("home.about.cta")}
                <Icon name="arrowRight" size={16} />
              </Link>
              <Link className="btn" to="/contact">
                {t("nav.contact")}
              </Link>
            </div>
          </div>
          <Reveal>
            <Bento />
          </Reveal>
        </div>
      </section>

      <Marquee items={list<string>("home.marquee")} />

      {/* ---- 01 · Two products, one foundation ---- */}
      <section className="section">
        <div className="container">
          <Label index="01" text={t("home.stack.label")} />
          <div className="section-head">
            <h2>{t("home.stack.title")}</h2>
            <p className="lead">{t("home.stack.lead")}</p>
          </div>
          <Reveal>
            <div className="stack">
              <div className="stack-products dark-zone">
                <Link to="/messenger" className="stack-product stack-messenger spot">
                  <span className="stack-kicker">{t("home.stack.messenger.kicker")}</span>
                  <span className="stack-name">Silvra Messenger</span>
                  <span className="stack-body">{t("home.stack.messenger.body")}</span>
                  <span className="stack-go">
                    <Icon name="arrowRight" size={18} />
                  </span>
                </Link>
                <span className="stack-blade" aria-hidden="true" />
                <Link to="/helix" className="stack-product stack-helix spot">
                  <span className="stack-kicker">{t("home.stack.helix.kicker")}</span>
                  <span className="stack-name">Helix Blockchain</span>
                  <span className="stack-body">{t("home.stack.helix.body")}</span>
                  <span className="stack-go">
                    <Icon name="arrowRight" size={18} />
                  </span>
                </Link>
              </div>
              <div className="stack-algos">
                <div className="stack-algo">
                  <span className="mono">ML-KEM · FIPS 203</span>
                  <span>{t("home.stack.kem")}</span>
                </div>
                <div className="stack-algo">
                  <span className="mono">ML-DSA · FIPS 204</span>
                  <span>{t("home.stack.dsa")}</span>
                </div>
              </div>
              <div className="stack-layer stack-pq">
                <Icon name="shield" size={18} />
                {t("home.stack.pq")}
              </div>
              <div className="stack-layer stack-eu">
                <span className="eu-dots" aria-hidden="true" />
                {t("home.stack.eu")}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- 02 · Why now ---- */}
      <section className="section why band">
        <div className="container">
          <Label index="02" text={t("home.why.label")} />
          <div className="section-head">
            <h2>{t("home.why.title")}</h2>
            <p className="lead">{t("home.why.lead")}</p>
          </div>
          <Timeline steps={list<Step>("home.why.steps")} />
          <Reveal>
            <div className="badge-row">
              {list<string>("home.why.badges").map((b) => (
                <span className="badge" key={b}>
                  {b}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- 03 · Inventory ---- */}
      <section className="section" id="inventar">
        <div className="container">
          <Label index="03" text={t("home.inventory.label")} />
          <div className="section-head">
            <h2>{t("home.inventory.title")}</h2>
            <p className="lead">{t("home.inventory.lead")}</p>
          </div>
          <Reveal>
            <CryptoInventory />
          </Reveal>
        </div>
      </section>

      {/* ---- 04 · How we work ---- */}
      <section className="section craft">
        <div className="container craft-grid">
          <Reveal>
            <Photo slot="work" className="craft-media" />
          </Reveal>
          <div className="craft-body">
            <Label index="04" text={t("home.craft.label")} />
            <h2>{t("home.craft.title")}</h2>
            <ul className="craft-list">
              {list<Point>("home.craft.points").map((p, i) => (
                <Reveal as="li" key={p.title} delay={i * 80}>
                  <span className="craft-num mono">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{p.title}</h3>
                    <p className="muted">{p.body}</p>
                  </div>
                </Reveal>
              ))}
            </ul>
            <Link className="text-link" to="/mission">
              {t("home.craft.cta")}
              <Icon name="arrowRight" size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ---- 05 · Europe ---- */}
      <section className="section europe">
        <div className="container europe-grid">
          <div>
            <Label index="05" text={t("home.europe.label")} />
            <h2>{t("home.europe.title")}</h2>
            <p className="lead">{t("home.europe.lead")}</p>
            <ul className="europe-points">
              {list<Point>("home.europe.points").map((p, i) => (
                <Reveal as="li" key={p.title} delay={i * 80}>
                  <Icon name={["globe", "ban", "layers"][i] ?? "check"} size={20} />
                  <div>
                    <h3>{p.title}</h3>
                    <p className="muted">{p.body}</p>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
          <Reveal className="europe-visual">
            <Photo slot="europe" className="europe-photo" />
            <p className="europe-caption mono">
              <span className="eu-dots" aria-hidden="true" />
              {t("home.europe.caption")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---- 06 · Live ---- */}
      <section className="section live band">
        <div className="container live-grid">
          <div>
            <Label index="06" text={t("home.live.label")} />
            <h2>{t("home.live.title")}</h2>
            <p className="lead">{t("home.live.lead")}</p>
            <Link className="text-link" to="/helix">
              {t("home.live.cta")}
              <Icon name="arrowRight" size={16} />
            </Link>
          </div>
          <Reveal>
            <Testnet />
          </Reveal>
        </div>
        <div className="container live-stream">
          <BlockStream />
        </div>
      </section>

      {/* ---- 07 · Questions ---- */}
      <section className="section band" id="faq">
        <div className="container faq-grid">
          <div>
            <Label index="07" text={t("home.faq.label")} />
            <h2>{t("home.faq.title")}</h2>
            <p className="lead">{t("home.faq.lead")}</p>
            <Link className="text-link" to="/contact">
              {t("home.faq.more")}
              <Icon name="arrowRight" size={16} />
            </Link>
          </div>
          <Faq items={list<QA>("home.faq.items")} />
        </div>
      </section>

      {/* ---- 08 · Join ---- */}
      <section className="section join">
        <div className="container">
          <Label index="08" text={t("home.join.label")} />
          <h2 className="join-title">{t("home.join.title")}</h2>
          <div className="join-grid">
            <p className="lead">{t("home.join.body")}</p>
            <div className="btn-row">
              <a className="btn primary magnetic" href={`mailto:${t("home.join.email")}`}>
                <Icon name="mail" size={16} />
                {t("home.join.email")}
              </a>
              <a className="btn" href={DISCORD} rel="noreferrer noopener" target="_blank">
                <Icon name="people" size={16} />
                Discord
              </a>
              <Link className="btn" to="/contact">
                {t("nav.contact")}
                <Icon name="arrowRight" size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
