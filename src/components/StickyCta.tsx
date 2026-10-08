import { useEffect, useState } from "react";
import type { ReactNode } from "react";

/** The sections that offer the same action in full: while one is on screen, the bar would only
 *  repeat it. */
const IN_PLACE = "#download, #loslegen";

/**
 * On a phone, the page's one action stays within reach once its opening has scrolled away — and
 * gets out of the way again when the footer or the page's own download section arrives, where
 * the same action is offered anyway.
 */
export default function StickyCta({ children, note, live = false }: { children: ReactNode; note?: string; live?: boolean }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const footer = document.querySelector(".site-footer");
      const nearEnd = footer ? footer.getBoundingClientRect().top < window.innerHeight : false;
      const inView = [...document.querySelectorAll(IN_PLACE)].some((el) => {
        const r = el.getBoundingClientRect();
        return r.top < window.innerHeight && r.bottom > 0;
      });
      setShown(window.scrollY > window.innerHeight * 0.9 && !nearEnd && !inView);
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    // Inert while hidden, so its link cannot take focus where nobody can see it.
    <div className={shown ? "sticky-cta shown" : "sticky-cta"} aria-hidden={!shown} {...(!shown ? { inert: "" } : {})}>
      {note && (
        // "Mainnet live · Block 4.447" reads as a label over its value: two short lines, not one
        // that breaks wherever the button leaves room.
        <span className={live ? "sticky-cta-note live" : "sticky-cta-note"}>
          <span>{note.split(" · ")[0]}</span>
          {note.includes(" · ") && <strong>{note.split(" · ").slice(1).join(" · ")}</strong>}
        </span>
      )}
      {children}
    </div>
  );
}
