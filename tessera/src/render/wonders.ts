// Drawing side of the World Wonders (see game/wonders): each wonder is a large landmark of its own, drawn from simple
// isometric shapes (original art, nothing traced). They are part of the static map layer, so they show in the cached
// map and in the iOS photo. A wonder still rising is drawn cut off at its progress, wrapped in scaffolding with a
// crane and its builder's flag; a finished one flies its holder's banner.
import { TRIBES } from '../data/tribes';
import { wonderHolder } from '../data/wonders';
import type { GameState, Tile } from '../game/types';
import { builtAt, siteAt, wonderCost } from '../game/wonders';
import { box, ellipse, faceQuad, line, poly, roof, shade, softShadow, type Ctx } from './prims';

/** How far above its tile centre each wonder reaches (world px): a rising one is cut off at a share of this. */
const HEIGHT: Record<string, number> = {
  pyramids: 48, greatwall: 34, colosseum: 30, machupicchu: 60, gardens: 50, library: 38, stonehenge: 22, angkor: 58,
  hagia: 56, djenne: 42, moai: 30, potala: 62, chichen: 50, terracotta: 24, lighthouse: 86, zimbabwe: 36,
};

const STONE = '#cfc6b0', SAND = '#e2c48a', GRANITE = '#9c968c', MUD = '#b98552', GRASS = '#6fa64a', LEAF = '#3f8a3a';

// ---------------------------------------------------------------- shapes

/** An iso pyramid on a square footprint `w` wide, `h` tall, with courses of stone on both faces. */
function pyramid(ctx: Ctx, x: number, y: number, w: number, h: number, color: string, courses = 6) {
  const hw = w / 2, hh = w / 4;
  poly(ctx, [x - hw, y, x, y + hh, x, y - h], shade(color, 0.08));
  poly(ctx, [x + hw, y, x, y + hh, x, y - h], shade(color, -0.24));
  for (let i = 1; i < courses; i++) {
    const k = i / courses;
    const ly = y + hh * (1 - k) - h * k;
    line(ctx, x - hw * (1 - k), y - h * k, x, ly, shade(color, -0.12), 0.5);
    line(ctx, x, ly, x + hw * (1 - k), y - h * k, shade(color, -0.38), 0.5);
  }
}

/** A dome: a half ellipse of radius r and height hgt standing on (x, y), lit from the left. */
function dome(ctx: Ctx, x: number, y: number, r: number, hgt: number, color: string) {
  ctx.beginPath();
  ctx.ellipse(x, y, r, hgt, 0, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, y, r, hgt, 0, Math.PI * 1.5, Math.PI * 2);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fillStyle = shade(color, -0.2);
  ctx.fill();
  ellipse(ctx, x, y, r, r * 0.22, shade(color, -0.3));
}

/** A round tower or cone: bottom radius r0, top radius r1. */
function cylinder(ctx: Ctx, x: number, y: number, r0: number, r1: number, hgt: number, color: string) {
  poly(ctx, [x - r0, y, x - r1, y - hgt, x + r1, y - hgt, x + r0, y], color);
  poly(ctx, [x + r0 * 0.1, y + r0 * 0.25, x + r1 * 0.1, y - hgt, x + r1, y - hgt, x + r0, y], shade(color, -0.22));
  ellipse(ctx, x, y, r0, r0 * 0.3, shade(color, -0.1));
  ellipse(ctx, x, y - hgt, r1, r1 * 0.3, shade(color, 0.2));
}

