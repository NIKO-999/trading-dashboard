// Drawing side of the role units (see game/roles): each empire's Recruiter, Sappers, Master Builder, Tax Collector,
// Fishing Fleet and Voyager, drawn in its own style (its people's dress from render/units, and its own standard, tools,
// records, hulls and sails), plus what they leave on the map: Sappers' forts and bridges, the Master Builder's grand
// works, undermined city walls, and a ring under units stationed in a city. The map parts are drawn into the map
// picture, so they show on the resting (photographed) map too. All the art is original and procedural.
import { TRIBES } from '../data/tribes';
import { unitVisibleTo } from '../game/mech';
import { cityById } from '../game/rules';
import { isSapperFort, isUpgraded, postedCity, undermined } from '../game/roles';
import type { GameState, Tile, TribeId, Unit, UnitKind } from '../game/types';
import { LAND_DEPTH, TH, tileCenter, WATER_DROP } from './camera';
import { HH, HW } from './common';
import { box, drawStar, ellipse, line, poly, rand, roof, shade, softShadow, type Ctx } from './prims';
import { figure } from './units';

const GOLD = '#f0c43a';
const WOOD = '#7a5230';
const DWOOD = '#5a3a22';
const ROPE = '#c9b27a';
const SAIL = '#efe6d0';
const DARK = '#1b1b1f';
const STEEL = '#bcc3cc';

// ---------------------------------------------------------------- looks

/** A Recruiter's standard: what it holds aloft to call men to arms. */
type Standard = 'vexillum' | 'tugh' | 'shield' | 'feathers' | 'sashimono' | 'eagle' | 'crescent' | 'coupstaff';
const RECRUITER: Partial<Record<TribeId, { standard: Standard; plume: string[] }>> = {
  rome: { standard: 'vexillum', plume: ['#c8372d'] },
  mongols: { standard: 'tugh', plume: ['#f4efe0', '#1a1a1e'] },
  zulu: { standard: 'shield', plume: ['#1a1a1e', '#f4efe0'] },
  aztec: { standard: 'feathers', plume: ['#1faa6b', '#2fd08a', '#e8c21a'] },
  japan: { standard: 'sashimono', plume: ['#1a1a1e'] },
  persia: { standard: 'eagle', plume: ['#3fa9c9'] },
  ottoman: { standard: 'crescent', plume: ['#f4efe0'] },
  lakota: { standard: 'coupstaff', plume: ['#f4efe0', '#1a1a1e'] },
};
/** Sappers' digging tool and what they haul. */
type Tool = 'dolabra' | 'spade' | 'stick' | 'hoe' | 'pick';
type Haul = 'turf' | 'wicker' | 'stakes' | 'reeds' | 'planks' | 'basket' | 'keg' | 'poles';
const SAPPER: Partial<Record<TribeId, { tool: Tool; haul: Haul }>> = {
  rome: { tool: 'dolabra', haul: 'turf' },
  mongols: { tool: 'spade', haul: 'wicker' },
  zulu: { tool: 'stick', haul: 'stakes' },
  aztec: { tool: 'stick', haul: 'reeds' },
  japan: { tool: 'hoe', haul: 'planks' },
  persia: { tool: 'spade', haul: 'basket' },
  ottoman: { tool: 'pick', haul: 'keg' },
  lakota: { tool: 'pick', haul: 'poles' },
};
/** A Master Builder's tool and the stone (or brick, or timber) it carries. */
type BTool = 'mallet' | 'trowel' | 'rod' | 'plumb' | 'chisel' | 'adze' | 'hammerstone';
const BUILDER: Partial<Record<TribeId, { tool: BTool; stone: string; timber?: boolean }>> = {
  egypt: { tool: 'mallet', stone: '#e6d3a0' },
  mali: { tool: 'trowel', stone: '#a8683a' },
  china: { tool: 'rod', stone: '#b8402e' },
  india: { tool: 'plumb', stone: '#c9785a' },
  maya: { tool: 'chisel', stone: '#dcd3b8' },
  inca: { tool: 'hammerstone', stone: '#9a9aa2' },
  tibet: { tool: 'adze', stone: '#8a5a33', timber: true },
  celts: { tool: 'adze', stone: '#7a5230', timber: true },
  aboriginal: { tool: 'hammerstone', stone: '#4a4a52' },
  khmer: { tool: 'chisel', stone: '#b89a6a' },
  ethiopia: { tool: 'chisel', stone: '#8a8074' },
};
/** A Tax Collector's record of what is owed, and the bag it fills. */
type Rec = 'scroll' | 'ledger' | 'quipu' | 'leaves' | 'codex' | 'tally' | 'stick' | 'pecha';
const COLLECTOR: Partial<Record<TribeId, { record: Rec; bag: string; hat?: string }>> = {
  egypt: { record: 'scroll', bag: '#e8d6a8' },
  mali: { record: 'ledger', bag: '#e8c21a' },
  china: { record: 'scroll', bag: '#c8372d', hat: '#1a1a1e' },
  india: { record: 'leaves', bag: '#2fb5a8' },
  maya: { record: 'codex', bag: '#c98a3a' },
  inca: { record: 'quipu', bag: '#b3302a' },
  tibet: { record: 'pecha', bag: '#8c1f3a' },
  celts: { record: 'tally', bag: '#3f7a3a' },
  aboriginal: { record: 'stick', bag: '#9a6238' },
  khmer: { record: 'leaves', bag: '#c8372d' },
  ethiopia: { record: 'ledger', bag: '#2f9a4a' },
};
/** A hull and its rig: the boats of the seafaring peoples. */
type Rig = 'crab' | 'gaff' | 'square' | 'lateen' | 'junk' | 'none' | 'brig';
interface Boat { hull: string; rig: Rig; sail?: string; stripe?: string; outrigger?: boolean; oars?: boolean; kayak?: boolean; eye?: boolean }
const FLEET: Partial<Record<TribeId, { fish: Boat; voyage: Boat }>> = {
  polynesia: { fish: { hull: '#2a1a12', rig: 'crab', sail: '#d9c7a0', outrigger: true }, voyage: { hull: '#2a1a12', rig: 'crab', sail: '#d9c7a0', stripe: '#b3302a' } },
  pirates: { fish: { hull: '#3a3a42', rig: 'gaff', sail: '#e2dac6' }, voyage: { hull: '#2a2a30', rig: 'brig', sail: '#ece6d6', stripe: DARK } },
  vikings: { fish: { hull: '#6b4424', rig: 'none', oars: true }, voyage: { hull: '#6b4424', rig: 'square', sail: '#b3302a', stripe: SAIL } },
  swahili: { fish: { hull: '#8a5a33', rig: 'lateen', sail: SAIL, outrigger: true }, voyage: { hull: '#7a4a2a', rig: 'square', sail: '#c9b27a' } },
  inuit: { fish: { hull: '#c9b48a', rig: 'none', kayak: true }, voyage: { hull: '#c9b48a', rig: 'square', sail: '#e8dcc0', oars: true } },
  greeks: { fish: { hull: '#5a6a8a', rig: 'lateen', sail: SAIL }, voyage: { hull: '#2a2a34', rig: 'square', sail: SAIL, oars: true, eye: true, stripe: '#b3302a' } },
  korea: { fish: { hull: '#6b3a22', rig: 'junk', sail: '#e8dcc4' }, voyage: { hull: '#5a3a22', rig: 'junk', sail: '#e8dcc4', stripe: '#c8372d' } },
};

