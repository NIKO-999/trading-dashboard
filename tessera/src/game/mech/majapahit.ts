import { emit } from '../events';
import { dist, isWater, neighbors, tileAt } from '../grid';
import { hostile } from '../diplomacy';
import { citiesOf, isExplored, moveOptions, moveUnit } from '../rules';
import type { Action } from '../rules';
import type { City, GameState, Tile, Unit, UnitKind } from '../types';
import type { Mechanic } from './types';

// The Spice Trade Jongs, and the Mandala of Nusantara.
//
// Empire bonus (Spice Islands): every fish and fruit harvest pays +1★ (in `rules.ts`, next to the Sacred Hunt line).
//
// Core: at the start of each Majapahit turn every jong (a Majapahit `ship`, `warship` or `tradeship`; the little
// canoes, `boat`, ferry troops and do not trade) standing beside a coastal city of another empire trades there for
// TRADE_STARS★. One ship trades with one city and one city takes one ship (`portVisits`: a fixed greedy matching, ships
// with the fewest ports beside them first, ids breaking ties, so the result is deterministic).
// If Majapahit is hostile to that city's owner (no treaty, see diplomacy `hostile`), the visit is a raid: Majapahit still
// takes TRADE_STARS★ and the owner loses RAID_LOSS★ (never below 0). Free Cities (held by the neutral owner) are
// foreign ports too, but they always trade and are never raided: city-states welcome merchants.
//
// Mandala tribute (`mech:mandala`, at the capital, MANDALA_COST★, once every MANDALA_COOLDOWN turns): every foreign
// coastal city with a Majapahit jong beside it right now pays +1★ a turn for the next MANDALA_TURNS turns (`income`).
// The count is taken when the action is used; it does not change if the ships sail on.

export const TRADE_STARS = 2;
export const RAID_LOSS = 1;
export const MANDALA_COST = 5;
export const MANDALA_COOLDOWN = 6;
export const MANDALA_TURNS = 5;
/** Kinds of Majapahit hull that trade (the jongs). */
export const JONG_KINDS: UnitKind[] = ['ship', 'warship', 'tradeship'];

export interface PortVisit { unit: number; city: number; x: number; y: number; cx: number; cy: number; raid: boolean }
interface MandalaState { turn: number; n: number }

const isMaja = (s: GameState, pid: number) => s.players[pid]?.tribe === 'majapahit';
export const isJong = (u: Unit) => JONG_KINDS.includes(u.kind);

/** A city standing on the sea: at least one water tile beside it. */
export const isCoastal = (s: GameState, c: City) => neighbors(s, c.x, c.y).some(isWater);

/** Cities of other empires (or Free Cities) on the coast. */
export const foreignPorts = (s: GameState, owner: number): City[] =>
  s.cities.filter((c) => c.owner !== owner && isCoastal(s, c)).sort((a, b) => a.id - b.id);

/** Is a visit by `owner` to a city of `cityOwner` a raid? Neutral (Free City) ports always trade. */
export const isRaid = (s: GameState, owner: number, cityOwner: number) =>
  !s.players[cityOwner]?.neutral && hostile(s, owner, cityOwner);

/** The jongs of `owner` beside foreign ports right now, matched one ship to one city. */
export function portVisits(s: GameState, owner: number): PortVisit[] {
  const ports = foreignPorts(s, owner);
  if (!ports.length) return [];
  const taken = new Set<number>();
  const out: PortVisit[] = [];
  // ships with fewer ports beside them choose first, and each takes the port fewest other ships could use (ids break
  // ties), so a ship between two ports leaves the shared one to a ship that has no other
  const near = new Map<number, City[]>();
  for (const u of s.units) if (u.owner === owner && isJong(u)) near.set(u.id, ports.filter((p) => dist(p.x, p.y, u.x, u.y) === 1));
  const demand = (c: City) => [...near.values()].filter((l) => l.includes(c)).length;
  const ships = s.units.filter((u) => near.get(u.id)?.length).sort((a, b) => near.get(a.id)!.length - near.get(b.id)!.length || a.id - b.id);
  for (const u of ships) {
    const c = near.get(u.id)!.filter((p) => !taken.has(p.id)).sort((a, b) => demand(a) - demand(b) || a.id - b.id)[0];
    if (!c) continue;
    taken.add(c.id);
    out.push({ unit: u.id, city: c.id, x: u.x, y: u.y, cx: c.x, cy: c.y, raid: isRaid(s, owner, c.owner) });
  }
  return out;
}

