import { useEffect } from "react";
import { prefersReducedMotion } from "./motion";

/**
 * Two pointer effects for the whole site, from one listener:
 *
 * - `.spot` elements get `--mx`/`--my`, the pointer's position inside them, which CSS turns into
 *   a soft light that follows the cursor across a card.
 * - `.magnetic` elements lean a few pixels towards the pointer while it is over them.
 *
 * Only for a fine pointer (a mouse, a trackpad): on touch there is no hover to follow. Nothing
 * here moves anything under reduced motion except the light, which is not motion.
 */
export function useCursorEffects(): void {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const still = prefersReducedMotion();
    let raf = 0;
    let last: PointerEvent | null = null;
    let magnet: HTMLElement | null = null;

    const release = () => {
      if (magnet) magnet.style.removeProperty("transform");
      magnet = null;
    };

    const frame = () => {
      raf = 0;
      const e = last;
      if (!e) return;
      const target = e.target instanceof Element ? e.target : null;

      const spot = target?.closest<HTMLElement>(".spot");
      if (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty("--mx", `${e.clientX - r.left}px`);
        spot.style.setProperty("--my", `${e.clientY - r.top}px`);
      }

      const m = still ? null : target?.closest<HTMLElement>(".magnetic") ?? null;
      if (m !== magnet) release();
      if (m) {
        magnet = m;
        const r = m.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        m.style.transform = `translate(${(dx * 6).toFixed(1)}px, ${(dy * 4).toFixed(1)}px)`;
      }
    };

    const onMove = (e: PointerEvent) => {
      last = e;
      if (!raf) raf = requestAnimationFrame(frame);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", release);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", release);
      cancelAnimationFrame(raf);
      release();
    };
  }, []);
}
