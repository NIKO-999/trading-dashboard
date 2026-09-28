// Generates the PWA icons (PNG + SVG) with no dependencies: a tiny polygon
// rasterizer plus a hand-rolled PNG encoder on top of node:zlib.
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const OUT = new URL('../public/icons/', import.meta.url);
mkdirSync(OUT, { recursive: true });

// Shapes in a 0..100 design space: [fill, points[]]
const SHAPES = [
  ['#1a8a3a', [[50, 58], [88, 77], [50, 96], [12, 77]]], // tile side shadow (drawn first, shifted)
  ['#6b4a2b', [[12, 70], [50, 89], [50, 96], [12, 77]]],
  ['#523720', [[88, 70], [50, 89], [50, 96], [88, 77]]],
  ['#56c23c', [[50, 51], [88, 70], [50, 89], [12, 70]]],
  ['#8a8f99', [[30, 72], [50, 28], [58, 72]]],
  ['#5d626b', [[50, 28], [70, 72], [58, 72]]],
  ['#eef6ff', [[43, 43.5], [50, 28], [54, 41], [48, 46]]],
  ['#c9dcef', [[50, 28], [57, 44], [54, 41]]],
  ['#f4c21b', [[70, 44], [74, 52], [83, 53], [76, 58], [78, 67], [70, 62], [62, 67], [64, 58], [57, 53], [66, 52]]],
];
const BG_TOP = [0x1d, 0x10, 0x3a];
const BG_BOT = [0x0b, 0x0d, 0x1a];

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
function inside(x, y, pts) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

function render(size, pad) {
  const px = Buffer.alloc(size * size * 4);
  const SS = 3; // supersampling
  const scale = (100 + pad * 2) / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const dx = (x + (sx + 0.5) / SS) * scale - pad, dy = (y + (sy + 0.5) / SS) * scale - pad;
        const t = Math.min(1, Math.max(0, dy / 100));
        let col = BG_TOP.map((v, i) => v + (BG_BOT[i] - v) * t);
        for (const [fill, pts] of SHAPES.slice(1)) if (inside(dx, dy - 2, pts)) col = hex(fill);
        r += col[0]; g += col[1]; b += col[2];
      }
      const n = SS * SS, o = (y * size + x) * 4;
      px[o] = r / n; px[o + 1] = g / n; px[o + 2] = b / n; px[o + 3] = 255;
    }
  }
  return png(size, size, px);
}

const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = (buf) => { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

writeFileSync(new URL('icon-192.png', OUT), render(192, 4));
writeFileSync(new URL('icon-512.png', OUT), render(512, 4));
writeFileSync(new URL('icon-maskable-512.png', OUT), render(512, 22));
writeFileSync(new URL('apple-touch-icon.png', OUT), render(180, 10));

const svgShapes = SHAPES.slice(1).map(([f, p]) => `<polygon fill="${f}" points="${p.map(([x, y]) => `${x},${y - 2}`).join(' ')}"/>`).join('');
writeFileSync(new URL('icon.svg', OUT), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 108 108"><defs><linearGradient id="g" x2="0" y2="1"><stop offset="0" stop-color="#1d103a"/><stop offset="1" stop-color="#0b0d1a"/></linearGradient></defs><rect x="-4" y="-4" width="108" height="108" rx="20" fill="url(#g)"/>${svgShapes}</svg>`);
console.log('icons written');
