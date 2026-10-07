import { useCallback, useState } from "react";
import type { MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import CipherCanvas from "./CipherCanvas";
import HelixCanvas from "./HelixCanvas";
import Icon from "./Icon";
import { useI18n } from "../i18n";
import { useNodeStatus } from "../lib/node";
import { useMediaQuery, useReducedMotion } from "../lib/motion";
import icon from "../assets/silvra-icon.png";

type Side = "messenger" | "helix";

/**
 * Messages only surface in the lower part of the messenger half, clear of the title above and
 * of the blade to the right. The blade's position here mirrors the CSS: it crosses the middle of
 * the gate and leans 7vw either way between top and bottom.
 */
function fitsMessenger(x: number, y: number, w: number, W: number, H: number): boolean {
  if (W < 820) return false;
  const blade = W * 0.5 + W * 0.07 * (1 - (2 * y) / H);
  return y > H * 0.7 && y < H * 0.92 && x > W * 0.05 && x + w < blade - 48;
}

/**
 * The opening of silvra.net: two products side by side, split by a diagonal blade of light.
 *
 * Each half is one link. Pointing at a half widens it and leans the blade away; choosing it
 * sweeps the blade across the screen before the router moves on, so the page you arrive at
 * reads as the half you picked, grown to fill the window. Modified clicks (new tab, new window)
 * and reduced motion skip the sweep and behave like the plain link underneath.
 */
export default function Gate() {
  const { t, list } = useI18n();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const { status } = useNodeStatus();
  const [leaving, setLeaving] = useState<Side | null>(null);
  // On a phone the halves stack top and bottom, so the helix lies along the blade instead.
  const stacked = useMediaQuery("(max-width: 820px)");

  const go = useCallback(
    (side: Side) => (e: MouseEvent<HTMLAnchorElement>) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (reduced) return;
      e.preventDefault();
      setLeaving(side);
      window.setTimeout(() => navigate(`/${side}`), 640);
    },
    [navigate, reduced],
  );

  const height = status?.height.toLocaleString("de-DE");

  return (
    <section className="gate dark-zone" data-leaving={leaving ?? undefined} aria-labelledby="gate-title">
      <h1 id="gate-title" className="sr-only">
        {t("home.gate.title")}
      </h1>

      <Link
        to="/messenger"
        className="gate-side gate-messenger"
        aria-labelledby="gate-m-title"
        aria-describedby="gate-m-text"
        onClick={go("messenger")}
      >
        <div className="gate-bg" aria-hidden="true">
          <div className="gate-aura" />
          <CipherCanvas phrases={list<string>("home.gate.messenger.phrases")} fits={fitsMessenger} />
        </div>
        <div className="gate-content">
          <p className="gate-kicker">
            <span className="gate-index">01</span>
            {t("home.gate.messenger.kicker")}
          </p>
          <h2 className="gate-title" id="gate-m-title">
            <span>{t("home.gate.messenger.title1")}</span> <span>{t("home.gate.messenger.title2")}</span>
          </h2>
          <p className="gate-text" id="gate-m-text">
            {t("home.gate.messenger.text")}
          </p>
          <ul className="gate-facts" aria-hidden="true">
            {list<string>("home.gate.messenger.facts").map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <span className="gate-cta">
            {t("home.gate.messenger.cta")}
            <Icon name="arrowRight" size={18} />
          </span>
        </div>
      </Link>

      <Link
        to="/helix"
        className="gate-side gate-helix"
        aria-labelledby="gate-h-title"
        aria-describedby="gate-h-text"
        onClick={go("helix")}
      >
        <div className="gate-bg" aria-hidden="true">
          <div className="gate-aura" />
          {stacked ? (
            <HelixCanvas key="stacked" cx={0.5} cy={0.66} tilt={1.47} radius={70} length={0.9} pulse={status?.height} />
          ) : (
            <HelixCanvas key="side" cx={0.67} cy={0.44} tilt={0.22} radius={112} length={1.3} pulse={status?.height} />
          )}
        </div>
        <div className="gate-content">
          <p className="gate-live" aria-hidden="true">
            <span className={status ? "dot ok pulse" : "dot off"} />
            {status && height ? t("home.gate.helix.live", { height }) : t("home.gate.helix.offline")}
          </p>
          <p className="gate-kicker">
            <span className="gate-index">02</span>
            {t("home.gate.helix.kicker")}
          </p>
          <h2 className="gate-title" id="gate-h-title">
            <span>{t("home.gate.helix.title1")}</span> <span>{t("home.gate.helix.title2")}</span>
          </h2>
          <p className="gate-text" id="gate-h-text">
            {t("home.gate.helix.text")}
          </p>
          <ul className="gate-facts" aria-hidden="true">
            {list<string>("home.gate.helix.facts").map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <span className="gate-cta">
            {t("home.gate.helix.cta")}
            <Icon name="arrowRight" size={18} />
          </span>
        </div>
      </Link>

      <div className="gate-blade" aria-hidden="true">
        {/* The glow is blurred as a whole after its band is clipped, which is why it is two
            elements deep: a filter on the clipped element itself would be cut off hard. */}
        <i className="gate-glow gate-glow-silver">
          <b />
        </i>
        <i className="gate-glow gate-glow-amber">
          <b />
        </i>
        <i className="gate-core" />
      </div>

      <a className="gate-seal" href="#about" aria-label={t("home.gate.scroll")}>
        <svg className="gate-seal-ring" viewBox="0 0 200 200" aria-hidden="true">
          <defs>
            <path id="seal-path" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
          </defs>
          <text>
            <textPath href="#seal-path" textLength="488">
              {t("home.gate.seal")}
            </textPath>
          </text>
        </svg>
        <img className="gate-seal-mark" src={icon} alt="" />
        <span className="gate-seal-arrow" aria-hidden="true">
          <Icon name="arrowDown" size={14} />
        </span>
      </a>
    </section>
  );
}
