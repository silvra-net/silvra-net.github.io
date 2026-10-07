import { useEffect, useState } from "react";
import type { RefObject } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";
const KEY = "silvra-motion";

/**
 * Motion has two sources: the OS setting for reduced motion, and a switch on the page itself
 * ("Bewegung anhalten"), which WCAG 2.2.2 asks for — anything that moves or updates on its own
 * must be possible to pause. An explicit choice on the page wins over the OS, in both directions,
 * the way the theme does. The choice is mirrored onto <html data-motion> before first paint
 * (index.html), so CSS can follow it without waiting for React.
 */
type Choice = "still" | "moving";
let choice: Choice | null | undefined;
const listeners = new Set<() => void>();

function readChoice(): Choice | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "still" || v === "moving" ? v : null;
  } catch {
    return null;
  }
}

/** The explicit choice made on the page, if any. */
export function motionChoice(): Choice | null {
  if (typeof window === "undefined") return null;
  if (choice === undefined) choice = readChoice();
  return choice;
}

/** Whether things should stand still: the page's own switch, or else the OS setting. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  const c = motionChoice();
  return c ? c === "still" : window.matchMedia(QUERY).matches;
}

function publish(): void {
  document.documentElement.dataset.motion = prefersReducedMotion() ? "still" : "moving";
  listeners.forEach((l) => l());
}

export function setMotionStill(still: boolean): void {
  choice = still ? "still" : "moving";
  try {
    localStorage.setItem(KEY, choice);
  } catch {
    /* private mode: the choice lasts for this page view */
  }
  publish();
}

export function subscribeMotion(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Follows both sources live: someone who switches either mid-visit should not have to reload.
 * Read on the client from the first render — it only ever steers effects and handlers, never
 * markup, so the server's `false` cannot make hydration disagree.
 */
export function useReducedMotion(): boolean {
  const [still, setStill] = useState(prefersReducedMotion);
  useEffect(() => {
    const on = () => setStill(prefersReducedMotion());
    const mq = window.matchMedia(QUERY);
    const os = () => publish();
    on();
    mq.addEventListener("change", os);
    const off = subscribeMotion(on);
    return () => {
      mq.removeEventListener("change", os);
      off();
    };
  }, []);
  return still;
}

/** Whether a media query matches, kept current as the window changes. */
export function useMediaQuery(query: string): boolean {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

/**
 * Write how far an element has travelled through the viewport into `--p` (0 → 1) on that
 * element, for CSS to read.
 *
 * 0 is when its top edge reaches `start` (a fraction of the viewport height from the top), 1 is
 * when its bottom edge reaches `end`. CSS does the rest, so a scroll costs one style write and
 * no React render. With reduced motion the value is pinned at 1: the finished state, not the
 * animation towards it.
 */
export function useScrollProgress(ref: RefObject<HTMLElement>, start = 0.85, end = 0.45): void {
  const still = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (still) {
      el.style.setProperty("--p", "1");
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const span = r.height + vh * (start - end);
      const p = Math.min(1, Math.max(0, (vh * start - r.top) / span));
      el.style.setProperty("--p", p.toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [ref, start, end, still]);
}

/**
 * Run a canvas animation only while it is on screen.
 *
 * `draw(now)` is called every frame while visible; with reduced motion it is called once per
 * resize instead, so the canvas still shows a composed still rather than a blank.
 */
export function useCanvasLoop(
  ref: RefObject<HTMLCanvasElement>,
  setup: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    resize: (w: number, h: number, dpr: number) => void;
    draw: (now: number) => void;
    dispose?: () => void;
  },
): void {
  // Switching motion off or on rebuilds the scene, so it can draw itself still or moving.
  const still = useReducedMotion();
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const scene = setup(canvas, ctx);
    let raf = 0;
    let visible = true;

    const fit = () => {
      const r = canvas.getBoundingClientRect();
      // Two device pixels per CSS pixel is as sharp as a soft glow needs to be, and keeps a
      // full-screen canvas on a 3x phone from costing nine times the fill.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scene.resize(r.width, r.height, dpr);
      // Resizing a canvas clears it. Draw straight away, so one that is off screen (or paused)
      // does not sit blank until it next scrolls into view.
      scene.draw(performance.now());
    };

    const loop = (now: number) => {
      raf = 0;
      if (!visible) return;
      scene.draw(now);
      raf = requestAnimationFrame(loop);
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    let io: IntersectionObserver | undefined;
    if (!still) {
      io = new IntersectionObserver((entries) => {
        visible = entries.some((e) => e.isIntersecting);
        if (visible && !raf) raf = requestAnimationFrame(loop);
      });
      io.observe(canvas);
      raf = requestAnimationFrame(loop);
    }

    return () => {
      ro.disconnect();
      io?.disconnect();
      cancelAnimationFrame(raf);
      scene.dispose?.();
    };
    // `setup` is a fresh closure every render; the scene is built once per mount on purpose,
    // and again only when motion is switched.
  }, [ref, still]);
}
