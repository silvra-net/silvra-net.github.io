import { useEffect, useRef, useState } from "react";

/**
 * Count from the previous value to the current one.
 *
 * Used for the block height, where the number genuinely changes while you watch — the motion
 * reports that something happened on the chain rather than decorating a static figure. The
 * first value shown is not animated: counting up from zero on load would imply a history the
 * page did not observe.
 */
export default function CountUp({ value, locale = "de-DE" }: { value: number; locale?: string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const seen = useRef(false);

  useEffect(() => {
    if (!seen.current) {
      seen.current = true;
      from.current = value;
      setShown(value);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      from.current = value;
      return;
    }

    const start = performance.now();
    const origin = from.current;
    const span = value - origin;
    const DURATION = 600;
    let raf = 0;

    const step = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      // easeOutQuad: fast to begin with, settling rather than stopping.
      setShown(Math.round(origin + span * (1 - (1 - p) * (1 - p))));
      if (p < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{shown.toLocaleString(locale)}</>;
}
