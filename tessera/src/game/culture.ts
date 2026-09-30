// Dynamic Cultural Assimilation, part 1: Culture Blending.
//
// Taking a city from another people lets the conqueror adopt ONE sub-trait of that people's identity. The city's origin
// (the tribe that first held it, `city.data.origin`, recorded by rules.capture and shared with the Ottoman mechanic) decides
// whose ways are offered, so a Roman who takes a Viking-founded city may learn Coastal Pillage from it.
//  - The registry below holds 2-3 sub-traits per empire: its historical strength (data/traits.ts `pros`), the first
//    suitable step of its skill line (data/uniqueTechs.ts), and for some empires a light version of their mechanic
//    (Viking coastal raze, Zulu horns, Japanese kiai, Mongol feint, Persian tribute, Ottoman levy).
//  - Perk sub-traits flow through game/perks.perksOf (the perks are copied into `player.culture.adopted`); mechanic sub-traits are small `Mechanic` hook sets that
//    mech/index.ts runs for the adopting player alongside its own empire's mechanic.
//  - Each origin people can be adopted from once, and an empire holds at most MAX_ADOPTED traditions.
//  - The choice waits in `player.culture.offers` until it is made: a modal for humans (ui/culture.ts), the best-scoring
//    option for the AI (`aiAdopt`, called at the top of ai.aiStep).
// Traits that only name "your unique unit" are skipped: they would mean the adopter's own unique unit, not the donor's.
import { TRAITS } from '../data/traits';
import { TRIBES } from '../data/tribes';
import { UNIQUE_TECHS } from '../data/uniqueTechs';
import { UNITS } from '../data/units';
import { emit } from './events';
import { dist, isWater, neighbors } from './grid';
import type { Mechanic } from './mech/types';
import { describePerk, MOUNTED_KINDS, type Perk } from './perks';
import { addPop, cityById, citiesOf, def, moveOptions, moveUnit, tileOwnerPlayer, unitAt } from './rules';
import type { Action } from './rules';
import type { City, CultureState, GameState, Tile, TribeId, Unit } from './types';

/** Most traditions one empire can hold. */
export const MAX_ADOPTED = 3;
/** Most sub-traits offered for one capture. */
export const OFFER_SIZE = 3;
/** Stars per improvement cost when pillaging a coast (Vikings themselves take 3x). */
export const PILLAGE_MULT = 2;
/** Chance an adopted Kiai strike lands (Japan's own is 30%). */
export const KIAI_LITE = 0.15;
/** Damage multiplier of adopted Horns against a hemmed-in enemy (Zulu's own is 3x and no counter). */
export const HORNS_MULT = 1.5;
/** Your foot soldiers around an enemy that make Horns count (as in the Zulu formation). */
export const HORNS_SIZE = 3;
/** Stars for each city taken with Royal Tribute adopted (Persia's own is 3). */
export const TRIBUTE_LITE = 2;

export interface SubTrait {
  id: string; // `${tribe}:${key}`
  from: TribeId;
  name: string;
  why: string;
  perks: Perk[];
  /** A light version of the donor's mechanic, run for the adopter (see mech/index.ts). */
  hook?: Mechanic;
  hookDesc?: string;
  /** How much the AI thinks the hook is worth (perks are valued from the state). */
  value?: number;
}

// ---------------------------------------------------------------- mechanic sub-traits

// (Nothing here imports the empire mechanic files: they import the rules, which import this module, so a static import
// would make module loading order-dependent. The few numbers shared with them are repeated instead.)
const coastal = (s: GameState, t: Tile) => neighbors(s, t.x, t.y).some(isWater);
/** Star cost of building each improvement, the base of the pillage payout (as in mech/vikings). */
const IMPROVEMENT_COST: Partial<Record<string, number>> = { farm: 5, mine: 5, lumber: 3, port: 7, temple: 10, market: 8 };

