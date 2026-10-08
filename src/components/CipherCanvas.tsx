import { useRef } from "react";
import { prefersReducedMotion, useCanvasLoop } from "../lib/motion";

/** Base64's alphabet: what ciphertext actually looks like when someone prints it. */
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
const MONO = '"JetBrains Mono Variable", ui-monospace, monospace';
const INK = "rgb(214,219,228)";

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

  useCanvasLoop(
    ref,
    (canvas, ctx) => {
      let W = 1;
      let H = 1;
      let cols = 0;
      let rows = 0;
      let dpr = 1;
      let alpha = new Float32Array(0);
      let glyph = new Uint8Array(0);
      let next = new Float64Array(0);
      // What each cell shows on the canvas right now (glyph, and alpha in 64ths; -1 is blank),
      // so a frame repaints only the cells that changed instead of the whole field.
      let shownGlyph = new Uint8Array(0);
      let shownAlpha = new Int8Array(0);
      let covered = new Uint8Array(0);
      let messages: Message[] = [];
      let nextSpawn = 0;
      let last = -1e9;
      const pointer = { x: -1e4, y: -1e4 };
      // A still frame should still say something: with reduced motion the message is drawn
      // already decrypted and stays that way, rather than frozen half-scrambled.
      const still = prefersReducedMotion();
      const noiseFont = () => `500 ${Math.round(cell * 0.62)}px ${MONO}`;
      const messageFont = () => `600 ${Math.round(cell * 0.8)}px ${MONO}`;

      // Every glyph, drawn once per size into a strip and stamped from there: one drawImage per
      // cell costs a fraction of shaping text with fillText. Two strips, for the faint noise and
      // for the scrambled letters of a message.
      let noise: HTMLCanvasElement | null = null;
      let scramble: HTMLCanvasElement | null = null;
      const atlas = (font: string) => {
        const side = Math.ceil(cell * dpr);
        const c = document.createElement("canvas");
        c.width = side * GLYPHS.length;
        c.height = side;
        const g = c.getContext("2d")!;
        g.scale(dpr, dpr);
        g.font = font;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillStyle = INK;
        for (let i = 0; i < GLYPHS.length; i++) g.fillText(GLYPHS[i], (i * side) / dpr + cell / 2, cell / 2);
        return c;
      };
      const stamp = (strip: HTMLCanvasElement, k: number, x: number, y: number) => {
        const side = strip.height;
        ctx.drawImage(strip, k * side, 0, side, side, x, y, cell, cell);
      };
      const build = () => {
        noise = atlas(noiseFont());
        scramble = atlas(messageFont());
        shownAlpha.fill(-1);
      };

      // The strips are drawn with whatever font is ready. When the mono face arrives, they are
      // drawn again and the field repainted, so a still frame does not keep the fallback.
      let disposed = false;
      document.fonts?.load(noiseFont()).then(() => {
        if (disposed || !noise) return;
        build();
        ctx.clearRect(0, 0, W, H);
        last = -1e9;
        frame(performance.now());
      }, () => {});

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

      // A message is set at the font's own advance, not one letter per cell: spread over the
      // grid it reads as noise that happens to be letters, not as words.
      const advance = cell * 0.5;
      const span = (m: Message) => Math.ceil((m.text.length * advance) / cell) + 1;

      const frame = (now: number) => {
        if (now > nextSpawn) {
          if (messages.length < 3) spawn(now);
          nextSpawn = now + 1400 + Math.random() * 1600;
        }
        if (messages.length === 0 && nextSpawn === 0) spawn(now);

        // A message's glow reaches into the rows above and below it. That band is cleared and
        // its noise repainted on every frame the message is up, and once more as it goes.
        covered.fill(0);
        for (const m of messages) {
          const n = span(m);
          if (now < m.end) for (let i = 0; i < n; i++) covered[m.r * cols + m.c + i] = 1;
          const c0 = Math.max(0, m.c - 1);
          const c1 = Math.min(cols, m.c + n + 1);
          ctx.clearRect(c0 * cell, (m.r - 1) * cell, (c1 - c0) * cell, cell * 3);
          for (let r = Math.max(0, m.r - 1); r <= Math.min(rows - 1, m.r + 1); r++) {
            shownAlpha.fill(-1, r * cols + c0, r * cols + c1);
          }
        }
        messages = messages.filter((m) => now < m.end);

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const i = r * cols + c;
            let a = 0;
            if (alpha[i] !== 0 && !covered[i]) {
              if (now > next[i]) {
                glyph[i] = (Math.random() * GLYPHS.length) | 0;
                next[i] = now + 250 + Math.random() * 4200;
              }
              const dx = c * cell + cell / 2 - pointer.x;
              const dy = r * cell + cell / 2 - pointer.y;
              const d2 = dx * dx + dy * dy;
              const boost = d2 < 22500 ? Math.pow(1 - Math.sqrt(d2) / 150, 2) * 0.55 : 0;
              a = Math.min(64, Math.round((alpha[i] + boost) * 64));
            }
            if (a === shownAlpha[i] && (a === 0 || glyph[i] === shownGlyph[i])) continue;
            if (shownAlpha[i] > 0) ctx.clearRect(c * cell, r * cell, cell, cell);
            shownAlpha[i] = a;
            shownGlyph[i] = glyph[i];
            if (a === 0) continue;
            ctx.globalAlpha = a / 64;
            stamp(noise!, glyph[i], c * cell, r * cell);
          }
        }

        for (const m of messages) {
          for (let i = 0; i < m.text.length; i++) {
            const ch = m.text[i];
            const x = m.c * cell + i * advance;
            const y = m.r * cell;
            const clear = now >= m.open[i] && now < m.close[i];
            if (ch === " " && clear) continue;
            if (clear) {
              ctx.globalAlpha = 1;
              ctx.font = messageFont();
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = "#ffffff";
              ctx.shadowColor = "rgba(190,220,255,0.9)";
              ctx.shadowBlur = 12;
              ctx.fillText(ch, x + cell / 2, y + cell / 2);
              ctx.shadowBlur = 0;
            } else {
              const before = now < m.open[i];
              const t = before ? 1 - (m.open[i] - now) / 600 : 1 - (now - m.close[i]) / 400;
              ctx.globalAlpha = Math.max(0.08, Math.min(0.7, t));
              stamp(scramble!, (Math.random() * GLYPHS.length) | 0, x, y);
            }
          }
        }
        ctx.globalAlpha = 1;
      };

      return {
        resize(w, h, ratio) {
          W = w;
          H = h;
          dpr = ratio;
          cols = Math.ceil(w / cell);
          rows = Math.ceil(h / cell);
          const total = cols * rows;
          alpha = new Float32Array(total);
          next = new Float64Array(total);
          glyph = new Uint8Array(total);
          shownGlyph = new Uint8Array(total);
          shownAlpha = new Int8Array(total);
          covered = new Uint8Array(total);
          for (let i = 0; i < total; i++) {
            // Most cells are empty or nearly so; a few are bright. Evenly lit noise reads as a
            // texture, uneven noise reads as data.
            alpha[i] = Math.random() < 0.5 ? 0 : 0.03 + Math.pow(Math.random(), 3) * 0.3;
            glyph[i] = (Math.random() * GLYPHS.length) | 0;
            next[i] = Math.random() * 4000;
          }
          messages = [];
          nextSpawn = 0;
          // Resizing cleared the canvas: rebuild the strips at the new density and repaint all.
          build();
          last = -1e9;
        },
        dispose() {
          disposed = true;
          window.removeEventListener("pointermove", onMove);
        },
        draw(now) {
          // Thirty frames a second is plenty for flickering letters and halves the cost.
          if (now - last < 32) return;
          last = now;
          frame(now);
        },
      };
    },
    // Faint letters behind text gain nothing from a dense backing store, and at one device pixel
    // per CSS pixel the cells sit on whole pixels, so repainting one leaves no seam.
    { maxDpr: 1 },
  );

  return <canvas ref={ref} className={className ? `fx-canvas ${className}` : "fx-canvas"} aria-hidden="true" />;
}