// ---------------------------------------------------------------- people

const walker = (ctx: Ctx, kind: UnitKind, tribe: TribeId, x: number, y: number, k = 0.92) => figure(ctx, kind, tribe, x, y, k);

function pennon(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  poly(ctx, [x, y, x + w, y + h * 0.3, x + w * 0.75, y + h * 0.5, x + w, y + h * 0.7, x, y + h], color);
  poly(ctx, [x, y + h * 0.5, x + w * 0.75, y + h * 0.5, x + w, y + h * 0.7, x, y + h], shade(color, -0.2));
}

/** The Recruiter: a warlord in the empire's dress with its standard held high and a plume on the head. */
function drawRecruiter(ctx: Ctx, tribe: TribeId, x: number, y: number) {
  const look = RECRUITER[tribe] ?? { standard: 'vexillum' as Standard, plume: [GOLD] };
  const T = TRIBES[tribe];
  // a short cape in the empire's colour
  poly(ctx, [x - 3, y - 13, x + 2, y - 13, x - 1, y + 1, x - 8, y + 1.5], shade(T.color, -0.25));
  const b = walker(ctx, 'defender', tribe, x, y, 1);
  const px = b.hand.x + 1, top = y - 36;
  line(ctx, px, b.hand.y + 6, px, top, DWOOD, 1.3); // the staff
  switch (look.standard) {
    case 'vexillum': // a square red cloth on a crossbar, fringed in gold, an eagle-less finial
      line(ctx, px - 5, top + 3, px + 5, top + 3, DWOOD, 1);
      poly(ctx, [px - 5, top + 3, px + 5, top + 3, px + 5, top + 12, px - 5, top + 12], '#b3302a');
      line(ctx, px - 5, top + 12.5, px + 5, top + 12.5, GOLD, 1);
      drawStar(ctx, px, top + 7.5, 2.2, GOLD);
      ellipse(ctx, px, top, 1.4, 1.4, GOLD);
      break;
    case 'tugh': // horse-tail tassels hanging from a trident finial
    case 'crescent': {
      const hair = look.standard === 'tugh' ? ['#f4efe0', '#d9d2c0', '#1a1a1e'] : ['#b3302a', '#8c1f1f', '#b3302a'];
      for (let i = 0; i < 3; i++) poly(ctx, [px - 1.2, top + 5, px + 1.2, top + 5, px + (i - 1) * 2.4 + 1, top + 16, px + (i - 1) * 2.4 - 1, top + 16], hair[i]);
      ellipse(ctx, px, top + 4.6, 2, 1.1, GOLD);
      if (look.standard === 'crescent') { ellipse(ctx, px, top, 2.6, 2.6, GOLD); ellipse(ctx, px + 1, top - 0.6, 2.1, 2.1, '#8fc8f0'); }
      else for (const dx of [-2, 0, 2]) line(ctx, px + dx, top + 3.5, px + dx, top - (dx ? 1 : 2.5), STEEL, 0.8);
      break;
    }
    case 'shield': // a tall cowhide shield hung on the staff as a rallying mark
      ellipse(ctx, px + 1, top + 10, 3.6, 7.4, '#f4efe0');
      for (const [dx, dy] of [[0, 6], [1.5, 11], [-1, 13]] as const) ellipse(ctx, px + 1 + dx, top + dy, 1.3, 1.8, '#1a1a1e');
      line(ctx, px + 1, top + 2, px + 1, top + 18, DWOOD, 1);
      break;
    case 'feathers': // a back-banner of quetzal feathers fanned on a frame
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.22;
        line(ctx, px, top + 8, px + Math.cos(a) * 11, top + 8 + Math.sin(a) * 11, look.plume[i % look.plume.length], 1.6);
      }
      ellipse(ctx, px, top + 8, 2.4, 2.4, GOLD);
      break;
    case 'sashimono': // a tall narrow banner with the clan's mon
      poly(ctx, [px, top, px + 6, top, px + 6, top + 18, px, top + 18], '#f4efe0');
      ellipse(ctx, px + 3, top + 7, 2.2, 2.2, T.color);
      line(ctx, px, top, px + 6, top, DARK, 0.8);
      break;
    case 'eagle': // a gold eagle with spread wings atop the staff, and a small square banner below
      poly(ctx, [px - 6, top + 1, px, top + 3, px + 6, top + 1, px + 3, top + 4.5, px, top + 5.5, px - 3, top + 4.5], GOLD);
      ellipse(ctx, px, top + 1, 1.3, 1.5, shade(GOLD, -0.2));
      pennon(ctx, px, top + 7, 7, 7, '#3fa9c9');
      break;
    case 'coupstaff': // a crook-topped lance hung with eagle feathers
      ctx.strokeStyle = DWOOD; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.arc(px + 3, top, 3, Math.PI, 0); ctx.stroke();
      for (let i = 0; i < 5; i++) {
        const fy = top + 3 + i * 2.8;
        poly(ctx, [px, fy, px + 1.2, fy, px + 0.8, fy + 4, px - 0.2, fy + 4], '#f4efe0');
        poly(ctx, [px - 0.2, fy + 3, px + 0.8, fy + 3, px + 0.8, fy + 4, px - 0.2, fy + 4], '#1a1a1e');
      }
      break;
  }
  // the warlord's plume
  for (let i = 0; i < look.plume.length + 1; i++) line(ctx, x - 0.5, b.top + 1, x - 3 - i * 1.4, b.top - 5 + i, look.plume[i % look.plume.length], 1.4);
}

