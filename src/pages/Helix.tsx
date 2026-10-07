import CountUp from "../components/CountUp";
import HelixCanvas from "../components/HelixCanvas";
import Icon from "../components/Icon";
import Marquee from "../components/Marquee";
import NextWorld from "../components/NextWorld";
import Photo from "../components/Photo";
import Reveal from "../components/Reveal";
import Scramble from "../components/Scramble";
import Testnet from "../components/Testnet";
import { useI18n } from "../i18n";
import { useSeo } from "../lib/seo";
import { useNodeStatus } from "../lib/node";
import { DISCORD, EXPLORER, GITHUB, NODE_HOST } from "../lib/links";
import helixIcon from "../assets/helix-icon.png";

interface Feature {
  icon: string;
  title: string;
  body: string;
}

function Label({ index, text }: { index: string; text: string }) {
  return (
    <p className="label">
      <span className="label-index">{index}</span>
      <Scramble text={text} />
    </p>
  );
}

/** A short, stable stand-in for a block hash: decoration, so it only has to look the part. */
function fakeHash(seed: string): string {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0");
}

export default function Helix() {
  const { t, list, lang } = useI18n();
  useSeo(t("meta.helix.title"), t("meta.helix.description"));
  const { status } = useNodeStatus();
  const features = list<Feature>("helix.features");

  return (
    <>
      <section className="p-hero p-hero-helix dark-zone">
        <div className="p-hero-bg" aria-hidden="true">
          <div className="p-hero-aura" />
          <HelixCanvas cx={0.74} cy={0.5} tilt={0.22} radius={130} length={1.35} pulse={status?.height} />
        </div>
        <div className="container p-hero-grid single">
          <div className="p-hero-text">
            <p className="label">
              <span className={status ? "dot ok pulse" : "dot off"} aria-hidden="true" />
              <Scramble text={t("helix.eyebrow")} />
            </p>
            <h1 className="p-title">
              <span className="gold">Helix</span> <span className="p-title-sub">{t("helix.titleSub")}</span>
            </h1>
            <p className="lead">{t("helix.subtitle")}</p>
            <div className="btn-row">
              <a className="btn primary" href={EXPLORER}>
                {t("helix.cta.explorer")}
                <Icon name="arrowUpRight" size={16} />
              </a>
              <a className="btn" href={DISCORD} rel="noreferrer noopener" target="_blank">
                <Icon name="people" size={16} />
                Discord
              </a>
            </div>
            <dl className="hero-stats">
              <div>
                <dt>{t("home.testnet.stats.height")}</dt>
                <dd className="mono">
                  {status ? <CountUp value={status.height} locale={lang === "de" ? "de-DE" : "en-GB"} /> : "—"}
                </dd>
              </div>
              <div>
                <dt>{t("helix.hero.signature")}</dt>
                <dd className="mono">ML-DSA-65</dd>
              </div>
              <div>
                <dt>{t("helix.hero.consensus")}</dt>
                <dd className="mono">BFT · PoS</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <Marquee items={list<string>("helix.marquee")} />

      <section className="section photo-split">
        <div className="container photo-split-grid">
          <Reveal className="helix-mark-wrap">
            <Photo slot="helix" className="photo-frame amber" />
            <img className="helix-mark" src={helixIcon} alt="" width={120} height={120} />
          </Reveal>
          <div>
            <Label index="01" text={t("helix.intro.eyebrow")} />
            <h2>{t("helix.intro.title")}</h2>
            <p className="lead">{t("helix.intro.body")}</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container live-grid">
          <div>
            <Label index="02" text={t("helix.testnet.eyebrow")} />
            <h2>{t("helix.testnet.title")}</h2>
            <p className="lead">{t("helix.testnet.lead")}</p>
          </div>
          <Reveal>
            <Testnet />
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Label index="03" text={t("helix.chain.eyebrow")} />
          <div className="section-head">
            <h2>{t("helix.chain.title")}</h2>
            <p className="lead">{t("helix.chain.lead")}</p>
          </div>
          <ol className="chain">
            {features.map((f, i) => (
              <Reveal as="li" key={f.title} delay={(i % 3) * 90} className="block">
                <div className="block-head mono" aria-hidden="true">
                  <span>#{String(i + 1).padStart(6, "0")}</span>
                  <span>0x{fakeHash(f.title)}</span>
                </div>
                <span className="block-icon">
                  <Icon name={f.icon} size={24} />
                </span>
                <h3>{f.title}</h3>
                <p className="muted">{f.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <div className="honesty">
              <span className="honesty-icon">
                <Icon name="alert" size={22} />
              </span>
              <div>
                <p className="label">{t("helix.honesty.eyebrow")}</p>
                <h2>{t("helix.honesty.title")}</h2>
                {list<string>("helix.honesty.paragraphs").map((p) => (
                  <p className="muted" key={p.slice(0, 40)}>
                    {p}
                  </p>
                ))}
                <p className="honesty-highlight">{t("helix.honesty.highlight")}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Label index="04" text={t("helix.cta.eyebrow")} />
          <div className="section-head">
            <h2>{t("helix.cta.title")}</h2>
            <p className="lead">{t("helix.cta.body")}</p>
          </div>
          <div className="link-grid">
            <a className="link-card" href={EXPLORER}>
              <Icon name="cube" size={22} />
              <span className="link-card-title">Helix {t("nav.explorer")}</span>
              <span className="muted">{t("helix.cta.explorerBody")}</span>
              <Icon name="arrowUpRight" size={18} className="link-card-go" />
            </a>
            <a className="link-card" href={`https://${NODE_HOST}`} rel="noreferrer noopener" target="_blank">
              <Icon name="server" size={22} />
              <span className="link-card-title">{NODE_HOST}</span>
              <span className="muted">{t("helix.cta.nodeBody")}</span>
              <Icon name="arrowUpRight" size={18} className="link-card-go" />
            </a>
            <a className="link-card" href={GITHUB} rel="noreferrer noopener" target="_blank">
              <Icon name="code" size={22} />
              <span className="link-card-title">GitHub</span>
              <span className="muted">{t("helix.cta.githubBody")}</span>
              <Icon name="arrowUpRight" size={18} className="link-card-go" />
            </a>
            <a className="link-card" href={DISCORD} rel="noreferrer noopener" target="_blank">
              <Icon name="people" size={22} />
              <span className="link-card-title">Discord</span>
              <span className="muted">{t("helix.cta.discordBody")}</span>
              <Icon name="arrowUpRight" size={18} className="link-card-go" />
            </a>
          </div>
        </div>
      </section>

      <NextWorld to="messenger" />
    </>
  );
}
