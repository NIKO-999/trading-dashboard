// Shared low-level drawing helpers for the flat, low-poly art style.
export type Ctx = CanvasRenderingContext2D;
export interface Pt { x: number; y: number }

let tint: { color: string; amount: number } | null = null;

let crisp = false;
/** Crisp art: flat colour faces and hard-edged shadows instead of smooth gradients and feathered blobs. */
export const setCrispArt = (on: boolean) => {
  crisp = on;
  if (typeof document !== 'undefined') document.documentElement.classList.toggle('flat', on);
};
/** How much lighter the left face and darker the right face of a block are: bolder when crisp. */
const faceLight = () => (crisp ? 0.11 : 0.06);
const faceDark = () => (crisp ? -0.3 : -0.2);

/** While set, every colour drawn through these helpers is blended toward `color` (hit flashes, spent units). */
export function setTint(color: string | null, amount = 0) {
  tint = color && amount > 0.01 ? { color, amount: Math.min(1, amount) } : null;
}

export function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export function mix(a: string, b: string, k: number) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
}

/** Applies the active tint to a colour (non-hex colours such as shadows pass through). */
export const ink = (c: string) => (tint && c.length === 7 && c[0] === '#' ? mix(c, tint.color, tint.amount) : c);

export const rand = (seed: number, i: number) => {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export function poly(ctx: Ctx, pts: number[], fill: string) {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  ctx.fillStyle = ink(fill);
  ctx.fill();
}

export function line(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, color: string, width: number) {
  ctx.strokeStyle = ink(color);
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

/** Fills a polygon with a vertical gradient from `a` (at y0) to `b` (at y1). */
export function polyGrad(ctx: Ctx, pts: number[], a: string, b: string, y0: number, y1: number) {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  if (crisp) {
    ctx.fillStyle = ink(mix(a, b, 0.4));
  } else if (Math.abs(y1 - y0) < 0.5) {
    ctx.fillStyle = ink(a);
  } else {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, ink(a));
    g.addColorStop(1, ink(b));
    ctx.fillStyle = g;
  }
  ctx.fill();
}

/**
 * An isometric box standing on (cx, cy) with footprint w (world px) and height h. Side faces
 * darken slightly toward the ground and the top's front edges catch a thin highlight, which
 * gives blocks a finished, bevelled look.
 */
export function box(ctx: Ctx, cx: number, cy: number, w: number, h: number, color: string, top?: string) {
  const hw = w / 2, hh = w / 4;
  const left = shade(color, faceLight()), right = shade(color, faceDark()), lid = top ?? shade(color, crisp ? 0.3 : 0.22);
  polyGrad(ctx, [cx - hw, cy - h, cx, cy + hh - h, cx, cy + hh, cx - hw, cy], shade(left, 0.05), shade(left, -0.12), cy - h, cy + hh);
  polyGrad(ctx, [cx + hw, cy - h, cx, cy + hh - h, cx, cy + hh, cx + hw, cy], shade(right, 0.04), shade(right, -0.14), cy - h, cy + hh);
  poly(ctx, [cx, cy - hh - h, cx + hw, cy - h, cx, cy + hh - h, cx - hw, cy - h], lid);
  if (w > 2.5 && h > 1) {
    ctx.strokeStyle = ink(shade(lid, 0.4));
    ctx.lineWidth = Math.min(0.9, w * 0.07);
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - hw, cy - h);
    ctx.lineTo(cx, cy + hh - h);
    ctx.lineTo(cx + hw, cy - h);
    ctx.stroke();
  }
}

/** A soft round contact shadow (darkest in the middle, fading out). */
export function softShadow(ctx: Ctx, x: number, y: number, rx: number, ry: number, alpha = 0.3) {
  if (rx <= 0 || ry <= 0) return;
  if (crisp) {
    ctx.fillStyle = `rgba(0,0,0,${alpha * 0.6})`;
    ctx.beginPath();
    ctx.ellipse(x, y, rx * 0.8, ry * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(0,0,0,${alpha})`);
  g.addColorStop(0.6, `rgba(0,0,0,${alpha * 0.55})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Paints part of one visible side of a box() with the same shading as that side.
 * Face 'L' runs from the left corner (u=0) to the front edge (u=1); face 'R' from the
 * front edge (u=0) to the right corner (u=1). v runs from the bottom (0) to the top (1).
 */
export function faceQuad(ctx: Ctx, face: 'L' | 'R', cx: number, cy: number, w: number, h: number,
  u0: number, u1: number, v0: number, v1: number, color: string) {
  const P = (u: number, v: number) => face === 'R'
    ? [cx + (u * w) / 2, cy + (w / 4) * (1 - u) - v * h]
    : [cx - w / 2 + (u * w) / 2, cy + (w / 4) * u - v * h];
  poly(ctx, [...P(u0, v0), ...P(u1, v0), ...P(u1, v1), ...P(u0, v1)], face === 'L' ? shade(color, faceLight()) : shade(color, faceDark()));
}

/** The same band on both visible sides of a box (belts, stripes, collars). */
export function band(ctx: Ctx, cx: number, cy: number, w: number, h: number, v0: number, v1: number, color: string) {
  faceQuad(ctx, 'L', cx, cy, w, h, 0, 1, v0, v1, color);
  faceQuad(ctx, 'R', cx, cy, w, h, 0, 1, v0, v1, color);
}

export function roof(ctx: Ctx, cx: number, cy: number, w: number, h: number, color: string) {
  const hw = w / 2, hh = w / 4;
  poly(ctx, [cx - hw, cy, cx, cy + hh, cx, cy - h], shade(color, crisp ? 0.16 : 0.1));
  poly(ctx, [cx + hw, cy, cx, cy + hh, cx, cy - h], shade(color, crisp ? -0.3 : -0.2));
}

export function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, fill: string) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
  ctx.fillStyle = ink(fill);
  ctx.fill();
}

/** A chunky, glossy gold star: rounded points, a warm top-to-bottom gradient, a dark amber rim and a highlight. */
export function drawStar(ctx: Ctx, x: number, y: number, r: number, fill = '#ffcf33') {
  const path = () => {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = (i % 2 ? r * 0.56 : r) * 0.86; // the rim's thickness makes up the rest of the size
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
  };
  path();
  const g = ctx.createLinearGradient(0, y - r, 0, y + r);
  g.addColorStop(0, ink(shade(fill, 0.55)));
  g.addColorStop(0.5, ink(fill));
  g.addColorStop(1, ink(mix(fill, '#ff8a00', 0.55)));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = ink(mix(fill, '#a85a00', 0.7));
  ctx.lineWidth = Math.max(0.8, r * 0.22);
  ctx.stroke();
  if (r >= 4) {
    ctx.save();
    ctx.translate(x - r * 0.24, y - r * 0.34);
    ctx.rotate(-0.5);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.2, r * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
