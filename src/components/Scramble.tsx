import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../lib/motion";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&+=/<>";

function noise(text: string): string {
  return [...text].map((ch) => (ch === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join("");
}

/**
 * Text that arrives encrypted and decrypts itself the first time it scrolls into view.
 *
 * The real text is always in the document and is what assistive technology reads; the noise is
 * a separate, hidden layer drawn over it while the effect runs, so the layout never moves and a
 * screen reader never meets gibberish. Reduced motion shows the text, plainly, from the start.
 */
export default function Scramble({ text, className, duration = 1000 }: { text: string; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [fx, setFx] = useState<string | null>(null);
  const still = useReducedMotion();

  useEffect(() => {
    if (still) {
      setFx(null);
      return;
    }
    const el = ref.current;
    if (!el) return;
    setFx(noise(text));
    let raf = 0;
    let started = false;
    const run = () => {
      if (started) return;
      started = true;
      const t0 = performance.now();
      const at = [...text].map((_, i) => (i / text.length) * duration * 0.55 + Math.random() * duration * 0.45);
      let lastFrame = 0;
      const step = (now: number) => {
        const dt = now - t0;
        if (now - lastFrame > 45) {
          lastFrame = now;
          let done = true;
          const s = [...text]
            .map((ch, i) => {
              if (ch === " " || dt >= at[i]) return ch;
              done = false;
              return GLYPHS[(Math.random() * GLYPHS.length) | 0];
            })
            .join("");
          setFx(done ? null : s);
          if (done) return;
        }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        run();
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [text, duration, still]);

  return (
    <span ref={ref} className={className ? `scramble ${className}` : "scramble"} data-busy={fx !== null || undefined}>
      <span className="scramble-text">{text}</span>
      {fx !== null && (
        <span className="scramble-fx" aria-hidden="true">
          {fx}
        </span>
      )}
    </span>
  );
}
