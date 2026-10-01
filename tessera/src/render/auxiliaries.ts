// Drawing side of the auxiliaries (see game/auxiliaries): each empire's Spearman, Scout and Healer, drawn in its own
// style (its people's dress from render/units, and its own spear head, shield, scouting gear, robe and healing tools),
// plus what shows on the map: a soft green ring under every Healer and a small green cross over each wounded unit of
// its empire beside it (the ones it will heal at the start of the next turn). The map parts are drawn into the map
// picture, so they show on the resting (photographed) map too. All the art is original and procedural.
import { TRIBES } from '../data/tribes';
import { convertLeft } from '../game/auxiliaries';
import { isWater } from '../game/grid';
import { unitVisibleTo } from '../game/mech';
import { maxHp } from '../game/rules';
import type { GameState, TribeId, Unit, UnitKind } from '../game/types';
import { tileCenter, WATER_DROP } from './camera';
import { box, ellipse, line, poly, shade, type Ctx } from './prims';
import { figure } from './units';

const GOLD = '#f0c43a';
const WOOD = '#7a5230';
const DWOOD = '#5a3a22';
const STEEL = '#bcc3cc';
const BRONZE = '#c9974a';
const DARK = '#1b1b1f';
const BONE = '#ece2c8';
const OBSIDIAN = '#2a2630';
const HIDE = '#f4efe0';
const GREEN = '#58d27a';

// ---------------------------------------------------------------- looks

/** The spear head: a leaf blade, a broad blade, a long pike point, an obsidian-edged club-spear, a bone point, a barbed
 *  harpoon-lance, a winged boar-spear or a crescent-backed blade. */
