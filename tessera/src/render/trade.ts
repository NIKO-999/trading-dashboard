// Drawing side of trade (see game/trade): each empire's merchants (one Trader and one Trade Ship kind, drawn in the
// empire's own style: a camel caravan, a llama train, a dog sled, a knarr, a dhow...) and the trade routes themselves,
// dotted caravan trails and sea lanes between the two cities. The trails are part of the map picture, so they show on
// the resting (photographed) map too. All the art is original and procedural.
import { TRIBES } from '../data/tribes';
import { isWater } from '../game/grid';
import { liveRoutes, TRADERS, type CaravanLook, type ShipLook } from '../game/trade';
import type { GameState, TribeId } from '../game/types';
import { tileCenter, WATER_DROP } from './camera';
import { box, ellipse, faceQuad, line, poly, shade, type Ctx } from './prims';
import { drawHorse, drawLlama, figure, tbYak } from './units';

const GOLD = '#f0c43a';
const WOOD = '#7a5230';
const ROPE = '#c9b27a';
const SAIL = '#efe6d0';
const DARK = '#1b1b1f';

// ---------------------------------------------------------------- loads and small parts

/** A corded bundle of goods (a bale, a sack of salt, a roll of cloth). */
function bale(ctx: Ctx, x: number, y: number, w: number, h: number, color: string, cord = ROPE) {
  box(ctx, x, y, w, h, color);
  faceQuad(ctx, 'L', x, y, w, h, 0.45, 0.55, 0, 1, cord);
  faceQuad(ctx, 'R', x, y, w, h, 0.45, 0.55, 0, 1, cord);
  faceQuad(ctx, 'R', x, y, w, h, 0, 1, 0.45, 0.55, cord);
}

/** A slab of rock salt, bright white with grey veins. */
function saltSlab(ctx: Ctx, x: number, y: number, k: number) {
  box(ctx, x, y, 3 * k, 8 * k, '#eeeae2', '#fbfaf6');
  line(ctx, x - 1.2 * k, y - 6 * k, x - 0.2 * k, y - 2 * k, '#b8b2a6', 0.5 * k);
}

/** A little team pennant on a pole, so everyone can tell whose merchant it is. */
function pennant(ctx: Ctx, x: number, y: number, h: number, color: string) {
  line(ctx, x, y, x, y - h, '#5a3a22', 0.9);
  poly(ctx, [x, y - h, x + 7, y - h + 2, x, y - h + 4], color);
  poly(ctx, [x, y - h + 2, x + 7, y - h + 2, x, y - h + 4], shade(color, -0.25));
}

/** A spoked wheel seen side on. */
function wheel(ctx: Ctx, x: number, y: number, r: number) {
  ellipse(ctx, x, y, r * 0.7, r, '#4a2e18');
  ellipse(ctx, x, y, r * 0.52, r * 0.78, '#8a6038');
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 4;
    line(ctx, x - Math.cos(a) * r * 0.5, y - Math.sin(a) * r * 0.76, x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.76, '#4a2e18', 0.8);
  }
  ellipse(ctx, x, y, 1.1, 1.4, '#3a2414');
}

// ---------------------------------------------------------------- animals

