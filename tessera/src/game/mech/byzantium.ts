import { emit } from '../events';
import { dist, isWater, neighbors, tileAt } from '../grid';
import { cityById, def, removeUnit } from '../rules';
import type { Action } from '../rules';
import { hostile } from '../diplomacy';
import type { City, GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

// Greek Fire (core) + Imperial Diplomacy (economy), with the Theodosian Walls empire bonus.
//
// Walls: a Byzantine unit standing in one of its own cities defends +1 (stat hook).
//
// Core: Byzantine ships carry siphons of Greek fire. Any enemy unit a Byzantine ship attacks (and does not kill) catches
// fire: `unit.data.fire` holds the burns still to come (FIRE_TURNS) and `unit.data.fireBy` the Byzantine player who lit it.
// The walls of a coastal Byzantine city have siphons too: an enemy that attacks a Byzantine unit standing in such a city,
// and survives, catches fire as well. A burning unit takes FIRE_DMG at each burn, which can kill (the kill is Byzantium's);
// when the counter runs out the fire goes out. Only units hostile to Byzantium burn (allies and treaty partners never do;
// the neutral beasts of the wild do).
// Simplification: the rules only call a mechanic's turnStart on its owner's own turn, so the fire burns at the start of
// the *Byzantine* turn that lit it, not the burning unit's; either way it burns once a round, FIRE_TURNS times.
//
// Economy: from one of its cities Byzantium may pay off the enemies near it (`mech:tribute`): it costs TRIBUTE_BASE plus
// TRIBUTE_PER for each enemy unit within TRIBUTE_REACH tiles of the city, and every such unit is bought for its owner's
// next turn: its blows that turn deal no damage (combat hook; it may still move and still takes a counter-blow). At most
// once every TRIBUTE_COOLDOWN turns per city. The beasts of the wild cannot be bribed.
// Simplification: the rules only ask the attacker's own mechanic for its `attackTargets`, so a Byzantine mechanic cannot
// strike a foreign unit's targets from its list; the bribe empties the blow instead.

export const WALLS_DEF = 1;
export const FIRE_TURNS = 2;
export const FIRE_DMG = 2;
export const TRIBUTE_BASE = 5;
export const TRIBUTE_PER = 2;
export const TRIBUTE_REACH = 3;
export const TRIBUTE_COOLDOWN = 5;

const isByz = (s: GameState, pid: number) => s.players[pid]?.tribe === 'byzantium';
const tileOf = (s: GameState, u: { x: number; y: number }) => tileAt(s, u.x, u.y)!;

/** The Byzantine city whose tile `u` stands on (a city of `owner`), if any. */
function ownCityUnder(s: GameState, owner: number, u: Unit): City | undefined {
  const t = tileOf(s, u);
  if (t.cityId === null) return undefined;
  const c = cityById(s, t.cityId);
  return c && c.owner === owner ? c : undefined;
}

/** Does the city stand on the coast (water beside it)? Its walls then carry siphons. */
export const coastalCity = (s: GameState, c: City) => neighbors(s, c.x, c.y).some(isWater);

/** Burns still to come on this unit (0 when it is not on fire). */
export const burning = (u: Unit): number => Number(u.data?.fire ?? 0);

/** Set `u` ablaze for FIRE_TURNS burns, lit by Byzantine player `by`. */
export function ignite(u: Unit, by: number) {
  u.data = { ...(u.data ?? {}), fire: FIRE_TURNS, fireBy: by };
}

function douse(u: Unit) {
  if (!u.data) return;
  delete u.data.fire;
  delete u.data.fireBy;
}

/** One burn of every unit `owner` set ablaze: FIRE_DMG each, which may kill; the fire goes out after its last burn. */
export function burnTick(s: GameState, owner: number) {
  for (const u of [...s.units]) {
    if (!burning(u) || u.data?.fireBy !== owner) continue;
    if (!hostile(s, owner, u.owner)) { douse(u); continue; } // a treaty was signed: the fire is put out
    u.hp -= FIRE_DMG;
    emit({ type: 'damage', unitId: u.id, x: u.x, y: u.y, amount: FIRE_DMG, crit: 'Greek fire' });
    if (u.hp <= 0) {
      removeUnit(s, u, null);
      emit({ type: 'death', unitId: u.id, x: u.x, y: u.y, owner: u.owner, kind: u.kind });
      s.players[owner].kills++;
      continue;
    }
    const left = burning(u) - 1;
    if (left > 0) u.data!.fire = left;
    else douse(u);
  }
}

/** Units of every empire currently burning with `owner`'s fire. */
export const ablaze = (s: GameState, owner: number) => s.units.filter((u) => burning(u) > 0 && u.data?.fireBy === owner);

// ---------------------------------------------------------------- tribute

/** Enemy units (not beasts) within reach of the city: the ones a tribute would buy off. */
export const tributeTargets = (s: GameState, owner: number, c: City) =>
  s.units.filter((u) => u.owner !== owner && hostile(s, owner, u.owner) && !s.players[u.owner].neutral && dist(u.x, u.y, c.x, c.y) <= TRIBUTE_REACH);

export const tributeCost = (n: number) => TRIBUTE_BASE + TRIBUTE_PER * n;

/** Turns until the city may pay tribute again (0 = now). */
export function tributeWait(s: GameState, c: City): number {
  const last = c.data?.tribute as number | undefined;
  return last === undefined ? 0 : Math.max(0, last + TRIBUTE_COOLDOWN - s.turn);
}

/** The turn number of `pid`'s next turn, seen from the turn now being played. */
const nextTurnOf = (s: GameState, pid: number) => (pid > s.current ? s.turn : s.turn + 1);

/** Is this unit bought off right now (its owner's turn, the turn it was paid for)? */
export const bribed = (s: GameState, u: Unit) => u.data?.bribe === s.turn && s.current === u.owner;
/** Is this unit bought off, now or for its coming turn? (For the map and the HUD.) */
export const underTribute = (s: GameState, u: Unit) => u.data?.bribe !== undefined && (u.data.bribe as number) >= s.turn;

function tributeCity(s: GameState, owner: number, t: Tile): City | undefined {
  if (t.cityId === null) return undefined;
  const c = cityById(s, t.cityId);
  return c && c.owner === owner && c.x === t.x && c.y === t.y ? c : undefined;
}

export function payTribute(s: GameState, owner: number, c: City): number {
  const foes = tributeTargets(s, owner, c);
  for (const u of foes) u.data = { ...(u.data ?? {}), bribe: nextTurnOf(s, u.owner) };
  c.data = { ...(c.data ?? {}), tribute: s.turn };
  emit({ type: 'toast', player: owner, text: `Imperial Diplomacy: ${foes.length} enemy unit${foes.length === 1 ? '' : 's'} near ${c.name} will hold back their blows next turn.` });
  return foes.length;
}

export const mech: Mechanic = {
  name: 'Greek Fire',
  blurb: 'Byzantine ships and the siphons on coastal city walls set their foes ablaze: a burning unit takes 2 damage a turn for 2 turns. Gold buys peace: pay off every enemy near a city so their blows land empty for a turn. Theodosian Walls: your units in your cities defend +1.',

  // Theodosian Walls
  stat(s, owner, u, stat) {
    if (stat !== 'def' || u.owner !== owner) return 0;
    return ownCityUnder(s, owner, u) ? WALLS_DEF : 0;
  },

  combat(s, owner, a, _d, ctx) {
    // a unit Byzantium paid off strikes empty air on the turn it was paid for
    if (a.owner !== owner && bribed(s, a) && hostile(s, owner, a.owner)) {
      ctx.dmg = 0;
      ctx.tag = 'Bribed';
    }
  },

  afterAttack(s, owner, a, d, info) {
    // a Byzantine ship's siphon sets the target ablaze
    if (a.owner === owner && def(a).naval && !info.killed && s.units.includes(d) && hostile(s, owner, d.owner)) ignite(d, owner);
    // the siphons on a coastal city's walls answer an attack on its garrison
    if (d.owner === owner && a.owner !== owner && s.units.includes(a) && hostile(s, owner, a.owner)) {
      const c = ownCityUnder(s, owner, d);
      if (c && coastalCity(s, c)) ignite(a, owner);
    }
  },

  turnStart(s, owner) {
    burnTick(s, owner);
    for (const u of s.units) if (u.data?.bribe !== undefined && (u.data.bribe as number) < s.turn) delete u.data.bribe; // spent bribes
  },

  actions(s, owner, t): Action[] {
    const c = tributeCity(s, owner, t);
    if (!c) return [];
    const n = tributeTargets(s, owner, c).length;
    const cost = tributeCost(n);
    const wait = tributeWait(s, c);
    const p = s.players[owner];
    const reason = n === 0 ? `No enemy within ${TRIBUTE_REACH} tiles` : wait > 0 ? `Envoys return in ${wait} turn${wait === 1 ? '' : 's'}` : p.stars < cost ? 'Not enough stars' : undefined;
    return [{
      id: 'mech:tribute', label: 'Pay Tribute',
      desc: `Imperial Diplomacy: buy off the ${n} enemy unit${n === 1 ? '' : 's'} within ${TRIBUTE_REACH} tiles: their blows deal no damage on their next turn. Once every ${TRIBUTE_COOLDOWN} turns per city.`,
      cost, enabled: !reason, reason, icon: 'market',
    }];
  },

  doAction(s, owner, t, id) {
    if (id !== 'mech:tribute') return false;
    const c = tributeCity(s, owner, t);
    if (!c || tributeWait(s, c) > 0 || tributeTargets(s, owner, c).length === 0) return false;
    payTribute(s, owner, c);
    return true;
  },

  ai(s, owner) {
    if (!isByz(s, owner)) return false;
    const p = s.players[owner];
    for (const c of s.cities) {
      if (c.owner !== owner || tributeWait(s, c) > 0) continue;
      const foes = tributeTargets(s, owner, c);
      // worth it when an army gathers at the gates (or the city is under real threat) and the treasury can spare it
      const threat = foes.filter((u) => def(u).atk > 0 && dist(u.x, u.y, c.x, c.y) <= 2).length;
      if (foes.length < 2 || threat < 1) continue;
      const cost = tributeCost(foes.length);
      if (p.stars < cost + 4) continue;
      p.stars -= cost; // the core charges only for human-issued actions; the AI pays here
      return mech.doAction!(s, owner, tileOf(s, c), 'mech:tribute');
    }
    return false;
  },
};

