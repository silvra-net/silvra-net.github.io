import { Link } from "react-router-dom";
import CipherLoop from "./CipherLoop";
import CountUp from "./CountUp";
import Icon from "./Icon";
import Photo from "./Photo";
import { useI18n } from "../i18n";
import { useNodeStatus } from "../lib/node";
import { HELIX_REPO } from "../lib/links";
import welcomeDe from "../assets/Welcome_DE-portrait.webp";
import welcomeEn from "../assets/Welcome_EN.webp";

/**
 * Silvra at a glance, as a bento grid: each tile one fact, several of them alive — a message
 * that keeps encrypting itself, the chain's real height, a standard you can look up.
 */
export default function Bento() {
  const { t, list, lang } = useI18n();
  const { status, failed, validators } = useNodeStatus();
  const locale = lang === "de" ? "de-DE" : "en-GB";

  return (
    <div className="bento">
      <Link to="/messenger" className="tile tile-messenger dark-zone">
        <span className="tile-kicker mono">{t("home.bento.messenger.kicker")}</span>
        <h3 className="tile-title">{t("home.bento.messenger.title")}</h3>
        <p className="tile-body">{t("home.bento.messenger.body")}</p>
        <img className="tile-phone" src={lang === "de" ? welcomeDe : welcomeEn} alt="" loading="lazy" width={600} height={1182} />
        <div className="tile-chat" aria-hidden="true">
          <p className="tile-bubble theirs">{t("home.bento.messenger.incoming")}</p>
          <CipherLoop className="tile-bubble-loop" messages={list<string>("messenger.hero.bubbles")} />
        </div>
        <span className="tile-go" aria-hidden="true">
          <Icon name="arrowRight" size={18} />
        </span>
      </Link>

      <Link to="/helix" className="tile tile-helix dark-zone">
        <span className="tile-kicker mono">
          {/* The words are the project's state, the dot is the node's: it lights only once the
              node has answered, like the panel's. */}
          <span className={status ? "dot ok pulse" : "dot off"} />{" "}
          {failed ? `Helix · ${t("home.testnet.offline")}` : t("home.bento.helix.kicker")}
        </span>
        <h3 className="tile-title">{t("home.bento.helix.title")}</h3>
        <p className="tile-big mono">{status ? <CountUp value={status.height} locale={locale} /> : "—"}</p>
        <p className="tile-body">
          {t("home.bento.helix.body", { validators: validators ?? "—" })}
        </p>
        <span className="tile-go" aria-hidden="true">
          <Icon name="arrowRight" size={18} />
        </span>
      </Link>

      <div className="tile tile-standards">
        <span className="tile-kicker mono">{t("home.bento.standards.kicker")}</span>
        <ul className="tile-seals">
          {list<{ code: string; name: string }>("home.bento.standards.items").map((s) => (
            <li key={s.code}>
              <span className="mono">{s.code}</span>
              {s.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="tile tile-eu dark-zone">
        <Photo slot="europe" className="tile-photo" />
        <div className="tile-overlay">
          <span className="tile-kicker mono">
            <span className="eu-dots" aria-hidden="true" /> {t("home.bento.eu.kicker")}
          </span>
          <h3 className="tile-title">{t("home.bento.eu.title")}</h3>
        </div>
      </div>

      <div className="tile tile-zero">
        <p className="tile-zero-num">0</p>
        <ul className="tile-zero-list">
          {list<string>("home.bento.zero.items").map((z) => (
            <li key={z}>
              <Icon name="ban" size={16} />
              {z}
            </li>
          ))}
        </ul>
      </div>

      <a className="tile tile-open" href={HELIX_REPO} rel="noreferrer noopener" target="_blank">
        <span className="tile-kicker mono">
          <Icon name="code" size={14} /> {t("home.bento.open.kicker")}
        </span>
        <h3 className="tile-title">{t("home.bento.open.title")}</h3>
        <p className="tile-body">{t("home.bento.open.body")}</p>
        {/* The README's own build steps, so the tile shows what "open" means in practice. */}
        <pre className="tile-term" aria-hidden="true">
          <span className="tile-term-p">$</span> git clone github.com/silvra-net/helix{"\n"}
          <span className="tile-term-p">$</span> cargo build --release{"\n"}
          <span className="tile-term-ok">✓</span> target/release/helix
        </pre>
        <span className="tile-go" aria-hidden="true">
          <Icon name="arrowUpRight" size={18} />
        </span>
      </a>
    </div>
  );
}