/** The Sappers: an engineer with a digging tool in hand and a load for the works on the back. */
function drawSapper(ctx: Ctx, tribe: TribeId, x: number, y: number) {
  const look = SAPPER[tribe] ?? { tool: 'spade' as Tool, haul: 'basket' as Haul };
  const bx = x - 6, by = y - 8;
  switch (look.haul) { // what they haul, on the back
    case 'turf': for (let i = 0; i < 3; i++) box(ctx, bx, by - i * 2.6, 5, 2.4, i % 2 ? '#6b8a3a' : '#7a5a34'); break;
    case 'wicker': case 'basket': {
      ellipse(ctx, bx, by - 2, 3.6, 5, '#b8945a');
      for (let i = -3; i <= 3; i += 1.5) line(ctx, bx - 3, by - 2 + i, bx + 3, by - 2 + i, '#8a6a3a', 0.5);
      if (look.haul === 'basket') ellipse(ctx, bx, by - 6.6, 3.2, 1.2, '#6a4a2a');
      break;
    }
    case 'stakes': case 'poles': for (let i = 0; i < 3; i++) line(ctx, bx - 2 + i * 1.5, by + 3, bx - 4 + i * 1.5, by - 13, look.haul === 'stakes' ? '#a07845' : '#c9a06a', 1.1); break;
    case 'reeds': for (let i = 0; i < 5; i++) line(ctx, bx - 2 + i, by + 3, bx - 5 + i * 1.2, by - 12, '#b8b060', 0.8); line(ctx, bx - 3, by - 3, bx + 2, by - 3, ROPE, 1); break;
    case 'planks': for (let i = 0; i < 2; i++) poly(ctx, [bx - 3 + i * 2, by + 3, bx - 1 + i * 2, by + 3, bx - 3 + i * 2, by - 13, bx - 5 + i * 2, by - 13], i ? '#c9a06a' : '#a07845'); break;
    case 'keg': ellipse(ctx, bx, by - 2, 3.4, 4.6, '#6b4424'); for (const dy of [-5, -2, 1]) line(ctx, bx - 3.2, by + dy, bx + 3.2, by + dy, '#3a3a40', 0.7); break;
  }
  const b = walker(ctx, 'explorer', tribe, x, y, 0.95);
  const hx = b.hand.x, hy = b.hand.y;
  line(ctx, hx - 2, hy + 7, hx + 3, hy - 11, WOOD, 1.2); // the haft
  const tx = hx + 3, ty = hy - 11;
  switch (look.tool) {
    case 'dolabra': poly(ctx, [tx - 4, ty + 1, tx + 4, ty - 1, tx + 4.5, ty + 0.5, tx - 3.5, ty + 2.5], STEEL); poly(ctx, [tx + 4, ty - 1, tx + 5, ty + 3, tx + 3.6, ty + 1], STEEL); break;
    case 'pick': poly(ctx, [tx - 5, ty + 2.5, tx, ty - 0.5, tx + 5, ty + 2.5, tx, ty + 0.8], STEEL); break;
    case 'hoe': poly(ctx, [tx - 1, ty, tx + 4, ty + 1, tx + 4, ty + 4, tx - 1, ty + 2], STEEL); break;
    case 'spade': poly(ctx, [hx - 3.4, hy + 7, hx - 0.6, hy + 7.5, hx - 1.2, hy + 11, hx - 3.4, hy + 10.5], STEEL); line(ctx, tx - 1.5, ty, tx + 1.5, ty, WOOD, 1.2); break;
    case 'stick': poly(ctx, [hx - 2, hy + 7, hx - 2.8, hy + 10.5, hx - 1.2, hy + 7.2], '#c9a06a'); ellipse(ctx, tx, ty, 1.4, 1.4, '#4a4a52'); break;
  }
}