/** A curved wall around an ellipse (rx, ry) `hgt` tall: the back arc first, then `inside`, then the front arc. */
function ringWall(ctx: Ctx, x: number, y: number, rx: number, ry: number, hgt: number, color: string, inside: () => void, front: (a: number, px: number, py: number) => void = () => {}) {
  const arc = (a0: number, a1: number, fill: string) => {
    ctx.beginPath();
    ctx.ellipse(x, y - hgt, rx, ry, 0, a0, a1);
    ctx.ellipse(x, y, rx, ry, 0, a1, a0, true);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  arc(Math.PI, Math.PI * 2, shade(color, -0.3)); // the inner side of the far wall
  inside();
  arc(0, Math.PI, shade(color, -0.06));
  ctx.beginPath(); // a lit rim along the top of the near wall
  ctx.ellipse(x, y - hgt, rx, ry, 0, 0, Math.PI);
  ctx.strokeStyle = shade(color, 0.25);
  ctx.lineWidth = 1.4;
  ctx.stroke();
  for (let i = 1; i < 12; i++) {
    const a = (i / 12) * Math.PI;
    front(a, x + Math.cos(a) * rx, y + Math.sin(a) * ry);
  }
}

/** A khmer-style tower: stacked narrowing tiers ending in a lotus bud. */
function prang(ctx: Ctx, x: number, y: number, w: number, hgt: number, color: string) {
  const tiers = 5;
  for (let i = 0; i < tiers; i++) box(ctx, x, y - (hgt * 0.55 * i) / tiers, w * (1 - i * 0.14), (hgt * 0.55) / tiers + 0.5, shade(color, i % 2 ? 0.05 : -0.04));
  poly(ctx, [x - w * 0.3, y - hgt * 0.55, x, y - hgt, x + w * 0.3, y - hgt * 0.55], shade(color, 0.1));
  poly(ctx, [x, y - hgt * 0.55 + w * 0.08, x, y - hgt, x + w * 0.3, y - hgt * 0.55], shade(color, -0.2));
}

// ---------------------------------------------------------------- the sixteen wonders (feet at the tile centre)

function mound(ctx: Ctx, x: number, y: number, h: number, rock: string, top: string) {
  poly(ctx, [x - 30, y + 2, x - 18, y - h * 0.6, x - 4, y - h, x + 12, y - h * 0.8, x + 30, y + 2, x, y + 15], rock);
  poly(ctx, [x + 2, y + 15, x - 2, y - h, x + 12, y - h * 0.8, x + 30, y + 2], shade(rock, -0.22));
  poly(ctx, [x - 18, y - h * 0.6 - 1, x - 4, y - h - 1, x + 12, y - h * 0.8 - 1, x + 4, y - h * 0.6], top);
}

const ART: Record<string, (ctx: Ctx, x: number, y: number) => void> = {
  pyramids(ctx, x, y) {
    pyramid(ctx, x - 17, y - 7, 26, 26, SAND, 4);
    pyramid(ctx, x + 4, y + 1, 44, 46, SAND, 7);
    poly(ctx, [x + 4 - 3.2, y - 42, x + 4, y - 45 - 1, x + 4 + 3.2, y - 42, x + 4, y - 40.4], '#f4d05a'); // gilded capstone
    pyramid(ctx, x + 20, y + 7, 16, 14, shade(SAND, -0.04), 3);
  },
  greatwall(ctx, x, y) {
    const seg = (x0: number, y0: number, x1: number, y1: number) => {
      const n = 8;
      for (let i = 0; i <= n; i++) {
        const px = x0 + ((x1 - x0) * i) / n, py = y0 + ((y1 - y0) * i) / n;
        box(ctx, px, py, 7, 10, '#b8ab8e');
        if (i % 2 === 0) box(ctx, px, py - 10, 2.6, 2.4, '#a89b7e');
      }
    };
    seg(x - 30, y - 2, x - 4, y - 14);
    box(ctx, x - 2, y - 12, 13, 24, '#b8ab8e'); // the watchtower
    for (const [ox, oy] of [[-5, -1], [5, -1], [0, 2.5], [0, -4.5]] as const) box(ctx, x - 2 + ox, y - 36 + oy, 3, 3, '#a89b7e');
    faceQuad(ctx, 'L', x - 2, y - 12, 13, 24, 0.35, 0.65, 0.55, 0.75, '#3a3026');
    seg(x - 2, y - 12, x + 26, y + 6);
  },
  colosseum(ctx, x, y) {
    ringWall(ctx, x, y + 2, 27, 13, 28, '#d6c7a1', () => {
      ellipse(ctx, x, y - 24, 20, 8.5, '#c7a36a'); // the sand of the arena
      ellipse(ctx, x, y - 25, 14, 5.5, '#d8b57b');
    }, (a, px, py) => {
      for (let tier = 0; tier < 3; tier++) {
        const ty = py + 2 - 7 - tier * 8.5;
        ctx.fillStyle = '#5b4a36';
        ctx.fillRect(px - 1.2, ty - 3.5, 2.4, 4.5);
        ellipse(ctx, px, ty - 3.5, 1.2, 1.1, '#5b4a36');
      }
      if (a > 2.3) poly(ctx, [px - 2, py + 2 - 28, px + 3, py + 2 - 22, px + 4, py + 2 - 28], '#b8a57f'); // the broken crown on one side
    });
  },
  machupicchu(ctx, x, y) {
    poly(ctx, [x + 4, y - 20, x + 16, y - 60, x + 22, y - 62, x + 30, y - 22], '#5f7f4a'); // the sugarloaf peak behind
    poly(ctx, [x + 19, y - 61, x + 22, y - 62, x + 30, y - 22, x + 22, y - 24], '#4a6a3a');
    mound(ctx, x, y, 24, '#8a8070', GRASS);
    for (let i = 0; i < 4; i++) box(ctx, x - 6 + i * 2, y - 12 - i * 5, 34 - i * 7, 4, i % 2 ? GRASS : shade(GRASS, 0.08), shade(GRASS, 0.18)); // terraces
    for (const [ox, oy] of [[-12, -28], [-4, -31], [4, -30], [11, -27]] as const) {
      box(ctx, x + ox, y + oy, 6, 4, '#bdb3a0');
      roof(ctx, x + ox, y + oy - 4, 7, 5, '#b88e3a');
    }
  },
  gardens(ctx, x, y) {
    for (let i = 0; i < 4; i++) {
      const w = 48 - i * 10, cy = y + 4 - i * 10;
      box(ctx, x, cy, w, 10, '#c9a472', shade(GRASS, 0.05));
      for (let j = 0; j < 5; j++) faceQuad(ctx, j < 3 ? 'L' : 'R', x, cy, w, 10, 0.1 + (j % 3) * 0.3, 0.2 + (j % 3) * 0.3, 0.25, 1, LEAF); // hanging vines
    }
    line(ctx, x + 10, y - 36, x + 12, y - 2, '#7fd0f0', 1.6); // a stream down the terraces
    for (const [ox, oy] of [[-6, -38], [6, -40], [0, -44]] as const) {
      line(ctx, x + ox, y + oy, x + ox, y + oy - 8, '#7a5a30', 1.2);
      for (let k = 0; k < 5; k++) { const a = -Math.PI + (k / 4) * Math.PI; line(ctx, x + ox, y + oy - 8, x + ox + Math.cos(a) * 6, y + oy - 8 + Math.sin(a) * 3 + 2, LEAF, 1.4); }
    }
  },
  library(ctx, x, y) {
    box(ctx, x, y + 2, 50, 6, '#d8d2c0');
    box(ctx, x, y - 4, 42, 22, '#efe9d8');
    for (let i = 0; i < 6; i++) {
      faceQuad(ctx, 'L', x, y - 4, 42, 22, 0.05 + i * 0.16, 0.1 + i * 0.16, 0.05, 0.85, '#a9a391'); // the colonnade's shadows
      faceQuad(ctx, 'R', x, y - 4, 42, 22, 0.05 + i * 0.16, 0.1 + i * 0.16, 0.05, 0.85, '#a9a391');
    }
    box(ctx, x, y - 26, 44, 3, '#e4ddc8');
    roof(ctx, x, y - 29, 44, 12, '#b85c3c');
    for (const [ox, oy] of [[-9, 9], [9, 9]] as const) { // scrolls stacked by the steps
      ellipse(ctx, x + ox, y + oy, 2.6, 1.6, '#f3e2b0');
      ellipse(ctx, x + ox, y + oy - 2, 2.2, 1.4, '#e9d49a');
    }
  },
  stonehenge(ctx, x, y) {
    ellipse(ctx, x, y + 1, 28, 13, shade(GRASS, -0.05));
    const n = 9;
    const stones: { a: number; px: number; py: number }[] = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; stones.push({ a, px: x + Math.cos(a) * 22, py: y + Math.sin(a) * 10 }); }
    const trilithon = (px: number, py: number) => {
      box(ctx, px - 2.6, py, 3.4, 14, GRANITE);
      box(ctx, px + 2.6, py, 3.4, 14, GRANITE);
      box(ctx, px, py - 14, 9, 2.6, shade(GRANITE, 0.06));
    };
    for (const s of stones.filter((k) => Math.sin(k.a) < 0).sort((a, b) => a.py - b.py)) trilithon(s.px, s.py);
    box(ctx, x, y, 8, 3, '#8f887a'); // the altar stone
    box(ctx, x - 4, y - 2, 5, 19, shade(GRANITE, -0.05)); // a great trilithon at the heart
    box(ctx, x + 5, y - 2, 5, 19, shade(GRANITE, -0.05));
    box(ctx, x + 0.5, y - 21, 14, 3.5, GRANITE);
    for (const s of stones.filter((k) => Math.sin(k.a) >= 0).sort((a, b) => a.py - b.py)) trilithon(s.px, s.py);
  },
  angkor(ctx, x, y) {
    poly(ctx, [x - 32, y, x, y - 16, x + 32, y, x, y + 16], '#4f9fc0'); // the moat
    poly(ctx, [x - 26, y, x, y - 13, x + 26, y, x, y + 13], '#8a8a6a');
    box(ctx, x, y + 2, 40, 5, '#a59a7a');
    box(ctx, x, y - 3, 30, 5, '#b3a886');
    for (const [ox, oy] of [[-12, -6], [12, -6], [-12, 4], [12, 4]] as const) if (oy < 0) prang(ctx, x + ox, y - 7 + oy, 7, 26, '#a89c78');
    prang(ctx, x, y - 8, 12, 50, '#b4a883');
    for (const [ox, oy] of [[-12, 4], [12, 4]] as const) prang(ctx, x + ox, y - 7 + oy, 7, 26, '#a89c78');
  },
  hagia(ctx, x, y) {
    for (const ox of [-22, 20]) { cylinder(ctx, x + ox, y - 2 - Math.abs(ox) / 6, 2, 1.6, 44, '#e8ddd0'); poly(ctx, [x + ox - 2, y - 46 - Math.abs(ox) / 6, x + ox, y - 54 - Math.abs(ox) / 6, x + ox + 2, y - 46 - Math.abs(ox) / 6], '#7f8ea3'); }
    box(ctx, x, y + 2, 38, 16, '#d99a82');
    faceQuad(ctx, 'L', x, y + 2, 38, 16, 0.2, 0.8, 0.3, 0.6, '#a86a56');
    dome(ctx, x - 12, y - 14, 8, 6, '#8796ab');
    dome(ctx, x + 12, y - 14, 8, 6, '#8796ab');
    box(ctx, x, y - 12, 22, 6, '#d99a82');
    dome(ctx, x, y - 18, 13, 13, '#8796ab');
    line(ctx, x, y - 31, x, y - 36, '#e8c85a', 1.2);
    for (const ox of [-14, 14]) { cylinder(ctx, x + ox, y + 10, 2, 1.6, 40, '#e8ddd0'); poly(ctx, [x + ox - 2, y - 30, x + ox, y - 38, x + ox + 2, y - 30], '#7f8ea3'); }
  },
  djenne(ctx, x, y) {
    box(ctx, x, y + 4, 52, 6, shade(MUD, -0.08));
    box(ctx, x, y - 2, 44, 20, MUD);
    for (let i = 0; i < 7; i++) faceQuad(ctx, 'L', x, y - 2, 44, 20, 0.04 + i * 0.14, 0.09 + i * 0.14, 0, 1.12, shade(MUD, 0.1)); // buttresses
    for (const [ox, oy] of [[-12, 4], [0, 8], [12, 4]] as const) {
      box(ctx, x + ox, y - 2 + oy, 8, 36, shade(MUD, 0.04));
      poly(ctx, [x + ox - 4, y - 38 + oy, x + ox, y - 44 + oy, x + ox + 4, y - 38 + oy], shade(MUD, 0.12));
      ellipse(ctx, x + ox, y - 45 + oy, 1.4, 1.4, '#f6f0e0'); // an ostrich-egg finial
      for (let k = 0; k < 4; k++) line(ctx, x + ox - 5, y - 10 - k * 7 + oy, x + ox - 3, y - 10 - k * 7 + oy, '#5a3a1e', 1); // torons: the palm beams sticking out
    }
  },
  moai(ctx, x, y) {
    poly(ctx, [x - 30, y + 2, x - 4, y - 11, x + 30, y + 6, x + 4, y + 17], shade(GRASS, 0.08)); // the headland
    box(ctx, x, y + 3, 44, 4, GRANITE); // the ahu platform
    for (let i = 0; i < 5; i++) {
      const px = x - 16 + i * 8, py = y - 1 + i * 2.5 - 6;
      poly(ctx, [px - 3.5, py, px - 3.8, py - 13, px - 3.2, py - 20, px + 2.8, py - 21, px + 3.5, py - 13, px + 3.5, py], '#6e6258');
      poly(ctx, [px + 0.5, py, px + 1, py - 21, px + 2.8, py - 21, px + 3.5, py - 13, px + 3.5, py], '#584e46');
      line(ctx, px - 3.2, py - 16, px + 2.8, py - 16.5, '#3e362f', 1.2); // the heavy brow
      poly(ctx, [px - 0.6, py - 16, px + 0.8, py - 16, px + 1.4, py - 10.5, px - 1, py - 10.5], '#7d7066'); // the long nose
      if (i % 2 === 0) box(ctx, px - 0.2, py - 21, 5, 3, '#a4513a'); // a red topknot
    }
  },
  potala(ctx, x, y) {
    mound(ctx, x, y, 18, '#8a7a66', '#8a7a66');
    box(ctx, x, y - 12, 46, 20, '#f2efe8');
    box(ctx, x + 2, y - 32, 22, 16, '#a8323a');
    box(ctx, x + 2, y - 48, 16, 4, '#8a2830');
    for (const [ox, oy] of [[-4, 0], [5, 0], [0, -3]] as const) roof(ctx, x + 2 + ox, y - 52 + oy, 6, 5, '#e2b83a');
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) faceQuad(ctx, c < 3 ? 'L' : 'R', x, y - 12, 46, 20, 0.12 + (c % 3) * 0.3, 0.2 + (c % 3) * 0.3, 0.2 + r * 0.25, 0.32 + r * 0.25, '#3a2c28');
    for (let c = 0; c < 4; c++) faceQuad(ctx, 'L', x + 2, y - 32, 22, 16, 0.12 + c * 0.22, 0.24 + c * 0.22, 0.4, 0.6, '#2c1c1c');
  },
  chichen(ctx, x, y) {
    for (let i = 0; i < 6; i++) box(ctx, x, y + 4 - i * 6.5, 48 - i * 6.2, 6.5, i % 2 ? '#d9d0b4' : '#cbc2a4');
    for (let i = 0; i < 6; i++) {
      const w = 48 - i * 6.2, cy = y + 4 - i * 6.5;
      faceQuad(ctx, 'R', x, cy, w, 6.5, 0.36, 0.64, 0, 1, '#efe7cc'); // the grand stair
      faceQuad(ctx, 'L', x, cy, w, 6.5, 0.36, 0.64, 0, 1, '#efe7cc');
    }
    box(ctx, x, y - 35, 13, 9, '#d9d0b4'); // the temple on top
    faceQuad(ctx, 'L', x, y - 35, 13, 9, 0.35, 0.65, 0, 0.7, '#2a2018');
    box(ctx, x, y - 44, 15, 2, '#b8402e');
    for (const ox of [-5, 5]) ellipse(ctx, x + ox, y + 12, 2.4, 1.6, '#3fbf8f'); // serpent heads at the foot of the stair
  },
  terracotta(ctx, x, y) {
    poly(ctx, [x - 30, y, x, y - 15, x + 30, y, x, y + 15], '#8a6440'); // the pit
    poly(ctx, [x - 30, y, x, y + 15, x, y + 18, x - 30, y + 3], '#6a4a2e');
    for (let r = 0; r < 3; r++) {
      line(ctx, x - 24 + r * 8, y - 3 - r * 4 + 8, x + 4 + r * 8, y - 17 - r * 4 + 20 + 3, '#6e4e30', 2.2); // earthen ridges between the ranks
    }
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
      const px = x - 16 + c * 6.5 + r * 5.5, py = y - 6 + c * 3.2 - r * 2.8 + 2;
      box(ctx, px, py, 3, 6, '#c08a5a');
      ellipse(ctx, px, py - 7.5, 1.4, 1.5, '#b07a4a');
    }
    box(ctx, x - 18, y - 6, 12, 6, '#a0322a');
    roof(ctx, x - 18, y - 12, 15, 6, '#3a3a40'); // a shelter over the dig
  },
  lighthouse(ctx, x, y) {
    poly(ctx, [x - 28, y + 3, x, y - 10, x + 28, y + 3, x, y + 16], '#b8ab8e'); // the harbour mole
    box(ctx, x, y + 4, 36, 6, '#d8d0b8');
    box(ctx, x, y - 2, 20, 36, '#efe8d6');
    for (let i = 0; i < 4; i++) faceQuad(ctx, 'L', x, y - 2, 20, 36, 0.4, 0.6, 0.12 + i * 0.22, 0.2 + i * 0.22, '#5a4e40');
    box(ctx, x, y - 38, 14, 22, '#e6dfcc');
    cylinder(ctx, x, y - 60, 5, 4.5, 12, '#ddd5c0');
    ellipse(ctx, x, y - 76, 9, 7, 'rgba(255,190,60,0.35)'); // the beacon
    poly(ctx, [x - 3.5, y - 72, x, y - 82, x + 3.5, y - 72], '#ffb030');
    poly(ctx, [x - 2, y - 72, x, y - 78, x + 2, y - 72], '#fff0a0');
    line(ctx, x, y - 82, x, y - 86, '#c8a040', 1.4);
  },
  zimbabwe(ctx, x, y) {
    ringWall(ctx, x, y + 2, 28, 13, 14, '#a39a8a', () => {
      ellipse(ctx, x, y - 12, 22, 9, shade(GRASS, -0.1));
      cylinder(ctx, x + 6, y - 10, 6, 3, 24, '#968d7c'); // the conical tower
    }, (a, px, py) => {
      if (a > 0.6 && a < 2.6) for (let k = 0; k < 2; k++) line(ctx, px - 2, py + 2 - 9 + k * 0.1, px, py + 2 - 11, '#7a7264', 0.8); // chevron frieze
    });
    for (const ox of [-18, 20]) { line(ctx, x + ox, y + 4, x + ox, y - 18, '#6a8a5a', 1.8); poly(ctx, [x + ox - 3, y - 18, x + ox, y - 23, x + ox + 3, y - 20], '#5a7a4a'); } // soapstone birds on pillars
  },
};