/** A dromedary (one hump) or Bactrian camel (two, shaggy), facing right. Returns the top of the load. */
function camel(ctx: Ctx, x: number, y: number, k: number, coat: string, humps: 1 | 2) {
  const leg = shade(coat, -0.18);
  for (const [lx, ly] of [[-5, -1.2], [-2.6, 0.6], [4.2, -0.6], [6.4, 1.2]] as const) {
    box(ctx, x + lx * k, y + ly * k, 1.7 * k, 10 * k, leg);
    ellipse(ctx, x + lx * k, y + ly * k, 1.5 * k, 0.8 * k, shade(leg, -0.3)); // splayed pads
  }
  line(ctx, x - 8 * k, y - 16 * k, x - 9.4 * k, y - 10 * k, shade(coat, -0.3), 1 * k); // tail
  box(ctx, x, y - 10 * k, 15 * k, 6.6 * k, coat);
  faceQuad(ctx, 'R', x, y - 10 * k, 15 * k, 6.6 * k, 0, 1, 0, 0.2, shade(coat, -0.2)); // belly shade
  if (humps === 1) {
    ellipse(ctx, x - 0.5 * k, y - 18.4 * k, 5.4 * k, 4.2 * k, coat);
    ellipse(ctx, x - 1.2 * k, y - 19.6 * k, 3.4 * k, 2.4 * k, shade(coat, 0.12));
  } else {
    for (const hx of [-3.6, 3]) {
      ellipse(ctx, x + hx * k, y - 18 * k, 3.2 * k, 4 * k, coat);
      ellipse(ctx, x + hx * k, y - 21 * k, 2.4 * k, 1.8 * k, shade(coat, -0.25)); // woolly tops
    }
    for (let i = 0; i < 5; i++) line(ctx, x + (5 + i * 0.8) * k, y - 12 * k, x + (5.2 + i * 0.8) * k, y - 8 * k, shade(coat, -0.28), 0.7 * k); // a shaggy throat
  }
  // the long neck dips forward and rises to the head
  poly(ctx, [x + 6 * k, y - 15 * k, x + 11 * k, y - 12 * k, x + 13.4 * k, y - 20 * k, x + 11 * k, y - 21 * k, x + 8.6 * k, y - 15 * k], coat);
  poly(ctx, [x + 11 * k, y - 12 * k, x + 13.4 * k, y - 20 * k, x + 12.6 * k, y - 20.6 * k, x + 10 * k, y - 13 * k], shade(coat, -0.18));
  box(ctx, x + 13.6 * k, y - 20.4 * k, 4.4 * k, 3.6 * k, shade(coat, 0.06));
  box(ctx, x + 16.2 * k, y - 20 * k, 2.6 * k, 2.4 * k, shade(coat, -0.05)); // muzzle
  ellipse(ctx, x + 13.8 * k, y - 23 * k, 0.5 * k, 0.5 * k, DARK); // eye
  poly(ctx, [x + 12.2 * k, y - 24 * k, x + 12.8 * k, y - 25.8 * k, x + 13.2 * k, y - 24 * k], shade(coat, -0.2)); // ear
  line(ctx, x + 17 * k, y - 21 * k, x + 14 * k, y - 17 * k, '#b3302a', 0.6 * k); // halter
  return { x: x - 0.5 * k, y: y - 21 * k };
}

/** A heavy ox with spreading horns, facing right. */
function ox(ctx: Ctx, x: number, y: number, k: number, coat: string) {
  const leg = shade(coat, -0.2);
  for (const [lx, ly] of [[-5, -1.2], [-2.4, 0.6], [4, -0.6], [6.4, 1.2]] as const) box(ctx, x + lx * k, y + ly * k, 2.4 * k, 6 * k, leg);
  box(ctx, x, y - 6 * k, 15 * k, 8 * k, coat);
  ellipse(ctx, x + 4 * k, y - 15.6 * k, 4.4 * k, 2.8 * k, shade(coat, 0.1)); // the shoulder hump
  box(ctx, x + 9.4 * k, y - 8 * k, 5 * k, 5 * k, shade(coat, 0.04)); // head
  box(ctx, x + 11.8 * k, y - 7 * k, 2.8 * k, 2.6 * k, '#e3c9b0'); // pale muzzle
  ellipse(ctx, x + 9.8 * k, y - 11 * k, 0.5 * k, 0.5 * k, DARK);
  poly(ctx, [x + 7.4 * k, y - 13 * k, x + 4.4 * k, y - 17.6 * k, x + 5.2 * k, y - 17.8 * k, x + 8.6 * k, y - 13.4 * k], '#efe6d0'); // horns
  poly(ctx, [x + 10.4 * k, y - 13.4 * k, x + 13.4 * k, y - 18 * k, x + 14 * k, y - 17.4 * k, x + 11.4 * k, y - 13 * k], '#efe6d0');
  line(ctx, x - 7.6 * k, y - 12 * k, x - 8.8 * k, y - 5 * k, leg, 0.8 * k); // tail
}

/** A grey elephant with a cargo platform on its back, facing right. Returns where the mahout sits. */
function elephant(ctx: Ctx, x: number, y: number, k: number, cloth: string) {
  const skin = '#8e8a88', leg = shade(skin, -0.12);
  for (const [lx, ly] of [[-6, -1.4], [-2.8, 0.8], [4.4, -0.8], [7.4, 1.4]] as const) box(ctx, x + lx * k, y + ly * k, 3.6 * k, 8.4 * k, leg);
  box(ctx, x, y - 8 * k, 18 * k, 10 * k, skin);
  ellipse(ctx, x - 1 * k, y - 20 * k, 8 * k, 3.6 * k, skin); // the rounded back
  // the head, a big ear and the trunk curling down
  ellipse(ctx, x + 10 * k, y - 18 * k, 5 * k, 5.4 * k, shade(skin, 0.06));
  ellipse(ctx, x + 7 * k, y - 17 * k, 3.6 * k, 5 * k, shade(skin, -0.12));
  poly(ctx, [x + 13 * k, y - 16 * k, x + 15.6 * k, y - 10 * k, x + 15 * k, y - 4 * k, x + 13 * k, y - 4.6 * k, x + 13.2 * k, y - 10 * k, x + 11.4 * k, y - 14.4 * k], skin);
  poly(ctx, [x + 12.4 * k, y - 13 * k, x + 16 * k, y - 11.6 * k, x + 12.6 * k, y - 11.4 * k], '#f4efe0'); // a short tusk
  ellipse(ctx, x + 11.6 * k, y - 20 * k, 0.6 * k, 0.6 * k, DARK);
  // the cargo: a saddle cloth and lashed crates
  poly(ctx, [x - 7 * k, y - 22 * k, x + 5 * k, y - 22 * k, x + 6 * k, y - 12 * k, x - 8 * k, y - 12 * k], cloth);
  poly(ctx, [x - 8 * k, y - 13.4 * k, x + 6 * k, y - 13.4 * k, x + 6 * k, y - 12 * k, x - 8 * k, y - 12 * k], GOLD);
  bale(ctx, x - 3.6 * k, y - 22 * k, 5 * k, 4 * k, '#a07845');
  bale(ctx, x + 1.4 * k, y - 22.6 * k, 4 * k, 3.4 * k, '#c9a878');
  return { x: x + 7 * k, y: y - 23 * k };
}

