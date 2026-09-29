import { emit } from '../events';
import { neighbors } from '../grid';
import { addPop, citiesOf, def, tileOwnerPlayer, unitAt } from '../rules';
import type { Action } from '../rules';
import type { City, GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

// Celts: Druidic Ley Lines (core) + Sacred Grove Vow (economy).
//
// (A) Ley Lines. Celts plant Sacred Groves (`mech:grove`, improvement `grove`) on empty forest tiles in their territory.
//     Every GROW_EVERY turns each grove spreads: one adjacent empty field (no resource, improvement, city, village, ruin,
//     road or unit; not foreign land) turns into forest marked `data.ley = owner, grown = true`. Any enemy land unit that
//     finishes a move on a ley forest (a grove, a grown forest, or a forest touching a grove) is entangled: it cannot
//     move on its next turn (`data.rootT` on the unit; `moveStep` forbids every step while it lasts). It can still attack.
//     State: tile.data.ley (owner id) on groves and grown forest; unit.data.rootT; player.mech = {planted, grown, rooted}.
//     Simplification: rooting only happens when the unit moves in; a unit already standing there when the forest grows
//     is spared (grown tiles are never chosen under a unit).
// (B) Grove Vow. The Celts never clear forest and never build lumber huts (`block` hook; ids `clear`, `lumber`).
//     In return every uncut forest tile of a city's territory that touches a grove pays +1★ (VOW_CAP per city), and a
//     city with such forests slowly grows: its `data.vow` fills by min(count, 4) per turn and turns into +1 population
//     at VOW_POP.

export const GROVE_COST = 4;
export const GROW_EVERY = 3;
export const VOW_CAP = 4;
export const VOW_POP = 8;
export const MAX_GROVES_PER_CITY = 4;

const isCelt = (s: GameState, owner: number) => s.players[owner].tribe === 'celts';
export const isGrove = (t: Tile) => t.improvement === 'grove';
const isLey = (t: Tile, owner: number) => t.data?.ley === owner;
const isLandUnit = (u: Unit) => !def(u).naval;
const stat = (s: GameState, owner: number, k: 'planted' | 'grown' | 'rooted', n = 1) => {
  const m = (s.players[owner].mech ??= {});
  m[k] = ((m[k] as number | undefined) ?? 0) + n;
};
export const counter = (s: GameState, owner: number, k: 'planted' | 'grown' | 'rooted') => (s.players[owner].mech?.[k] as number | undefined) ?? 0;

/** Is this a forest in the reach of a grove of `owner` (a grove, grown forest, or a forest touching a grove)? */
export function isLeyForest(s: GameState, owner: number, t: Tile): boolean {
  if (t.terrain !== 'forest') return false;
  if (isLey(t, owner)) return true;
  return neighbors(s, t.x, t.y).some((n) => isGrove(n) && isLey(n, owner));
}

// ---------------------------------------------------------------- economy

/** Uncut forest tiles of city `c` that touch one of the empire's groves. */
export function vowForests(s: GameState, c: City): Tile[] {
  return s.tiles.filter((t) => t.owner === c.id && t.terrain === 'forest' && !isGrove(t)
    && neighbors(s, t.x, t.y).some((n) => isGrove(n) && isLey(n, c.owner)));
}
export const vowStars = (s: GameState, c: City) => Math.min(VOW_CAP, vowForests(s, c).length);
export const vowIncome = (s: GameState, owner: number) => citiesOf(s, owner).reduce((n, c) => n + vowStars(s, c), 0);
export const groveCount = (s: GameState, owner: number) => s.tiles.filter((t) => isGrove(t) && isLey(t, owner)).length;
export const groveCountOf = (s: GameState, c: City) => s.tiles.filter((t) => isGrove(t) && t.owner === c.id).length;

function vowGrowth(s: GameState, owner: number) {
  for (const c of citiesOf(s, owner)) {
    const n = Math.min(4, vowForests(s, c).length);
    if (!n) continue;
    const d = (c.data ??= {});
    let v = ((d.vow as number | undefined) ?? 0) + n;
    if (v >= VOW_POP) {
      v -= VOW_POP;
      addPop(s, c, 1);
      emit({ type: 'harvest', player: owner, x: c.x, y: c.y, pop: 1 });
    }
    d.vow = v;
  }
}

// ---------------------------------------------------------------- ley growth

const growable = (s: GameState, owner: number, t: Tile) => {
  const o = tileOwnerPlayer(s, t);
  return t.terrain === 'field' && !t.resource && !t.improvement && t.cityId === null && !t.village && !t.ruin && !t.road
    && (o === null || o === owner) && !unitAt(s, t.x, t.y);
};

function spread(s: GameState, owner: number) {
  for (const g of s.tiles) {
    if (!isGrove(g) || !isLey(g, owner)) continue;
    const gd = (g.data ??= {});
    const n = ((gd.grow as number | undefined) ?? 0) + 1;
    if (n < GROW_EVERY) { gd.grow = n; continue; }
    const cand = neighbors(s, g.x, g.y).filter((t) => growable(s, owner, t));
    if (!cand.length) { gd.grow = GROW_EVERY - 1; continue; } // wait for room
    gd.grow = 0;
    const t = cand[(g.seed + s.turn) % cand.length]; // deterministic pick
    t.terrain = 'forest';
    t.data = { ...(t.data ?? {}), ley: owner, grown: true };
    stat(s, owner, 'grown');
    emit({ type: 'harvest', player: owner, x: t.x, y: t.y, pop: 0 });
  }
}

// ---------------------------------------------------------------- planting

export function groveCheck(s: GameState, owner: number, t: Tile): string | null {
  if (tileOwnerPlayer(s, t) !== owner) return 'Only in your own territory';
  if (t.terrain !== 'forest') return 'Needs a forest tile';
  if (t.improvement || t.resource || t.cityId !== null || t.village || t.ruin) return 'The forest must be empty';
  const u = unitAt(s, t.x, t.y);
  if (u && u.owner !== owner) return 'Enemy on the tile';
  const c = s.cities.find((e) => e.id === t.owner);
  if (c && groveCountOf(s, c) >= MAX_GROVES_PER_CITY) return `Only ${MAX_GROVES_PER_CITY} groves per city`;
  return null;
}

export function plant(s: GameState, owner: number, t: Tile): boolean {
  t.improvement = 'grove';
  t.data = { ...(t.data ?? {}), ley: owner, grow: 0 };
  stat(s, owner, 'planted');
  emit({ type: 'harvest', player: owner, x: t.x, y: t.y, pop: 0 });
  return true;
}

/** How useful a grove on `t` would be: forests it would feed plus fields it could grow over (used by the AI). */
export function groveValue(s: GameState, owner: number, t: Tile): number {
  const ns = neighbors(s, t.x, t.y);
  return ns.filter((n) => n.terrain === 'forest' && n.owner === t.owner && !isGrove(n)).length + ns.filter((n) => growable(s, owner, n)).length * 0.5;
}

export const mech: Mechanic = {
  name: 'Druidic Ley Lines',
  blurb: 'Plant Sacred Groves that spread forest and root enemies who enter it; the Celts never cut trees, and uncut forest beside groves pays stars and slowly grows cities.',

  setup(s, owner) { s.players[owner].mech = { planted: 0, grown: 0, rooted: 0 }; },

  income(s, owner) { return vowIncome(s, owner) + citiesOf(s, owner).length; },
  turnStart(s, owner) { spread(s, owner); vowGrowth(s, owner); },

  // an entangled unit cannot move at all (it may still fight)
  moveStep(s, owner, u, _from, _to, ctx) {
    const r = u.data?.rootT as number | undefined;
    if (r === undefined || u.data?.rootBy !== owner) return;
    if (s.turn === r + 1) ctx.forbid = true;
  },

  afterMove(s, owner, u, _from, to) {
    if (u.owner === owner || !isLandUnit(u) || !s.units.includes(u) || !isLeyForest(s, owner, to)) return;
    u.data = { ...(u.data ?? {}), rootT: s.turn, rootBy: owner };
    stat(s, owner, 'rooted');
    emit({ type: 'toast', player: owner, text: 'An enemy is entangled in the roots!' });
    emit({ type: 'toast', player: u.owner, text: 'Your unit is entangled by ley roots and cannot move next turn.' });
  },

  // the Sacred Grove Vow: no felling of forest
  block(s, owner, pid, id, t) {
    if (pid !== owner || t.terrain !== 'forest') return undefined;
    if (id === 'clear' || id === 'lumber') return 'Sacred Grove Vow: the Celts never fell trees';
    return undefined;
  },

  actions(s, owner, t): Action[] {
    if (tileOwnerPlayer(s, t) !== owner || t.terrain !== 'forest' || t.improvement || t.resource || t.cityId !== null) return [];
    const why = groveCheck(s, owner, t) ?? (s.players[owner].stars < GROVE_COST ? 'Not enough stars' : null);
    return [{ id: 'mech:grove', label: 'Plant Sacred Grove', cost: GROVE_COST, icon: 'temple', enabled: !why, reason: why ?? undefined,
      desc: `Every ${GROW_EVERY} turns forest spreads to an adjacent field; enemies entering its forest are rooted for a turn; touching forests pay +1★ (max ${VOW_CAP} per city) and grow the city.` }];
  },

  doAction(s, owner, t, id) {
    if (!isCelt(s, owner) || id !== 'mech:grove') return false;
    return !groveCheck(s, owner, t) && plant(s, owner, t);
  },

  ai(s, owner) {
    const p = s.players[owner];
    if (p.stars < GROVE_COST || !citiesOf(s, owner).length) return false;
    let best: { t: Tile; v: number } | null = null;
    for (const t of s.tiles) {
      if (tileOwnerPlayer(s, t) !== owner || t.terrain !== 'forest' || groveCheck(s, owner, t)) continue;
      const v = groveValue(s, owner, t);
      if (v >= 1 && (!best || v > best.v)) best = { t, v };
    }
    if (!best) return false;
    p.stars -= GROVE_COST;
    return plant(s, owner, best.t);
  },
};
