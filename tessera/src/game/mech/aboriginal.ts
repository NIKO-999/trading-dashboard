import { emit } from '../events';
import { dist, isLand, isWater, neighbors, tileAt } from '../grid';
import { addPop, citiesOf, def, isExplored, moveOptions, moveUnit } from '../rules';
import type { Action } from '../rules';
import type { GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

// Dreamtime Paths.
//
// (A) Songlines. For 1 star the Aboriginal player paints an invisible "Songline Track" (improvement `songline`) on any
//     explored, empty land tile (action `mech:songline`; `mech:unsong` wipes one for free). Friendly land units enter a
//     songline tile for 0 move points (and it never bogs them down in forest/swamp), and a unit standing on a songline
//     is hidden from every other empire (`unitVisible`: it cannot be seen in the render nor targeted by attacks).
//     The base game draws no art for the `songline` improvement, and the tile panel names it only to its owner, so the
//     network is invisible to opponents; the owner sees it through render/mech/aboriginal.ts.
//     Fog of war: `Player.explored` is only ever set to true in the core (nothing resets it), so explored territory never
//     re-covers; a test guards this. Songlines can only be painted on explored tiles.
//     Simplification: tiles holding a resource, village, ruin or city cannot carry a track (the base renderer would hide
//     the resource under the improvement); units reach such landmarks from an adjacent track tile.
//
// (B) Pilgrimage. Natural landmarks are: mountains, ruins, villages, wild fruit (oasis), forest with animals. A unit
//     arriving at a landmark at least MIN_TRIP tiles from the last landmark it visited (stored in unit.data.last) earns
//     floor(distance / 2) stars, up to MAX_PAY. Going straight back to the previous landmark pays nothing (no ping-pong).
//     The first time the empire reaches any landmark (player.mech.reached), the nearest city gains +1 population.
//     Ruins and villages vanish when used, so setup() tags every landmark tile with tile.data.lm.

export const PAINT_COST = 1;
export const MIN_TRIP = 4;
export const MAX_PAY = 5;

interface Mem { painted: number; trips: number; tripStars: number; reached: string[]; pt?: number; pn?: number }
type Pt = { x: number; y: number };

export const memOf = (s: GameState, owner: number): Mem => {
  const p = s.players[owner];
  const m = (p.mech ??= {}) as unknown as Mem;
  m.painted ??= 0; m.trips ??= 0; m.tripStars ??= 0; m.reached ??= [];
  return m;
};

const landmarkNow = (t: Tile) =>
  t.terrain === 'mountain' || t.ruin || t.village || t.resource === 'fruit' || (t.terrain === 'forest' && t.resource === 'animal');
/** Is this tile a natural landmark (a tile tagged at setup counts even after its ruin or village was used)? */
export const isLandmark = (t: Tile) => !!t.data?.lm || landmarkNow(t);
export const isSongline = (t: Tile | undefined) => t?.improvement === 'songline';
const key = (t: Pt) => `${t.x},${t.y}`;

export function songlineCount(s: GameState): number { return s.tiles.filter(isSongline).length; }
export function landmarkTotals(s: GameState, owner: number) {
  const known = s.tiles.filter((t) => isLandmark(t) && isExplored(s, owner, t.x, t.y)).length;
  return { known, reached: memOf(s, owner).reached.length };
}

export const paintable = (s: GameState, owner: number, t: Tile) =>
  isLand(t) && t.terrain !== 'ice' && t.terrain !== 'platform' && !t.improvement && !t.resource && !t.village && !t.ruin && t.cityId === null && isExplored(s, owner, t.x, t.y);

export function paint(s: GameState, owner: number, t: Tile): boolean {
  if (!paintable(s, owner, t)) return false;
  t.improvement = 'songline';
  memOf(s, owner).painted++;
  emit({ type: 'harvest', player: owner, x: t.x, y: t.y, pop: 0 });
  return true;
}

const enemyAdjacent = (s: GameState, u: Unit, t: Tile) => s.units.some((e) => e.owner !== u.owner && dist(e.x, e.y, t.x, t.y) === 1);

function pilgrimage(s: GameState, owner: number, u: Unit, to: Tile) {
  if (!isLandmark(to)) return;
  const m = memOf(s, owner);
  const p = s.players[owner];
  const d = (u.data ??= {}) as { last?: Pt; prev?: Pt };
  if (d.last && !(d.last.x === to.x && d.last.y === to.y)) {
    const far = dist(d.last.x, d.last.y, to.x, to.y);
    const back = d.prev && d.prev.x === to.x && d.prev.y === to.y;
    if (far >= MIN_TRIP && !back) {
      const pay = Math.min(MAX_PAY, Math.floor(far / 2));
      p.stars += pay;
      m.trips++; m.tripStars += pay;
      emit({ type: 'stars', player: owner, x: to.x, y: to.y, amount: pay });
    }
  }
  if (!d.last || d.last.x !== to.x || d.last.y !== to.y) { d.prev = d.last; d.last = { x: to.x, y: to.y }; }
  if (!m.reached.includes(key(to))) { // new land opened by the Songlines: the nearest city grows
    m.reached.push(key(to));
    const c = citiesOf(s, owner).sort((a, b) => dist(a.x, a.y, to.x, to.y) - dist(b.x, b.y, to.x, to.y) || a.id - b.id)[0];
    if (c) { addPop(s, c, 1); emit({ type: 'harvest', player: owner, x: to.x, y: to.y, pop: 1 }); }
  }
}

/** Landmarks the empire has seen but not yet reached, for the AI's track building. */
const unreached = (s: GameState, owner: number) => {
  const got = memOf(s, owner).reached;
  return s.tiles.filter((t) => isLandmark(t) && isExplored(s, owner, t.x, t.y) && !got.includes(key(t)));
};

function aiPaint(s: GameState, owner: number): boolean {
  const p = s.players[owner];
  const m = memOf(s, owner);
  if (m.pt !== s.turn) { m.pt = s.turn; m.pn = 0; }
  if ((m.pn ?? 0) >= 2 || p.stars < PAINT_COST + 2) return false;
  const goals = unreached(s, owner);
  if (!goals.length) return false;
  const sources: Pt[] = [...citiesOf(s, owner), ...s.tiles.filter(isSongline)];
  let best: { t: Tile; score: number } | null = null;
  for (const src of sources) {
    for (const t of neighbors(s, src.x, src.y)) {
      if (!paintable(s, owner, t)) continue;
      const g = goals.reduce((b, l) => Math.min(b, dist(l.x, l.y, t.x, t.y)), 99);
      const score = g * 100 + t.y * s.size + t.x; // deterministic tie-break
      if (!best || score < best.score) best = { t, score };
    }
  }
  if (!best) return false;
  p.stars -= PAINT_COST;
  paint(s, owner, best.t);
  m.pn = (m.pn ?? 0) + 1;
  return true;
}

const PILGRIMS = ['warrior', 'rider', 'explorer', 'woomera', 'archer'];

function aiPilgrim(s: GameState, owner: number): boolean {
  for (const u of s.units.filter((e) => e.owner === owner && !e.moved && PILGRIMS.includes(e.kind) && !def(e).naval).sort((a, b) => a.id - b.id)) {
    const last = (u.data as { last?: Pt } | undefined)?.last;
    const prev = (u.data as { prev?: Pt } | undefined)?.prev;
    let best: { x: number; y: number; score: number } | null = null;
    for (const o of moveOptions(s, u)) {
      const t = tileAt(s, o.x, o.y)!;
      if (!isLandmark(t) || (prev && prev.x === t.x && prev.y === t.y)) continue;
      const far = last ? dist(last.x, last.y, t.x, t.y) : 0;
      const fresh = !memOf(s, owner).reached.includes(key(t));
      if (!fresh && far < MIN_TRIP) continue;
      const score = (far >= MIN_TRIP ? Math.min(MAX_PAY, Math.floor(far / 2)) : 0) + (fresh ? 3 : 0);
      if (!best || score > best.score) best = { x: o.x, y: o.y, score };
    }
    if (best && moveUnit(s, u, best.x, best.y)) return true;
  }
  return false;
}

export const mech: Mechanic = {
  name: 'Dreamtime Paths',
  blurb: 'Paint invisible Songlines that let your units travel free and unseen; pilgrimages between distant landmarks pay Stars and grow your cities.',

  setup(s, owner) {
    memOf(s, owner);
    for (const t of s.tiles) if (landmarkNow(t)) t.data = { ...t.data, lm: 1 };
  },

  moveStep(s, owner, u, from, to, ctx) {
    if (u.owner !== owner || !isSongline(to) || ctx.forbid || ctx.opt.embark || ctx.opt.disembark || isWater(from)) return;
    ctx.cost = 0;
    if (to.terrain !== 'mountain' && !enemyAdjacent(s, u, to)) ctx.stop = false; // forest and swamp do not bog a unit down
  },

  unitVisible(s, owner, viewer, u) {
    if (u.owner !== owner || viewer === owner) return undefined;
    return isSongline(tileAt(s, u.x, u.y)) ? false : undefined;
  },

  afterMove(s, owner, u, _from, to) {
    if (u.owner !== owner) return;
    pilgrimage(s, owner, u, to);
  },

  actions(s, owner, t): Action[] {
    const p = s.players[owner];
    if (isSongline(t)) {
      return [{ id: 'mech:unsong', label: 'Wipe Songline', desc: 'Erase this Songline Track (free).', cost: 0, enabled: true, icon: 'road' }];
    }
    if (!paintable(s, owner, t)) return [];
    const ok = p.stars >= PAINT_COST;
    return [{
      id: 'mech:songline', label: 'Paint Songline',
      desc: 'Invisible track: your units cross it for free and are hidden from other empires while standing on it.',
      cost: PAINT_COST, enabled: ok, reason: ok ? undefined : 'Not enough stars', icon: 'road',
    }];
  },

  doAction(s, owner, t, id) {
    if (id === 'mech:songline') return paint(s, owner, t);
    if (id === 'mech:unsong' && isSongline(t)) { t.improvement = null; return true; }
    return false;
  },

  ai(s, owner) {
    if (aiPilgrim(s, owner)) return true;
    return aiPaint(s, owner);
  },
};
