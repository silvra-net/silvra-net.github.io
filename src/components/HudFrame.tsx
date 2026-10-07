/**
 * The frame of a situation display, for the dark openings of every page: digital camouflage at
 * the edges, faint scan lines and four corner marks. Decoration only — hidden from assistive
 * technology and click-through.
 */
export default function HudFrame() {
  return (
    <div className="hud-frame" aria-hidden="true">
      <div className="hud-camo" />
      <div className="hud-scan" />
      <i className="hud-corner tl" />
      <i className="hud-corner tr" />
      <i className="hud-corner bl" />
      <i className="hud-corner br" />
    </div>
  );
}