type Head = 'leaf' | 'broad' | 'pike' | 'obsidian' | 'bone' | 'barbed' | 'winged' | 'crescent';
/** The shield on the off arm (or none, for a two-handed pike). */
type Shield = 'round' | 'oval' | 'hide' | 'tall' | 'rect' | 'wicker' | 'none';
interface SpearLook { head: Head; metal: string; tassel?: string; shield: Shield; face: string; mark: string; long?: boolean }
const SPEAR: Record<TribeId, SpearLook> = {
  egypt: { head: 'leaf', metal: BRONZE, shield: 'tall', face: '#e8d6a8', mark: '#8a5a33' },
  aztec: { head: 'obsidian', metal: OBSIDIAN, tassel: '#1faa6b', shield: 'round', face: '#efe6d2', mark: '#1faa6b' },
  polynesia: { head: 'bone', metal: BONE, tassel: '#f4efe0', shield: 'none', face: '#2a1a12', mark: '#b3302a' },
  rome: { head: 'leaf', metal: STEEL, shield: 'oval', face: '#b3302a', mark: GOLD },
  pirates: { head: 'pike', metal: STEEL, shield: 'none', face: '#3b3b46', mark: '#f1efe6', long: true },
  vikings: { head: 'winged', metal: STEEL, shield: 'round', face: '#c9a06a', mark: '#b3302a' },
  japan: { head: 'pike', metal: '#dde2e8', tassel: '#c8372d', shield: 'none', face: '#2a2a34', mark: '#c8372d', long: true },
  mongols: { head: 'crescent', metal: STEEL, tassel: '#f4efe0', shield: 'wicker', face: '#b8945a', mark: '#1a1a1e' },
  greeks: { head: 'pike', metal: BRONZE, shield: 'round', face: BRONZE, mark: '#1a1a1e', long: true },
  zulu: { head: 'broad', metal: STEEL, shield: 'hide', face: HIDE, mark: '#1a1a1e' },
  persia: { head: 'leaf', metal: STEEL, tassel: '#e8c21a', shield: 'wicker', face: '#c9a06a', mark: '#3fa9c9' },
  celts: { head: 'broad', metal: STEEL, shield: 'oval', face: '#3f7a3a', mark: '#e8c21a' },
  inuit: { head: 'bone', metal: '#e8e0c8', shield: 'none', face: '#c9b48a', mark: '#5a3e2b' },
  inca: { head: 'leaf', metal: BRONZE, tassel: '#c8372d', shield: 'rect', face: '#c8372d', mark: '#e8c21a' },
  ethiopia: { head: 'leaf', metal: STEEL, shield: 'round', face: '#8a5a36', mark: '#e8c21a' },
  aboriginal: { head: 'barbed', metal: '#c9a06a', shield: 'oval', face: '#b8502e', mark: '#f4efe0' },
  china: { head: 'leaf', metal: STEEL, tassel: '#c8372d', shield: 'rect', face: '#2b3266', mark: '#c8372d' },
  india: { head: 'broad', metal: STEEL, tassel: '#2fb5a8', shield: 'round', face: '#6b3a22', mark: GOLD },
  mali: { head: 'leaf', metal: STEEL, tassel: '#c8372d', shield: 'hide', face: '#d9c7a0', mark: '#6b3a22' },
  lakota: { head: 'leaf', metal: '#9a9aa2', tassel: '#f4efe0', shield: 'round', face: HIDE, mark: '#c8372d' },
  ottoman: { head: 'pike', metal: STEEL, tassel: '#c8372d', shield: 'none', face: '#8c1836', mark: GOLD, long: true },
  maya: { head: 'obsidian', metal: OBSIDIAN, tassel: '#2fb58a', shield: 'round', face: '#e3a53a', mark: '#2a1a12' },
  korea: { head: 'leaf', metal: STEEL, tassel: '#c8372d', shield: 'rect', face: '#c8372d', mark: '#f4efe0' },
  khmer: { head: 'broad', metal: BRONZE, shield: 'oval', face: '#8a5a33', mark: GOLD },
  swahili: { head: 'leaf', metal: STEEL, shield: 'hide', face: '#c9a06a', mark: '#2a7ab8' },
  tibet: { head: 'leaf', metal: STEEL, tassel: '#e8c21a', shield: 'wicker', face: '#8c1f3a', mark: GOLD },
  carthage: { head: 'leaf', metal: BRONZE, tassel: '#5a1e6e', shield: 'round', face: '#5a1e6e', mark: '#e6d6b0' },
  byzantium: { head: 'broad', metal: STEEL, tassel: '#d4a62a', shield: 'oval', face: '#2f7a3a', mark: GOLD },
  arabia: { head: 'leaf', metal: STEEL, tassel: '#f0ead8', shield: 'round', face: '#2a5a10', mark: '#f0ead8' },
  rus: { head: 'winged', metal: STEEL, tassel: '#e0b030', shield: 'tall', face: '#a83228', mark: '#e0b030' },
  vietnam: { head: 'leaf', metal: BRONZE, tassel: '#f08aa8', shield: 'wicker', face: '#b03a2a', mark: '#f2d06a' },
  babylon: { head: 'broad', metal: BRONZE, tassel: '#2a3fd0', shield: 'tall', face: '#2a3fd0', mark: '#e8c060' },
  nubia: { head: 'leaf', metal: STEEL, tassel: '#b07a10', shield: 'hide', face: '#b07a10', mark: '#f4efe0' },
  majapahit: { head: 'crescent', metal: BRONZE, tassel: '#e05010', shield: 'oval', face: '#7a2804', mark: GOLD },
  spain: { head: 'pike', metal: STEEL, tassel: '#f0c43a', shield: 'none', face: '#7a0a14', mark: '#f0c43a', long: true },
  haudenosaunee: { head: 'bone', metal: BONE, tassel: '#4a3a8a', shield: 'hide', face: '#4a3a8a', mark: '#f4efe0' },
};

