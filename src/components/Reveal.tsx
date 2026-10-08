import { useEffect, useRef, useState } from "react";
import type { ElementType, ReactNode } from "react";
import { prefersReducedMotion } from "../lib/motion";

/**
 * Fade a block in the first time it comes into view.
 *
 * Deliberately one-way and short: this is the whole animation budget the design system has for
 * ordinary content. Anything that re-animates on the way back up turns scrolling into a
 * performance, which is the opposite of what a page about restraint should do.
 *
 * Visitors who ask for reduced motion get the content immediately, never a fade. Content is
 * hidden only once a script has marked the page (`.js` on <html>), so without JavaScript nothing
 * waits for a reveal that will never come; the stylesheet also shows it if the bundle never runs.
 */
export default function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
}: {
  children: ReactNode;
  delay?: number;
  /** The element to render, so a revealed list item can still be the list item. */
  as?: ElementType;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (shown) return;
    if (prefersReducedMotion()) {
      setShown(true);
      return;
    }
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
      { rootMargin: "200px 0px 0px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  return (
    <Tag
      ref={ref}
      className={`reveal${shown ? " shown" : ""}${className ? ` ${className}` : ""}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
