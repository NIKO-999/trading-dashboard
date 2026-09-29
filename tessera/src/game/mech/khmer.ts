import { emit } from '../events';
import { dist, isLand, neighbors } from '../grid';
import { citiesOf, def, removeUnit, tileOwnerPlayer, unitAt } from '../rules';
import type { Action } from '../rules';
import type { City, GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

// Khmer: the Great Reservoir (Baray) system.
//
// (A) Great Reservoir Flooding. Khmer build barays (`mech:baray`) and dams (`mech:dam`, next to a baray) on empty land in
//     their territory. There are no rivers, so blowing a dam (`mech:flood`) releases the reservoir: every tile within
//     FLOOD_RADIUS of the barays touching that dam becomes shallow water for FLOOD_TURNS turns. Enemy land units caught
//     there are swept away (a unit cannot stand in water, so the flood kills rather than wounds); tiles holding a Khmer
//     land unit stay dry, so Khmer units are spared. Then the water recedes.
//     State: tile.data.flood = { left, orig, by } while flooded; tile.data.khmer = owner on barays and dams.
//     Simplifications: cities are never flooded; if the Khmer are eliminated their floods stay (nobody ticks them);
//     a boat that is afloat on a receding tile keeps the water there until it leaves.
// (B) Baray Hydraulics. Natural shallow water and barays pay +1★ for every land resource tile (fruit, crop, animal, ore)
//     of the same city's territory they touch; linked barays (adjacent = a canal) multiply what the network earns
//     (x1.5 for two, x2 for three or more). Each city's hydraulic income is capped. Floods are too brief to pay.
//     This comes on top of the existing +1★ per farm of `cityIncome`.

export const BARAY_COST = 8;
export const DAM_COST = 2;
export const FLOOD_COST = 1;
export const FLOOD_RADIUS = 2;
export const FLOOD_TURNS = 2;
export const CITY_CAP = 3;
const BUILDABLE = ['field', 'desert', 'swamp', 'tundra'];
const LAND_RES = ['fruit', 'crop', 'animal', 'ore'];

const isKhmer = (s: GameState, owner: number) => s.players[owner].tribe === 'khmer';
export const isBaray = (t: Tile) => t.improvement === 'baray';
export const isDam = (t: Tile) => t.improvement === 'dam';
export const floodLeft = (t: Tile) => { const f = t.data?.flood as { left?: number } | undefined; return f && typeof f.left === 'number' ? f.left : 0; };

// ---------------------------------------------------------------- economy

const landResource = (t: Tile) => t.resource !== null && LAND_RES.includes(t.resource) && isLand(t) && !floodLeft(t);
const touches = (s: GameState, c: City, t: Tile) => neighbors(s, t.x, t.y).filter((n) => n.owner === c.id && landResource(n)).length;

export interface Hydraulics { natural: number; canals: number; total: number; capped: boolean; barays: number }

/** Reservoir income of one city: touched resources of shallows and barays, with canal networks compounding. */
export function hydraulics(s: GameState, c: City): Hydraulics {
  const mine = s.tiles.filter((t) => t.owner === c.id);
  let natural = 0;
  for (const t of mine) if (t.terrain === 'shallow' && !floodLeft(t)) natural += touches(s, c, t);
  const barays = mine.filter((t) => isBaray(t) && isLand(t));
  const seen = new Set<Tile>();
  let canals = 0;
  for (const b of barays) {
    if (seen.has(b)) continue;
    const group: Tile[] = [];
    const queue = [b];
    seen.add(b);
    while (queue.length) {
      const t = queue.pop()!;
      group.push(t);
      for (const n of barays) if (!seen.has(n) && dist(n.x, n.y, t.x, t.y) <= 1) { seen.add(n); queue.push(n); }
    }
    const sum = group.reduce((a, t) => a + touches(s, c, t), 0);
    canals += Math.floor(sum * Math.min(2, 1 + 0.5 * (group.length - 1)));
  }
  const raw = natural + canals;
  return { natural, canals, total: Math.min(CITY_CAP, raw), capped: raw > CITY_CAP, barays: barays.length };
}

export const reservoirIncome = (s: GameState, owner: number) => citiesOf(s, owner).reduce((n, c) => n + hydraulics(s, c).total, 0);

// ---------------------------------------------------------------- flooding

const isMine = (s: GameState, owner: number, t: Tile) => t.data?.khmer === owner && tileOwnerPlayer(s, t) === owner;
const mark = (t: Tile, owner: number) => { t.data = { ...(t.data ?? {}), khmer: owner }; };

/** The barays a dam draws on: those touching it. */
const feeders = (s: GameState, owner: number, dam: Tile) => neighbors(s, dam.x, dam.y).filter((n) => isBaray(n) && isMine(s, owner, n));

/** Tiles a dam would flood: within FLOOD_RADIUS of a feeding baray (never cities, barays or mountains). */
export function floodZone(s: GameState, owner: number, dam: Tile): Tile[] {
  const zone = new Set<Tile>();
  for (const b of feeders(s, owner, dam)) {
    for (const t of neighbors(s, b.x, b.y, FLOOD_RADIUS)) if (isLand(t) && t.cityId === null && t.terrain !== 'mountain' && !isBaray(t)) zone.add(t);
  }
  return [...zone];
}

const isLandUnit = (u: Unit) => !def(u).naval;

function wash(s: GameState, owner: number, u: Unit) {
  emit({ type: 'damage', unitId: u.id, x: u.x, y: u.y, amount: u.hp });
  u.hp = 0;
  removeUnit(s, u, null);
  emit({ type: 'death', unitId: u.id, x: u.x, y: u.y, owner: u.owner, kind: u.kind });
  s.players[owner].kills++;
}

/** Blow the dam: flood the zone and wash away every enemy land unit standing in it. Returns how many were hit. */
export function blowDam(s: GameState, owner: number, dam: Tile): number {
  const zone = floodZone(s, owner, dam);
  dam.improvement = null;
  const { khmer: _k, ...rest } = dam.data ?? {};
  dam.data = rest;
  if (!zone.includes(dam)) zone.push(dam);
  let washed = 0;
  for (const t of zone) {
    const here = unitAt(s, t.x, t.y);
    if (here && here.owner === owner && isLandUnit(here)) continue; // the water parts around our own soldiers
    const prev = t.data?.flood as { left: number; orig: string } | undefined;
    t.data = { ...(t.data ?? {}), flood: { left: FLOOD_TURNS, orig: prev?.orig ?? t.terrain, by: owner } };
    t.terrain = 'shallow';
    if (here && here.owner !== owner && isLandUnit(here)) { wash(s, owner, here); washed++; }
  }
  return washed;
}

/** Let the water run down: tick every flood this empire released. */
function recede(s: GameState, owner: number) {
  for (const t of s.tiles) {
    const f = t.data?.flood as { left: number; orig: string; by: number } | undefined;
    if (!f || f.by !== owner) continue;
    if (f.left > 1) { t.data = { ...t.data, flood: { ...f, left: f.left - 1 } }; continue; }
    const boat = unitAt(s, t.x, t.y);
    if (boat && !isLandUnit(boat)) continue; // a boat afloat here keeps the water until it leaves
    t.terrain = f.orig as Tile['terrain'];
    const { flood: _f, ...rest } = t.data!;
    t.data = rest;
  }
}

// ---------------------------------------------------------------- building

const openGround = (s: GameState, owner: number, t: Tile) =>
  tileOwnerPlayer(s, t) === owner && isLand(t) && BUILDABLE.includes(t.terrain) && t.cityId === null && !t.village && !t.improvement && !t.resource;

function buildCheck(s: GameState, owner: number, t: Tile): string | null {
  if (tileOwnerPlayer(s, t) !== owner) return 'Only in your own territory';
  if (!openGround(s, owner, t)) return 'Needs open ground';
  const u = unitAt(s, t.x, t.y);
  if (u && u.owner !== owner) return 'Enemy on the tile';
  return null;
}
const damCheck = (s: GameState, owner: number, t: Tile) =>
  buildCheck(s, owner, t) ?? (neighbors(s, t.x, t.y).some((n) => isBaray(n) && isMine(s, owner, n)) ? null : 'Must touch one of your barays');

function build(s: GameState, owner: number, t: Tile, kind: 'baray' | 'dam') {
  t.improvement = kind;
  mark(t, owner);
  emit({ type: 'harvest', player: owner, x: t.x, y: t.y, pop: 0 });
  return true;
}

/** Stars a new baray on `t` would add per turn (used by the AI and the tile menu). */
export function barayGain(s: GameState, owner: number, t: Tile): number {
  const c = s.cities.find((e) => e.id === t.owner);
  if (!c) return 0;
  const before = hydraulics(s, c).total;
  const keep = { improvement: t.improvement, data: t.data };
  t.improvement = 'baray';
  t.data = { ...(t.data ?? {}), khmer: owner };
  const after = hydraulics(s, c).total;
  t.improvement = keep.improvement;
  t.data = keep.data;
  return after - before;
}

export const mech: Mechanic = {
  name: 'Great Reservoir Flooding',
  blurb: 'Build barays and dams, then blow a dam to flood enemy armies for 2 turns; water and barays pay +1★ per resource they touch, compounding across linked canals.',

  income(s, owner) { return reservoirIncome(s, owner); },
  turnStart(s, owner) { recede(s, owner); },

  // wading through a reservoir slows an invader
  moveStep(s, owner, u, _from, to, ctx) {
    if (u.owner === owner || !isBaray(to) || to.data?.khmer !== owner || !isLandUnit(u)) return;
    ctx.stop = true;
  },

  actions(s, owner, t): Action[] {
    const stars = s.players[owner].stars;
    if (isDam(t) && isMine(s, owner, t)) {
      const n = floodZone(s, owner, t).length;
      const why = !feeders(s, owner, t).length ? 'No baray feeds this dam' : stars < FLOOD_COST ? 'Not enough stars' : undefined;
      return [{ id: 'mech:flood', label: 'Blow the Dam', cost: FLOOD_COST, icon: 'axe', enabled: !why, reason: why,
        desc: `Flood ${n} tiles for ${FLOOD_TURNS} turns: enemy land units there are swept away; your own units keep their ground dry.` }];
    }
    if (!openGround(s, owner, t)) return [];
    const why = buildCheck(s, owner, t) ?? (stars < BARAY_COST ? 'Not enough stars' : null);
    const dwhy = damCheck(s, owner, t) ?? (stars < DAM_COST ? 'Not enough stars' : null);
    return [
      { id: 'mech:baray', label: 'Dig Baray', cost: BARAY_COST, icon: 'port', enabled: !why, reason: why ?? undefined,
        desc: `A reservoir: +1★ per land resource it touches (x1.5 / x2 when canals link barays). Now: +${barayGain(s, owner, t)}★.` },
      { id: 'mech:dam', label: 'Build Dam', cost: DAM_COST, icon: 'road', enabled: !dwhy, reason: dwhy ?? undefined,
        desc: 'A sluice beside a baray. Blow it later to flood the land around the reservoir.' },
    ];
  },

  doAction(s, owner, t, id) {
    if (!isKhmer(s, owner)) return false;
    if (id === 'mech:baray') return !buildCheck(s, owner, t) && build(s, owner, t, 'baray');
    if (id === 'mech:dam') return !damCheck(s, owner, t) && build(s, owner, t, 'dam');
    if (id === 'mech:flood') {
      if (!isDam(t) || !isMine(s, owner, t) || !feeders(s, owner, t).length) return false;
      blowDam(s, owner, t);
      return true;
    }
    return false;
  },

  ai(s, owner) {
    const p = s.players[owner];
    const mineTiles = s.tiles.filter((t) => isMine(s, owner, t));
    // 1. Blow a dam when it drowns enemies and none of ours would be caught in the water.
    for (const d of mineTiles.filter(isDam)) {
      const zone = floodZone(s, owner, d);
      const foes = zone.map((t) => unitAt(s, t.x, t.y)).filter((u): u is Unit => !!u && u.owner !== owner && isLandUnit(u));
      if (!foes.length || p.stars < FLOOD_COST) continue;
      if (foes.reduce((n, u) => n + u.hp, 0) < 5) continue;
      p.stars -= FLOOD_COST;
      blowDam(s, owner, d);
      return true;
    }
    // 2. Threatened baray without a dam: give it one.
    if (p.stars >= DAM_COST + 1) {
      for (const b of mineTiles.filter(isBaray)) {
        if (!s.units.some((u) => u.owner !== owner && isLandUnit(u) && dist(u.x, u.y, b.x, b.y) <= 4)) continue;
        if (neighbors(s, b.x, b.y).some((n) => isDam(n) && n.data?.khmer === owner)) continue;
        const spot = neighbors(s, b.x, b.y).find((n) => !damCheck(s, owner, n) && !unitAt(s, n.x, n.y));
        if (spot) { p.stars -= DAM_COST; return build(s, owner, spot, 'dam'); }
      }
    }
    // 3. Dig a profitable baray as soon as it can be afforded: it is the Khmer's main investment.
    if (p.stars >= BARAY_COST && citiesOf(s, owner).length) {
      let best: { t: Tile; g: number } | null = null;
      for (const t of s.tiles) {
        if (tileOwnerPlayer(s, t) !== owner || buildCheck(s, owner, t) || unitAt(s, t.x, t.y)) continue;
        const g = barayGain(s, owner, t);
        if (g >= 2 && (!best || g > best.g)) best = { t, g };
      }
      if (best) { p.stars -= BARAY_COST; return build(s, owner, best.t, 'baray'); }
    }
    return false;
  },
};