/** What a Scout carries: a horn, a spyglass, a walking staff, a knotted message cord, a rolled map or a feathered lance. */
type Gear = 'horn' | 'spyglass' | 'staff' | 'cord' | 'map' | 'feather';
/** What it wears on its head: a hood, a cap, a wide hat, a headband with a feather, or nothing. */
type Hat = 'hood' | 'cap' | 'wide' | 'band' | 'none';
interface ScoutLook { gear: Gear; pack: string; hat: Hat; hatC: string }
const SCOUT: Record<TribeId, ScoutLook> = {
  egypt: { gear: 'staff', pack: '#e8d6a8', hat: 'band', hatC: '#2f5fb8' },
  aztec: { gear: 'feather', pack: '#efe6d2', hat: 'band', hatC: '#1faa6b' },
  polynesia: { gear: 'horn', pack: '#c9b27a', hat: 'none', hatC: '#1a1a1e' },
  rome: { gear: 'map', pack: '#8a6038', hat: 'cap', hatC: '#b3302a' },
  pirates: { gear: 'spyglass', pack: '#6b4424', hat: 'wide', hatC: '#2a2a30' },
  vikings: { gear: 'horn', pack: '#6a5238', hat: 'hood', hatC: '#4a6a8a' },
  japan: { gear: 'staff', pack: '#2a2a34', hat: 'hood', hatC: '#1a1a1e' },
  mongols: { gear: 'horn', pack: '#b8945a', hat: 'cap', hatC: '#c8372d' },
  greeks: { gear: 'staff', pack: '#e8dcc0', hat: 'wide', hatC: '#c9a06a' },
  zulu: { gear: 'staff', pack: '#f4efe0', hat: 'band', hatC: '#f4efe0' },
  persia: { gear: 'map', pack: '#c9a06a', hat: 'cap', hatC: '#3fa9c9' },
  celts: { gear: 'horn', pack: '#6b8a3a', hat: 'hood', hatC: '#3f7a3a' },
  inuit: { gear: 'staff', pack: '#c9b48a', hat: 'hood', hatC: '#e8e0c8' },
  inca: { gear: 'cord', pack: '#c8372d', hat: 'cap', hatC: '#e8c21a' },
  ethiopia: { gear: 'staff', pack: '#f3eedd', hat: 'wide', hatC: '#c9a06a' },
  aboriginal: { gear: 'feather', pack: '#9a6238', hat: 'band', hatC: '#f4efe0' },
  china: { gear: 'map', pack: '#dcd3b8', hat: 'wide', hatC: '#c9b27a' },
  india: { gear: 'horn', pack: '#2fb5a8', hat: 'band', hatC: '#e8c21a' },
  mali: { gear: 'staff', pack: '#e8c21a', hat: 'hood', hatC: '#2a4a8a' },
  lakota: { gear: 'feather', pack: '#cdbb94', hat: 'hood', hatC: '#8a8a92' }, // a wolf skin over the head
  ottoman: { gear: 'spyglass', pack: '#8c1836', hat: 'cap', hatC: '#f4efe0' },
  maya: { gear: 'feather', pack: '#c98a3a', hat: 'band', hatC: '#2fb58a' },
  korea: { gear: 'horn', pack: '#efe9d8', hat: 'wide', hatC: '#1a1a1e' },
  khmer: { gear: 'staff', pack: '#c8372d', hat: 'band', hatC: GOLD },
  swahili: { gear: 'map', pack: '#2a7ab8', hat: 'cap', hatC: '#f4efe0' },
  tibet: { gear: 'staff', pack: '#8c1f3a', hat: 'cap', hatC: '#e8c21a' },
  carthage: { gear: 'horn', pack: '#e6d6b0', hat: 'band', hatC: '#5a1e6e' },
  byzantium: { gear: 'map', pack: '#2f7a3a', hat: 'cap', hatC: '#d4a62a' },
  arabia: { gear: 'spyglass', pack: '#d8c4a0', hat: 'wide', hatC: '#f0ead8' },
  rus: { gear: 'horn', pack: '#6a4a30', hat: 'cap', hatC: '#5a3a2a' },
  vietnam: { gear: 'cord', pack: '#c9a45a', hat: 'wide', hatC: '#e8d8a0' },
  babylon: { gear: 'staff', pack: '#d8c4a0', hat: 'band', hatC: '#2a3fd0' },
  nubia: { gear: 'cord', pack: '#c8a070', hat: 'band', hatC: '#b07a10' },
  majapahit: { gear: 'horn', pack: '#c8a070', hat: 'wide', hatC: '#c8a050' },
  spain: { gear: 'spyglass', pack: '#6a4a30', hat: 'wide', hatC: '#1a1a1e' },
  haudenosaunee: { gear: 'feather', pack: '#8a6a4a', hat: 'none', hatC: '#4a3a8a' },
};

/** What a Healer holds: a staff with a snake, a smoking censer, a bowl of medicine, a rattle, a prayer wheel, a scroll
 *  of remedies, a bundle of herbs or a leather bag. */
