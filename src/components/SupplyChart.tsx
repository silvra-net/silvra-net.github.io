import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { useI18n } from "../i18n";

/*
  HLX supply over time, computed from the protocol's own parameters (helix TOKENOMICS.md,
  helix-executor genesis.rs): 100,000 HLX at genesis, a block reward of 1 HLX that halves every
  15,768,000 blocks — about a year at two-second blocks — and a hard cap of 33,000,000.
  Burned fees are not subtracted: they depend on use, and the curve is the ceiling, not a
  forecast.
*/
const GENESIS = 100_000;
const BLOCKS_PER_ERA = 15_768_000;
const CAP = 33_000_000;
const YEARS = 30;

interface Point {
  year: number;
  supply: number;
  minted: number;
}

function curve(): Point[] {
  const out: Point[] = [{ year: 0, supply: GENESIS, minted: 0 }];
  let supply = GENESIS;
  for (let era = 0; era < YEARS; era++) {
    // The reward is an integer in nano-HLX shifted right once per era, exactly as the chain does.
    const rewardNano = Math.floor(1e9 / 2 ** era);
    const minted = (BLOCKS_PER_ERA * rewardNano) / 1e9;
    supply += minted;
    out.push({ year: era + 1, supply, minted });
  }
  return out;
}

const H = 300;
const PAD = { top: 28, right: 92, bottom: 34, left: 56 };

/**
 * One series, so no legend: the heading says what is plotted. A hairline marks the cap, the end
 * carries its value, and a crosshair reads out any year — by pointer or by arrow keys. Every
 * value is also in the table below the chart, so nothing depends on hovering.
 */
export default function SupplyChart() {
  const { t, lang } = useI18n();
  const locale = lang === "de" ? "de-DE" : "en-GB";
  const data = useMemo(curve, []);
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(720);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.max(300, el.clientWidth)));
    ro.observe(el);
    setW(Math.max(300, el.clientWidth));
    return () => ro.disconnect();
  }, []);

  const narrow = w < 520;
  const pad = narrow ? { ...PAD, right: 24, left: 44 } : PAD;
  const iw = w - pad.left - pad.right;
  const ih = H - pad.top - pad.bottom;
  const x = (year: number) => pad.left + (year / YEARS) * iw;
  const y = (v: number) => pad.top + ih - (v / 35_000_000) * ih;
  const mio = (v: number, digits = 1) =>
    `${(v / 1e6).toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })} ${t("helix.supply.million")}`;

  const line = data.map((p, i) => `${i ? "L" : "M"}${x(p.year).toFixed(1)},${y(p.supply).toFixed(1)}`).join("");
  const area = `${line}L${x(YEARS)},${y(0)}L${x(0)},${y(0)}Z`;
  const last = data[data.length - 1];
  const point = active === null ? null : data[active];

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * w;
    const year = Math.round(((px - pad.left) / iw) * YEARS);
    setActive(Math.min(YEARS, Math.max(0, year)));
  };
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      setActive((a) => Math.min(YEARS, Math.max(0, (a ?? 0) + (e.key === "ArrowRight" ? 1 : -1))));
    }
    if (e.key === "Escape") setActive(null);
  };

  return (
    <figure className="chart">
      <div className="chart-box" ref={box}>
        <svg
          width={w}
          height={H}
          role="img"
          aria-label={t("helix.supply.aria")}
          tabIndex={0}
          onPointerMove={onMove}
          onPointerLeave={() => setActive(null)}
          onKeyDown={onKey}
          onBlur={() => setActive(null)}
        >
          {[0, 10e6, 20e6, 30e6].map((v) => (
            <g key={v}>
              <line className="chart-grid" x1={pad.left} x2={pad.left + iw} y1={y(v)} y2={y(v)} />
              <text className="chart-tick" x={pad.left - 10} y={y(v) + 4} textAnchor="end">
                {v === 0 ? "0" : `${v / 1e6} ${t("helix.supply.millionShort")}`}
              </text>
            </g>
          ))}
          {[0, 5, 10, 15, 20, 25, 30].map((yr) => (
            <text key={yr} className="chart-tick" x={x(yr)} y={H - 10} textAnchor="middle">
              {yr === 0 ? t("helix.supply.genesis") : t("helix.supply.yearShort", { n: yr })}
            </text>
          ))}

          <line className="chart-cap" x1={pad.left} x2={pad.left + iw} y1={y(CAP)} y2={y(CAP)} />
          <text className="chart-label" x={pad.left + 4} y={y(CAP) - 8}>
            {t("helix.supply.cap")}
          </text>

          <path className="chart-area" d={area} />
          <path className="chart-line" d={line} />

          <circle className="chart-dot" cx={x(last.year)} cy={y(last.supply)} r={4.5} />
          {!narrow && (
            <text className="chart-end" x={x(last.year) + 10} y={y(last.supply) + 4}>
              ≈ {mio(last.supply)}
            </text>
          )}

          {point && (
            <g className="chart-cross">
              <line x1={x(point.year)} x2={x(point.year)} y1={pad.top} y2={pad.top + ih} />
              <circle cx={x(point.year)} cy={y(point.supply)} r={5} />
            </g>
          )}
        </svg>
        {point && (
          <div
            className="chart-tip"
            style={{
              left: Math.min(w - 190, Math.max(0, x(point.year) + 12)),
              top: Math.max(0, y(point.supply) - 70),
            }}
            aria-live="polite"
          >
            <strong>{mio(point.supply, 2)}</strong>
            <span>{point.year === 0 ? t("helix.supply.genesis") : t("helix.supply.yearLong", { n: point.year })}</span>
            {point.year > 0 && <span>+{point.minted.toLocaleString(locale, { maximumFractionDigits: 0 })} HLX</span>}
          </div>
        )}
      </div>
      <figcaption className="chart-caption">{t("helix.supply.caption")}</figcaption>
      <details className="chart-table">
        <summary>{t("helix.supply.table")}</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">{t("helix.supply.colYear")}</th>
              <th scope="col">{t("helix.supply.colMinted")}</th>
              <th scope="col">{t("helix.supply.colSupply")}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.year}>
                <td>{p.year === 0 ? t("helix.supply.genesis") : p.year}</td>
                <td className="mono">{p.minted.toLocaleString(locale, { maximumFractionDigits: 2 })}</td>
                <td className="mono">{p.supply.toLocaleString(locale, { maximumFractionDigits: 0 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