/** The Master Builder: a mason or wright with the tool of the trade and a block of the empire's stone (or a beam). */
function drawBuilder(ctx: Ctx, tribe: TribeId, x: number, y: number) {
  const look = BUILDER[tribe] ?? { tool: 'mallet' as BTool, stone: '#c9c0a8' };
  // the stone block (or timber) set down beside the builder
  if (look.timber) { box(ctx, x + 8, y + 2, 4, 2.4, look.stone); box(ctx, x + 10, y + 0.5, 4, 2.4, shade(look.stone, 0.15)); }
  else box(ctx, x + 8.5, y + 2, 6, 4.4, look.stone);
  line(ctx, x + 6, y - 1.2, x + 11, y + 1.2, shade(look.stone, -0.3), 0.5); // a scribed line on it
  const b = walker(ctx, 'explorer', tribe, x - 1, y, 0.95);
  const hx = b.hand.x, hy = b.hand.y;
  switch (look.tool) {
    case 'mallet': line(ctx, hx, hy + 1, hx + 3, hy - 7, WOOD, 1.1); box(ctx, hx + 3.4, hy - 7, 3.4, 3, '#a07845'); break;
    case 'trowel': line(ctx, hx, hy, hx + 2, hy - 4, WOOD, 1.2); poly(ctx, [hx + 1, hy - 4, hx + 6, hy - 5, hx + 3.4, hy - 9], STEEL); break;
    case 'rod': line(ctx, hx - 1, hy + 9, hx + 2, hy - 13, '#c8372d', 1.2); for (let i = 0; i < 5; i++) line(ctx, hx - 0.6 + i * 0.55, hy + 5 - i * 4.4, hx + 1.4 + i * 0.55, hy + 5 - i * 4.4, GOLD, 0.6); break;
    case 'plumb': line(ctx, hx + 2, hy - 6, hx + 2, hy + 4, ROPE, 0.6); poly(ctx, [hx + 0.8, hy + 4, hx + 3.2, hy + 4, hx + 2, hy + 7], '#c9974a'); line(ctx, hx, hy - 6, hx + 4, hy - 6, WOOD, 1.2); break;
    case 'chisel': line(ctx, hx, hy, hx + 3, hy - 5, STEEL, 1); ellipse(ctx, hx - 1.4, hy + 2, 1.6, 1.2, '#8a8074'); break;
    case 'adze': line(ctx, hx, hy + 1, hx + 2, hy - 8, WOOD, 1.2); poly(ctx, [hx + 2, hy - 8, hx + 6, hy - 7, hx + 5.5, hy - 5.5, hx + 1.8, hy - 6.6], STEEL); break;
    case 'hammerstone': ellipse(ctx, hx + 1, hy - 1, 2.4, 2, '#8a8a92'); ellipse(ctx, hx + 0.4, hy - 1.6, 1, 0.7, '#b8b8c0'); break;
  }
  // a knotted cord of measure at the belt
  line(ctx, x - 3, y - 6, x - 5, y - 1, ROPE, 0.7);
  ellipse(ctx, x - 5, y - 1, 0.9, 0.9, ROPE);
}

/** The Tax Collector: an official with a record of dues in hand and a heavy bag at the hip. */
function drawCollector(ctx: Ctx, tribe: TribeId, x: number, y: number) {
  const look = COLLECTOR[tribe] ?? { record: 'ledger' as Rec, bag: GOLD };
  // the bag of dues set down beside the collector, coins spilling at its mouth
  ellipse(ctx, x + 7.5, y - 1.5, 3.6, 3.8, look.bag);
  ellipse(ctx, x + 7.5, y - 5, 2, 0.9, shade(look.bag, -0.35));
  for (const [dx, dy] of [[4.6, 1.8], [6.4, 2.6], [9.6, 2]] as const) ellipse(ctx, x + dx, y + dy, 1.1, 0.6, GOLD);
  const b = walker(ctx, 'explorer', tribe, x - 1, y, 0.9);
  const hx = b.hand.x, hy = b.hand.y;
  switch (look.record) {
    case 'scroll': poly(ctx, [hx - 1, hy - 5, hx + 4, hy - 5.8, hx + 4, hy - 0.8, hx - 1, hy], '#f4ead0'); ellipse(ctx, hx - 1, hy - 2.5, 0.9, 2.6, '#c9b27a'); ellipse(ctx, hx + 4, hy - 3.3, 0.9, 2.6, '#c9b27a'); break;
    case 'ledger': box(ctx, hx + 1.5, hy, 5, 2, '#6b3a22', '#f4ead0'); break;
    case 'codex': for (let i = 0; i < 3; i++) poly(ctx, [hx - 1 + i * 2, hy - 5, hx + 1 + i * 2, hy - 5.5, hx + 1 + i * 2, hy, hx - 1 + i * 2, hy + 0.5], i % 2 ? '#e8dcc0' : '#f4efe0'); line(ctx, hx - 0.5, hy - 3, hx + 4.5, hy - 3.4, '#b8402e', 0.6); break;
    case 'quipu': line(ctx, hx - 2, hy - 3, hx + 5, hy - 3.5, '#b3302a', 1); for (let i = 0; i < 5; i++) { line(ctx, hx - 1 + i * 1.4, hy - 3.2, hx - 1 + i * 1.4, hy + 2 + (i % 2), ['#e8c21a', '#1f8a82', '#f4efe0', '#b3302a', '#3a2a1a'][i], 0.6); ellipse(ctx, hx - 1 + i * 1.4, hy - 0.5 + (i % 2), 0.6, 0.6, DARK); } break;
    case 'leaves': case 'pecha': poly(ctx, [hx - 2, hy - 3, hx + 5, hy - 4, hx + 5, hy - 1.6, hx - 2, hy - 0.6], look.record === 'pecha' ? '#e8c21a' : '#c9b27a'); line(ctx, hx - 2, hy - 1.8, hx + 5, hy - 2.8, DWOOD, 0.4); break;
    case 'tally': case 'stick': line(ctx, hx - 1, hy + 1, hx + 4, hy - 6, '#a07845', 1.4); for (let i = 1; i < 5; i++) line(ctx, hx - 1 + i, hy + 1 - i * 1.4, hx - 0.2 + i, hy + 1.2 - i * 1.4, look.record === 'stick' ? '#f4efe0' : DWOOD, 0.5); break;
  }
  if (look.hat) { box(ctx, x - 1, b.top + 1.2, 6, 2.2, look.hat); line(ctx, x - 5, b.top + 0.8, x + 3, b.top + 0.8, look.hat, 0.9); }
}

// ---------------------------------------------------------------- boats