type Tool = 'serpent' | 'censer' | 'bowl' | 'rattle' | 'wheel' | 'scroll' | 'herbs' | 'bag';
interface HealerLook { tool: Tool; robe: string; trim: string; hood?: boolean }
const HEALER: Record<TribeId, HealerLook> = {
  egypt: { tool: 'bowl', robe: '#f4efe0', trim: '#2f5fb8' },
  aztec: { tool: 'herbs', robe: '#efe6d2', trim: '#1faa6b' },
  polynesia: { tool: 'herbs', robe: '#c9b27a', trim: '#b3302a' },
  rome: { tool: 'bag', robe: '#e8dcc0', trim: '#b3302a' },
  pirates: { tool: 'bag', robe: '#f1efe6', trim: '#3b3b46' },
  vikings: { tool: 'herbs', robe: '#4a6a8a', trim: '#e8dcc0', hood: true },
  japan: { tool: 'rattle', robe: '#e8e0cc', trim: '#8a6a3a', hood: true },
  mongols: { tool: 'rattle', robe: '#3a5a8a', trim: '#e8c21a' },
  greeks: { tool: 'serpent', robe: '#f4f1ea', trim: '#3a5a8a' },
  zulu: { tool: 'herbs', robe: '#a8683a', trim: '#f4efe0' },
  persia: { tool: 'censer', robe: '#f4efe0', trim: '#3fa9c9' },
  celts: { tool: 'herbs', robe: '#f0ece0', trim: '#3f7a3a', hood: true },
  inuit: { tool: 'rattle', robe: '#c9b48a', trim: '#5a3e2b', hood: true },
  inca: { tool: 'bowl', robe: '#c8372d', trim: '#e8c21a' },
  ethiopia: { tool: 'censer', robe: '#f3eedd', trim: '#2f9a4a', hood: true },
  aboriginal: { tool: 'herbs', robe: '#8a4a2a', trim: '#f4efe0' },
  china: { tool: 'scroll', robe: '#dcd3b8', trim: '#2b3266' },
  india: { tool: 'bowl', robe: '#e89a2a', trim: '#f4efe0' },
  mali: { tool: 'scroll', robe: '#f4efe0', trim: '#6b3a22', hood: true },
  lakota: { tool: 'rattle', robe: '#cdbb94', trim: '#c8372d' },
  ottoman: { tool: 'bag', robe: '#1f4f8a', trim: '#f4efe0' },
  maya: { tool: 'censer', robe: '#efe6d2', trim: '#2fb58a' },
  korea: { tool: 'bowl', robe: '#efe9d8', trim: '#c8372d' },
  khmer: { tool: 'censer', robe: '#e89a2a', trim: '#8a3a1a' },
  swahili: { tool: 'herbs', robe: '#f4efe0', trim: '#2a7ab8' },
  tibet: { tool: 'wheel', robe: '#8c1f3a', trim: '#e8c21a' },
  carthage: { tool: 'censer', robe: '#e6d6b0', trim: '#5a1e6e' },
  byzantium: { tool: 'scroll', robe: '#1a3a20', trim: '#d4a62a', hood: true },
  arabia: { tool: 'scroll', robe: '#f0ead8', trim: '#2a5a10' },
  rus: { tool: 'herbs', robe: '#5a3a2a', trim: '#a83228' },
  vietnam: { tool: 'herbs', robe: '#3a3a3a', trim: '#f08aa8' },
  babylon: { tool: 'censer', robe: '#f0e8d0', trim: '#2a3fd0' },
  nubia: { tool: 'herbs', robe: '#f4efe0', trim: '#b07a10' },
  majapahit: { tool: 'herbs', robe: '#2a5a3a', trim: '#e05010' },
  spain: { tool: 'bag', robe: '#1a1a1e', trim: '#f4efe0', hood: true },
  haudenosaunee: { tool: 'rattle', robe: '#6a4a30', trim: '#4a3a8a' },
};

// ---------------------------------------------------------------- people

/** Draws an auxiliary of `kind` for `tribe` standing on (x, y). */
export function drawAuxUnit(ctx: Ctx, kind: UnitKind, tribe: TribeId, x: number, y: number) {
  if (kind === 'spearman') return drawSpearman(ctx, tribe, x, y);
  if (kind === 'scout') return drawScout(ctx, tribe, x, y);
  return drawHealer(ctx, tribe, x, y);
}

