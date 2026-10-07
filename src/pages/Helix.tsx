import BlockStream from "../components/BlockStream";
import CodeBlock from "../components/CodeBlock";
import CountUp from "../components/CountUp";
import HelixCanvas from "../components/HelixCanvas";
import Icon from "../components/Icon";
import Marquee from "../components/Marquee";
import NextWorld from "../components/NextWorld";
import Photo from "../components/Photo";
import Reveal from "../components/Reveal";
import Scramble from "../components/Scramble";
import SupplyChart from "../components/SupplyChart";
import Testnet from "../components/Testnet";
import SectionNav from "../components/SectionNav";
import Faq from "../components/Faq";
import type { QA } from "../components/Faq";
import StickyCta from "../components/StickyCta";
import HudFrame from "../components/HudFrame";
import { useOs } from "../lib/os";
import { useI18n } from "../i18n";
import { useSeo } from "../lib/seo";
import { useNodeStatus } from "../lib/node";
import { DISCORD, EXPLORER, HELIX_DOCS, HELIX_RELEASES, HELIX_REPO, HELIX_TOKENOMICS, NODE_HOST } from "../lib/links";
import helixIcon from "../assets/helix-icon.png";

interface Feature {
  icon: string;
  title: string;
  body: string;
}
interface Row {
  problem: string;
  helix: string;
}
interface Figure {
  value: string;
  label: string;
}

function Label({ index, text }: { index: string; text: string }) {
  return (
    <p className="label">
      <span className="label-index">{index}</span>
      <Scramble text={text} />
    </p>
  );
}

/** A short, stable stand-in for a block hash on the architecture tiles: decoration only. */
function fakeHash(seed: string): string {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0");
}