/** Foreign coastal cities with any Majapahit jong beside them (what the mandala counts). */
export const mandalaCount = (s: GameState, owner: number): number =>
  foreignPorts(s, owner).filter((c) => s.units.some((u) => u.owner === owner && isJong(u) && dist(c.x, c.y, u.x, u.y) === 1)).length;

const mandalaOf = (s: GameState, owner: number) => s.players[owner].mech?.mandala as MandalaState | undefined;

/** Stars a turn the mandala tribute pays now (0 when none is running). */
export function mandalaIncome(s: GameState, owner: number): number {
  const m = mandalaOf(s, owner);
  return m && s.turn > m.turn && s.turn <= m.turn + MANDALA_TURNS ? m.n : 0;
}
/** Turns of tribute still to come (0 when none). */
export function mandalaLeft(s: GameState, owner: number): number {
  const m = mandalaOf(s, owner);
  return m ? Math.max(0, m.turn + MANDALA_TURNS - s.turn) : 0;
}

const capitalTile = (s: GameState, owner: number): Tile | undefined => {
  const c = citiesOf(s, owner).find((e) => e.capital) ?? citiesOf(s, owner)[0];
  return c && tileAt(s, c.x, c.y);
};

/** Why the mandala cannot be proclaimed now (stars aside), or null. */
export function mandalaWhy(s: GameState, owner: number): string | null {
  const m = mandalaOf(s, owner);
  if (m && s.turn - m.turn < MANDALA_COOLDOWN) return `Ready again in ${MANDALA_COOLDOWN - (s.turn - m.turn)} turns`;
  if (!mandalaCount(s, owner)) return 'No jong lies beside a foreign port';
  return null;
}

function proclaim(s: GameState, owner: number): boolean {
  if (mandalaWhy(s, owner)) return false;
  const n = mandalaCount(s, owner);
  const p = s.players[owner];
  p.mech = { ...(p.mech ?? {}), mandala: { turn: s.turn, n } };
  const cap = capitalTile(s, owner)!;
  emit({ type: 'harvest', player: owner, x: cap.x, y: cap.y, pop: 0 });
  emit({ type: 'toast', player: owner, text: `Mandala of Nusantara: ${n} port${n === 1 ? '' : 's'} pay tribute, +${n}★ a turn for ${MANDALA_TURNS} turns.` });
  return true;
}

/** Pay out this turn's port visits. */
function trade(s: GameState, owner: number) {
  const visits = portVisits(s, owner);
  const p = s.players[owner];
  let raids = 0;
  for (const v of visits) {
    p.stars += TRADE_STARS;
    emit({ type: 'stars', player: owner, x: v.x, y: v.y, amount: TRADE_STARS });
    if (!v.raid) continue;
    raids++;
    const c = s.cities.find((e) => e.id === v.city)!;
    const victim = s.players[c.owner];
    const lost = Math.min(RAID_LOSS, Math.max(0, victim.stars));
    victim.stars -= lost;
    emit({ type: 'toast', player: c.owner, text: `Majapahit jongs raid ${c.name}${lost ? `: you lose ${lost}★` : ''}.` });
  }
  if (visits.length) {
    const earned = visits.length * TRADE_STARS;
    emit({ type: 'toast', player: owner, text: `Spice trade: ${visits.length} port${visits.length === 1 ? '' : 's'} visited, +${earned}★${raids ? ` (${raids} raided)` : ''}.` });
  }
  p.mech = {
    ...(p.mech ?? {}),
    lastTrade: visits.length * TRADE_STARS, lastPorts: visits.length,
    tradeStars: ((p.mech?.tradeStars as number) ?? 0) + visits.length * TRADE_STARS,
    raids: ((p.mech?.raids as number) ?? 0) + raids,
  };
}