/** The Spearman: a foot soldier in the empire's dress, a long spear raised and (mostly) a shield on the other arm. */
function drawSpearman(ctx: Ctx, tribe: TribeId, x: number, y: number) {
  const look = SPEAR[tribe];
  const b = figure(ctx, 'warrior', tribe, x, y, 0.96);
  // the spear, held upright and a little forward: a long pike reaches higher
  const hx = b.hand.x, hy = b.hand.y;
  const top = y - (look.long ? 40 : 34);
  const bx = hx - 1.4, by = hy + 9;
  const tx = hx + 3, ty = top;
  line(ctx, bx, by, tx, ty, shade(WOOD, 0.1), 1.3);
  const ux = (tx - bx) / Math.hypot(tx - bx, ty - by), uy = (ty - by) / Math.hypot(tx - bx, ty - by);
  const nx = -uy, ny = ux;
  const P = (a: number, n: number) => [tx + ux * a + nx * n, ty + uy * a + ny * n];
  switch (look.head) {
    case 'leaf': poly(ctx, [...P(-1, 0), ...P(1.5, 1.8), ...P(6, 0), ...P(1.5, -1.8)], look.metal); break;
    case 'broad': poly(ctx, [...P(-1, 0), ...P(2, 2.5), ...P(7.5, 0), ...P(2, -2.5)], look.metal); line(ctx, ...(P(0, 0) as [number, number]), ...(P(6, 0) as [number, number]), shade(look.metal, -0.3), 0.5); break;
    case 'pike': poly(ctx, [...P(-1, 0.9), ...P(6.5, 0), ...P(-1, -0.9)], look.metal); break;
    case 'obsidian': // a wooden head edged with dark glass blades
      poly(ctx, [...P(-2, 1.2), ...P(6, 0.8), ...P(7.5, 0), ...P(6, -0.8), ...P(-2, -1.2)], '#8a6038');
      for (let i = 0; i < 4; i++) { poly(ctx, [...P(i * 1.8 - 1, 1.1), ...P(i * 1.8, 2.6), ...P(i * 1.8 + 0.8, 1.1)], look.metal); poly(ctx, [...P(i * 1.8 - 1, -1.1), ...P(i * 1.8, -2.6), ...P(i * 1.8 + 0.8, -1.1)], look.metal); }
      break;
    case 'bone': poly(ctx, [...P(-1.5, 0.9), ...P(6.5, 0.3), ...P(7, 0), ...P(6.5, -0.3), ...P(-1.5, -0.9)], look.metal); line(ctx, ...(P(-2, -1) as [number, number]), ...(P(-2, 1) as [number, number]), '#6b4424', 1); break;
    case 'barbed': poly(ctx, [...P(-1, 0.7), ...P(7, 0), ...P(-1, -0.7)], look.metal); for (const a of [1, 3.5]) poly(ctx, [...P(a, 0.5), ...P(a - 2, 2.2), ...P(a - 1, 0.5)], look.metal); break;
    case 'winged': poly(ctx, [...P(-1, 0), ...P(2, 2), ...P(7, 0), ...P(2, -2)], look.metal); line(ctx, ...(P(-1.5, 3) as [number, number]), ...(P(-1.5, -3) as [number, number]), look.metal, 1); break;
    case 'crescent': poly(ctx, [...P(-1, 0), ...P(1.5, 1.6), ...P(6.5, 0), ...P(1.5, -1.6)], look.metal); poly(ctx, [...P(0, -1), ...P(-1, -4), ...P(2.5, -3.2), ...P(1.4, -1.3)], look.metal); break;
  }
  if (look.tassel) for (const d of [-0.9, 0, 0.9]) line(ctx, ...(P(-1.6, d) as [number, number]), ...(P(-4.8, d * 1.8 + 0.6) as [number, number]), look.tassel, 0.7); // a tuft under the head
  // the shield on the off arm
  const ox = b.off.x - 1, oy = b.off.y + 2;
  switch (look.shield) {
    case 'round': ellipse(ctx, ox, oy, 5.4, 6, shade(look.face, -0.2)); ellipse(ctx, ox - 0.4, oy, 5, 5.6, look.face); ellipse(ctx, ox - 0.4, oy, 1.4, 1.5, look.mark); break;
    case 'oval': ellipse(ctx, ox, oy, 4.4, 7.4, shade(look.face, -0.2)); ellipse(ctx, ox - 0.4, oy, 4, 7, look.face); line(ctx, ox - 0.4, oy - 6, ox - 0.4, oy + 6, look.mark, 1); ellipse(ctx, ox - 0.4, oy, 1.4, 1.4, look.mark); break;
    case 'hide': // a tall cowhide shield with dark patches and a stick behind it
      line(ctx, ox, oy - 10, ox, oy + 10, DWOOD, 0.9);
      ellipse(ctx, ox, oy, 4, 8.6, look.face);
      for (const [dx, dy] of [[-1, -3], [1.2, 1.5], [-0.6, 5]] as const) ellipse(ctx, ox + dx, oy + dy, 1.2, 1.7, look.mark);
      break;
    case 'tall': poly(ctx, [ox - 4, oy - 8, ox + 4, oy - 8.6, ox + 4, oy + 6, ox, oy + 8.6, ox - 4, oy + 6], look.face); line(ctx, ox, oy - 8, ox, oy + 8, look.mark, 0.8); break;
    case 'rect': box(ctx, ox, oy + 5, 7, 12, look.face); ellipse(ctx, ox, oy - 1, 1.6, 1.6, look.mark); break;
    case 'wicker': // a woven wicker shield
      poly(ctx, [ox - 3.8, oy - 6.5, ox + 3.8, oy - 7, ox + 3.8, oy + 5.5, ox, oy + 6.6, ox - 3.8, oy + 6], look.face);
      for (let i = -5; i <= 5; i += 1.6) line(ctx, ox - 3.8, oy + i, ox + 3.8, oy + i - 0.3, shade(look.face, -0.25), 0.4);
      line(ctx, ox - 3.8, oy - 6.5, ox + 3.8, oy - 7, look.mark, 1);
      break;
    case 'none': // a pikeman's sash in the empire's colour instead
      line(ctx, x - 3.5, y - 13, x + 3, y - 5, look.mark, 1.2);
      break;
  }
}

