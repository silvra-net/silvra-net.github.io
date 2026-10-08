// Generate the site's digital camouflage: one seamless tile per theme, as a small SVG.
//
// Digital camo because it is the one pattern that is military and made of pixels at the same
// time — the army reference and the cyber one in a single texture. The pattern is ours rather
// than a copy of any service's. Like printed camouflage it is laid down in layers: each colour
// gets its own noise field and covers a fixed share of the tile, so the patches interlock instead
// of ringing each other the way contour bands of one field would. Cut into square cells, in the
// site's own night-olive greys. A few cells in the base colour carry the signal colour, like
// noise on a line — the only place the pattern admits it is digital.
//
// Each tile is written twice. The site draws the PNG: 96 × 96 cells, one pixel each, indexed
// colour, small enough for Vite to inline into the stylesheet, so the pattern behind the first
// screen costs no request and no SVG rasterising; CSS scales it up 4× with crisp edges. The SVG
// is the same tile for tools that want vectors (scripts/og.mjs).
//
// Run by hand when the palette changes; the files are committed. Same seed, same tile.
//
//   node scripts/camo.mjs

import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const CELLS = 96; // cells per side; the tile is CELLS × CELLS and wraps seamlessly
const CELL_PX = 4; // intrinsic size of one cell; CSS may scale the tile

const THEMES = {
  dark: {
    bands: ["#0b0e0a", "#141a11", "#1c2517", "#28321f"],
    signal: "#3fe0b0",
    signalOpacity: 0.3,
  },
  light: {
    bands: ["#e7e9dd", "#d9ddcb", "#cbd1b9", "#bcc3a5"],
    signal: "#0a6e53",
    signalOpacity: 0.26,
  },
};

/** A small deterministic generator (mulberry32), so the tile never changes by accident. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Value noise on a lattice of `period` points that wraps around the tile in both directions. */
function tileableNoise(period, rand) {
  const lattice = Array.from({ length: period * period }, rand);
  const at = (i, j) => lattice[((j % period) + period) % period * period + (((i % period) + period) % period)];
  const smooth = (t) => t * t * (3 - 2 * t);
  return (u, v) => {
    // u, v in [0, 1): position on the tile
    const x = u * period;
    const y = v * period;
    const i = Math.floor(x);
    const j = Math.floor(y);
    const fx = smooth(x - i);
    const fy = smooth(y - j);
    const top = at(i, j) * (1 - fx) + at(i + 1, j) * fx;
    const bottom = at(i, j + 1) * (1 - fx) + at(i + 1, j + 1) * fx;
    return top * (1 - fy) + bottom * fy;
  };
}

/** One colour layer: a noise field cut so that it covers `share` of the tile. */
function layer(rand, share) {
  const coarse = tileableNoise(6, rand);
  const fine = tileableNoise(13, rand);
  const grain = tileableNoise(31, rand);
  const values = [];
  for (let y = 0; y < CELLS; y++) {
    for (let x = 0; x < CELLS; x++) {
      const u = (x + 0.5) / CELLS;
      const v = (y + 0.5) / CELLS;
      // The grain is what makes the edges ragged and stepped instead of round.
      values.push(coarse(u, v) * 0.5 + fine(u, v) * 0.28 + grain(u, v) * 0.22);
    }
  }
  const cut = [...values].sort((a, b) => b - a)[Math.floor(share * values.length)];
  return values.map((v) => v > cut);
}

function field(seed) {
  const rand = rng(seed);
  // Base colour everywhere, then three layers on top of each other, darkest share first.
  const bands = new Array(CELLS * CELLS).fill(0);
  for (const [band, share] of [
    [1, 0.48],
    [3, 0.17],
    [2, 0.24],
  ]) {
    layer(rand, share).forEach((on, k) => {
      if (on) bands[k] = band;
    });
  }
  // Signal cells: sparse, only on the base colour, sometimes a short run like a burst on a line.
  const signal = new Array(bands.length).fill(false);
  for (let k = 0; k < bands.length; k++) {
    if (bands[k] !== 0 || rand() > 0.006) continue;
    const run = rand() < 0.4 ? 2 + Math.floor(rand() * 4) : 1;
    for (let r = 0; r < run; r++) {
      const x = (k % CELLS) + r;
      if (x >= CELLS) break;
      const idx = Math.floor(k / CELLS) * CELLS + x;
      if (bands[idx] === 0) signal[idx] = true;
    }
  }
  return { bands, signal };
}

function svg({ bands: palette, signal: signalColour, signalOpacity }, { bands, signal }) {
  const rects = [];
  // Band 0 is the background; bands 1–3 as horizontal runs of equal cells, one rect per run.
  for (let y = 0; y < CELLS; y++) {
    let x = 0;
    while (x < CELLS) {
      const b = bands[y * CELLS + x];
      let end = x + 1;
      while (end < CELLS && bands[y * CELLS + end] === b) end++;
      if (b > 0) rects.push(`<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${palette[b]}"/>`);
      x = end;
    }
  }
  const signals = [];
  for (let k = 0; k < signal.length; k++) {
    if (signal[k]) signals.push(`<rect x="${k % CELLS}" y="${Math.floor(k / CELLS)}" width="1" height="1"/>`);
  }
  const size = CELLS * CELL_PX;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${CELLS} ${CELLS}" shape-rendering="crispEdges">` +
    `<rect width="${CELLS}" height="${CELLS}" fill="${palette[0]}"/>` +
    rects.join("") +
    `<g fill="${signalColour}" fill-opacity="${signalOpacity}">${signals.join("")}</g>` +
    `</svg>\n`
  );
}

const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));

/** CRC-32 as PNG chunks need it. */
const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png({ bands: palette, signal: signalColour, signalOpacity }, { bands, signal }) {
  // Palette: the four bands, then the signal colour laid over the base at its opacity — the
  // same colour the SVG's translucent cells end up as.
  const base = hex(palette[0]);
  const lit = hex(signalColour).map((v, i) => Math.round(base[i] * (1 - signalOpacity) + v * signalOpacity));
  const colours = [...palette.map(hex), lit];
  const rows = [];
  for (let y = 0; y < CELLS; y++) {
    const row = Buffer.alloc(CELLS + 1); // filter byte 0, then one index per cell
    for (let x = 0; x < CELLS; x++) {
      const k = y * CELLS + x;
      row[x + 1] = signal[k] ? 4 : bands[k];
    }
    rows.push(row);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(CELLS, 0);
  ihdr.writeUInt32BE(CELLS, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 3; // indexed colour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("PLTE", Buffer.from(colours.flat())),
    chunk("IDAT", deflateSync(Buffer.concat(rows), { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const pattern = field(20261007);
for (const [name, theme] of Object.entries(THEMES)) {
  const out = `src/assets/camo-${name}.svg`;
  const text = svg(theme, pattern);
  writeFileSync(out, text);
  console.log(`camo: ${out} (${(text.length / 1024).toFixed(1)} kB)`);
  const image = png(theme, pattern);
  // The JS-free privacy page carries its own copy of the dark tile.
  for (const file of [`src/assets/camo-${name}.png`, ...(name === "dark" ? ["public/privacy/camo-dark.png"] : [])]) {
    writeFileSync(file, image);
    console.log(`camo: ${file} (${(image.length / 1024).toFixed(1)} kB)`);
  }
}