/** Idle jongs of `owner`: not moved, carrying nobody. */
const idleJongs = (s: GameState, owner: number) =>
  s.units.filter((u) => u.owner === owner && isJong(u) && !u.moved && !u.carrying).sort((a, b) => a.id - b.id);

export const mech: Mechanic = {
  name: 'Spice Trade Jongs',
  blurb: `Your jongs (galleys and warships) that start your turn beside another empire's coastal city trade there for ${TRADE_STARS}★, one ship per port; at war it is a raid and the owner also loses ${RAID_LOSS}★. Mandala tribute at the capital (${MANDALA_COST}★): +1★ a turn per visited port for ${MANDALA_TURNS} turns. Spice Islands: fish and fruit harvests pay +1★.`,

  setup(s, owner) {
    const p = s.players[owner];
    p.mech = { ...(p.mech ?? {}), tradeStars: 0, raids: 0, lastTrade: 0, lastPorts: 0 };
  },

  turnStart(s, owner) {
    if (s.turn === 0 || !isMaja(s, owner)) return;
    trade(s, owner);
  },

  income(s, owner) { return isMaja(s, owner) ? mandalaIncome(s, owner) : 0; },

  actions(s, owner, t): Action[] {
    if (!isMaja(s, owner) || capitalTile(s, owner) !== t) return [];
    const why = mandalaWhy(s, owner) ?? (s.players[owner].stars < MANDALA_COST ? 'Not enough stars' : null);
    const n = mandalaCount(s, owner);
    return [{
      id: 'mech:mandala', label: 'Mandala Tribute', cost: MANDALA_COST, icon: 'flag', enabled: !why, reason: why ?? undefined,
      desc: `The ports your jongs lie beside swear to the Mandala: +1★ a turn for each (${n} now) for ${MANDALA_TURNS} turns. Once every ${MANDALA_COOLDOWN} turns.`,
    }];
  },

  doAction(s, owner, t, id) {
    if (id !== 'mech:mandala' || !isMaja(s, owner) || capitalTile(s, owner) !== t) return false;
    return proclaim(s, owner);
  },

  // Proclaim the mandala when it pays back; then send idle jongs to lie beside foreign ports.
  ai(s, owner) {
    if (!isMaja(s, owner)) return false;
    const p = s.players[owner];
    const n = mandalaCount(s, owner);
    if (n * MANDALA_TURNS > MANDALA_COST && p.stars >= MANDALA_COST + 2 && !mandalaWhy(s, owner) && capitalTile(s, owner)) {
      p.stars -= MANDALA_COST; // the core charges only for human-issued actions; the AI pays here
      if (proclaim(s, owner)) return true;
      p.stars += MANDALA_COST;
    }
    const ports = foreignPorts(s, owner).filter((c) => isExplored(s, owner, c.x, c.y));
    if (!ports.length) return false;
    // ports already served by a jong that stays put
    const served = new Set(portVisits(s, owner).map((v) => v.city));
    const staying = new Set(portVisits(s, owner).map((v) => v.unit));
    for (const u of idleJongs(s, owner)) {
      if (staying.has(u.id)) continue;
      const open = ports.filter((c) => !served.has(c.id));
      if (!open.length) return false;
      // peaceful ports first (a raid makes enemies), then the nearest
      const score = (x: number, y: number) => Math.min(...open.map((c) => dist(c.x, c.y, x, y) * 2 + (isRaid(s, owner, c.owner) ? 1 : 0)));
      const here = score(u.x, u.y);
      let pick: { x: number; y: number; v: number } | null = null;
      for (const o of moveOptions(s, u)) {
        const t = tileAt(s, o.x, o.y)!;
        if (!isWater(t) || o.disembark || o.embark || t.cityId !== null) continue;
        if (s.units.some((e) => e.x === o.x && e.y === o.y)) continue;
        const v = score(o.x, o.y);
        if (v < here && (!pick || v < pick.v || (v === pick.v && (o.y < pick.y || (o.y === pick.y && o.x < pick.x))))) pick = { x: o.x, y: o.y, v };
      }
      if (pick && moveUnit(s, u, pick.x, pick.y)) return true;
    }
    return false;
  },
};