/** The Scout: a light walker in plain dress with a pack on the back and the tool of the trail in hand. */
function drawScout(ctx: Ctx, tribe: TribeId, x: number, y: number) {
  const look = SCOUT[tribe];
  // the pack, slung behind, with a rolled blanket on top
  box(ctx, x - 5.5, y - 7, 4.4, 6, look.pack);
  ellipse(ctx, x - 5.5, y - 13.4, 2.6, 1.2, shade(look.pack, -0.25));
  const b = figure(ctx, 'explorer', tribe, x + 0.5, y, 0.9);
  const hx = b.hand.x, hy = b.hand.y;
  switch (look.gear) {
    case 'staff': line(ctx, hx - 1, hy + 10, hx + 1.5, hy - 14, WOOD, 1.2); ellipse(ctx, hx + 1.5, hy - 14, 1, 1, DWOOD); break;
    case 'horn': // a signal horn raised to call the others
      poly(ctx, [hx - 0.5, hy - 1, hx + 5, hy - 5, hx + 7, hy - 3.4, hx + 0.5, hy + 0.5], '#e8dcc0');
      ellipse(ctx, hx + 6.4, hy - 4.4, 1.4, 1.8, shade('#e8dcc0', -0.3));
      break;
    case 'spyglass': line(ctx, hx, hy, hx + 6, hy - 5, '#8a6038', 1.8); line(ctx, hx + 3, hy - 2.5, hx + 7, hy - 5.8, GOLD, 1.3); break;
    case 'cord': line(ctx, hx - 2, hy - 2, hx + 5, hy - 2.5, '#b3302a', 0.9); for (let i = 0; i < 4; i++) line(ctx, hx - 1 + i * 1.8, hy - 2.2, hx - 1 + i * 1.8, hy + 2.5, ['#e8c21a', '#1f8a82', '#f4efe0', '#3a2a1a'][i], 0.6); break;
    case 'map': poly(ctx, [hx - 1, hy - 4, hx + 5, hy - 5, hx + 5, hy, hx - 1, hy + 1], '#efe2c0'); line(ctx, hx, hy - 2.5, hx + 4, hy - 2, '#b3302a', 0.5); ellipse(ctx, hx + 5, hy - 2.5, 0.8, 2.6, '#c9b27a'); break;
    case 'feather': line(ctx, hx - 1, hy + 10, hx + 1.5, hy - 12, WOOD, 1); for (let i = 0; i < 3; i++) poly(ctx, [hx + 1.3 - i * 0.2, hy - 10 + i * 2.4, hx + 4.5, hy - 8 + i * 2.4, hx + 1.2 - i * 0.2, hy - 7.6 + i * 2.4], i % 2 ? '#f4efe0' : '#1a1a1e'); break;
  }
  const hy0 = b.top + 1.2;
  switch (look.hat) {
    case 'hood': poly(ctx, [x - 4, hy0 + 3, x - 3, hy0 - 1.4, x + 1, hy0 - 2.6, x + 4.6, hy0 - 0.6, x + 5, hy0 + 3, x + 3.8, hy0 + 1, x - 2.6, hy0 + 1], look.hatC); break;
    case 'cap': poly(ctx, [x - 3.6, hy0 + 0.6, x - 2.2, hy0 - 2.8, x + 3, hy0 - 3.2, x + 4.4, hy0 + 0.4], look.hatC); break;
    case 'wide': ellipse(ctx, x + 0.5, hy0 + 0.6, 7.4, 2.2, shade(look.hatC, -0.15)); poly(ctx, [x - 2.6, hy0 + 0.4, x - 1.6, hy0 - 3, x + 2.6, hy0 - 3.2, x + 3.6, hy0 + 0.2], look.hatC); break;
    case 'band': line(ctx, x - 3.6, hy0 + 1.4, x + 4.4, hy0 + 1, look.hatC, 1.2); line(ctx, x - 2.6, hy0 + 0.8, x - 4.6, hy0 - 5, look.hatC === '#f4efe0' ? '#1a1a1e' : '#f4efe0', 1); break;
    case 'none': break;
  }
}