/** A small sled dog, facing right. */
function dog(ctx: Ctx, x: number, y: number, k: number, coat: string) {
  for (const lx of [-2.4, -0.8, 2, 3.4]) box(ctx, x + lx * k, y, 1 * k, 3.4 * k, shade(coat, -0.15));
  box(ctx, x, y - 3 * k, 7 * k, 3.4 * k, coat);
  box(ctx, x + 4.4 * k, y - 5 * k, 3 * k, 2.6 * k, coat);
  poly(ctx, [x + 3.8 * k, y - 7.2 * k, x + 4.2 * k, y - 9 * k, x + 4.8 * k, y - 7.4 * k], coat); // pricked ears
  box(ctx, x + 6 * k, y - 4.6 * k, 1.6 * k, 1.4 * k, '#f4efe0'); // pale mask
  poly(ctx, [x - 3.6 * k, y - 6 * k, x - 5.6 * k, y - 9 * k, x - 3 * k, y - 7 * k], shade(coat, 0.2)); // curled tail
  faceQuad(ctx, 'R', x, y - 3 * k, 7 * k, 3.4 * k, 0.1, 0.9, 0.4, 0.6, '#b3302a'); // harness
}

// ---------------------------------------------------------------- caravans

/** A walking merchant of the empire, seen from the side (in their people's dress). */
const walker = (ctx: Ctx, tribe: TribeId, x: number, y: number, k = 0.72) => figure(ctx, 'explorer', tribe, x, y, k);

function porter(ctx: Ctx, tribe: TribeId, x: number, y: number, k: number) {
  const pole = tribe === 'china' || tribe === 'japan' || tribe === 'korea';
  if (!pole) { // a load on the back, carried by a tumpline or straps
    const load = tribe === 'swahili' ? '#efe6d0' : tribe === 'maya' ? '#c98a3a' : tribe === 'aboriginal' ? '#9a6238' : tribe === 'polynesia' ? '#b89a5a' : '#a07845';
    bale(ctx, x - 4.6 * k, y - 10 * k, 5 * k, 9 * k, load);
    if (tribe === 'swahili') for (const dy of [0, 2.4]) line(ctx, x - 7 * k, y - (20 + dy) * k, x - 1.6 * k, y - (21.6 + dy) * k, '#f4efe0', 1.1 * k); // ivory tusks bound on top
    if (tribe === 'polynesia') for (let i = 0; i < 4; i++) line(ctx, x - 6.6 * k + i * 1.3 * k, y - 10 * k, x - 6.2 * k + i * 1.3 * k, y - 19 * k, '#8a6a3a', 0.4 * k); // woven flax kete
  }
  const b = walker(ctx, tribe, x, y, k);
  if (!pole) { line(ctx, b.hand.x, b.hand.y, x - 3 * k, y - 18 * k, ROPE, 0.6 * k); return; }
  // a shoulder pole with a basket (or a silk bale) at each end
  const py = b.top + 6 * k;
  line(ctx, x - 11 * k, py + 1.4 * k, x + 11 * k, py - 1.4 * k, '#8a6038', 1.1 * k);
  for (const [dx, dy] of [[-10, 1.2], [10, -1.2]] as const) {
    line(ctx, x + (dx - 1.6) * k, py + dy * k, x + (dx - 1) * k, py + (dy + 7) * k, ROPE, 0.5 * k);
    line(ctx, x + (dx + 1.6) * k, py + dy * k, x + (dx + 1) * k, py + (dy + 7) * k, ROPE, 0.5 * k);
    if (tribe === 'china') bale(ctx, x + dx * k, py + (dy + 12) * k, 5 * k, 5 * k, dx < 0 ? '#c8372d' : '#f0c43a', '#7a1f1a'); // bolts of silk
    else { ellipse(ctx, x + dx * k, py + (dy + 9.4) * k, 3.2 * k, 2.6 * k, '#b8945a'); ellipse(ctx, x + dx * k, py + (dy + 7.8) * k, 3.2 * k, 1.2 * k, '#d8bc84'); } // baskets
  }
}

