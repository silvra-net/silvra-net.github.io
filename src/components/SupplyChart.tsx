import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { useI18n } from "../i18n";
import Icon from "./Icon";

/*
  HLX supply over time, computed from the protocol's own parameters (helix TOKENOMICS.md,
  helix-executor genesis.rs): 161,000 HLX at genesis (launch reserve 100,000, three operators
  15,000 each, bootstrap validator 15,000 staked + 1,000), then a block reward of 1 HLX that
  halves every 15,768,000 blocks — about a year at two-second blocks. Issuance runs out at a real
  maximum of about 31.7 million; the hard cap of 33,000,000 stays above it in the code.
  Burned fees are not subtracted: they depend on use, and the curve is the ceiling, not a
  forecast.
*/
const GENESIS = 161_000;
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
/* The readout's width (fixed in the stylesheet) and a generous height, for deciding where it fits. */
const TIP_W = 176;
const TIP_H = 92;

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
  const [tableOpen, setTableOpen] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    // Drawn at exactly the width it has, so the readout's pixel position matches the drawing.
    const fit = () => {
      if (el.clientWidth) setW(el.clientWidth);
    };
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    fit();
    return () => ro.disconnect();
  }, []);

  const narrow = w < 520;
  // On a phone the axis carries bare numbers and names its unit once, above itself.
  const pad = narrow ? { ...PAD, right: 24, left: 34 } : PAD;
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
  // Genesis is too small a share to read in millions.
  const amount = (v: number) => (v < 1e6 ? `${v.toLocaleString(locale)} HLX` : mio(v, 2));
  const yearLabel = (year: number) => (year === 0 ? t("helix.supply.genesis") : t("helix.supply.yearLong", { n: year }));
  // Below 100 HLX a year, whole numbers would read "0"; three significant digits keep the halving visible.
  const minted = (v: number) =>
    v < 100 ? v.toLocaleString(locale, { maximumSignificantDigits: 3 }) : v.toLocaleString(locale, { maximumFractionDigits: 0 });

  // The readout sits under the curve, where the chart is empty — never over the cap line or the
  // end value — and on the side of the crosshair that has room. Only at genesis, with the curve
  // on the floor, does it go above.
  let tip: { left: number; top: number; transform?: string } | null = null;
  if (point) {
    const px = x(point.year);
    const py = y(point.supply);
    const left = px > w / 2 ? px - 12 - TIP_W : px + 12;
    const above = py + 18 + TIP_H > H;
    tip = { left: Math.min(w - TIP_W, Math.max(0, left)), top: above ? py - 18 : py + 18, transform: above ? "translateY(-100%)" : undefined };
  }

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
        {/* The viewBox lets the prerendered chart, drawn for 720px, scale down to a phone before
            (or without) the script measuring the real width. */}
        <svg
          viewBox={`0 0 ${w} ${H}`}
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
                {v === 0 || narrow ? `${v / 1e6}` : `${v / 1e6} ${t("helix.supply.millionShort")}`}
              </text>
            </g>
          ))}
          {narrow && (
            <text className="chart-tick" x={0} y={12}>
              {t("helix.supply.millionShort")}
            </text>
          )}
          {(narrow ? [0, 10, 20, 30] : [0, 5, 10, 15, 20, 25, 30]).map((yr) => (
            <text key={yr} className="chart-tick" x={x(yr)} y={H - 10} textAnchor="middle">
              {yr === 0 ? (narrow ? "0" : t("helix.supply.genesis")) : t("helix.supply.yearShort", { n: yr })}
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
        {point && tip && (
          <div className="chart-tip" style={tip} aria-hidden="true">
            <strong>{amount(point.supply)}</strong>
            <span>{yearLabel(point.year)}</span>
            {point.year > 0 && <span>+{minted(point.minted)} HLX</span>}
          </div>
        )}
        {/* In the page from the start, so the first arrow-key step is announced: a live region
            that appears together with its text is often not read at all. */}
        <p className="sr-only" aria-live="polite">
          {point ? `${amount(point.supply)}, ${yearLabel(point.year)}` : ""}
        </p>
      </div>
      <figcaption className="chart-caption">{t("helix.supply.caption")}</figcaption>
      <details className="chart-table" onToggle={(e) => setTableOpen(e.currentTarget.open)}>
        <summary>
          {tableOpen ? t("helix.supply.tableHide") : t("helix.supply.tableShow")}
          <span className="faq-icon" aria-hidden="true">
            <Icon name="plus" size={14} />
          </span>
        </summary>
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
                <td className="mono">{p.year === 0 ? t("helix.supply.genesis") : p.year}</td>
                <td className="mono">{p.minted.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="mono">{p.supply.toLocaleString(locale, { maximumFractionDigits: 0 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