/** The Healer: a robed figure with a stole in the empire's trim, and the tools of healing in hand. */
function drawHealer(ctx: Ctx, tribe: TribeId, x: number, y: number) {
  const look = HEALER[tribe];
  // the long robe, sweeping out behind
  poly(ctx, [x - 3.5, y - 13.5, x + 3, y - 13.5, x + 3.6, y + 1.4, x - 6, y + 2, x - 8.5, y + 0.4], shade(look.robe, -0.18));
  const b = figure(ctx, 'explorer', tribe, x, y, 0.92);
  // the robe's front and the stole over it
  poly(ctx, [x - 3.4, y - 11, x + 3.4, y - 11.5, x + 4, y + 0.6, x - 4, y + 1], look.robe);
  line(ctx, x - 1.4, y - 12, x - 1.8, y + 0.8, look.trim, 1.3);
  line(ctx, x + 1.6, y - 12.3, x + 2, y + 0.4, look.trim, 1.3);
  if (look.hood) poly(ctx, [x - 4.4, b.top + 5, x - 3.6, b.top - 0.4, x + 0.6, b.top - 1.6, x + 4.6, b.top + 0.2, x + 5, b.top + 5, x + 3.6, b.top + 2.2, x - 2.8, b.top + 2.4], shade(look.robe, -0.08));
  const hx = b.hand.x, hy = b.hand.y;
  switch (look.tool) {
    case 'serpent': // a staff with a snake coiled up it
      line(ctx, hx, hy + 10, hx + 1.5, hy - 14, WOOD, 1.3);
      for (let i = 0; i < 4; i++) line(ctx, hx - 1 + i * 0.35, hy + 4 - i * 4.4, hx + 2.6 + i * 0.35, hy + 1.8 - i * 4.4, '#3f8a4a', 1);
      ellipse(ctx, hx + 2.4, hy - 13, 1.1, 0.8, '#3f8a4a');
      break;
    case 'censer': // a smoking censer swinging on its chain
      line(ctx, hx, hy - 1, hx + 2, hy + 6, '#c9974a', 0.6);
      ellipse(ctx, hx + 2, hy + 7.4, 2.2, 1.8, '#c9974a');
      for (let i = 0; i < 3; i++) ellipse(ctx, hx + 3 + i * 1.4, hy + 4 - i * 3, 1.6 - i * 0.3, 1.2 - i * 0.2, `rgba(235,235,235,${0.7 - i * 0.18})`);
      break;
    case 'bowl': ellipse(ctx, hx + 2, hy - 1, 3.2, 1.4, '#b8763c'); ellipse(ctx, hx + 2, hy - 1.6, 2.6, 0.8, '#6fbf7a'); break;
    case 'rattle': line(ctx, hx, hy + 1, hx + 2.4, hy - 5, WOOD, 1); ellipse(ctx, hx + 3, hy - 6.6, 2.2, 2.4, '#c9a06a'); for (const d of [-1.6, 0, 1.6]) line(ctx, hx + 3 + d, hy - 8.8, hx + 3 + d * 1.4, hy - 11, look.trim, 0.6); break;
    case 'wheel': line(ctx, hx, hy + 2, hx + 1, hy - 6, WOOD, 1); box(ctx, hx + 1.2, hy - 6, 3.4, 4, GOLD); line(ctx, hx + 2.8, hy - 8, hx + 5, hy - 9.4, DARK, 0.5); ellipse(ctx, hx + 5.2, hy - 9.6, 0.8, 0.8, DARK); break;
    case 'scroll': poly(ctx, [hx - 1, hy - 5, hx + 4, hy - 5.6, hx + 4, hy - 0.8, hx - 1, hy], '#f4ead0'); ellipse(ctx, hx - 1, hy - 2.5, 0.9, 2.6, '#c9b27a'); line(ctx, hx, hy - 3.6, hx + 3, hy - 3.9, '#3a8a4a', 0.5); break;
    case 'herbs': for (let i = 0; i < 4; i++) line(ctx, hx, hy + 1, hx - 1 + i * 1.5, hy - 6 - (i % 2), i % 2 ? '#3f8a4a' : '#6fbf5a', 1); line(ctx, hx - 1, hy - 0.4, hx + 2, hy - 0.8, '#c9b27a', 0.8); break;
    case 'bag': box(ctx, hx + 2, hy + 2, 5, 3.6, '#6b3a22'); poly(ctx, [hx + 1, hy - 1.6, hx + 3, hy - 3.6, hx + 3.6, hy - 1.6], '#6b3a22'); line(ctx, hx + 0.8, hy + 0.4, hx + 3.2, hy + 0.2, '#f4efe0', 0.8); line(ctx, hx + 2, hy - 0.8, hx + 2, hy + 1.4, '#f4efe0', 0.8); break;
  }
}