/** A wonder's landmark with its feet at (x, y). */
export function drawWonderArt(ctx: Ctx, id: string, x: number, y: number) {
  softShadow(ctx, x + 2, y + 4, 30, 12, 0.22);
  (ART[id] ?? ART.pyramids)(ctx, x, y);
}

/** A small flag on a pole in an empire's colour. */
function banner(ctx: Ctx, x: number, y: number, color: string) {
  line(ctx, x, y, x, y - 22, '#3a2a1a', 1.4);
  poly(ctx, [x + 0.7, y - 22, x + 10, y - 19, x + 0.7, y - 15.5], color);
  poly(ctx, [x + 0.7, y - 19, x + 10, y - 19, x + 0.7, y - 15.5], shade(color, -0.25));
}

/** Scaffolding and a crane around a wonder rising to `top`. */
function scaffold(ctx: Ctx, x: number, y: number, top: number) {
  const wood = '#8a6238';
  for (const [ox, oy] of [[-20, 2], [20, 2], [-8, 9], [8, 9]] as const) line(ctx, x + ox, y + oy, x + ox, Math.min(y + oy - 6, top), wood, 1.2);
  for (let k = y - 6; k > top; k -= 9) {
    line(ctx, x - 20, k + 2, x - 8, k + 9, wood, 0.9);
    line(ctx, x + 20, k + 2, x + 8, k + 9, wood, 0.9);
  }
  // the crane: a mast and a boom with a hanging block of stone
  line(ctx, x + 26, y + 4, x + 26, top - 16, wood, 1.6);
  line(ctx, x + 26, top - 16, x - 4, top - 10, wood, 1.3);
  line(ctx, x + 2, top - 11, x + 2, top - 2, '#3a3026', 0.7);
  box(ctx, x + 2, top + 1, 4, 3, STONE);
}

