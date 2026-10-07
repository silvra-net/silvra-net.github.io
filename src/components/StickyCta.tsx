import { useEffect, useState } from "react";
import type { ReactNode } from "react";

/**
 * On a phone, the page's one action stays within reach once its opening has scrolled away — and
 * gets out of the way again when the footer arrives, where the same action is offered anyway.
 */
export default function StickyCta({ children, note, live = false }: { children: ReactNode; note?: string; live?: boolean }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const footer = document.querySelector(".site-footer");
      const nearEnd = footer ? footer.getBoundingClientRect().top < window.innerHeight : false;
      setShown(window.scrollY > window.innerHeight * 0.9 && !nearEnd);
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
    <div className={shown ? "sticky-cta shown" : "sticky-cta"} aria-hidden={!shown}>
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