/** Pochteca: a travelling Aztec merchant bent under a tall wooden carrying frame, with a staff and a fan. */
function pochteca(ctx: Ctx, tribe: TribeId, x: number, y: number) {
  const k = 0.8;
  const fx = x - 5.4 * k;
  for (const dx of [-2.2, 2.2]) line(ctx, fx + dx * k, y - 2 * k, fx + dx * k, y - 26 * k, '#6b4424', 1 * k); // the frame's uprights
  for (const dy of [6, 14, 22]) line(ctx, fx - 2.6 * k, y - dy * k, fx + 2.6 * k, y - dy * k, '#6b4424', 0.8 * k);
  bale(ctx, fx, y - 8 * k, 5.4 * k, 6 * k, '#e3d3a8'); // cotton mantles
  bale(ctx, fx, y - 14 * k, 5 * k, 5 * k, '#1faa9b'); // bundles of feathers and jade
  ellipse(ctx, fx, y - 23 * k, 3 * k, 2 * k, '#6b3a1a'); // a sack of cacao beans
  for (let i = 0; i < 3; i++) poly(ctx, [fx, y - 25 * k, fx - 2 + i * 2, y - 31 * k, fx + 1, y - 25 * k], ['#1faa6b', '#d6453b', GOLD][i]); // quetzal plumes
  const b = walker(ctx, tribe, x, y, k);
  line(ctx, b.hand.x, b.hand.y + 6 * k, b.hand.x + 1 * k, b.hand.y - 12 * k, '#3a2414', 0.9 * k); // the black merchant's staff
  ellipse(ctx, b.off.x + 1, b.off.y - 1, 2.2 * k, 2.8 * k, '#1faa6b'); // a feather fan
}

/** A two-wheeled cart pulled by an ox. */
function oxcart(ctx: Ctx, tribe: TribeId, x: number, y: number) {
  const k = 0.72;
  const cargo = tribe === 'rome' ? 'amphora' : tribe === 'india' ? 'sacks' : 'hides';
  const cx = x - 8, cy = y + 1;
  line(ctx, cx + 4, cy - 6, x + 5, y - 3, '#6b4424', 1.2); // the shaft to the yoke
  box(ctx, cx, cy - 4, 14, 3, WOOD);
  box(ctx, cx, cy - 7, 13, 3, shade(WOOD, 0.1));
  if (cargo === 'amphora') for (const [dx, dy] of [[-3, 0], [0, 1], [3, 0], [-1.5, -2], [1.5, -2]] as const) {
    ellipse(ctx, cx + dx, cy - 11 + dy, 1.6, 2.8, '#c96a3a');
    box(ctx, cx + dx, cy - 13.4 + dy, 0.9, 1.4, '#a8552e');
  } else if (cargo === 'sacks') for (const dx of [-3, 1, 4]) ellipse(ctx, cx + dx, cy - 10.4, 2.6, 2.4, '#d9c79a');
  else { bale(ctx, cx - 2, cy - 7, 5, 4, '#8a5a33'); bale(ctx, cx + 2.6, cy - 7.6, 4, 3.4, '#c9a06a'); }
  wheel(ctx, cx - 1, cy - 2, 4.4);
  ox(ctx, x + 5, y + 2, k, tribe === 'india' ? '#e8e2d6' : tribe === 'zulu' ? '#3a2a22' : '#8a5a33');
  if (tribe === 'zulu') faceQuad(ctx, 'R', x + 5, y + 2 - 6 * k, 15 * k, 8 * k, 0.2, 0.5, 0.3, 0.8, '#f4efe0'); // a Nguni hide, patched white
  walker(ctx, tribe, x + 15, y + 4, 0.6);
}

