import { TECH_BY_ID } from '../../data/techs';
import { UNITS } from '../../data/units';
import { unitFor } from '../../data/tribes';
import { emit } from '../events';
import { needWhy, spendNeeds } from '../goods';
import { dist, isLand, neighbors, tileAt } from '../grid';
import { spawnUnit } from '../mapgen';
import { citiesOf, cityById, eraWhy, hasTech, maxHp, removeUnit, tileOwnerPlayer, trainCost, unitAt } from '../rules';
import type { Action } from '../rules';
import type { City, GameState, Tile, Unit, UnitKind } from '../types';
import { hostile } from '../diplomacy';
import type { Mechanic } from './types';

// Purple Dye & Mercenary Contracts.
//
// Purple Dye (the empire bonus): every port and every market inside Carthaginian borders earns +1★ a turn.
//
// Mercenary Contracts: from any of its cities Carthage may hire a veteran soldier (`mech:merc:<kind>`) of a kind it can
// already train: warrior, archer, rider, swordsman, knight, or its own Sacred Band in place of the defender. The
// contract costs the normal training price x1.5 (rounded up) and uses the same tech, era, Iron and Horses as training.
// The mercenary stands on the city (or beside it when the city tile is taken), ready next turn, and is not supported
// by the city: it takes none of its unit slots. One hire per city per turn, and never more living mercenaries than
// Carthage has cities. Each one is paid 1★ at the start of every Carthaginian turn; when the treasury can't cover the
// wage bill, the most recently hired mercenaries walk off until it can.

export const MERC_MULT = 1.5;
export const MERC_UPKEEP = 1;
export const MERC_BASES: UnitKind[] = ['warrior', 'archer', 'rider', 'defender', 'swordsman', 'knight'];

const isCarthage = (s: GameState, pid: number) => s.players[pid]?.tribe === 'carthage';

// ---------------------------------------------------------------- purple dye

/** Ports and markets inside `owner`'s borders. */
export const dyeWorks = (s: GameState, owner: number): Tile[] =>
  s.tiles.filter((t) => (t.improvement === 'port' || t.improvement === 'market') && tileOwnerPlayer(s, t) === owner);

export const dyeIncome = (s: GameState, owner: number) => dyeWorks(s, owner).length;

// ---------------------------------------------------------------- mercenaries

export const isMerc = (u: Unit) => u.data?.merc !== undefined;
/** Living mercenaries of `owner`, oldest contract first. */
export const mercsOf = (s: GameState, owner: number): Unit[] =>
  s.units.filter((u) => u.owner === owner && isMerc(u)).sort((a, b) => Number(a.data!.merc) - Number(b.data!.merc) || a.id - b.id);
export const mercCap = (s: GameState, owner: number) => citiesOf(s, owner).length;
export const mercUpkeep = (s: GameState, owner: number) => mercsOf(s, owner).length * MERC_UPKEEP;

/** The kinds Carthage may hire (its unique stands in for the defender). */
export const mercKinds = (s: GameState, owner: number): UnitKind[] => MERC_BASES.map((k) => unitFor(s.players[owner].tribe, k));
export const mercCost = (s: GameState, owner: number, k: UnitKind) => Math.ceil(trainCost(s, owner, k) * MERC_MULT);

/** Where a hired unit appears: the city tile if free, else a free land tile beside it. */
export function mercSpot(s: GameState, c: City): Tile | undefined {
  const home = tileAt(s, c.x, c.y)!;
  if (!unitAt(s, home.x, home.y)) return home;
  return neighbors(s, c.x, c.y).filter((t) => isLand(t) && t.terrain !== 'mountain' && !unitAt(s, t.x, t.y)).sort((a, b) => a.y - b.y || a.x - b.x)[0];
}

/** A running count of contracts signed, so the newest mercenary is always known. */
const nextContract = (s: GameState, owner: number) => {
  const p = s.players[owner];
  const n = Number(p.mech?.contracts ?? 0) + 1;
  p.mech = { ...(p.mech ?? {}), contracts: n };
  return n;
};

/** Why `owner` can't hire `k` in city `c` right now (stars aside), or null. */
export function hireCheck(s: GameState, owner: number, c: City, k: UnitKind): string | null {
  if (c.owner !== owner) return 'Not your city';
  if (!mercKinds(s, owner).includes(k)) return 'No such contract';
  if (!hasTech(s, owner, UNITS[k].tech)) return `Needs ${TECH_BY_ID[UNITS[k].tech!]?.name ?? UNITS[k].tech}`;
  const era = eraWhy(s, owner, k);
  if (era) return era;
  const need = needWhy(s, owner, k);
  if (need) return need;
  if (c.data?.mercTurn === s.turn) return 'This city already hired a mercenary this turn';
  if (mercsOf(s, owner).length >= mercCap(s, owner)) return `At most ${mercCap(s, owner)} mercenaries (one per city)`;
  if (!mercSpot(s, c)) return 'No free tile in or beside the city';
  return null;
}

/** Sign the contract: the veteran appears, free of the city's unit slots. Stars are paid by the caller. */
export function hire(s: GameState, owner: number, c: City, k: UnitKind): Unit | null {
  if (hireCheck(s, owner, c, k)) return null;
  const spot = mercSpot(s, c)!;
  spendNeeds(s, owner, k); // Iron and Horses, as for training
  const u = spawnUnit(s, k, owner, spot.x, spot.y, null);
  u.veteran = true;
  u.hp = maxHp(u);
  u.data = { ...(u.data ?? {}), merc: nextContract(s, owner) };
  c.data = { ...(c.data ?? {}), mercTurn: s.turn };
  const p = s.players[owner];
  p.mech = { ...(p.mech ?? {}), hired: Number(p.mech?.hired ?? 0) + 1 };
  return u;
}

