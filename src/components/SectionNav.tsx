import { useEffect, useRef, useState } from "react";

export interface NavItem {
  id: string;
  label: string;
}

/**
 * A long page's table of contents, pinned under the header once the opening has scrolled past:
 * where you are, and one tap to anywhere else. The current section is the last one whose top
 * has passed the upper third of the screen.
 *
 * Pages render it as the first child of a `.section-span` wrapper around their numbered
 * sections. A sticky element stays inside its parent, so the bar scrolls away with the last
 * section instead of floating over the door to the other world and the footer, with or without
 * JavaScript.
 */
export default function SectionNav({ items, label }: { items: NavItem[]; label: string }) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const [stuck, setStuck] = useState(false);
  const bar = useRef<HTMLElement>(null);

  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const line = window.innerHeight / 3;
      let current = items[0]?.id ?? "";
      for (const it of items) {
        const el = document.getElementById(it.id);
        if (el && el.getBoundingClientRect().top < line) current = it.id;
      }
      setActive(current);
      const top = bar.current?.getBoundingClientRect().top ?? 1;
      setStuck(top <= 73);
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
  }, [items]);

  // Keep the active pill in view inside the horizontally scrolling bar on narrow screens.
  useEffect(() => {
    const el = bar.current?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    const track = bar.current?.querySelector<HTMLElement>(".section-nav-track");
    if (el && track && track.scrollWidth > track.clientWidth) {
      track.scrollTo({ left: el.offsetLeft - track.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
    }
  }, [active]);

  return (
    <nav ref={bar} className={stuck ? "section-nav stuck" : "section-nav"} aria-label={label}>
      <div className="container">
        <div className="section-nav-track">
          {items.map((it) => (
            <a
              key={it.id}
              data-id={it.id}
              href={`#${it.id}`}
              className={it.id === active ? "section-nav-link active" : "section-nav-link"}
              aria-current={it.id === active ? "location" : undefined}
            >
              {it.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
