/**
 * The frame of a situation display, for the dark openings of every page: digital camouflage at
 * the edges, faint scan lines and four corner marks. Decoration only — hidden from assistive
 * technology and click-through. A panel that draws its own corner marks takes it without them.
 */
export default function HudFrame({ corners = true }: { corners?: boolean }) {
  return (
    <div className="hud-frame" aria-hidden="true">
      <div className="hud-camo" />
      <div className="hud-scan" />
      {corners && (
        <>
          <i className="hud-corner tl" />
          <i className="hud-corner tr" />
          <i className="hud-corner bl" />
          <i className="hud-corner br" />
        </>
      )}
    </div>
  );
}
