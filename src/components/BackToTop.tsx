import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { useI18n } from "../i18n";

const R = 19;
const C = 2 * Math.PI * R;

/**
 * A way back to the top once the page is long behind you, with the reading progress drawn as a
 * ring around it. Hidden until it is useful: on the first screen it would only be clutter.
 */
export default function BackToTop() {
  const { t } = useI18n();
  const [shown, setShown] = useState(false);
  const ring = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let raf = 0;
    const paint = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      ring.current?.style.setProperty("stroke-dashoffset", String(C * (1 - p)));
      setShown(window.scrollY > window.innerHeight * 1.4);
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    paint();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <button
      type="button"
      className={shown ? "to-top shown" : "to-top"}
      aria-label={t("nav.top")}
      tabIndex={shown ? 0 : -1}
      onClick={() => {
        window.scrollTo({ top: 0 });
        // Focus goes up with the view, to the start of the document, as after a page load: the
        // next Tab reaches the skip link, then the header. Left on this button (which now hides),
        // it would continue in the footer.
        document.body.setAttribute("tabindex", "-1");
        document.body.focus({ preventScroll: true });
      }}
    >
      <svg className="to-top-svg" viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r={R} className="to-top-track" />
        <circle ref={ring} cx="22" cy="22" r={R} className="to-top-ring" style={{ strokeDasharray: C, strokeDashoffset: C }} />
      </svg>
      <Icon name="arrowUp" size={16} />
    </button>
  );
}
