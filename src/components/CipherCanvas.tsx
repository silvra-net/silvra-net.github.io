import { useRef } from "react";
import { prefersReducedMotion, useCanvasLoop } from "../lib/motion";

/** Base64's alphabet: what ciphertext actually looks like when someone prints it. */
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
const pick = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

interface Props {
  /** Plain-text messages that surface out of the noise now and then, and sink back into it. */
  phrases: string[];
  /** Whether a message of width `w` may be placed with its left edge at (x, y). */
  fits?: (x: number, y: number, w: number, W: number, H: number) => boolean;
  /** Cell size in CSS pixels. */
  cell?: number;
  className?: string;
}

interface Message {
  r: number;
  c: number;
  text: string;
  open: number[];
  close: number[];
  end: number;
}

/**
 * A field of ciphertext in which, now and then, a message decrypts itself, stays readable for a
 * moment, and is encrypted again.
 *
 * It is a picture of the idea, not of the protocol: what crosses the wire is noise, and the
 * message exists in the clear only at the two ends. The pointer brightens the noise near it, but
 * never decrypts anything — the key is not in the browser.
 */
export default function CipherCanvas({ phrases, fits, cell = 20, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const phrasesRef = useRef(phrases);
  phrasesRef.current = phrases;
  const fitsRef = useRef(fits);
  fitsRef.current = fits;

  useCanvasLoop(ref, (canvas, ctx) => {
    let W = 1;
    let H = 1;
    let cols = 0;
    let rows = 0;
    let alpha = new Float32Array(0);
    let glyph: string[] = [];
    let next = new Float64Array(0);
    let messages: Message[] = [];
    let nextSpawn = 0;
    let last = 0;
    const pointer = { x: -1e4, y: -1e4 };
    // A still frame should still say something: with reduced motion the message is drawn
    // already decrypted and stays that way, rather than frozen half-scrambled.
    const still = prefersReducedMotion();

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const spawn = (now: number) => {
      const list = phrasesRef.current;
      if (list.length === 0) return;
      const text = list[(Math.random() * list.length) | 0];
      for (let tries = 0; tries < 24; tries++) {
        const r = 1 + ((Math.random() * (rows - 2)) | 0);
        const c = 1 + ((Math.random() * Math.max(1, cols - text.length - 2)) | 0);
        const x = c * cell;
        const y = r * cell;
        const w = text.length * cell * 0.5;
        if (fitsRef.current && !fitsRef.current(x, y, w, W, H)) continue;
        if (messages.some((m) => Math.abs(m.r - r) < 3)) continue;
        if (still) {
          messages.push({ r, c, text, open: [...text].map(() => 0), close: [...text].map(() => Infinity), end: Infinity });
          return;
        }
        const opened = now + 200;
        const open = [...text].map((_, i) => opened + i * 55 + Math.random() * 260);
        const hold = Math.max(...open) + 2600;
        const close = [...text].map((_, i) => hold + i * 35 + Math.random() * 220);
        messages.push({ r, c, text, open, close, end: Math.max(...close) + 400 });
        return;
      }
    };

    return {
      resize(w, h) {
        W = w;
        H = h;
        cols = Math.ceil(w / cell);
        rows = Math.ceil(h / cell);
        const total = cols * rows;
        alpha = new Float32Array(total);
        next = new Float64Array(total);
        glyph = new Array<string>(total);
        for (let i = 0; i < total; i++) {
          // Most cells are empty or nearly so; a few are bright. Evenly lit noise reads as a
          // texture, uneven noise reads as data.
          alpha[i] = Math.random() < 0.5 ? 0 : 0.03 + Math.pow(Math.random(), 3) * 0.3;
          glyph[i] = pick();
          next[i] = Math.random() * 4000;
        }
        messages = [];
        nextSpawn = 0;
      },
      dispose() {
        window.removeEventListener("pointermove", onMove);
      },
      draw(now) {
        // Thirty frames a second is plenty for flickering letters and halves the cost.
        if (now - last < 32) return;
        last = now;

        if (now > nextSpawn) {
          if (messages.length < 3) spawn(now);
          nextSpawn = now + 1400 + Math.random() * 1600;
        }
        messages = messages.filter((m) => now < m.end);
        if (messages.length === 0 && nextSpawn === 0) spawn(now);

        ctx.clearRect(0, 0, W, H);
        ctx.font = `500 ${Math.round(cell * 0.62)}px "JetBrains Mono Variable", ui-monospace, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // A message is set at the font's own advance, not one letter per cell: spread over the
        // grid it reads as noise that happens to be letters, not as words.
        const advance = cell * 0.5;
        const covered = new Set<number>();
        for (const m of messages) {
          const span = Math.ceil((m.text.length * advance) / cell) + 1;
          for (let i = 0; i < span; i++) covered.add(m.r * cols + m.c + i);
        }

        ctx.fillStyle = "rgb(214,219,228)";
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const i = r * cols + c;
            if (alpha[i] === 0 || covered.has(i)) continue;
            if (now > next[i]) {
              glyph[i] = pick();
              next[i] = now + 250 + Math.random() * 4200;
            }
            const x = c * cell + cell / 2;
            const y = r * cell + cell / 2;
            const d = Math.hypot(x - pointer.x, y - pointer.y);
            const boost = d < 150 ? Math.pow(1 - d / 150, 2) * 0.55 : 0;
            ctx.globalAlpha = Math.min(1, alpha[i] + boost);
            ctx.fillText(glyph[i], x, y);
          }
        }

        ctx.font = `600 ${Math.round(cell * 0.8)}px "JetBrains Mono Variable", ui-monospace, monospace`;
        for (const m of messages) {
          for (let i = 0; i < m.text.length; i++) {
            const ch = m.text[i];
            const x = m.c * cell + i * advance + cell / 2;
            const y = m.r * cell + cell / 2;
            const clear = now >= m.open[i] && now < m.close[i];
            if (ch === " " && clear) continue;
            if (clear) {
              ctx.globalAlpha = 1;
              ctx.fillStyle = "#ffffff";
              ctx.shadowColor = "rgba(190,220,255,0.9)";
              ctx.shadowBlur = 12;
              ctx.fillText(ch, x, y);
              ctx.shadowBlur = 0;
            } else {
              const before = now < m.open[i];
              const t = before ? 1 - (m.open[i] - now) / 600 : 1 - (now - m.close[i]) / 400;
              ctx.globalAlpha = Math.max(0.08, Math.min(0.7, t));
              ctx.fillStyle = "rgb(214,219,228)";
              ctx.fillText(pick(), x, y);
            }
          }
        }
        ctx.globalAlpha = 1;
      },
    };
  });

  return <canvas ref={ref} className={className ? `fx-canvas ${className}` : "fx-canvas"} aria-hidden="true" />;
}
