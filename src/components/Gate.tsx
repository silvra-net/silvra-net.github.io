import { useCallback, useEffect, useRef, useState } from "react";
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
 * Messages only surface in the lower part of the messenger half, clear of the title above, of
 * the status readout below and of the blade to the right. The blade's position here mirrors the
 * CSS: it crosses the middle of the gate and leans 7vw either way between top and bottom.
 */
function fitsMessenger(x: number, y: number, w: number, W: number, H: number): boolean {
  if (W < 820) return false;
  const blade = W * 0.5 + W * 0.07 * (1 - (2 * y) / H);
  return y > H * 0.66 && y < H * 0.82 && x > W * 0.05 && x + w < blade - 48;
}

/** A status readout in the corner of a half: label and value, like a line on a display. */
function Readout({ rows, className }: { rows: [string, string][]; className: string }) {
  return (
    <dl className={`gate-readout ${className}`}>
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * The opening of silvra.net: a main menu with two sectors, split by a diagonal blade.
 *
 * It reads like a situation display — corner marks, a status readout per side, a claim plate at
 * the top — but every working part is ordinary: each half is one link, the claim is the page's
 * h1, and the readouts repeat what the page says elsewhere, so they are hidden from assistive
 * technology. ← and → choose a side from the keyboard, as a menu would.
 *
 * Pointing at a half widens it and leans the blade away; choosing it sweeps the blade across the
 * screen before the router moves on. Modified clicks (new tab, new window) and stillness skip
 * the sweep and behave like the plain link underneath.
 */
export default function Gate() {
  const { t, list, lang } = useI18n();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const { status, failed } = useNodeStatus();
  const [leaving, setLeaving] = useState<Side | null>(null);
  const section = useRef<HTMLElement>(null);
  const messenger = useRef<HTMLAnchorElement>(null);
  const helix = useRef<HTMLAnchorElement>(null);
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

  // ← and → pick a side while the menu is on screen and nothing else has the keyboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const el = section.current;
      const active = document.activeElement;
      const free = !active || active === document.body || (el?.contains(active) ?? false);
      if (!el || !free) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < window.innerHeight * 0.5 || r.top > window.innerHeight * 0.5) return;
      e.preventDefault();
      (e.key === "ArrowLeft" ? messenger : helix).current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const height = status ? status.height.toLocaleString(lang === "de" ? "de-DE" : "en-GB") : null;
  const helixRows = list<[string, string]>("home.gate.hudHelix").map(
    ([k, v]) =>
      [
        k,
        v
          .replace("{{height}}", height ?? (failed ? t("home.gate.hudOffline") : "…"))
          .replace("{{version}}", status?.version ?? "—"),
      ] as [string, string],
  );

  return (
    <section ref={section} className="gate dark-zone" data-leaving={leaving ?? undefined} aria-labelledby="gate-title">
      <div className="gate-plate">
        <h1 id="gate-title" className="gate-claim">
          <span className="gate-claim-org">{t("home.gate.claimOrg")}</span>
          <span className="gate-claim-sep" aria-hidden="true">
            //
          </span>
          <span className="sr-only"> — </span>
          {t("home.gate.claim")}
        </h1>
        <p className="gate-choose" aria-hidden="true">
          <kbd>←</kbd>
          {t("home.gate.choose")}
          <kbd>→</kbd>
        </p>
      </div>

      <Link
        ref={messenger}
        to="/messenger"
        className="gate-side gate-messenger"
        onClick={go("messenger")}
      >
        <div className="gate-bg" aria-hidden="true">
          <div className="gate-camo" />
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
          <span className="gate-cta">
            {t("home.gate.messenger.cta")}
            <Icon name="arrowRight" size={18} />
          </span>
        </div>
      </Link>

      <Link
        ref={helix}
        to="/helix"
        className="gate-side gate-helix"
        onClick={go("helix")}
      >
        <div className="gate-bg" aria-hidden="true">
          <div className="gate-camo" />
          <div className="gate-aura" />
          {stacked ? (
            <HelixCanvas key="stacked" cx={0.5} cy={0.66} tilt={1.47} radius={70} length={0.9} pulse={status?.height} />
          ) : (
            <HelixCanvas key="side" cx={0.67} cy={0.44} tilt={0.22} radius={112} length={1.3} pulse={status?.height} />
          )}
        </div>
        <div className="gate-content">
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
          <span className="gate-cta">
            {t("home.gate.helix.cta")}
            <Icon name="arrowRight" size={18} />
          </span>
        </div>
      </Link>

      <div className="gate-hud" aria-hidden="true">
        <i className="hud-corner tl" />
        <i className="hud-corner tr" />
        <i className="hud-corner bl" />
        <i className="hud-corner br" />
        <div className="gate-scan" />
        <Readout className="readout-messenger" rows={list<[string, string]>("home.gate.hudMessenger")} />
        <Readout className={status ? "readout-helix live" : "readout-helix"} rows={helixRows} />
      </div>

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
        <i className="gate-pulse" />
      </div>

      {/* The name starts with the words written on the ring, so someone who reads them aloud to
          a voice control finds the link (WCAG 2.5.3). */}
      <a className="gate-seal" href="#about" aria-label={`${t("home.gate.seal").replace(/ · $/, "")} — ${t("home.gate.scroll")}`}>
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
        {/* A bezel of ticks, still while the text ring turns: the emblem's fixed frame. */}
        <svg className="gate-seal-bezel" viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r="95" pathLength="360" />
          <circle className="major" cx="100" cy="100" r="95" pathLength="360" />
        </svg>
        <img className="gate-seal-mark" src={icon} alt="" />
        <span className="gate-seal-arrow" aria-hidden="true">
          <Icon name="arrowDown" size={14} />
        </span>
      </a>
    </section>
  );
}