// ---------------------------------------------------------------- the map

/** A little green cross (heal mark), outlined so it reads on any ground. */
function cross(ctx: Ctx, x: number, y: number, r: number) {
  poly(ctx, [x - r * 0.4 - 0.8, y - r - 0.8, x + r * 0.4 + 0.8, y - r - 0.8, x + r * 0.4 + 0.8, y + r + 0.8, x - r * 0.4 - 0.8, y + r + 0.8], DARK);
  poly(ctx, [x - r - 0.8, y - r * 0.4 - 0.8, x + r + 0.8, y - r * 0.4 - 0.8, x + r + 0.8, y + r * 0.4 + 0.8, x - r - 0.8, y + r * 0.4 + 0.8], DARK);
  poly(ctx, [x - r * 0.4, y - r, x + r * 0.4, y - r, x + r * 0.4, y + r, x - r * 0.4, y + r], GREEN);
  poly(ctx, [x - r, y - r * 0.4, x + r, y - r * 0.4, x + r, y + r * 0.4, x - r, y + r * 0.4], GREEN);
}

/** Under the units: a green ring under each Healer (brighter when Convert is ready) and a cross over the wounded it tends. */
export function drawAuxGround(ctx: Ctx, s: GameState, viewer: number) {
  const seen = (u: Unit) => viewer < 0 || (s.players[viewer].explored[u.y * s.size + u.x] && unitVisibleTo(s, viewer, u));
  for (const h of s.units) {
    if (h.kind !== 'healer' || !seen(h)) continue;
    const t = s.tiles[h.y * s.size + h.x];
    const c = tileCenter(h.x, h.y);
    const y = c.y + (isWater(t) ? WATER_DROP : 0) + 3;
    ctx.save();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = convertLeft(s, h) ? 'rgba(88,210,122,0.45)' : 'rgba(88,210,122,0.85)';
    ctx.beginPath();
    ctx.ellipse(c.x, y, 17, 8.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(88,210,122,0.12)';
    ctx.fill();
    ctx.restore();
    // the wounded of its empire beside it: healed at the start of the owner's next turn
    for (const u of s.units) {
      if (u === h || u.owner !== h.owner || Math.max(Math.abs(u.x - h.x), Math.abs(u.y - h.y)) !== 1 || u.hp >= maxHp(u) || !seen(u)) continue;
      const k = tileCenter(u.x, u.y);
      const w = s.tiles[u.y * s.size + u.x];
      cross(ctx, k.x - 13, k.y + (isWater(w) ? WATER_DROP : 0) + 4, 2.6);
    }
  }
}

/** Menu icon for Convert (`aux:convert`): an open hand over a heart in the empire's colour. Returns false for other icons. */
export function drawAuxIcon(ctx: Ctx, icon: string, tribe: TribeId, x: number, y: number): boolean {
  if (icon !== 'aux:convert') return false;
  const T = TRIBES[tribe];
  ellipse(ctx, x, y + 12, 16, 5, 'rgba(88,210,122,0.35)');
  // two banners turning: the foe's grey giving way to your colour
  line(ctx, x - 9, y + 12, x - 9, y - 12, DWOOD, 1.6);
  poly(ctx, [x - 9, y - 12, x - 1, y - 9, x - 9, y - 5], '#8a8a92');
  line(ctx, x + 7, y + 12, x + 7, y - 14, DWOOD, 1.6);
  poly(ctx, [x + 7, y - 14, x + 17, y - 10, x + 7, y - 5], T.color);
  // the arrow from one to the other
  line(ctx, x - 5, y + 2, x + 3, y + 2, GOLD, 2);
  poly(ctx, [x + 3, y - 1.5, x + 7, y + 2, x + 3, y + 5.5], GOLD);
  cross(ctx, x - 1, y - 8, 3);
  return true;
}
