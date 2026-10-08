import { useEffect, useRef, useState } from "react";
import type { FocusEvent } from "react";
import { useI18n } from "../i18n";
import { useBlockStream } from "../lib/node";
import { useReducedMotion } from "../lib/motion";
import { EXPLORER } from "../lib/links";

/* As many tiles as the widest row can hold. How many of them show is up to the stylesheet: a
   container query hides the ones the row has no room for, so a tile is never cut off at the edge
   and a hidden tile cannot take focus — with or without JavaScript, from the first paint. */
const SLOTS = 8;

function short(hash: string): string {
  return hash ? `${hash.slice(0, 6)}…${hash.slice(-4)}` : "";
}

/**
 * The chain, as it grows: the newest blocks as a row of tiles, each one sliding in when the
 * node reports it. Heights, hashes, transaction counts and ages come from the node's own block
 * view — consecutive, never filled in or simulated. Empty slots stay visibly empty.
 */
export default function BlockStream() {
  const { t, lang } = useI18n();
  const { blocks, failed } = useBlockStream();
  // The same switch that stops the numbers stops the ages: a paused page shows clock times,
  // which stay true without changing.
  const paused = useReducedMotion();
  const [now, setNow] = useState(() => Date.now());
  const locale = lang === "de" ? "de-DE" : "en-GB";

  useEffect(() => {
    if (paused) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [paused]);

  // While the visitor is in the row — a tile focused, or the pointer over it — the row holds
  // still. Otherwise a new block would push the focused tile one place on every two seconds,
  // and out of the row altogether a few blocks later. On leaving, it catches up at once.
  const [focusIn, setFocusIn] = useState(false);
  const [pointerIn, setPointerIn] = useState(false);
  const held = focusIn || pointerIn;
  const kept = useRef(blocks);
  if (!held) kept.current = blocks;
  const shown = kept.current.slice(0, SLOTS);

  const onBlur = (e: FocusEvent<HTMLOListElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusIn(false);
  };

  const age = (ts: number) => {
    if (paused) {
      return new Date(ts).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }
    const s = Math.max(0, Math.round((now - ts) / 1000));
    return s < 60 ? t("blocks.secondsAgo", { n: s }) : t("blocks.minutesAgo", { n: Math.floor(s / 60) });
  };

  return (
    <div className="stream" role="region" aria-label={t("blocks.label")}>
      <ol
        className="stream-row"
        aria-live="off"
        onFocus={() => setFocusIn(true)}
        onBlur={onBlur}
        onPointerEnter={() => setPointerIn(true)}
        onPointerLeave={() => setPointerIn(false)}
      >
        {shown.map((b, i) => (
          <li key={b.height} className={i === 0 ? "stream-block newest" : "stream-block"}>
            <a href={`${EXPLORER}block/${b.height}`} className="stream-link">
              <span className="stream-top" aria-hidden="true" />
              <span className="stream-height mono">#{b.height.toLocaleString(locale)}</span>
              <span className="stream-tx mono">{t("blocks.tx", { n: b.tx_count })}</span>
              <span className="stream-hash mono">{short(b.hash)}</span>
              <span className="stream-age mono">{age(b.timestamp)}</span>
              {/* Named by what it shows (WCAG 2.5.3), then where it leads. */}
              <span className="sr-only"> — {t("blocks.openSuffix")}</span>
            </a>
          </li>
        ))}
        {Array.from({ length: Math.max(0, SLOTS - shown.length) }, (_, i) => (
          <li key={`empty-${i}`} className="stream-block empty" aria-hidden="true">
            <span className="stream-top" />
            <span className="stream-height mono">{failed ? "—" : "…"}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