function hull(ctx: Ctx, x: number, y: number, w: number, h: number, color: string, bow = 4, stern = 3) {
  poly(ctx, [x - w, y - h - stern, x + w, y - h - bow, x + w - 5, y + 3, x - w + 4, y + 3], color);
  poly(ctx, [x - w, y - h - stern, x + w, y - h - bow, x + w - 1, y - h - bow + 2, x - w + 1, y - h - stern + 2], shade(color, 0.2));
}
function wake(ctx: Ctx, x: number, y: number, w: number) {
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y + 3.4, w * 0.8, 2.2, 0, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.stroke();
}
const mast = (ctx: Ctx, x0: number, y0: number, x1: number, y1: number) => line(ctx, x0, y0, x1, y1, DWOOD, 1.2);

/** A rig on a mast at `mx`, reaching up to `top` (y) from the deck at `deck`. */
function rig(ctx: Ctx, b: Boat, mx: number, deck: number, top: number, w: number) {
  const sail = b.sail ?? SAIL;
  switch (b.rig) {
    case 'crab':
      mast(ctx, mx, deck, mx, top + 4);
      poly(ctx, [mx, deck - 2, mx - w, top, mx - w * 0.4, top + 3, mx + w * 0.9, top - 3, mx + w * 0.5, deck - 12], sail);
      line(ctx, mx, deck - 2, mx - w, top, DWOOD, 0.8); line(ctx, mx, deck - 2, mx + w * 0.9, top - 3, DWOOD, 0.8);
      if (b.stripe) line(ctx, mx - w * 0.5, top + 6, mx + w * 0.45, top + 1, b.stripe, 1.2);
      break;
    case 'gaff':
      mast(ctx, mx, deck, mx, top);
      poly(ctx, [mx - 1, top + 2, mx - w, top + 5, mx - w, deck - 3, mx - 1, deck - 3], sail);
      poly(ctx, [mx + 1, top + 2, mx + w, deck - 3, mx + 1, deck - 3], shade(sail, 0.05));
      break;
    case 'square':
      mast(ctx, mx, deck, mx, top);
      poly(ctx, [mx - w, top + 2, mx + w, top + 2, mx + w + 1, deck - 5, mx - w - 1, deck - 5], sail);
      if (b.stripe) for (let i = 0; i < 4; i++) if (i % 2) poly(ctx, [mx - w + i * w / 2, top + 2, mx - w + (i + 1) * w / 2, top + 2, mx - w + (i + 1) * w / 2 + 0.3, deck - 5, mx - w + i * w / 2 + 0.3, deck - 5], b.stripe);
      break;
    case 'lateen':
      mast(ctx, mx, deck, mx + 1, top + 4);
      poly(ctx, [mx - w, deck - 7, mx + w * 0.9, top, mx + 3, deck - 3], sail);
      line(ctx, mx - w, deck - 7, mx + w * 0.9, top, DWOOD, 0.9);
      break;
    case 'junk':
      mast(ctx, mx, deck, mx, top);
      poly(ctx, [mx - w, top + 2, mx + w * 0.4, top + 1, mx + w * 0.6, deck - 4, mx - w - 1, deck - 4], sail);
      for (let i = 1; i < 5; i++) line(ctx, mx - w - 0.2 * i, top + 2 + ((deck - 6 - top) * i) / 5, mx + w * 0.45, top + 1 + ((deck - 5 - top) * i) / 5, DWOOD, 0.6);
      if (b.stripe) line(ctx, mx - w, top + 2, mx + w * 0.4, top + 1, b.stripe, 1.2);
      break;
    case 'brig':
      for (const [dx, h] of [[-5, 1], [6, 0.8]] as const) {
        mast(ctx, mx + dx, deck, mx + dx, top + (1 - h) * 20);
        for (const t of [0, 1]) poly(ctx, [mx + dx - w * 0.5 * h, top + (1 - h) * 20 + 2 + t * 9, mx + dx + w * 0.5 * h, top + (1 - h) * 20 + 2 + t * 9, mx + dx + w * 0.55 * h, top + (1 - h) * 20 + 9 + t * 9, mx + dx - w * 0.55 * h, top + (1 - h) * 20 + 9 + t * 9], sail);
      }
      poly(ctx, [mx - 5, top - 1, mx + 1, top, mx - 5, top + 1.4], b.stripe ?? DARK);
      break;
    case 'none': break;
  }
}

/** A net over the side, cork floats along its edge and a fish or two in the mesh. */
function net(ctx: Ctx, x: number, y: number, w: number) {
  ctx.strokeStyle = 'rgba(230,220,190,0.9)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(x + (i * w) / 4, y - 3); ctx.lineTo(x + (i * w) / 4 - 2, y + 4); ctx.stroke(); }
  for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.moveTo(x - j * 0.6, y - 3 + j * 3.2); ctx.lineTo(x + w - j * 0.6, y - 3 + j * 3.2); ctx.stroke(); }
  for (let i = 0; i <= 3; i++) ellipse(ctx, x + (i * w) / 3 - 2, y + 4, 1, 0.8, '#e8a03a');
  poly(ctx, [x + w * 0.3, y + 1, x + w * 0.3 + 4, y, x + w * 0.3 + 5.6, y + 1.2, x + w * 0.3 + 4, y + 2], '#9ab8c8');
}

