import { emit } from '../events';
import { dist, isLand, isWater, neighbors, tileAt } from '../grid';
import { addPop, cityById, def, doAction, hasTech, isExplored, moveOptions, moveUnit, tileOwnerPlayer, unitAt } from '../rules';
import type { Action, MoveOption } from '../rules';
import type { GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';
import { hostile } from '../diplomacy';

// Glacial Freeze (A): an Inuit land unit may walk out onto open water beside it (shallows, or ocean touching land or
// ice); the water freezes under its feet into permanent `ice` terrain, a land bridge for everyone. Inuit cities also
// freeze one adjacent shallow tile every FREEZE_EVERY turns. Enemy units standing on ice take FREEZE_DAMAGE at the
// start of each Inuit turn (never lethal) unless their owner has a fire tech (FIRE_TECHS).
// Whale Harvest & Ice Floes (B): `mech:harvest` on a fish/whale tile in Inuit territory pays a big lump sum of Stars and
// instant Population, then the node is "thawed" for a few turns until it re-freezes and can be harvested again. The
// ordinary one-shot Harvest is blocked for Inuit on those tiles (the node is renewable instead of consumed).
// Simplification: water tiles that carry a resource or improvement are never frozen (they stay fishing grounds).
// Skill line (data/uniqueTechs.ts; the effects live here): Glacial Footing (`inuit:1`) pays GLACIAL_STARS per tile
// frozen; Deep Whaling (`inuit:2`) makes the renewable harvest pay 50% more Stars and rest DEEP_REST turns less;
// Sub-Zero Aura (`inuit:3`) chills for +1 damage, pays AURA_STARS per chilled enemy and freezes around cities every
// AURA_EVERY turns.
//
// Humans: tap an adjacent water tile with a ready land unit and choose "Freeze water" (1 star) or simply move onto the
// highlighted water tile; tap a fish/whale tile in your borders for "Whale Harvest"/"Fish Harvest". AI: see `ai`.

export const FREEZE_EVERY = 3;
export const FREEZE_DAMAGE = 2;
export const FIRE_TECHS = ['smithing', 'mining'];
export const FREEZE_COST = 1;
export const HARVEST_COST = 2;
export const WHALE = { stars: 7, pop: 2, rest: 7 };
export const FISH = { stars: 4, pop: 1, rest: 5 };
const AI_FREEZES_PER_TURN = 2;
export const GLACIAL_STARS = 1;
export const DEEP_REST = 2;
export const AURA_STARS = 1;
export const AURA_EVERY = 2;

type Counters = { frozen: number; walked: number; aura: number; whales: number; fish: number; chilled: number; turnFrozen: number };
const KEYS = ['frozen', 'walked', 'aura', 'whales', 'fish', 'chilled', 'turnFrozen'] as const;

function counters(s: GameState, owner: number): Counters {
  const p = s.players[owner];
  const m = (p.mech ??= {}) as Partial<Counters>;
  for (const k of KEYS) m[k] ??= 0;
  return m as Counters;
}
export const stats = (s: GameState, owner: number): Counters => counters(s, owner);

export const isIce = (t: Tile) => t.terrain === 'ice';
/** Turns left before a harvested fish/whale node re-freezes (0 = ready). */
export const restLeft = (t: Tile): number => {
  const r = (t.data?.inuit as { rest?: number } | undefined)?.rest;
  return typeof r === 'number' ? r : 0;
};
const marine = (t: Tile) => t.resource === 'whale' || t.resource === 'fish';

/** Open water the freeze can take: shallows or ocean touching land/ice, free of cities, resources and improvements. */
export function canFreeze(s: GameState, t: Tile): boolean {
  if (!isWater(t) || t.cityId !== null || t.resource || t.improvement) return false;
  return t.terrain === 'shallow' || neighbors(s, t.x, t.y).some(isLand);
}

function freezeTile(s: GameState, owner: number, t: Tile, kind: 'walked' | 'aura') {
  t.terrain = 'ice';
  t.data = { ...t.data, ice: owner };
  const c = counters(s, owner);
  c.frozen++;
  c[kind]++;
  if (hasTech(s, owner, 'inuit:1')) { // Glacial Footing
    s.players[owner].stars += GLACIAL_STARS;
    emit({ type: 'stars', player: owner, x: t.x, y: t.y, amount: GLACIAL_STARS });
  }
  emit({ type: 'toast', player: owner, text: 'The water freezes into a bridge of ice.' });
}

const isWalker = (u: Unit, owner: number) => u.owner === owner && !def(u).naval && !u.carrying;

/** Ready land units of `owner` beside the water tile, healthiest first. */
const freezers = (s: GameState, owner: number, t: Tile) =>
  s.units.filter((u) => isWalker(u, owner) && !u.moved && !u.attacked && dist(u.x, u.y, t.x, t.y) === 1).sort((a, b) => b.hp - a.hp || a.id - b.id);

/** What a renewable harvest of this node pays `owner` (Deep Whaling: +50% Stars, re-freezes sooner). */
export function harvestOf(s: GameState, owner: number, t: Tile): { stars: number; pop: number; rest: number } {
  const h = t.resource === 'whale' ? WHALE : FISH;
  if (!hasTech(s, owner, 'inuit:2')) return h;
  return { stars: Math.round(h.stars * 1.5), pop: h.pop, rest: Math.max(1, h.rest - DEEP_REST) };
}

/** Why the node cannot be harvested right now (stars excluded), or undefined. */
function nodeBlock(s: GameState, owner: number, t: Tile): string | undefined {
  if (!marine(t) || t.improvement) return 'Nothing to harvest';
  if (tileOwnerPlayer(s, t) !== owner || !cityById(s, t.owner)) return 'Outside your borders';
  const tech = t.resource === 'whale' ? 'whaling' : 'fishing';
  if (!hasTech(s, owner, tech)) return `Needs ${tech}`;
  if (restLeft(t) > 0) return `Thawed: re-freezes in ${restLeft(t)} turn${restLeft(t) === 1 ? '' : 's'}`;
  return undefined;
}

/** Land (and ice) tiles connected to the unit's tile. */
function landComponent(s: GameState, u: Unit): Set<number> {
  const seen = new Set<number>([u.y * s.size + u.x]);
  const queue = [tileAt(s, u.x, u.y)!];
  while (queue.length) {
    const t = queue.pop()!;
    for (const n of neighbors(s, t.x, t.y)) {
      const i = n.y * s.size + n.x;
      if (seen.has(i) || !isLand(n)) continue;
      seen.add(i);
      queue.push(n);
    }
  }
  return seen;
}

export const mech: Mechanic = {
  name: 'Glacial Freeze',
  blurb: 'Land units and cities freeze water into permanent ice bridges that chill enemies without fire techs; whale and fish nodes pay a huge lump of stars and population, then must re-freeze before reuse.',

  setup(s, owner) { counters(s, owner); },

  turnStart(s, owner) {
    const c = counters(s, owner);
    c.turnFrozen = 0;
    for (const t of s.tiles) { // depleted nodes re-freeze
      const r = restLeft(t);
      if (!r) continue;
      const { inuit: _i, ...rest } = t.data ?? {};
      t.data = r > 1 ? { ...rest, inuit: { rest: r - 1 } } : rest;
    }
    const aura = hasTech(s, owner, 'inuit:3'); // Sub-Zero Aura
    if (s.turn > 0 && s.turn % (aura ? AURA_EVERY : FREEZE_EVERY) === 0) { // the city aura
      for (const city of s.cities) {
        if (city.owner !== owner) continue;
        const t = neighbors(s, city.x, city.y).find((n) => n.terrain === 'shallow' && canFreeze(s, n) && !unitAt(s, n.x, n.y));
        if (t) freezeTile(s, owner, t, 'aura');
      }
    }
    for (const u of s.units) { // freeze damage
      if (u.owner === owner || !hostile(s, owner, u.owner) || u.hp <= 1) continue;
      const t = tileAt(s, u.x, u.y);
      if (!t || !isIce(t) || FIRE_TECHS.some((k) => hasTech(s, u.owner, k))) continue;
      const n = Math.min(FREEZE_DAMAGE + (aura ? 1 : 0), u.hp - 1);
      u.hp -= n;
      c.chilled++;
      emit({ type: 'damage', unitId: u.id, x: u.x, y: u.y, amount: n });
      if (aura) { s.players[owner].stars += AURA_STARS; emit({ type: 'stars', player: owner, x: u.x, y: u.y, amount: AURA_STARS }); }
    }
  },

  // Walking out onto adjacent open water (costs the whole move).
  extraMoves(s, owner, u): MoveOption[] {
    if (!isWalker(u, owner) || u.moved) return [];
    return neighbors(s, u.x, u.y).filter((t) => canFreeze(s, t) && !unitAt(s, t.x, t.y)).map((t) => ({ x: t.x, y: t.y, path: [{ x: t.x, y: t.y }] }));
  },

  afterMove(s, owner, u, _from, to) {
    if (u.owner !== owner || !isWalker(u, owner) || !canFreeze(s, to)) return;
    freezeTile(s, owner, to, 'walked');
  },

  actions(s, owner, t): Action[] {
    const acts: Action[] = [];
    if (canFreeze(s, t) && !unitAt(s, t.x, t.y)) {
      const ready = freezers(s, owner, t).length > 0;
      const poor = s.players[owner].stars < FREEZE_COST;
      acts.push({
        id: 'mech:freeze', label: 'Freeze water', icon: 'road', cost: FREEZE_COST,
        desc: 'A ready land unit beside this water turns it into permanent ice, a land bridge. (Or just walk onto it.)',
        enabled: ready && !poor,
        reason: !ready ? 'Needs a ready land unit next to it' : poor ? 'Not enough stars' : undefined,
      });
    }
    if (marine(t) && !t.improvement && tileOwnerPlayer(s, t) === owner) {
      const why = nodeBlock(s, owner, t) ?? (s.players[owner].stars < HARVEST_COST ? 'Not enough stars' : undefined);
      const h = harvestOf(s, owner, t);
      const whale = t.resource === 'whale';
      acts.push({
        id: 'mech:harvest', label: whale ? 'Whale Harvest' : 'Fish Harvest', icon: whale ? 'whale' : 'fish', cost: HARVEST_COST,
        desc: `+${h.stars}★ and +${h.pop} population at once. The node thaws for ${h.rest} turns, then re-freezes and can be harvested again.`,
        enabled: !why, reason: why, needs: why?.startsWith('Needs') ? (whale ? 'whaling' : 'fishing') : undefined,
      });
    }
    return acts;
  },

  doAction(s, owner, t, id) {
    const c = counters(s, owner);
    if (id === 'mech:freeze') {
      const u = freezers(s, owner, t)[0];
      if (!u || !canFreeze(s, t) || unitAt(s, t.x, t.y)) return false;
      freezeTile(s, owner, t, 'walked');
      u.moved = u.attacked = true;
      return true;
    }
    if (id === 'mech:harvest') {
      if (nodeBlock(s, owner, t)) return false; // the core already charged HARVEST_COST
      const city = cityById(s, t.owner)!;
      const h = harvestOf(s, owner, t);
      s.players[owner].stars += h.stars;
      emit({ type: 'stars', player: owner, x: t.x, y: t.y, amount: h.stars });
      const pop = h.pop + (t.resource === 'fish' && hasTech(s, owner, 'aquaculture') ? 1 : 0);
      emit({ type: 'harvest', player: owner, x: t.x, y: t.y, pop });
      addPop(s, city, pop);
      t.data = { ...t.data, inuit: { rest: h.rest } };
      if (t.resource === 'whale') c.whales++; else c.fish++;
      return true;
    }
    return false;
  },

  // The ordinary Harvest would consume the node for good; Inuit use the renewable one instead.
  block(s, _owner, pid, actionId, t) {
    if (s.players[pid].tribe !== 'inuit' || actionId !== 'harvest' || !marine(t)) return undefined;
    return 'Use the renewable harvest';
  },

  ai(s, owner) {
    const p = s.players[owner];
    if (p.stars >= HARVEST_COST) {
      for (const t of s.tiles) if (marine(t) && !t.improvement && tileOwnerPlayer(s, t) === owner && !nodeBlock(s, owner, t) && doAction(s, owner, t, 'mech:harvest')) return true;
    }
    // Bridge to a landmass we cannot walk to: freeze toward the nearest enemy city.
    const c = counters(s, owner);
    if (c.turnFrozen >= AI_FREEZES_PER_TURN) return false;
    const targets = s.cities.filter((k) => k.owner !== owner && isExplored(s, owner, k.x, k.y));
    if (!targets.length) return false;
    for (const u of s.units.filter((e) => isWalker(e, owner) && !e.moved && def(e).atk > 0).sort((a, b) => a.id - b.id)) {
      if (tileAt(s, u.x, u.y)!.cityId !== null) continue;
      const reach = landComponent(s, u);
      if (targets.some((k) => reach.has(k.y * s.size + k.x))) continue; // it can walk there
      const goal = targets.reduce((b, k) => (dist(u.x, u.y, k.x, k.y) < dist(u.x, u.y, b.x, b.y) ? k : b));
      const here = dist(u.x, u.y, goal.x, goal.y);
      const step = moveOptions(s, u)
        .filter((o) => !o.embark && isWater(tileAt(s, o.x, o.y)!) && dist(o.x, o.y, goal.x, goal.y) < here)
        .sort((a, b) => dist(a.x, a.y, goal.x, goal.y) - dist(b.x, b.y, goal.x, goal.y))[0];
      if (step && moveUnit(s, u, step.x, step.y)) { c.turnFrozen++; return true; }
    }
    return false;
  },
};
