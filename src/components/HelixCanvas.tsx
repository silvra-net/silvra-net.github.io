import { useRef } from "react";
import { useCanvasLoop } from "../lib/motion";

interface Props {
  /** Centre of the helix, as fractions of the canvas. */
  cx?: number;
  cy?: number;
  /** Lean of the axis from vertical in radians; positive leans the top to the right. */
  tilt?: number;
  /** Radius in CSS pixels at a 1440px-wide canvas; scales with the width, within limits. */
  radius?: number;
  /** Length of the axis as a multiple of the canvas height. */
  length?: number;
  /** Changes whenever a new block arrives; every change sends a pulse down the strands. */
  pulse?: number;
  className?: string;
}

const AMBER: [number, number, number] = [224, 164, 74];
const HOT: [number, number, number] = [255, 222, 160];

/** A soft round glow, drawn once and stamped for every node instead of a gradient per node. */
function sprite(rgb: [number, number, number]): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, `rgba(${rgb.join(",")},1)`);
  grad.addColorStop(0.25, `rgba(${rgb.join(",")},0.55)`);
  grad.addColorStop(1, `rgba(${rgb.join(",")},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return c;
}

/**
 * Helix, drawn as what the name says: a double helix whose rungs are blocks.
 *
 * Two strands of nodes turn around a leaning axis, joined by a rung per block. When the live
 * node reports a new height, a pulse of light runs down the rungs — so the motion reports that
 * the chain moved rather than only decorating the page.
 */
export default function HelixCanvas({
  cx = 0.5,
  cy = 0.5,
  tilt = 0.22,
  radius = 110,
  length = 1.3,
  pulse,
  className,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const pulseRef = useRef(pulse);
  pulseRef.current = pulse;

  useCanvasLoop(ref, (canvas, ctx) => {
    let W = 1;
    let H = 1;
    let R = radius;
    let seen = pulseRef.current;
    let pulseAt = -1e9;
    const glow = sprite(AMBER);
    const hot = sprite(HOT);
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const dust = Array.from({ length: 70 }, () => ({
      x: Math.random(),
      y: Math.random(),
      v: 0.00002 + Math.random() * 0.00005,
      p: Math.random() * Math.PI * 2,
      s: 0.6 + Math.random() * 1.4,
    }));

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      pointer.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    return {
      resize(w, h) {
        W = w;
        H = h;
        R = Math.max(54, Math.min(radius * 1.25, (radius * w) / 1440));
      },
      dispose() {
        window.removeEventListener("pointermove", onMove);
      },
      draw(now) {
        if (pulseRef.current !== seen) {
          if (seen !== undefined) pulseAt = now;
          seen = pulseRef.current;
        }
        pointer.x += (pointer.tx - pointer.x) * 0.04;
        pointer.y += (pointer.ty - pointer.y) * 0.04;

        ctx.clearRect(0, 0, W, H);
        const up = { x: Math.sin(tilt), y: -Math.cos(tilt) };
        const across = { x: Math.cos(tilt), y: Math.sin(tilt) };
        const ox = cx * W + pointer.x * 14;
        const oy = cy * H + pointer.y * 10;
        const len = H * length;
        const gap = Math.max(22, R * 0.26);
        const n = Math.ceil(len / gap);
        const spin = now * 0.00032 + pointer.x * 0.25;
        const twist = 0.36;
        // The pulse travels from the top of the strand to the bottom in 1.8 seconds.
        const front = (now - pulseAt) / 1800;

        type Node = { x: number; y: number; z: number; i: number };
        const a: Node[] = [];
        const b: Node[] = [];
        for (let i = 0; i < n; i++) {
          const s = len / 2 - i * gap;
          const bx = ox + up.x * s;
          const by = oy + up.y * s;
          for (const [list, off] of [
            [a, 0],
            [b, Math.PI],
          ] as const) {
            const th = i * twist + spin + off;
            const d = Math.cos(th) * R;
            list.push({ x: bx + across.x * d, y: by + across.y * d, z: Math.sin(th), i });
          }
        }

        const heat = (i: number) => {
          if (front < 0 || front > 1.3) return 0;
          const k = 1 - Math.abs(front * n - i) / 3;
          return Math.max(0, k);
        };

        // Dust first: it is the farthest thing in the scene.
        for (const d of dust) {
          d.y -= d.v * 16;
          if (d.y < -0.02) d.y = 1.02;
          const tw = 0.35 + 0.65 * Math.abs(Math.sin(now * 0.001 + d.p));
          ctx.globalAlpha = 0.28 * tw;
          ctx.fillStyle = `rgb(${AMBER.join(",")})`;
          ctx.fillRect(d.x * W, d.y * H, d.s, d.s);
        }

        const strand = (list: Node[], back: boolean) => {
          for (let i = 1; i < list.length; i++) {
            const p = list[i - 1];
            const q = list[i];
            const z = (p.z + q.z) / 2;
            if (back !== z < 0) continue;
            ctx.globalAlpha = 0.12 + 0.5 * ((z + 1) / 2);
            ctx.strokeStyle = `rgb(${AMBER.join(",")})`;
            ctx.lineWidth = 1 + (z + 1) * 0.6;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        };
        const nodes = (list: Node[], back: boolean) => {
          for (const p of list) {
            if (back !== p.z < 0) continue;
            const h = heat(p.i);
            const size = 10 + (p.z + 1) * 9 + h * 18;
            ctx.globalAlpha = 0.25 + 0.6 * ((p.z + 1) / 2) + h * 0.3;
            ctx.drawImage(h > 0.2 ? hot : glow, p.x - size / 2, p.y - size / 2, size, size);
            if (p.z > 0.2) {
              ctx.globalAlpha = 0.85;
              ctx.fillStyle = "#fff6e6";
              ctx.beginPath();
              ctx.arc(p.x, p.y, 1.2 + p.z * 1.2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        };

        strand(a, true);
        strand(b, true);
        nodes(a, true);
        nodes(b, true);

        // Rungs: one per block, each with a small block at its middle.
        for (let i = 0; i < n; i++) {
          const p = a[i];
          const q = b[i];
          const h = heat(i);
          const facing = 1 - Math.abs(p.z);
          ctx.globalAlpha = 0.1 + 0.28 * facing + h * 0.6;
          ctx.strokeStyle = h > 0.1 ? `rgb(${HOT.join(",")})` : `rgb(${AMBER.join(",")})`;
          ctx.lineWidth = 1 + h * 1.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
          if (i % 2 === 0) {
            const mx = (p.x + q.x) / 2;
            const my = (p.y + q.y) / 2;
            const s = 2.5 + facing * 2 + h * 3;
            ctx.save();
            ctx.translate(mx, my);
            ctx.rotate(tilt + Math.PI / 4);
            ctx.globalAlpha = 0.2 + 0.5 * facing + h * 0.5;
            ctx.strokeStyle = h > 0.1 ? "#fff3dc" : `rgb(${AMBER.join(",")})`;
            ctx.lineWidth = 1;
            ctx.strokeRect(-s, -s, s * 2, s * 2);
            ctx.restore();
          }
        }

        strand(a, false);
        strand(b, false);
        nodes(a, false);
        nodes(b, false);
        ctx.globalAlpha = 1;
      },
    };
  });

  return <canvas ref={ref} className={className ? `fx-canvas ${className}` : "fx-canvas"} aria-hidden="true" />;
}