/** A pack animal led by its merchant: camels, llamas, horses, mules, yaks, an elephant. */
function drawCaravan(ctx: Ctx, look: CaravanLook, tribe: TribeId, x: number, y: number) {
  const T = TRIBES[tribe];
  switch (look) {
    case 'camel':
    case 'saltcamel':
    case 'bactrian': {
      const k = look === 'bactrian' ? 0.8 : 0.78;
      const coat = look === 'bactrian' ? '#8a6038' : tribe === 'ethiopia' ? '#d6b78a' : '#c9a06a';
      const top = camel(ctx, x - 2, y + 2, k, coat, look === 'bactrian' ? 2 : 1);
      // a striped saddle blanket and the load slung either side
      poly(ctx, [top.x - 5, top.y + 3, top.x + 5, top.y + 3, top.x + 6, top.y + 9, top.x - 6, top.y + 9], T.color);
      line(ctx, top.x - 6, top.y + 8, top.x + 6, top.y + 8, GOLD, 0.8);
      if (look === 'saltcamel') for (const dx of [-3.4, 0, 3.4]) saltSlab(ctx, top.x + dx, top.y + 12, 0.9); // slabs of Taoudenni salt
      else if (look === 'bactrian') { bale(ctx, top.x, top.y + 6, 5, 5, '#e3d3a8'); bale(ctx, top.x + 0.6, top.y + 1, 4, 3.4, '#b3302a'); }
      else { bale(ctx, top.x - 3, top.y + 9, 4.4, 5, '#e3d3a8'); bale(ctx, top.x + 3, top.y + 8, 4, 4.4, '#a07845'); }
      walker(ctx, tribe, x + 12, y + 5, 0.62);
      return;
    }
    case 'llama': {
      drawLlama(ctx, x - 8, y - 1, 0.55, '#efe6d6', '#9a7448'); // the one behind
      bale(ctx, x - 8, y - 9, 4, 3, '#b3302a');
      const saddle = drawLlama(ctx, x + 1, y + 3, 0.66, '#f2ead8', '#8a5a33', T.color);
      bale(ctx, saddle.x, saddle.y + 3, 4.4, 3.4, '#c98a3a');
      walker(ctx, tribe, x + 12, y + 5, 0.58);
      return;
    }
    case 'yak': {
      tbYak(ctx, x - 1, y + 3, 0.8, '#3a2a22');
      bale(ctx, x - 2, y - 11, 5, 4, '#b3302a');
      bale(ctx, x + 2.4, y - 12, 4, 3.4, '#e3d3a8'); // bricks of tea and salt
      walker(ctx, tribe, x + 13, y + 5, 0.6);
      return;
    }
    case 'packhorse':
    case 'mule': {
      const mule = look === 'mule';
      const coat = mule ? '#7a6a5a' : tribe === 'celts' ? '#8a4f2a' : '#c9a878';
      const saddle = drawHorse(ctx, x - 2, y + 3, mule ? 0.78 : 0.86, coat, '#2a1a10', undefined, T.color);
      if (mule) { // long ears
        const hx = x - 2 + 10.5 * 0.78, hy = y + 3 - 15 * 0.78;
        poly(ctx, [hx - 1, hy - 4, hx - 1.4, hy - 10, hx + 0.6, hy - 4.4], shade(coat, -0.1));
        poly(ctx, [hx + 1, hy - 4, hx + 1.8, hy - 9.6, hx + 2.4, hy - 4.2], shade(coat, 0.05));
      }
      bale(ctx, saddle.x - 3, saddle.y + 5, 4.4, 5, tribe === 'pirates' ? '#3a2a22' : '#a07845'); // panniers
      bale(ctx, saddle.x + 2.6, saddle.y + 4, 4, 4.6, tribe === 'pirates' ? '#6b4424' : '#e3d3a8');
      if (tribe === 'pirates') { ellipse(ctx, saddle.x, saddle.y + 1, 2.4, 2, '#6b4424'); line(ctx, saddle.x - 2.4, saddle.y + 1, saddle.x + 2.4, saddle.y + 1, '#3a2414', 0.6); } // a rum keg
      walker(ctx, tribe, x + 13, y + 5, 0.62);
      return;
    }
    case 'travois': {
      // two lodge poles dragged behind a pony, a hide bundle lashed across them
      line(ctx, x + 1, y - 12, x - 14, y + 4, '#8a6038', 1.2);
      line(ctx, x + 3, y - 12, x - 10, y + 6, '#8a6038', 1.2);
      poly(ctx, [x - 9, y - 3, x - 4, y - 7, x - 1, y - 4, x - 6, y + 1], '#d9c29a'); // a buffalo hide bundle
      line(ctx, x - 9, y - 3, x - 1, y - 4, '#b3302a', 0.7);
      drawHorse(ctx, x + 3, y + 3, 0.8, '#e6dccb', '#2a1a10', undefined, T.color);
      faceQuad(ctx, 'R', x + 3, y + 3 - 6 * 0.8, 17 * 0.8, 7 * 0.8, 0.5, 0.8, 0.3, 0.8, '#6a4a2a'); // a paint pony's patch
      walker(ctx, tribe, x + 14, y + 6, 0.58);
      return;
    }
    case 'dogsled': {
      // a sled on bone runners, laden with furs, pulled by a pair of dogs
      line(ctx, x - 12, y + 2, x + 2, y + 5, '#e8e0c8', 1);
      line(ctx, x - 13, y + 0.6, x - 12, y + 2, '#e8e0c8', 1);
      box(ctx, x - 5, y + 1, 12, 2.4, '#8a6038');
      bale(ctx, x - 6, y - 1, 6, 4, '#eef3f6');
      bale(ctx, x - 2, y - 1.6, 4, 3, '#6a4a2e');
      line(ctx, x + 1, y - 1, x + 7, y + 2, ROPE, 0.6);
      dog(ctx, x + 9, y + 1, 1, '#9aa0a8');
      dog(ctx, x + 14, y + 5, 1, '#e8e6e0');
      figure(ctx, 'explorer', tribe, x - 11, y - 1, 0.6);
      return;
    }
    case 'elephant': {
      const seat = elephant(ctx, x - 1, y + 3, 0.72, T.color);
      figure(ctx, 'explorer', tribe, seat.x, seat.y + 3, 0.5, true);
      return;
    }
    case 'oxcart': return oxcart(ctx, tribe, x, y);
    case 'pochteca': return pochteca(ctx, tribe, x + 2, y + 2);
    case 'porter': {
      porter(ctx, tribe, x - 7, y - 1, 0.6); // a second porter behind
      porter(ctx, tribe, x + 4, y + 3, 0.72);
      return;
    }
  }
}