function drawBoatLook(ctx: Ctx, b: Boat, tribe: TribeId, x: number, y: number, big: boolean) {
  const T = TRIBES[tribe];
  if (b.kayak) { // a pair of skin kayaks, a hunter in each with a double paddle and a harpoon
    for (const [dx, dy] of [[-5, -2], [5, 2]] as const) {
      hull(ctx, x + dx, y + dy, 11, 0.6, b.hull, 2, 2);
      const f = figure(ctx, 'explorer', tribe, x + dx, y + dy - 2, 0.42, true);
      line(ctx, f.hand.x - 6, f.hand.y + 3, f.hand.x + 5, f.hand.y - 3, '#6b4424', 0.8);
    }
    line(ctx, x - 12, y - 7, x + 2, y - 10, '#e8e0c8', 0.7);
    if (!big) net(ctx, x + 4, y + 5, 8);
    wake(ctx, x, y, 18);
    return;
  }
  const w = big ? 20 : 15;
  if (b.outrigger) { // a float on booms to one side
    line(ctx, x - 5, y - 3, x - 2, y + 5, WOOD, 0.8); line(ctx, x + 5, y - 4, x + 8, y + 4, WOOD, 0.8);
    hull(ctx, x + 3, y + 6, w * 0.55, 0.3, shade(b.hull, 0.15), 1, 1);
  }
  if (big && b.rig === 'crab') hull(ctx, x - 3, y - 3, w * 0.85, 1.4, b.hull, 4, 4); // a second hull: the double canoe
  hull(ctx, x, y, w, big ? 3 : 1.6, b.hull, big ? 6 : 3, big ? 6 : 3);
  if (b.stripe && b.rig !== 'crab') line(ctx, x - w + 2, y - (big ? 7 : 4), x + w - 2, y - (big ? 9 : 5), b.stripe === DARK ? GOLD : b.stripe, 0.7);
  if (b.eye) { ellipse(ctx, x + w - 4, y - 4, 1.2, 1, '#f4efe0'); ellipse(ctx, x + w - 4, y - 4, 0.5, 0.5, DARK); }
  if (b.oars) for (let i = 0; i < (big ? 5 : 3); i++) line(ctx, x - w + 6 + i * 5, y - 2, x - w + 3 + i * 5, y + 6, '#8a6038', 0.8);
  rig(ctx, b, x + (big ? 1 : 0), y - (big ? 5 : 2), y - (big ? 38 : 26), big ? 11 : 8);
  if (!big) { // a fisher hauling the net
    const f = figure(ctx, 'explorer', tribe, x + 8, y - 2, 0.5, true);
    line(ctx, f.hand.x, f.hand.y, x + 12, y + 2, ROPE, 0.6);
    net(ctx, x + 10, y + 4, 9);
  } else { // a lookout at the bow and the navigator's star on a pennant
    figure(ctx, 'explorer', tribe, x + w - 7, y - 5, 0.48, true);
    line(ctx, x - w + 2, y - 8, x - w + 2, y - 22, DWOOD, 0.9);
    pennon(ctx, x - w + 2, y - 22, 8, 5, T.color);
    drawStar(ctx, x - w + 5, y - 19.5, 1.6, GOLD);
  }
  wake(ctx, x, y, w + 2);
}

/** Draws a role unit of `tribe` standing on (x, y) (called from render/units). */
export function drawRoleUnit(ctx: Ctx, kind: UnitKind, tribe: TribeId, x: number, y: number) {
  switch (kind) {
    case 'recruiter': return drawRecruiter(ctx, tribe, x, y);
    case 'sapper': return drawSapper(ctx, tribe, x, y);
    case 'builder': return drawBuilder(ctx, tribe, x, y);
    case 'collector': return drawCollector(ctx, tribe, x, y);
    case 'fishfleet': return drawBoatLook(ctx, FLEET[tribe]?.fish ?? { hull: '#6b4424', rig: 'lateen' }, tribe, x, y, false);
    case 'voyager': return drawBoatLook(ctx, FLEET[tribe]?.voyage ?? { hull: '#6b4424', rig: 'square', stripe: TRIBES[tribe].color }, tribe, x, y, true);
  }
}

// ---------------------------------------------------------------- the map

/** Direction of a bridge deck: along x when there is land along x, else along y. */
function deckAxis(s: GameState, t: Tile): 'x' | 'y' {
  const land = (dx: number, dy: number) => { const n = s.tiles[(t.y + dy) * s.size + t.x + dx]; return !!n && t.x + dx >= 0 && t.x + dx < s.size && n.terrain !== 'shallow' && n.terrain !== 'ocean'; };
  const xs = +land(-1, 0) + +land(1, 0), ys = +land(0, -1) + +land(0, 1);
  return xs >= ys ? 'x' : 'y';
}

/** The ground of a bridged shallow: the water under it and a plank deck on piles, running from shore to shore. */
export function drawBridgeGround(ctx: Ctx, s: GameState, t: Tile, x: number, y: number) {
  const P = TRIBES[t.biome].palette;
  const top = y + WATER_DROP;
  const col = P.shallow;
  poly(ctx, [x - HW, top + HH, x, top + TH, x, y + TH + LAND_DEPTH, x - HW, y + HH + LAND_DEPTH], shade(col, -0.2));
  poly(ctx, [x + HW, top + HH, x, top + TH, x, y + TH + LAND_DEPTH, x + HW, y + HH + LAND_DEPTH], shade(col, -0.35));
  poly(ctx, [x, top, x + HW, top + HH, x, top + TH, x - HW, top + HH], col);
  const cx = x, cy = y + HH;
  // unit vectors of the deck's run and its width on screen
  const along = deckAxis(s, t) === 'x' ? { x: HW, y: HH } : { x: -HW, y: HH };
  const across = deckAxis(s, t) === 'x' ? { x: -HW, y: HH } : { x: HW, y: HH };
  const hw = 0.22, lift = -3;
  const P4 = (a: number, b: number) => [cx + along.x * a + across.x * b, cy + along.y * a + across.y * b + lift];
  for (const a of [-0.7, -0.2, 0.3, 0.8]) for (const b of [-hw, hw]) { // the piles
    const [px, py] = P4(a, b);
    line(ctx, px, py, px, py + 7, DWOOD, 1.4);
  }
  poly(ctx, [...P4(-1, -hw), ...P4(1, -hw), ...P4(1, hw), ...P4(-1, hw)], '#a07845');
  for (let i = -9; i <= 9; i += 2) { const [a0, b0] = P4(i / 10, -hw), [a1, b1] = P4(i / 10, hw); line(ctx, a0, b0, a1, b1, '#7a5230', 0.6); } // the planks
  for (const b of [-hw, hw]) { // rails
    const [r0x, r0y] = P4(-0.95, b), [r1x, r1y] = P4(0.95, b);
    line(ctx, r0x, r0y - 4, r1x, r1y - 4, '#6b4424', 1);
    for (const a of [-0.95, -0.3, 0.3, 0.95]) { const [px, py] = P4(a, b); line(ctx, px, py, px, py - 4, '#6b4424', 0.9); }
  }
}