/** The unit of `owner` that may pillage this coastal tile now, if any. */
function pillageCheck(s: GameState, owner: number, t: Tile): Unit | null {
  const u = unitAt(s, t.x, t.y);
  if (!u || u.owner !== owner || !t.improvement || t.cityId !== null || !coastal(s, t)) return null;
  const host = tileOwnerPlayer(s, t);
  if (host === null || host === owner || u.data?.pillage === s.turn) return null;
  return u;
}
const pillageValue = (t: Tile) => PILLAGE_MULT * (IMPROVEMENT_COST[t.improvement!] ?? 5);

function pillage(s: GameState, owner: number, u: Unit, t: Tile) {
  const value = pillageValue(t);
  const host = cityById(s, t.owner);
  t.improvement = null;
  s.players[owner].stars += value;
  emit({ type: 'stars', player: owner, x: t.x, y: t.y, amount: value });
  if (host) addPop(s, host, -1);
  u.data = { ...u.data, pillage: s.turn };
  u.attacked = true;
  emit({ type: 'toast', player: owner, text: `Coastal pillage: +${value}★.` });
}

/** Deterministic 0..1 roll for an adopted Kiai (its own salt, so it never agrees with Japan's by accident). */
function kiaiRoll(s: GameState, a: Unit, d: Unit): number {
  let h = (s.seed ^ 0x5bd1e995 ^ Math.imul(s.turn + 7, 0x9e3779b1) ^ Math.imul(a.id + 3, 0x85ebca6b) ^ Math.imul(d.id + 5, 0xc2b2ae35)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export const isKiaiLite = (s: GameState, a: Unit, d: Unit) => kiaiRoll(s, a, d) < KIAI_LITE;

const isMelee = (u: Unit) => { const d = UNITS[u.kind]; return d.atk > 0 && d.range === 1 && !d.naval; };
const hornsAround = (s: GameState, owner: number, x: number, y: number) => s.units.filter((e) => e.owner === owner && isMelee(e) && dist(e.x, e.y, x, y) === 1);
/** Units that may feint: land riders and archers without the `escape` skill (those already ride away). */
const canFeint = (u: Unit) => !def(u).naval && !def(u).skills.includes('escape') && (MOUNTED_KINDS.includes(u.kind) || def(u).range > 1);
/** May this unit pull back one tile right now (Feigned Retreat adopted)? */
export const feinting = (s: GameState, u: Unit) => u.data?.feint === s.turn && u.attacked && !u.moved;

const HOOKS: Partial<Record<TribeId, Omit<SubTrait, 'from' | 'perks'>>> = {
  vikings: {
    id: 'vikings:pillage', name: 'Coastal Pillage', why: 'Longships taught the art of the shore raid.', value: 5,
    hookDesc: `A unit standing on an enemy improvement beside water can raze it for ${PILLAGE_MULT}x its cost in ★; the city loses 1 population.`,
    hook: {
      name: 'Coastal Pillage', blurb: '',
      actions(s, owner, t): Action[] {
        if (!pillageCheck(s, owner, t)) return [];
        return [{ id: 'mech:pillage', label: 'Pillage', desc: `Burn this ${t.improvement} (adopted from the Vikings): +${pillageValue(t)}★ now, its city loses 1 population.`, cost: 0, enabled: true, icon: 'axe' }];
      },
      doAction(s, owner, t, id) {
        const u = id === 'mech:pillage' ? pillageCheck(s, owner, t) : null;
        if (!u) return false;
        pillage(s, owner, u, t);
        return true;
      },
      ai(s, owner) {
        for (const u of s.units) {
          if (u.owner !== owner) continue;
          const t = s.tiles[u.y * s.size + u.x];
          if (pillageCheck(s, owner, t)) { pillage(s, owner, u, t); return true; }
        }
        return false;
      },
    },
  },
  zulu: {
    id: 'zulu:horns', name: 'Horns of the Buffalo', why: 'The chest pins the foe while the horns close around it.', value: 4,
    hookDesc: `Foot soldiers deal ${HORNS_MULT}x damage to an enemy hemmed in by ${HORNS_SIZE} or more of your foot soldiers.`,
    hook: {
      name: 'Horns of the Buffalo', blurb: '',
      combat(s, owner, a, d, ctx) {
        if (a.owner !== owner || d.owner === owner || !isMelee(a) || dist(a.x, a.y, d.x, d.y) !== 1) return;
        if (hornsAround(s, owner, d.x, d.y).length >= HORNS_SIZE) { ctx.dmg *= HORNS_MULT; ctx.tag = 'Horns!'; }
      },
    },
  },
  japan: {
    id: 'japan:kiai', name: 'Kiai Strike', why: 'A shout, a single cut, and no reply.', value: 4,
    hookDesc: `Each attack has a ${KIAI_LITE * 100}% chance to strike without a counter-blow.`,
    hook: {
      name: 'Kiai Strike', blurb: '',
      combat(s, owner, a, d, ctx) {
        if (a.owner === owner && d.owner !== owner && isKiaiLite(s, a, d)) { ctx.ret = 0; ctx.tag = 'Kiai!'; }
      },
      afterAttack(s, owner, a, d) {
        if (a.owner === owner && isKiaiLite(s, a, d)) emit({ type: 'toast', player: owner, text: 'Kiai! No counter-blow.' });
      },
    },
  },
  mongols: {
    id: 'mongols:feint', name: 'Feigned Retreat', why: 'Strike, turn, and draw the enemy on.', value: 4,
    hookDesc: 'Riders and archers without the escape skill may pull back 1 tile after they attack.',
    hook: {
      name: 'Feigned Retreat', blurb: '',
      afterAttack(s, owner, a) {
        if (a.owner !== owner || !canFeint(a) || s.units.indexOf(a) < 0) return;
        a.data = { ...a.data, feint: s.turn };
        a.moved = false; // reopen the move; moveStep caps it at one tile
        if (s.players[owner].human) emit({ type: 'toast', player: owner, text: 'Feigned retreat: pull back 1 tile.' });
      },
      moveStep(s, owner, u, _from, to, ctx) {
        if (u.owner === owner && feinting(s, u) && dist(u.x, u.y, to.x, to.y) > 1) ctx.forbid = true;
      },
      turnEnd(s, owner) {
        for (const u of s.units) if (u.owner === owner && u.data?.feint !== undefined) delete u.data.feint;
      },
      ai(s, owner) {
        const foes = s.units.filter((e) => e.owner !== owner);
        const near = (x: number, y: number) => foes.reduce((m, e) => Math.min(m, dist(e.x, e.y, x, y)), 99);
        for (const u of s.units) {
          if (u.owner !== owner || !feinting(s, u)) continue;
          const best = moveOptions(s, u).filter((o) => !o.embark && !o.disembark).sort((a, b) => near(b.x, b.y) - near(a.x, a.y))[0];
          if (best && near(best.x, best.y) > near(u.x, u.y)) return moveUnit(s, u, best.x, best.y);
          u.moved = true; // nowhere safer: hold
          return true;
        }
        return false;
      },
    },
  },
  persia: {
    id: 'persia:tribute', name: 'Royal Tribute', why: 'Every conquered satrapy sent gold to the King of Kings.', value: 3,
    hookDesc: `Capturing a city pays ${TRIBUTE_LITE}★.`,
    hook: {
      name: 'Royal Tribute', blurb: '',
      cityCaptured(s, owner, c, from) {
        if (c.owner !== owner || from === owner) return;
        s.players[owner].stars += TRIBUTE_LITE;
        emit({ type: 'stars', player: owner, x: c.x, y: c.y, amount: TRIBUTE_LITE });
      },
    },
  },
  ottoman: {
    id: 'ottoman:levy', name: 'Devşirme Levy', why: 'Conquered provinces sent their sons to the capital.', value: 3,
    hookDesc: 'Capturing a city grows your nearest other city by 1.',
    hook: {
      name: 'Devşirme Levy', blurb: '',
      cityCaptured(s, owner, c, from) {
        if (c.owner !== owner || from === owner) return;
        const near = citiesOf(s, owner).filter((o) => o.id !== c.id).sort((a, b) => dist(a.x, a.y, c.x, c.y) - dist(b.x, b.y, c.x, c.y))[0];
        if (!near) return;
        addPop(s, near, 1);
        emit({ type: 'harvest', player: owner, x: near.x, y: near.y, pop: 1 });
      },
    },
  },
};

// ---------------------------------------------------------------- registry

let registry: Record<TribeId, SubTrait[]> | null = null;
let byId: Record<string, SubTrait> = {};

/** Built on first use: the rules and mech/index import this module, so nothing here may run while modules load. */
function reg(): Record<TribeId, SubTrait[]> {
  if (registry) return registry;
  const out = {} as Record<TribeId, SubTrait[]>;
  for (const tribe of Object.keys(TRAITS) as TribeId[]) {
    const list: SubTrait[] = [];
    const seen = new Set<string>();
    const add = (key: string, name: string, why: string, perks: Perk[]) => {
      if (perks.some((p) => 'who' in p && p.who === 'unique')) return; // would mean the adopter's own unique unit
      const sig = perks.map(describePerk).join(' ');
      if (seen.has(sig)) return;
      seen.add(sig);
      list.push({ id: `${tribe}:${key}`, from: tribe, name, why, perks });
    };
    TRAITS[tribe].pros.forEach((t, i) => add(`pro${i}`, t.name, t.why, t.perks));
    for (const t of UNIQUE_TECHS) if (t.tribe === tribe && list.length < 2) add(`line${t.tier}`, t.name, t.flavor, t.perks);
    const h = HOOKS[tribe];
    if (h) list.push({ ...h, from: tribe, perks: [] });
    out[tribe] = list.slice(0, OFFER_SIZE);
  }
  registry = out;
  byId = Object.fromEntries(Object.values(out).flat().map((t) => [t.id, t]));
  return out;
}

/** The sub-traits other empires can adopt from `tribe`. */
export const subTraitsOf = (tribe: TribeId): SubTrait[] => reg()[tribe];
export const subTrait = (id: string): SubTrait | undefined => (reg(), byId[id]);
/** One line of plain English for what a sub-trait does. */
export const describeSubTrait = (t: SubTrait) => [...t.perks.map(describePerk), ...(t.hookDesc ? [t.hookDesc] : [])].join(' ');

// ---------------------------------------------------------------- state

/** A player's culture record, created (and old saves defaulted) on first use. */
export function cultureOf(s: GameState, pid: number): CultureState {
  const p = s.players[pid];
  const c = (p.culture ??= { adopted: [], offers: [] });
  c.adopted ??= [];
  c.offers ??= [];
  return c;
}
export const adoptedOf = (s: GameState, pid: number) => s.players[pid].culture?.adopted ?? [];
export const offersOf = (s: GameState, pid: number) => s.players[pid].culture?.offers ?? [];

/** Mechanic hooks of every adopted tradition (run by mech/index.ts for this player). */
export function adoptedHooks(s: GameState, pid: number): Mechanic[] {
  const list = s.players[pid].culture?.adopted;
  if (!list?.length) return [];
  const out: Mechanic[] = [];
  for (const a of list) { const h = subTrait(a.id)?.hook; if (h) out.push(h); }
  return out;
}

/** The people a city belongs to at heart: its recorded origin, else its current owner's. */
export const cityOrigin = (s: GameState, c: City): TribeId => (typeof c.data?.origin === 'string' ? (c.data.origin as TribeId) : s.players[c.owner].tribe);

/**
 * Called by rules.capture once `pid` has taken `c` (whose origin people is `origin`): queue a choice of that people's
 * sub-traits unless it is the conqueror's own people, was already adopted from or offered, or the cap is reached.
 */
export function offerCulture(s: GameState, pid: number, c: City, origin: TribeId): boolean {
  if (origin === s.players[pid].tribe) return false;
  const st = cultureOf(s, pid);
  if (st.adopted.length + st.offers.length >= MAX_ADOPTED) return false;
  if (st.adopted.some((a) => a.from === origin) || st.offers.some((o) => o.from === origin)) return false;
  const options = subTraitsOf(origin).map((t) => t.id);
  if (!options.length) return false;
  st.offers.push({ from: origin, city: c.name, options });
  emit({ type: 'toast', player: pid, text: `${TRIBES[origin].people} ways live on in ${c.name}: adopt one of their traditions.` });
  return true;
}

/** Take sub-trait `id` from the pending offer of people `from`. */
export function adopt(s: GameState, pid: number, from: TribeId, id: string): boolean {
  const st = cultureOf(s, pid);
  const i = st.offers.findIndex((o) => o.from === from);
  const t = subTrait(id);
  if (i < 0 || !t || !st.offers[i].options.includes(id) || st.adopted.length >= MAX_ADOPTED) return false;
  const [offer] = st.offers.splice(i, 1);
  st.adopted.push({ id, from, turn: s.turn, city: offer.city, perks: t.perks.map((p) => ({ ...p })) });
  const who = TRIBES[s.players[pid].tribe].people;
  emit({ type: 'toast', player: pid, text: `Adopted from the ${TRIBES[from].people}s: ${t.name}.` });
  s.log.push({ turn: s.turn, text: `The ${who}s adopt ${t.name} from the ${TRIBES[from].people}s.` });
  return true;
}

// ---------------------------------------------------------------- AI

/** A rough worth of a sub-trait to `pid` now (higher is better). */
export function scoreSubTrait(s: GameState, pid: number, t: SubTrait): number {
  const units = s.units.filter((u) => u.owner === pid);
  const cities = citiesOf(s, pid);
  const share = (who?: string) => {
    if (!who || who === 'all') return 1;
    const kinds = units.map((u) => u.carrying ?? u.kind);
    const hit = kinds.filter((k) => {
      const d = UNITS[k];
      if (who === 'naval') return d.naval;
      if (who === 'mounted') return MOUNTED_KINDS.includes(k);
      if (who === 'ranged') return d.range > 1 && !d.naval;
      if (who === 'siege') return k === 'catapult' || k === 'hwacha';
      return !d.naval && d.range === 1 && !MOUNTED_KINDS.includes(k); // melee
    }).length;
    return Math.max(0.25, hit / Math.max(1, kinds.length));
  };
  const owned = (imp: string) => s.tiles.filter((x) => x.improvement === imp && tileOwnerPlayer(s, x) === pid).length;
  let v = t.value ?? 0;
  for (const p of t.perks) {
    switch (p.k) {
      case 'atk': case 'def': v += p.n * 8 * share(p.who); break;
      case 'move': v += p.n * 5 * share(p.who); break;
      case 'income': v += p.per === 'city' ? p.n * cities.length * 3 : p.per === 'capital' ? p.n * 3 : p.per === 'road' ? p.n * 2 : p.n * (owned(p.per) * 3 + 1); break;
      case 'grow': v += p.n * 2; break;
      case 'cost': v += p.n * (p.of === 'tech' ? 3 : 2); break;
      case 'techcost': v -= p.n; break;
      case 'terrain': v += p.n * 4; break;
      case 'heal': case 'kill': v += p.n * 3; break;
      case 'vision': case 'levelstar': case 'harvestStar': v += p.n * 2; break;
    }
  }
  if (t.id === 'vikings:pillage' && units.some((u) => def(u).naval)) v += 1; // raiders need boats to reach the coasts
  return v;
}

/** One AI step: settle the first pending offer with its best option. */
export function aiAdopt(s: GameState, pid: number): boolean {
  const offer = offersOf(s, pid)[0];
  if (!offer) return false;
  const best = offer.options.map((id) => subTrait(id)!).filter(Boolean).sort((a, b) => scoreSubTrait(s, pid, b) - scoreSubTrait(s, pid, a))[0];
  if (best && adopt(s, pid, offer.from, best.id)) return true;
  cultureOf(s, pid).offers.shift(); // nothing adoptable (cap reached): drop it
  return true;
}

// ---------------------------------------------------------------- part 2

// Rogue States: a conquered city left ungarrisoned far from home grows restless and may break away under the neutral
// owner; having adopted its people's ways calms it. `cultureUnrest` lives in game/rebels and runs from turn.startTurn.