/** A wonder standing or rising on this tile, if any (called by the map's scenery pass). Returns true if one was drawn. */
export function drawWonderTile(ctx: Ctx, s: GameState, t: Tile, x: number, y: number): boolean {
  const b = builtAt(s, t.x, t.y);
  if (b) {
    drawWonderArt(ctx, b.id, x, y);
    banner(ctx, x - 26, y + 4, TRIBES[s.players[wonderHolder(s, b)].tribe].color);
    return true;
  }
  const site = siteAt(s, t.x, t.y);
  if (!site) return false;
  const k = Math.max(0.12, Math.min(0.95, site.paid / wonderCost(s, site.pid, site.id)));
  const top = y + 16 - ((HEIGHT[site.id] ?? 50) + 16) * k;
  poly(ctx, [x - 26, y, x, y - 13, x + 26, y, x, y + 13], 'rgba(214,202,172,0.9)'); // the laid-out foundation
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - 60, top, 120, y + 40 - top);
  ctx.clip();
  drawWonderArt(ctx, site.id, x, y);
  ctx.restore();
  scaffold(ctx, x, y, top);
  banner(ctx, x - 26, y + 4, TRIBES[s.players[site.pid].tribe].color);
  return true;
}

/** A wonder for a button or a card, fitted into a box about 54 px across centred on (x, y). */
export function drawWonderIcon(ctx: Ctx, id: string, x: number, y: number, size = 54) {
  const k = (size / 54) * Math.min(0.62, 34 / (HEIGHT[id] ?? 50)); // tall ones (the Lighthouse) shrink to fit
  ctx.save();
  ctx.translate(x, y + size * 0.3);
  ctx.scale(k, k);
  drawWonderArt(ctx, id, 0, 0);
  ctx.restore();
}