// ---------------------------------------------------------------- ships

/** A hull seen side on: a keel line from bow (right) to stern (left). */
function hull(ctx: Ctx, x: number, y: number, w: number, h: number, color: string, bow = 4, stern = 3) {
  poly(ctx, [x - w, y - h - stern, x + w, y - h - bow, x + w - 6, y + 3, x - w + 5, y + 3], color);
  poly(ctx, [x - w, y - h - stern, x + w, y - h - bow, x + w - 1, y - h - bow + 2, x - w + 1, y - h - stern + 2], shade(color, 0.2));
}
/** A white bow wave and wake. */
function wake(ctx: Ctx, x: number, y: number, w: number) {
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y + 3.4, w * 0.8, 2.2, 0, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.stroke();
}
function mast(ctx: Ctx, x0: number, y0: number, x1: number, y1: number) { line(ctx, x0, y0, x1, y1, '#5a3a22', 1.2); }

function drawTradeShipLook(ctx: Ctx, look: ShipLook, tribe: TribeId, x: number, y: number) {
  const T = TRIBES[tribe];
  switch (look) {
    case 'knarr': { // a broad clinker-built cargo ship, one striped square sail, bales amidships
      hull(ctx, x, y, 19, 3, '#6b4424', 7, 7);
      for (const dy of [1, 3.4]) line(ctx, x - 17, y - dy - 1, x + 17, y - dy - 2, shade('#6b4424', -0.3), 0.5); // the overlapping strakes
      poly(ctx, [x + 17, y - 9, x + 21, y - 14, x + 19, y - 9], '#6b4424');
      bale(ctx, x - 5, y - 4, 5, 3.4, '#a07845'); bale(ctx, x + 5, y - 4, 4.4, 3, '#e3d3a8');
      mast(ctx, x, y - 4, x, y - 30);
      poly(ctx, [x - 10, y - 28, x + 10, y - 28, x + 11, y - 12, x - 11, y - 12], SAIL);
      for (let i = 0; i < 4; i++) poly(ctx, [x - 10 + i * 5.4, y - 28, x - 7.3 + i * 5.4, y - 28, x - 7.6 + i * 5.6, y - 12, x - 10.6 + i * 5.6, y - 12], i % 2 ? T.color : '#b3302a');
      break;
    }
    case 'dhow': { // a lateen sail on a forward-raked mast, a high square stern
      hull(ctx, x, y, 18, 2, '#8a5a33', 5, 6);
      box(ctx, x - 13, y - 6, 6, 3, '#6b4424');
      bale(ctx, x - 2, y - 3, 5, 3, '#e3d3a8'); bale(ctx, x + 4, y - 3, 4, 2.6, '#c98a3a');
      mast(ctx, x - 2, y - 3, x + 1, y - 27);
      poly(ctx, [x - 15, y - 12, x + 12, y - 32, x + 4, y - 7], SAIL);
      line(ctx, x - 15, y - 12, x + 12, y - 32, '#5a3a22', 1);
      line(ctx, x - 10, y - 11, x + 3, y - 8, shade(SAIL, -0.2), 0.6);
      break;
    }
    case 'felucca': { // a slim Nile boat under a tall lateen sail, a lotus-carved stern
      hull(ctx, x, y, 17, 1.6, '#c9a06a', 3, 5);
      ellipse(ctx, x - 17, y - 8, 1.6, 2.6, '#1faa9b');
      bale(ctx, x + 2, y - 2.6, 5, 3, '#e3d3a8');
      mast(ctx, x + 3, y - 2, x + 4, y - 25);
      poly(ctx, [x - 13, y - 5, x + 16, y - 36, x + 6, y - 5], '#f6f1e4');
      line(ctx, x - 13, y - 5, x + 16, y - 36, '#6b4424', 1);
      break;
    }
    case 'sloop': { // a dark-hulled fore-and-aft rig: gaff mainsail and a jib, a black pennant
      hull(ctx, x, y, 17, 3, '#2a2a30', 5, 3);
      line(ctx, x - 16, y - 7, x + 16, y - 9, GOLD, 0.6);
      bale(ctx, x - 6, y - 5, 4, 3, '#6b4424');
      mast(ctx, x - 1, y - 5, x - 1, y - 32);
      poly(ctx, [x - 2, y - 30, x - 16, y - 26, x - 16, y - 9, x - 2, y - 9], '#e2dac6');
      poly(ctx, [x, y - 30, x + 19, y - 9, x, y - 9], '#ece6d6');
      poly(ctx, [x - 1, y - 32, x + 6, y - 31, x - 1, y - 29.6], DARK);
      break;
    }
    case 'waka': { // a double-hulled trading canoe: a deck between the hulls, a crab-claw sail
      hull(ctx, x - 3, y - 3, 16, 1.4, '#2a1a12', 4, 4);
      box(ctx, x, y - 6, 22, 2, '#8a6038');
      bale(ctx, x - 3, y - 7, 4.4, 3, '#b89a5a'); bale(ctx, x + 3, y - 7, 4, 2.6, '#d8bc84');
      hull(ctx, x + 2, y + 1, 17, 1.6, '#3a2418', 5, 4);
      line(ctx, x - 14, y - 4, x + 14, y - 5, '#b3302a', 0.8);
      mast(ctx, x - 2, y - 7, x - 1, y - 26);
      poly(ctx, [x - 1, y - 8, x - 13, y - 33, x - 6, y - 30, x + 11, y - 36, x + 6, y - 22], '#d9c7a0'); // the crab-claw sail of plaited pandanus
      line(ctx, x - 1, y - 8, x - 13, y - 33, '#6b4424', 0.8);
      line(ctx, x - 1, y - 8, x + 11, y - 36, '#6b4424', 0.8);
      break;
    }
    case 'junk': { // a high-sterned junk with ribbed, battened sails
      hull(ctx, x, y, 18, 3, '#6b3a22', 4, 9);
      box(ctx, x - 12, y - 9, 7, 4, '#8a4a2a');
      line(ctx, x - 17, y - 12, x + 16, y - 7, '#c8372d', 0.8);
      ellipse(ctx, x + 14, y - 5, 1.2, 1.2, '#f4efe0'); ellipse(ctx, x + 14, y - 5, 0.5, 0.5, DARK); // the painted eye at the bow
      for (const [mx, h, w] of [[-3, 30, 9], [8, 22, 6]] as const) {
        mast(ctx, x + mx, y - 5, x + mx, y - h);
        poly(ctx, [x + mx - w, y - h + 2, x + mx + w * 0.4, y - h + 1, x + mx + w * 0.6, y - 9, x + mx - w - 1, y - 9], tribe === 'korea' ? '#e8dcc4' : '#c86a3a');
        for (let i = 1; i < 5; i++) line(ctx, x + mx - w - 0.2 * i, y - h + 2 + ((h - 11) * i) / 5, x + mx + w * 0.45, y - h + 1 + ((h - 10) * i) / 5, '#5a3a22', 0.6); // battens
      }
      break;
    }
    case 'roundship': { // a broad merchant hull under one square sail, a curling sternpost, jars aboard
      hull(ctx, x, y, 18, 4, '#7a4a2a', 5, 5);
      poly(ctx, [x - 18, y - 9, x - 22, y - 16, x - 20, y - 17, x - 17, y - 11], '#7a4a2a'); // the goose-neck sternpost
      for (const dx of [-6, -2.5, 1, 4.5]) { ellipse(ctx, x + dx, y - 8, 1.5, 2.6, '#c96a3a'); box(ctx, x + dx, y - 10.2, 0.9, 1.2, '#a8552e'); }
      mast(ctx, x + 2, y - 6, x + 2, y - 31);
      poly(ctx, [x - 9, y - 29, x + 13, y - 29, x + 14, y - 13, x - 10, y - 13], SAIL);
      line(ctx, x - 10, y - 21, x + 14, y - 21, shade(SAIL, -0.15), 0.5);
      ellipse(ctx, x + 2, y - 21, 3.4, 3, T.color); // the owner's device on the sail
      break;
    }
    case 'canoe': { // a long dugout or skin boat heaped with bundles and one paddler
      const inuit = tribe === 'inuit' || tribe === 'lakota' || tribe === 'celts';
      hull(ctx, x, y, 19, 1.2, inuit ? '#c9b48a' : '#5a3a22', 3, 3);
      if (inuit) for (let i = -14; i <= 14; i += 4) line(ctx, x + i, y - 3, x + i + 1, y + 2, '#8a7450', 0.5); // the ribs under the skin
      bale(ctx, x - 6, y - 3, 5, 3, '#a07845'); bale(ctx, x - 1, y - 3.4, 4.4, 3.4, '#e3d3a8'); bale(ctx, x + 4, y - 3, 4, 2.6, T.color);
      const b = figure(ctx, 'explorer', tribe, x + 11, y - 3, 0.52, true);
      line(ctx, b.hand.x + 2, b.hand.y - 4, b.hand.x - 3, y + 5, '#6b4424', 0.9);
      ellipse(ctx, b.hand.x - 3.4, y + 5.4, 1, 1.8, '#8a5a2b');
      break;
    }
    case 'raft': { // lashed logs (balsa, reeds or hide) with a small square sail and a hut of goods
      for (let i = 0; i < 5; i++) box(ctx, x - 12 + i * 5.6, y + 1 - i * 0.6, 5.2, 2.4, i % 2 ? '#c9a06a' : '#b8905a');
      line(ctx, x - 14, y - 1, x + 14, y - 3.6, ROPE, 0.6);
      bale(ctx, x - 5, y - 1.6, 6, 4, tribe === 'inca' ? '#b3302a' : '#8a6038');
      bale(ctx, x + 3, y - 2.2, 4, 3, '#e3d3a8');
      mast(ctx, x + 5, y - 2, x + 5, y - 22);
      poly(ctx, [x - 2, y - 21, x + 12, y - 21, x + 12, y - 8, x - 2, y - 8], tribe === 'inca' ? '#e8d6a8' : '#d9c7a0');
      if (tribe === 'inca') for (let i = 0; i < 3; i++) line(ctx, x - 2, y - 17 + i * 4, x + 12, y - 17 + i * 4, '#b3302a', 0.8);
      break;
    }
  }
  pennant(ctx, x - 16, y - 10, 12, T.color);
  wake(ctx, x, y, 22);
}