/** Turn start: pay each mercenary; while the wages can't be met, the newest contract walks off. */
export function payMercs(s: GameState, owner: number) {
  const p = s.players[owner];
  const mercs = mercsOf(s, owner);
  while (mercs.length && p.stars < mercs.length * MERC_UPKEEP) {
    const u = mercs.pop()!;
    removeUnit(s, u, null);
    emit({ type: 'toast', player: owner, text: `Unpaid, a mercenary ${UNITS[u.kind].name} deserts. Keep ${MERC_UPKEEP}★ a turn for each contract.` });
    p.mech = { ...(p.mech ?? {}), deserted: Number(p.mech?.deserted ?? 0) + 1 };
  }
  const wage = mercs.length * MERC_UPKEEP;
  p.stars -= wage;
  p.mech = { ...(p.mech ?? {}), lastWage: wage };
}

// ---------------------------------------------------------------- AI

/** A Carthaginian city with a hostile unit within 3 tiles. */
function threatened(s: GameState, owner: number): City | undefined {
  let best: { c: City; d: number } | undefined;
  for (const c of citiesOf(s, owner)) {
    for (const u of s.units) {
      if (u.owner === owner || !hostile(s, owner, u.owner) || UNITS[u.kind].atk <= 0) continue;
      const d = dist(u.x, u.y, c.x, c.y);
      if (d <= 3 && (!best || d < best.d)) best = { c, d };
    }
  }
  return best?.c;
}

/** At open war with another empire (only with diplomacy on; otherwise everyone is a rival and threat decides). */
const atWar = (s: GameState, owner: number) =>
  !!s.diplo && s.players.some((p) => p.id !== owner && p.alive && !p.neutral && hostile(s, owner, p.id) && citiesOf(s, p.id).some((c) => citiesOf(s, owner).some((m) => dist(c.x, c.y, m.x, m.y) <= 8)));

export const mech: Mechanic = {
  name: 'Purple Dye & Mercenary Contracts',
  blurb: 'Every port and market pays +1★ a turn. Any city may hire a veteran mercenary for 1.5× the training price; it needs no unit slot but costs 1★ a turn, and deserts when unpaid. One per city.',

  income(s, owner) {
    return isCarthage(s, owner) ? dyeIncome(s, owner) : 0;
  },

  turnStart(s, owner) {
    if (!isCarthage(s, owner)) return;
    payMercs(s, owner);
  },

  actions(s, owner, t): Action[] {
    if (!isCarthage(s, owner) || t.cityId === null) return [];
    const c = cityById(s, t.cityId);
    if (!c || c.owner !== owner) return [];
    const stars = s.players[owner].stars;
    const out: Action[] = [];
    for (const k of mercKinds(s, owner)) {
      const d = UNITS[k];
      if (!hasTech(s, owner, d.tech)) continue; // contracts appear as the tech to field them arrives
      const cost = mercCost(s, owner, k);
      const why = hireCheck(s, owner, c, k) ?? (stars < cost ? 'Not enough stars' : null);
      out.push({
        id: `mech:merc:${k}`, label: `Hire Mercenary ${d.name}`, cost, icon: k, enabled: !why, reason: why ?? undefined,
        desc: `A veteran ${d.name} (⚔${d.atk} 🛡${d.def} ❤${d.hp + 5}), ready next turn. Takes no unit slot but costs ${MERC_UPKEEP}★ a turn; unpaid, it deserts.`,
      });
    }
    return out;
  },

  doAction(s, owner, t, id) {
    if (!id.startsWith('mech:merc:') || !isCarthage(s, owner) || t.cityId === null) return false;
    const c = cityById(s, t.cityId);
    if (!c) return false;
    return !!hire(s, owner, c, id.slice('mech:merc:'.length) as UnitKind);
  },

  // Hire when a city is threatened (or the empire is at war), and only from spare stars that leave the wage bill safe.
  ai(s, owner) {
    if (!isCarthage(s, owner)) return false;
    const p = s.players[owner];
    const danger = threatened(s, owner);
    if (!danger && !atWar(s, owner)) return false;
    const mercs = mercsOf(s, owner).length;
    if (mercs >= mercCap(s, owner)) return false;
    const reserve = 4 + (mercs + 1) * MERC_UPKEEP * 2; // two turns of wages kept back, and a little more
    const cities = danger ? [danger, ...citiesOf(s, owner).filter((c) => c !== danger)] : citiesOf(s, owner);
    // strongest affordable contract first
    const kinds = mercKinds(s, owner).sort((a, b) => mercCost(s, owner, b) - mercCost(s, owner, a));
    for (const c of cities) {
      for (const k of kinds) {
        const cost = mercCost(s, owner, k);
        if (p.stars < cost + reserve || hireCheck(s, owner, c, k)) continue;
        if (!hire(s, owner, c, k)) continue;
        p.stars -= cost; // the core charges only for human-issued actions; the AI pays here
        return true;
      }
      if (danger) break; // only the city in danger hires
    }
    return false;
  },
};
