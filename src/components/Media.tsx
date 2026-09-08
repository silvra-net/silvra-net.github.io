import { useEffect, useRef, useState } from "react";

/**
 * A looping background video with its poster as the visible fallback.
 *
 * Autoplay is a request, not a guarantee: browsers refuse it on metered connections and in
 * low-power modes, and a visitor who asked for reduced motion should never get it. In every one
 * of those cases the poster frame is what stays on screen, so the section is composed around
 * the still image and the motion is the addition — not the other way round.
 */
function wantsVideo(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  // Data Saver, where the browser exposes it. Autoplaying five megabytes at someone who has
  // asked their browser to spend less would be a strange thing for this site in particular.
  const conn = (navigator as { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return false;
  // Phones get the poster. The footage is atmosphere, not information, and it is not worth a
  // multi-megabyte download over mobile data to set a mood.
  return window.matchMedia("(min-width: 701px)").matches;
}

export default function Media({ src, poster, alt }: { src: string; poster: string; alt: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [motion] = useState(wantsVideo);

  useEffect(() => {
    const el = ref.current;
    if (!el || !motion) return;
    // play() rejects when the browser declines; the poster is already correct, so swallow it.
    void el.play().catch(() => undefined);
  }, [motion]);

  if (!motion) return <img className="media" src={poster} alt={alt} />;

  return (
    <video
      ref={ref}
      className="media"
      poster={poster}
      src={src}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={alt}
    />
  );
}