/** A Trader of `tribe` standing on (x, y). */
export function drawTrader(ctx: Ctx, tribe: TribeId, x: number, y: number) {
  drawCaravan(ctx, TRADERS[tribe].landLook, tribe, x, y);
}

/** A Trade Ship of `tribe` afloat at (x, y). */
export function drawTradeShip(ctx: Ctx, tribe: TribeId, x: number, y: number) {
  drawTradeShipLook(ctx, TRADERS[tribe].seaLook, tribe, x, y);
}

// ---------------------------------------------------------------- the routes on the map

/**
 * Every standing route the viewer has seen: a dotted caravan trail over land (a dashed sea lane over water) in the colour
 * of the empire that opened it, with a small bale at each city end. Drawn on the ground, under the units.
 */
export function drawTradeRoutes(ctx: Ctx, s: GameState, viewer: number) {
  if (!s.trade?.routes.length) return;
  const seen = (i: number) => viewer < 0 || s.players[viewer].explored[i];
  const at = (i: number) => {
    const t = s.tiles[i];
    const c = tileCenter(t.x, t.y);
    return { x: c.x, y: c.y + (isWater(t) ? WATER_DROP : 0) + 2, water: isWater(t) };
  };
  ctx.save();
  ctx.lineCap = 'round';
  for (const r of liveRoutes(s)) {
    const color = TRIBES[s.players[r.by].tribe].color;
    for (let j = 1; j < r.path.length; j++) {
      const i0 = r.path[j - 1], i1 = r.path[j];
      if (!seen(i0) && !seen(i1)) continue;
      const a = at(i0), b = at(i1);
      const sea = a.water || b.water;
      // a dark underlay so the dots read on every ground, then the dots in the empire's colour
      ctx.setLineDash(sea ? [5, 5] : [0.1, 6]);
      ctx.lineDashOffset = j * 1.5;
      ctx.strokeStyle = 'rgba(20,14,8,0.55)';
      ctx.lineWidth = sea ? 3.4 : 4.6;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.strokeStyle = sea ? 'rgba(255,255,255,0.9)' : color;
      ctx.lineWidth = sea ? 1.6 : 3;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      if (sea) { // a thin line of the owner's colour down the middle of the sea lane
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    ctx.setLineDash([]);
    // a little bale of goods beside each city end, so a trail's ends are easy to spot
    for (const i of [r.path[1], r.path[r.path.length - 2]]) {
      if (i === undefined || !seen(i) || s.tiles[i].cityId !== null) continue;
      const p = at(i);
      bale(ctx, p.x, p.y - 1, 4, 3, '#c9a06a', color);
    }
  }
  ctx.restore();
}
