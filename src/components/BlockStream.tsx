import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import { useBlockStream } from "../lib/node";
import { EXPLORER } from "../lib/links";

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
  const [now, setNow] = useState(() => Date.now());
  const locale = lang === "de" ? "de-DE" : "en-GB";

  // Ages tick on their own; the blocks only change when the chain does.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const shown = blocks.slice(0, SLOTS);
  const age = (ts: number) => {
    const s = Math.max(0, Math.round((now - ts) / 1000));
    return s < 60 ? t("blocks.secondsAgo", { n: s }) : t("blocks.minutesAgo", { n: Math.floor(s / 60) });
  };

  return (
    <div className="stream" role="region" aria-label={t("blocks.label")}>
      <ol className="stream-row" aria-live="off">
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