/** Scenery the role units leave on a tile: a Sappers' fort, a grand work, an undermined city (called from render/draw). */
export function drawRoleTile(ctx: Ctx, s: GameState, t: Tile, cx: number, cy: number) {
  if (isSapperFort(t)) drawFort(ctx, s, t, cx, cy);
  if (isUpgraded(t)) drawGrandWork(ctx, s, t, cx, cy);
  if (t.cityId !== null) {
    const c = cityById(s, t.cityId);
    if (c && undermined(s, c)) drawUndermined(ctx, t, cx, cy);
  }
}

/** A ring of earth and sharpened stakes around a timber watch platform, flying its builders' colour. */
function drawFort(ctx: Ctx, s: GameState, t: Tile, cx: number, cy: number) {
  const color = TRIBES[s.players[t.data!.sfort as number]?.tribe ?? t.biome].color;
  softShadow(ctx, cx, cy + 6, 20, 9, 0.28);
  ellipse(ctx, cx, cy + 5, 19, 9, '#8a7a5a');
  ellipse(ctx, cx, cy + 4, 15, 6.6, '#a8966e');
  for (let i = 0; i < 14; i++) { // stakes around the bank (the far half first)
    const a = Math.PI + (i / 14) * Math.PI * 2;
    const sx = cx + Math.cos(a) * 17, sy = cy + 4 + Math.sin(a) * 8;
    poly(ctx, [sx - 1.3, sy, sx, sy - 6 - rand(t.seed, i) * 2, sx + 1.3, sy], i % 2 ? '#7a5230' : '#8a6038');
  }
  box(ctx, cx, cy + 2, 8, 9, '#8a6038'); // the watch platform
  roof(ctx, cx, cy - 7, 10, 4, shade('#6b4424', 0.1));
  line(ctx, cx + 3, cy - 8, cx + 3, cy - 20, DWOOD, 1);
  pennon(ctx, cx + 3, cy - 20, 7, 5, color);
}

/** The grand works: an Estate's manor, a Deep Mine's headframe, a Harbour's crane and beacon, a Bazaar's domed hall. */
function drawGrandWork(ctx: Ctx, s: GameState, t: Tile, cx: number, cy: number) {
  const owner = t.owner !== null ? cityById(s, t.owner)?.owner : undefined;
  const color = TRIBES[owner !== undefined ? s.players[owner].tribe : t.biome].color;
  switch (t.improvement) {
    case 'farm': // a manor house with a granary at the corner of the fields
      box(ctx, cx - 12, cy + 1, 10, 7, '#e8dcc0');
      roof(ctx, cx - 12, cy - 6, 12, 6, color);
      box(ctx, cx - 3, cy + 5, 5, 6, '#c9a06a');
      roof(ctx, cx - 3, cy - 1, 6, 4, '#8a6038');
      break;
    case 'mine': { // a timber headframe with its winding wheel
      for (const dx of [-5, 5]) line(ctx, cx + 10 + dx, cy + 6, cx + 10, cy - 16, '#6b4424', 1.4);
      line(ctx, cx + 6, cy - 4, cx + 14, cy - 4, '#6b4424', 1);
      ctx.strokeStyle = '#3a3a40'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(cx + 10, cy - 16, 3.6, 3.6, 0, 0, Math.PI * 2); ctx.stroke();
      line(ctx, cx + 10, cy - 16, cx + 10, cy + 2, '#3a3a40', 0.6);
      box(ctx, cx - 11, cy + 6, 5, 3, '#4a4a52'); // an ore cart
      break;
    }
    case 'port': { // a long stone quay, a cargo crane and a harbour light
      const d = WATER_DROP;
      box(ctx, cx + 10, cy + d + 2, 8, 3, '#9a9aa2');
      box(ctx, cx + 14, cy + d - 1, 4, 12, '#e8e0cc');
      poly(ctx, [cx + 12, cy + d - 13, cx + 16, cy + d - 13, cx + 14, cy + d - 17], color);
      ellipse(ctx, cx + 14, cy + d - 11, 1.6, 1.4, '#ffe08a');
      line(ctx, cx - 8, cy + d + 4, cx - 8, cy + d - 14, '#6b4424', 1.3);
      line(ctx, cx - 8, cy + d - 14, cx + 2, cy + d - 10, '#6b4424', 1.1);
      line(ctx, cx + 1, cy + d - 10, cx + 1, cy + d - 3, ROPE, 0.6);
      box(ctx, cx + 1, cy + d - 1, 3, 2.4, '#a07845');
      break;
    }
    case 'market': // a domed hall behind the stalls, with a pennant
      box(ctx, cx, cy - 2, 14, 7, '#e8dcc0');
      ctx.fillStyle = shade(color, 0.1);
      ctx.beginPath(); ctx.ellipse(cx, cy - 9, 6, 6, 0, Math.PI, 0); ctx.fill();
      line(ctx, cx, cy - 15, cx, cy - 21, DWOOD, 0.9);
      pennon(ctx, cx, cy - 21, 5, 3.4, GOLD);
      break;
  }
}

