import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

/**
 * Fade a block in the first time it comes into view.
 *
 * Deliberately one-way and short: this is the whole animation budget the design system has for
 * ordinary content. Anything that re-animates on the way back up turns scrolling into a
 * performance, which is the opposite of what a page about restraint should do.
 *
 * Visitors who ask for reduced motion get the content immediately, never a fade.
 */
export default function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    if (shown) return;
    const el = ref.current;
    // No IntersectionObserver (or no element) must never mean invisible content.
    if (!el || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  return (
    <div ref={ref} className={shown ? "reveal shown" : "reveal"} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