export default function Helix() {
  const { t, list, lang } = useI18n();
  useSeo(t("meta.helix.title"), t("meta.helix.description"));
  const { status, validators, blockTime } = useNodeStatus();
  const locale = lang === "de" ? "de-DE" : "en-GB";
  const features = list<Feature>("helix.features");
  const os = useOs();
  // The wallet is a desktop app: name the visitor's system when it is one of the three it runs
  // on, and say plainly that it is for a computer when the visitor is on a phone.
  const walletLabel = t(`helix.download.${os === "mac" || os === "windows" || os === "linux" ? os : "generic"}`);
  const nav = [
    { id: "live", label: t("helix.nav.live") },
    { id: "warum", label: t("helix.nav.why") },
    { id: "architektur", label: t("helix.nav.chain") },
    { id: "tokenomics", label: t("helix.nav.supply") },
    { id: "loslegen", label: t("helix.nav.start") },
    { id: "fragen", label: t("helix.nav.faq") },
    { id: "offen", label: t("helix.nav.open") },
  ];

  return (
    <>
      <section className="p-hero p-hero-helix dark-zone">
        <div className="p-hero-bg" aria-hidden="true">
          <div className="p-hero-aura" />
          <HelixCanvas cx={0.74} cy={0.5} tilt={0.22} radius={130} length={1.35} pulse={status?.height} />
        </div>
        <HudFrame />
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
              <a className="btn primary magnetic" href={HELIX_RELEASES} rel="noreferrer noopener" target="_blank">
                <Icon name="arrowDown" size={16} />
                {walletLabel}
              </a>
              <a className="btn" href={EXPLORER}>
                {t("helix.cta.explorer")}
                <Icon name="arrowUpRight" size={16} />
              </a>
            </div>
            <dl className="hero-stats">
              <div>
                <dt>{t("home.testnet.stats.height")}</dt>
                <dd className="mono">{status ? <CountUp value={status.height} locale={locale} /> : "—"}</dd>
              </div>
              <div>
                <dt>{t("helix.hero.blockTime")}</dt>
                <dd className="mono">
                  {blockTime ? `${blockTime.toLocaleString(locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 })} s` : "≈ 2 s"}
                </dd>
              </div>
              <div>
                <dt>{t("helix.hero.validators")}</dt>
                <dd className="mono">{validators ?? "—"}</dd>
              </div>
              <div>
                <dt>{t("helix.hero.signature")}</dt>
                <dd className="mono">ML-DSA-65</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <Marquee items={list<string>("helix.marquee")} />
      <SectionNav items={nav} label={t("nav.sections")} />

      {/* ---- 01 · The chain, live ---- */}
      <section className="section" id="live">
        <div className="container">
          <Label index="01" text={t("helix.live.eyebrow")} />
          <div className="section-head">
            <h2>{t("helix.live.title")}</h2>
            <p className="lead">{t("helix.live.lead")}</p>
          </div>
          <BlockStream />
          <div className="live-under">
            <Testnet />
          </div>
        </div>
      </section>

      {/* ---- 02 · Built for it ---- */}
      <section className="section photo-split">
        <div className="container photo-split-grid">
          <Reveal className="helix-mark-wrap">
            <Photo slot="helix" className="photo-frame amber" />
            <img className="helix-mark" src={helixIcon} alt="" width={120} height={120} />
          </Reveal>
          <div>
            <Label index="02" text={t("helix.intro.eyebrow")} />
            <h2>{t("helix.intro.title")}</h2>
            <p className="lead">{t("helix.intro.body")}</p>
          </div>
        </div>
      </section>

      {/* ---- 03 · Why Helix ---- */}
      <section className="section band" id="warum">
        <div className="container">
          <Label index="03" text={t("helix.why.eyebrow")} />
          <div className="section-head">
            <h2>{t("helix.why.title")}</h2>
            <p className="lead">{t("helix.why.lead")}</p>
          </div>
          <Reveal>
            <table className="compare">
              <thead>
                <tr>
                  <th scope="col">{t("helix.why.colProblem")}</th>
                  <th scope="col">
                    <span className="compare-helix">Helix</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list<Row>("helix.why.rows").map((r) => (
                  <tr key={r.problem}>
                    <td>
                      <Icon name="alert" size={16} />
                      {r.problem}
                    </td>
                    <td>
                      <Icon name="check" size={16} />
                      {r.helix}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </div>
      </section>

      {/* ---- 04 · Architecture ---- */}
      <section className="section" id="architektur">
        <div className="container">
          <Label index="04" text={t("helix.chain.eyebrow")} />
          <div className="section-head">
            <h2>{t("helix.chain.title")}</h2>
            <p className="lead">{t("helix.chain.lead")}</p>
          </div>
          <ol className="chain">
            {features.map((f, i) => (
              <Reveal as="li" key={f.title} delay={(i % 4) * 80} className="block spot">
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

      {/* ---- 05 · Tokenomics ---- */}
      <section className="section band" id="tokenomics">
        <div className="container">
          <Label index="05" text={t("helix.supply.eyebrow")} />
          <div className="section-head">
            <h2>{t("helix.supply.title")}</h2>
            <p className="lead">{t("helix.supply.lead")}</p>
          </div>
          <div className="supply-grid">
            <Reveal className="supply-chart">
              <h3 className="chart-title">{t("helix.supply.chartTitle")}</h3>
              <SupplyChart />
            </Reveal>
            <dl className="figures">
              {list<Figure>("helix.supply.figures").map((f, i) => (
                <Reveal key={f.label} delay={i * 50} className="figure">
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </Reveal>
              ))}
            </dl>
          </div>
          <p className="supply-note">
            <Icon name="alert" size={16} />
            <span>
              {t("helix.supply.note")}{" "}
              <a href={HELIX_TOKENOMICS} rel="noreferrer noopener" target="_blank">
                TOKENOMICS.md
              </a>
              .
            </span>
          </p>
        </div>
      </section>

      {/* ---- 06 · Get started ---- */}
      <section className="section" id="loslegen">
        <div className="container">
          <Label index="06" text={t("helix.start.eyebrow")} />
          <div className="section-head">
            <h2>{t("helix.start.title")}</h2>
            <p className="lead">{t("helix.start.lead")}</p>
          </div>
          <div className="paths">
            <Reveal className="path spot">
              <span className="path-num mono">A</span>
              <h3>{t("helix.start.wallet.title")}</h3>
              <p className="muted">{t("helix.start.wallet.body")}</p>
              <ul className="path-points">
                {list<string>("helix.start.wallet.points").map((p) => (
                  <li key={p}>
                    <Icon name="check" size={16} />
                    {p}
                  </li>
                ))}
              </ul>
              <a className="btn primary magnetic" href={HELIX_RELEASES} rel="noreferrer noopener" target="_blank">
                <Icon name="arrowDown" size={16} />
                {walletLabel}
              </a>
              {os === "mobile" && <p className="path-note">{t("helix.download.mobileNote")}</p>}
            </Reveal>
            <Reveal className="path spot" delay={90}>
              <span className="path-num mono">B</span>
              <h3>{t("helix.start.cli.title")}</h3>
              <p className="muted">{t("helix.start.cli.body")}</p>
              <CodeBlock title="helix" lines={list<string>("helix.start.cli.lines")} />
              <a className="text-link" href={`${HELIX_DOCS}/cli.md`} rel="noreferrer noopener" target="_blank">
                {t("helix.start.cli.cta")}
                <Icon name="arrowUpRight" size={16} />
              </a>
            </Reveal>
            <Reveal className="path spot" delay={180}>
              <span className="path-num mono">C</span>
              <h3>{t("helix.start.validate.title")}</h3>
              <p className="muted">{t("helix.start.validate.body")}</p>
              <ul className="path-points">
                {list<string>("helix.start.validate.points").map((p) => (
                  <li key={p}>
                    <Icon name="check" size={16} />
                    {p}
                  </li>
                ))}
              </ul>
              <div className="btn-row">
                <a className="btn" href={`${HELIX_DOCS}/running-a-node.md`} rel="noreferrer noopener" target="_blank">
                  {t("helix.start.validate.cta")}
                  <Icon name="arrowUpRight" size={14} />
                </a>
                <a className="btn" href={`${HELIX_DOCS}/staking.md`} rel="noreferrer noopener" target="_blank">
                  {t("helix.start.validate.cta2")}
                  <Icon name="arrowUpRight" size={14} />
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---- Honestly ---- */}
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
                <ul className="honesty-list">
                  {list<{ title: string; body: string }>("helix.honesty.items").map((it) => (
                    <li key={it.title}>
                      <strong>{it.title}</strong>
                      <span className="muted">{it.body}</span>
                    </li>
                  ))}
                </ul>
                <p className="honesty-highlight">{t("helix.honesty.highlight")}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- Questions ---- */}
      <section className="section band" id="fragen">
        <div className="container faq-grid">
          <div>
            <Label index="07" text={t("helix.faq.label")} />
            <h2>{t("helix.faq.title")}</h2>
          </div>
          <Faq items={list<QA>("helix.faq.items")} />
        </div>
      </section>

      {/* ---- 08 · Open ---- */}
      <section className="section" id="offen">
        <div className="container">
          <Label index="08" text={t("helix.cta.eyebrow")} />
          <div className="section-head">
            <h2>{t("helix.cta.title")}</h2>
            <p className="lead">{t("helix.cta.body")}</p>
          </div>
          <div className="link-grid">
            <a className="link-card spot" href={HELIX_REPO} rel="noreferrer noopener" target="_blank">
              <Icon name="code" size={22} />
              <span className="link-card-title">silvra-net/helix</span>
              <span className="muted">{t("helix.cta.githubBody")}</span>
              <Icon name="arrowUpRight" size={18} className="link-card-go" />
            </a>
            <a className="link-card spot" href={EXPLORER}>
              <Icon name="cube" size={22} />
              <span className="link-card-title">Helix {t("nav.explorer")}</span>
              <span className="muted">{t("helix.cta.explorerBody")}</span>
              <Icon name="arrowUpRight" size={18} className="link-card-go" />
            </a>
            <a className="link-card spot" href={`https://${NODE_HOST}`} rel="noreferrer noopener" target="_blank">
              <Icon name="server" size={22} />
              <span className="link-card-title">{NODE_HOST}</span>
              <span className="muted">{t("helix.cta.nodeBody")}</span>
              <Icon name="arrowUpRight" size={18} className="link-card-go" />
            </a>
            <a className="link-card spot" href={DISCORD} rel="noreferrer noopener" target="_blank">
              <Icon name="people" size={22} />
              <span className="link-card-title">Discord</span>
              <span className="muted">{t("helix.cta.discordBody")}</span>
              <Icon name="arrowUpRight" size={18} className="link-card-go" />
            </a>
          </div>
        </div>
      </section>

      <NextWorld to="messenger" />

      <StickyCta live note={status ? t("helix.sticky.note", { height: status.height.toLocaleString(locale) }) : undefined}>
        <a className="btn primary" href={EXPLORER}>
          {t("helix.cta.explorer")}
          <Icon name="arrowUpRight" size={16} />
        </a>
      </StickyCta>
    </>
  );
}