/** An undermined city: a caved-in breach with fallen stones and dust. */
function drawUndermined(ctx: Ctx, t: Tile, cx: number, cy: number) {
  ellipse(ctx, cx + 9, cy + 10, 7, 3, 'rgba(40,28,18,0.55)');
  for (let i = 0; i < 6; i++) box(ctx, cx + 4 + rand(t.seed, 40 + i) * 12, cy + 8 + rand(t.seed, 50 + i) * 5, 2.4, 1.6, '#9a9aa2');
  for (let i = 0; i < 3; i++) ellipse(ctx, cx + 6 + i * 4, cy + 3 - i * 1.5, 4 - i * 0.6, 2.6 - i * 0.4, `rgba(200,180,150,${0.45 - i * 0.1})`);
  line(ctx, cx + 3, cy + 8, cx + 8, cy + 4, '#3a2a1a', 0.8);
  line(ctx, cx + 8, cy + 4, cx + 7, cy + 1, '#3a2a1a', 0.7);
}

/** Under the units: a ring in the empire's colour beneath a Recruiter or Tax Collector stationed in a city. */
export function drawRoleGround(ctx: Ctx, s: GameState, viewer: number) {
  for (const u of s.units) {
    if (u.kind !== 'recruiter' && u.kind !== 'collector') continue;
    if (viewer >= 0 && (!s.players[viewer].explored[u.y * s.size + u.x] || !unitVisibleTo(s, viewer, u))) continue;
    if (!postedCity(s, u)) continue;
    stationRing(ctx, s, u);
  }
}
function stationRing(ctx: Ctx, s: GameState, u: Unit) {
  const c = tileCenter(u.x, u.y);
  const color = TRIBES[s.players[u.owner].tribe].color;
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = shade(color, 0.25);
  ctx.beginPath();
  ctx.ellipse(c.x, c.y + 3, 17, 8.5, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(c.x, c.y + 3, 20, 10, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  // a small badge at the front of the ring: a banner for the recruiter, a coin for the collector
  const bx = c.x + 14, by = c.y + 9;
  ellipse(ctx, bx, by, 4.2, 4.2, DARK);
  if (u.kind === 'collector') { ellipse(ctx, bx, by, 3.2, 3.2, GOLD); drawStar(ctx, bx, by, 2, '#fff2b0'); }
  else { line(ctx, bx - 1.5, by + 3, bx - 1.5, by - 3, '#e8dcc0', 0.8); poly(ctx, [bx - 1.5, by - 3, bx + 2.8, by - 2, bx - 1.5, by], color); }
}

/** Menu icons for the role actions (`role:banner`, `role:coins`, `role:fort`, ...). Returns false for other icons. */
export function drawRoleIcon(ctx: Ctx, icon: string, tribe: TribeId, x: number, y: number): boolean {
  const T = TRIBES[tribe];
  switch (icon) {
    case 'role:banner':
      line(ctx, x - 4, y + 14, x - 4, y - 14, DWOOD, 2);
      poly(ctx, [x - 4, y - 13, x + 10, y - 10, x + 6, y - 5, x + 10, y, x - 4, y - 2], T.color);
      ellipse(ctx, x - 4, y - 15, 2, 2, GOLD);
      return true;
    case 'role:coins':
      for (const [dx, dy] of [[-6, 8], [4, 9], [-1, 3], [7, 2], [1, -3]] as const) { ellipse(ctx, x + dx, y + dy + 1, 5.6, 2.8, '#a8740a'); ellipse(ctx, x + dx, y + dy, 5.6, 2.8, GOLD); }
      drawStar(ctx, x + 1, y - 4, 3, '#fff2b0');
      return true;
    case 'role:fort': {
      ellipse(ctx, x, y + 12, 17, 7, '#8a7a5a');
      for (let i = 0; i < 9; i++) { const sx = x - 14 + i * 3.5; poly(ctx, [sx - 1.4, y + 12, sx, y + 3, sx + 1.4, y + 12], i % 2 ? '#7a5230' : '#8a6038'); }
      box(ctx, x, y + 8, 8, 9, '#8a6038');
      line(ctx, x + 3, y - 1, x + 3, y - 13, DWOOD, 1.2);
      pennon(ctx, x + 3, y - 13, 7, 5, T.color);
      return true;
    }
    case 'role:bridge':
      ellipse(ctx, x, y + 10, 18, 6, '#6fc3de');
      for (const px of [-10, -3, 4, 11]) line(ctx, x + px, y + 5, x + px, y + 12, DWOOD, 1.4);
      poly(ctx, [x - 16, y + 6, x + 16, y + 2, x + 16, y + 6, x - 16, y + 10], '#a07845');
      line(ctx, x - 16, y + 2, x + 16, y - 2, '#6b4424', 1.2);
      return true;
    case 'role:undermine':
      box(ctx, x, y + 4, 22, 10, '#9a9aa2');
      poly(ctx, [x - 3, y + 6, x + 4, y - 4, x + 7, y + 8], '#2a1e14');
      for (let i = 0; i < 4; i++) box(ctx, x - 10 + i * 6, y + 14, 3, 2, '#8a8a92');
      line(ctx, x - 12, y - 6, x - 4, y + 2, STEEL, 1.6);
      return true;
    case 'role:upgrade':
      box(ctx, x - 5, y + 10, 10, 8, '#e8dcc0');
      roof(ctx, x - 5, y + 2, 12, 6, T.color);
      poly(ctx, [x + 8, y - 12, x + 13, y - 4, x + 10, y - 4, x + 10, y + 6, x + 6, y + 6, x + 6, y - 4, x + 3, y - 4], '#3fbf6f');
      return true;
    case 'role:outpost':
      ellipse(ctx, x, y + 11, 18, 6, '#6fc3de');
      poly(ctx, [x - 12, y + 10, x - 4, y + 2, x + 8, y + 3, x + 13, y + 10], '#8fce5a');
      box(ctx, x, y + 5, 7, 5, '#e8dcc0');
      roof(ctx, x, y, 8, 5, T.roof);
      line(ctx, x + 6, y + 3, x + 6, y - 12, DWOOD, 1.1);
      pennon(ctx, x + 6, y - 12, 7, 5, T.color);
      return true;
  }
  return false;
}
