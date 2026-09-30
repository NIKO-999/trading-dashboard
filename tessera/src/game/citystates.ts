// Free Cities: a few small independent city-states that belong to no empire. Switched on per game
// (`NewGameOptions.freeCities`, on by default on the new-game screen). They are ordinary cities held by the hidden
// neutral owner (game/wild `ensureNeutral`), the way Rogue States are (game/rebels); their own state lives in
// `GameState.free`, so saves work and older saves simply have none.
//
//  - PLACEMENT. At the start, about one per two empires (FREE_MIN to FREE_MAX) on good, unclaimed land at least
//    CAPITAL_GAP tiles from any capital. Each has a type (FREE_KINDS: Trade, Military, Science, Culture or Maritime; a
//    Maritime city only on a coast) and a name of its own. It stands at level 3 behind walls with a Defender on it,
//    and never grows, trains or expands.
//  - ENVOYS. An empire that has seen a Free City can send it an envoy from the city's tile menu, or from the menu of a
//    unit of its own standing next to it (id `free:envoy:<city id>`): `envoyCost` Stars, 1★ dearer for every envoy that
//    empire has paid for before, and one per city a round. Envoys stay for good, but attacking a Free City's units
//    sends that empire's envoys there home and closes the city to it for FOE_ROUNDS rounds.
//  - FAVOUR. 1 envoy gives the small bonus, 3 the bigger one; the empire with the most envoys (at least 3, and strictly
//    more than anyone else) is its SUZERAIN and gets the best one (FREE_KINDS lists them). A suzerain's Free City also
//    raises a levy (an Archer beside it), and its guards strike the suzerain's foes that come near: empires that fought
//    the suzerain in the last FOE_ROUNDS rounds. They never strike the suzerain; anyone who attacked the city itself is
//    struck too.
//  - CONQUEST. A Free City can be taken like any city. It then becomes an ordinary city of the conqueror, and every
//    other empire that kept envoys there is angered (opinion −ANGER, when Diplomacy is on). In the One City
//    Challenge it is razed instead, for FREE_RAZE_SCORE.
//  - QUESTS. Every QUEST_EVERY rounds one Free City asks for something: burn the raider camp nearest it (game/clans),
//    or grow a city to a level. Whoever does it gets QUEST_ENVOYS free envoy there.
//  - AI. Computer empires send envoys when they have Stars to spare, prefer the types that suit them (Military at
//    war, Maritime with a coast...), and above all go for a suzerainty they can win or keep (`freeAi`, from game/ai).
import { TRIBES, unitFor } from '../data/tribes';
import { UNITS } from '../data/units';
import { diploOn } from './diplomacy';
import { emit } from './events';
import { dist, isLand, isWater, neighbors, tileAt } from './grid';
import { foundCity, spawnUnit } from './mapgen';
import { addPop, attack, attackOptions, citiesOf, cityById, def, doAction, hasTech, maxHp, previewCombat, removeUnit, tileActions, unitAt, type Action } from './rules';
import { stockOf, STOCK_CAP } from './goods';
import { routesOf } from './trade';
import type { Rng } from './rng';
import type { City, FreeCity, FreeKind, FreeState, GameState, Tile, Unit, UnitKind } from './types';
import { empires, ensureNeutral, isLava, isNeutral, spawnNeutral } from './wild';

// ---------------------------------------------------------------- tuning

/** How many Free Cities a map gets: about one per two empires, at least FREE_MIN and at most FREE_MAX. */
export const FREE_MIN = 2;
export const FREE_MAX = 6;
export const freeCount = (empireCount: number) => Math.max(FREE_MIN, Math.min(FREE_MAX, Math.round(empireCount / 2)));
/** No Free City stands closer than this to a capital (or to another Free City). */
export const CAPITAL_GAP = 4;
/** An envoy costs this, and 1★ more for each envoy the empire has paid for before. */
export const ENVOY_BASE = 5;
/** Envoys for the bigger bonus, and the least a suzerain needs. */
export const TIER2 = 3;
/** Rounds a Free City remembers who attacked it (it takes no envoys from them), and its suzerain's wars. */
export const FOE_ROUNDS = 5;
/** Opinion lost with every empire that kept envoys in a Free City you conquered (see game/diplomacy). */
export const ANGER = 20;
/** Score for razing a Free City in the One City Challenge (a rival's capital gives RAZE_SCORE). */
export const FREE_RAZE_SCORE = 200;
/** Rounds before a Free City replaces a lost guard. */
export const FREE_REARM = 4;
/** Health a Free City's guards recover each round. */
export const FREE_HEAL = 2;
/** A Military suzerain's gift of a unit comes every this many rounds. */
export const GIFT_EVERY = 6;
/** Quests: the first round one is asked, the rounds between them, how long each stands, and its reward. */
export const QUEST_FROM = 6;
export const QUEST_EVERY = 7;
export const QUEST_LIFE = 10;
export const QUEST_ENVOYS = 1;

export interface FreeKindDef {
  name: string;
  icon: string; // for text (the map draws its own badge, see render/citystates)
  blurb: string;
  names: string[];
  /** What each standing brings: 1 envoy, TIER2 envoys, suzerain. */
  bonus: [string, string, string];
}

/** The five types of Free City and what their favour brings. */
export const FREE_KINDS: Record<FreeKind, FreeKindDef> = {
  trade: {
    name: 'Trade', icon: '⚖', blurb: 'A market town on the caravan roads.',
    names: ['Saltmere', 'Coinhaven', 'Amberfall', 'Brightmarket', 'Tollbridge'],
    bonus: ['+1★ a turn', '+2★ a turn', '+2★ a turn, and +1★ for each of your trade routes (up to 3)'],
  },
  military: {
    name: 'Military', icon: '⚔', blurb: 'A walled town of smiths and sellswords.',
    names: ['Ironhold', 'Spearford', 'Redwatch', 'Shieldmoor', 'Anvilgate'],
    bonus: ['+1 Iron every 3 turns', '+1 Iron and +1 Horses every 3 turns', `a free unit every ${GIFT_EVERY} turns, and Iron and Horses as before`],
  },
  science: {
    name: 'Science', icon: '✎', blurb: 'A town of libraries and star-gazers.',
    names: ['Starwell', 'Quillhaven', 'Glasspire', 'Lanternreach', 'Inkwater'],
    bonus: ['techs cost 1★ less', 'techs cost 2★ less', 'techs cost 3★ less'],
  },
  culture: {
    name: 'Culture', icon: '♪', blurb: 'A town of poets, players and festivals.',
    names: ['Songvale', 'Lyrecrest', 'Velvetmoor', 'Dawnhollow', 'Masquerre'],
    bonus: ['+50 score a turn', '+100 score a turn', '+150 score a turn, and +1 population in your capital every 5 turns'],
  },
  maritime: {
    name: 'Maritime', icon: '⚓', blurb: 'A harbour town of fishers and shipwrights.',
    names: ['Gullport', 'Tidewick', 'Coralmouth', 'Seawhistle', 'Saltwharf'],
    bonus: ['+1 population in your capital every 5 turns', '+1 population in your capital every 3 turns', '+1 population in your capital and each coastal city every 3 turns'],
  },
};
export const FREE_KIND_IDS = Object.keys(FREE_KINDS) as FreeKind[];

// ---------------------------------------------------------------- queries

export const freeOn = (s: GameState) => !!s.free;
/** The Free City standing as city `c`, while it is one (a conquered one is not). */
export const freeCityOf = (s: GameState, c: City | undefined): FreeCity | undefined =>
  c && isNeutral(s, c.owner) ? s.free?.cities.find((f) => f.id === c.id) : undefined;
export const isFreeCity = (s: GameState, c: City | undefined) => !!freeCityOf(s, c);
export const freeById = (s: GameState, id: unknown): FreeCity | undefined => (typeof id === 'number' ? s.free?.cities.find((f) => f.id === id) : undefined);
/** Is this a Free City's guard or levy? */
export const isFreeUnit = (s: GameState, u: Unit) => isNeutral(s, u.owner) && typeof u.data?.free === 'number';
/** The Free City a unit guards. */
export const freeOfUnit = (s: GameState, u: Unit) => (isFreeUnit(s, u) ? freeById(s, u.data!.free) : undefined);
export const guardsOf = (s: GameState, f: FreeCity) => s.units.filter((u) => isFreeUnit(s, u) && u.data!.free === f.id);
export const cityOfFree = (s: GameState, f: FreeCity) => cityById(s, f.id)!;

export const envoysOf = (f: FreeCity, pid: number) => f.envoys[pid] ?? 0;
const living = (s: GameState, pid: number) => !!s.players[pid]?.alive && !s.players[pid].neutral;

/** Who is suzerain now: the living empire with the most envoys, at least TIER2 and strictly more than anyone else. */
export function leaderOf(s: GameState, f: FreeCity): number | null {
  let best: number | null = null, bn = 0, tie = false;
  for (const [k, n] of Object.entries(f.envoys)) {
    const pid = Number(k);
    if (!living(s, pid) || n <= 0) continue;
    if (n > bn) { best = pid; bn = n; tie = false; } else if (n === bn) tie = true;
  }
  return best !== null && bn >= TIER2 && !tie ? best : null;
}

/** An empire's standing with a Free City: 0 none, 1 an envoy, 2 TIER2 envoys, 3 suzerain. */
export function tierOf(s: GameState, f: FreeCity, pid: number): 0 | 1 | 2 | 3 {
  if (!living(s, pid)) return 0;
  if (f.suz === pid) return 3;
  const n = envoysOf(f, pid);
  return n >= TIER2 ? 2 : n >= 1 ? 1 : 0;
}

/** Has `pid` found this Free City (seen its tile)? */
export const metFree = (s: GameState, pid: number, f: FreeCity) => {
  const c = cityById(s, f.id);
  return !!c && !!s.players[pid]?.explored[c.y * s.size + c.x];
};
/** Did `pid` attack this Free City in the last FOE_ROUNDS rounds? */
export const angryWith = (s: GameState, f: FreeCity, pid: number) => s.turn - (f.foes[pid] ?? -99) < FOE_ROUNDS;

/** Stars `pid`'s next envoy costs. */
export const envoyCost = (s: GameState, pid: number) => ENVOY_BASE + (s.free?.sent[pid] ?? 0);

/** Why `pid` can't send an envoy to this Free City now (null when it can), leaving the Stars aside. */
export function envoyBar(s: GameState, pid: number, f: FreeCity): string | null {
  if (!living(s, pid)) return 'Only an empire can send envoys';
  if (!metFree(s, pid, f)) return 'You have not found it yet';
  if (angryWith(s, f, pid)) return `You attacked it: it takes no envoys from you until round ${(f.foes[pid] ?? 0) + FOE_ROUNDS}`;
  if (f.last[pid] === s.turn) return 'One envoy a round';
  return null;
}

const pair = (a: number, b: number) => (a < b ? `${a}:${b}` : `${b}:${a}`);
/** Have these two empires fought in the last FOE_ROUNDS rounds? */
export const foughtLately = (s: GameState, a: number, b: number) => s.turn - (s.free?.war[pair(a, b)] ?? -99) < FOE_ROUNDS;

/** The empires a Free City's guards strike: those who attacked it lately, and its suzerain's foes. Never the suzerain. */
export function freeFoes(s: GameState, f: FreeCity): number[] {
  return empires(s).filter((p) => p.alive && p.id !== f.suz && (angryWith(s, f, p.id) || (f.suz !== null && foughtLately(s, f.suz, p.id)))).map((p) => p.id);
}

/** Does the AI of `pid` leave this unit alone? A Free City's guards, unless the city is at odds with it and it keeps no envoys there. */
export function freeSpares(s: GameState, pid: number, e: Unit): boolean {
  const f = freeOfUnit(s, e);
  if (!f) return false;
  return envoysOf(f, pid) > 0 || !freeFoes(s, f).includes(pid);
}

// ---------------------------------------------------------------- the bonuses

/** Stars a turn from Trade cities (counted in `income`, so the HUD shows them). */
export function freeIncome(s: GameState, pid: number): number {
  if (!s.free) return 0;
  let n = 0;
  for (const f of s.free.cities) {
    if (f.kind !== 'trade') continue;
    const t = tierOf(s, f, pid);
    n += t === 3 ? 2 + Math.min(3, routesOf(s, pid).length) : t === 2 ? 2 : t === 1 ? 1 : 0;
  }
  return n;
}

/** Stars off every tech from Science cities (at most 3 in all). */
export function freeTechOff(s: GameState, pid: number): number {
  if (!s.free) return 0;
  let n = 0;
  for (const f of s.free.cities) if (f.kind === 'science') n += tierOf(s, f, pid);
  return Math.min(3, n);
}

/** Score a turn from Culture cities. */
export const cultureScore = (s: GameState, f: FreeCity, pid: number) => (f.kind === 'culture' ? 50 * tierOf(s, f, pid) : 0);

/** The capital, or the biggest city, of an empire. */
const seat = (s: GameState, pid: number) => citiesOf(s, pid).sort((a, b) => Number(b.capital) - Number(a.capital) || b.level - a.level || a.id - b.id)[0];

function grow(s: GameState, c: City, why: string) {
  addPop(s, c, 1);
  emit({ type: 'harvest', player: c.owner, x: c.x, y: c.y, pop: 1 });
  emit({ type: 'toast', player: c.owner, text: `${why}: +1 population in ${c.name}.` });
}

/** The start of `pid`'s turn: what its standing with each Free City brings besides Stars and cheaper techs. */
export function freeTurnStart(s: GameState, pid: number) {
  if (!s.free || s.turn <= 0 || !living(s, pid)) return;
  const p = s.players[pid];
  for (const f of s.free.cities) {
    const t = tierOf(s, f, pid);
    if (!t) continue;
    const c = cityOfFree(s, f);
    switch (f.kind) {
      case 'culture': {
        p.bonusScore += cultureScore(s, f, pid);
        const home = t === 3 && s.turn % 5 === 0 ? seat(s, pid) : undefined;
        if (home) grow(s, home, `The festivals of ${c.name}`);
        break;
      }
      case 'maritime': {
        const every = t === 1 ? 5 : 3;
        if (s.turn % every) break;
        const home = seat(s, pid);
        const coast = t === 3 ? citiesOf(s, pid).filter((k) => k !== home && neighbors(s, k.x, k.y).some(isWater)).sort((a, b) => a.id - b.id).slice(0, 3) : [];
        for (const k of [home, ...coast]) if (k) grow(s, k, `Fishing fleets from ${c.name}`);
        break;
      }
      case 'military': {
        if (s.turn % 3 === 0) {
          const st = stockOf(p);
          st.iron = Math.min(STOCK_CAP, st.iron + 1);
          if (t >= 2) st.horses = Math.min(STOCK_CAP, st.horses + 1);
        }
        if (t === 3 && s.turn > f.since && (s.turn - f.since) % GIFT_EVERY === 0) giftUnit(s, f, pid);
        break;
      }
    }
  }
}

/** The best soldier `pid` knows how to train, as a gift. */
function giftKind(s: GameState, pid: number): UnitKind {
  const tribe = s.players[pid].tribe;
  for (const k of ['knight', 'swordsman', 'archer', 'rider', 'warrior'] as UnitKind[]) if (hasTech(s, pid, UNITS[k].tech)) return unitFor(tribe, k);
  return unitFor(tribe, 'warrior');
}

/** Open ground beside a Free City for a new unit. */
const freeSpot = (s: GameState, c: City) => neighbors(s, c.x, c.y).sort((a, b) => a.y - b.y || a.x - b.x)
  .find((t) => isLand(t) && t.terrain !== 'mountain' && t.terrain !== 'ice' && !isLava(t) && t.cityId === null && !t.village && !unitAt(s, t.x, t.y));

function giftUnit(s: GameState, f: FreeCity, pid: number) {
  const c = cityOfFree(s, f);
  const spot = freeSpot(s, c);
  if (!spot) return;
  const kind = giftKind(s, pid);
  spawnUnit(s, kind, pid, spot.x, spot.y, null);
  emit({ type: 'toast', player: pid, text: `${c.name} sends you a ${UNITS[kind].name} as its suzerain. It waits beside the city.` });
}

// ---------------------------------------------------------------- envoys

/** Recounts the suzerain and tells whoever gained or lost it. */
export function settle(s: GameState, f: FreeCity) {
  const now = leaderOf(s, f);
  if (now === f.suz) return;
  const c = cityOfFree(s, f);
  const was = f.suz;
  f.suz = now;
  f.since = s.turn;
  if (was !== null && living(s, was)) emit({ type: 'toast', player: was, text: `You are no longer suzerain of ${c.name}.` });
  if (now !== null) {
    emit({ type: 'toast', player: now, text: `You are now suzerain of ${c.name}: ${FREE_KINDS[f.kind].bonus[2]}. Its guards fight your foes.` });
    s.log.push({ turn: s.turn, text: `The ${TRIBES[s.players[now].tribe].people} empire becomes suzerain of the Free City of ${c.name}.` });
  }
}

export function addEnvoys(s: GameState, f: FreeCity, pid: number, n: number) {
  f.envoys[pid] = envoysOf(f, pid) + n;
  settle(s, f);
}

/** Free Cities a Send Envoy on tile `t` reaches: the city itself, or those next to `pid`'s own unit standing there. */
function envoyTargets(s: GameState, pid: number, t: Tile): FreeCity[] {
  if (t.cityId !== null) { const f = freeCityOf(s, cityById(s, t.cityId)); return f ? [f] : []; }
  const u = unitAt(s, t.x, t.y);
  if (!u || u.owner !== pid) return [];
  return s.free!.cities.filter((f) => { const c = cityOfFree(s, f); return isNeutral(s, c.owner) && dist(c.x, c.y, t.x, t.y) === 1; });
}

/** The Send Envoy entries of `pid`'s tile menu (ids `free:envoy:<city id>`). */
export function freeActions(s: GameState, pid: number, t: Tile): Action[] {
  if (!s.free || !living(s, pid)) return [];
  const p = s.players[pid];
  const cost = envoyCost(s, pid);
  return envoyTargets(s, pid, t).filter((f) => metFree(s, pid, f)).map((f) => {
    const c = cityOfFree(s, f);
    const bar = envoyBar(s, pid, f);
    const n = envoysOf(f, pid);
    return {
      id: `free:envoy:${f.id}`, label: t.cityId === null ? `Envoy to ${c.name}` : 'Send Envoy', cost, icon: `free:${f.kind}`,
      desc: `Send an envoy to the ${FREE_KINDS[f.kind].name} city of ${c.name} (you have ${n}). 1 envoy: ${FREE_KINDS[f.kind].bonus[0]}; ${TIER2}: ${FREE_KINDS[f.kind].bonus[1]}; the most (${TIER2}+): suzerain, ${FREE_KINDS[f.kind].bonus[2]}. Each envoy you send costs 1★ more.`,
      enabled: !bar && p.stars >= cost, reason: bar ?? (p.stars < cost ? 'Not enough stars' : undefined),
    };
  });
}

/** Runs a Free City action (the rules have already charged its cost). */
export function freeDoAction(s: GameState, pid: number, id: string): boolean {
  const f = freeById(s, Number(id.split(':')[2]));
  if (!f || !s.free || !id.startsWith('free:envoy:')) return false;
  const c = cityOfFree(s, f);
  s.free.sent[pid] = (s.free.sent[pid] ?? 0) + 1;
  f.last[pid] = s.turn;
  addEnvoys(s, f, pid, 1);
  const n = envoysOf(f, pid);
  emit({ type: 'toast', player: pid, text: `Your envoy reaches ${c.name} (${n} there). ${f.suz === pid ? 'You are its suzerain.' : n >= TIER2 ? 'Its bigger favour is yours.' : n === 1 ? 'Its first favour is yours.' : ''}`.trim() });
  return true;
}

// ---------------------------------------------------------------- war and conquest

/**
 * Called by rules.attack: remembers fights between empires (a Free City fights its suzerain's foes), and an empire
 * that attacks a Free City's unit loses its envoys there and is shut out for a while.
 */
export function freeStruck(s: GameState, a: Unit, d: Unit) {
  if (!s.free || isNeutral(s, a.owner)) return;
  if (!isNeutral(s, d.owner)) { s.free.war[pair(a.owner, d.owner)] = s.turn; return; }
  const f = freeOfUnit(s, d);
  if (!f) return;
  const had = envoysOf(f, a.owner);
  const first = !angryWith(s, f, a.owner);
  f.foes[a.owner] = s.turn;
  if (had) { delete f.envoys[a.owner]; settle(s, f); }
  if (first || had) emit({ type: 'toast', player: a.owner, text: `You attacked ${cityOfFree(s, f).name}!${had ? ` Your ${had} envoy${had === 1 ? ' is' : 's are'} sent home.` : ''} It will fight you for ${FOE_ROUNDS} rounds.` });
}

/**
 * Called by the rules just before a Free City is taken (or, in the One City Challenge, razed) by `by`: it stops being
 * a Free City, its levy scatters, and every other empire that kept envoys there is angered.
 */
export function freeFalls(s: GameState, c: City, by: number) {
  const f = freeCityOf(s, c);
  if (!f || !s.free) return;
  const who = TRIBES[s.players[by].tribe].people;
  for (const [k, n] of Object.entries(f.envoys)) {
    const pid = Number(k);
    if (pid === by || n <= 0 || !living(s, pid)) continue;
    if (diploOn(s)) s.diplo!.mood[`${pid}:${by}`] = (s.diplo!.mood[`${pid}:${by}`] ?? 0) - ANGER;
    emit({ type: 'toast', player: pid, text: `${who} forces have conquered the Free City of ${c.name}, where you kept ${n} envoy${n === 1 ? '' : 's'}.${diploOn(s) ? ` Your opinion of them drops (−${ANGER}).` : ''}` });
  }
  for (const u of guardsOf(s, f)) {
    removeUnit(s, u, null);
    emit({ type: 'death', unitId: u.id, x: u.x, y: u.y, owner: u.owner, kind: u.kind });
  }
  s.free.cities = s.free.cities.filter((x) => x !== f);
  s.log.push({ turn: s.turn, text: `${who} forces conquer the Free City of ${c.name}.` });
}

// ---------------------------------------------------------------- the Free Cities' round

/** Once a round, after the last empire (called by game/wild.wildRound): guards heal, rearm and strike; quests. */
export function freeRound(s: GameState) {
  if (!s.free) return;
  for (const f of s.free.cities) {
    const c = cityOfFree(s, f);
    if (!c || !isNeutral(s, c.owner)) continue;
    settle(s, f); // a fallen empire's envoys no longer count
    const band = guardsOf(s, f);
    const guard = band.find((u) => !u.data!.levy);
    const levy = band.find((u) => u.data!.levy);
    if ((!guard || (f.suz !== null && !levy)) && f.rearm === null) f.rearm = s.turn + (guard ? 0 : FREE_REARM);
    if (f.rearm !== null && s.turn >= f.rearm) {
      if (!guard && !unitAt(s, c.x, c.y)) muster(s, f, 'defender', c.x, c.y, false);
      else if (f.suz !== null && !levy) { const t = freeSpot(s, c); if (t) muster(s, f, 'archer', t.x, t.y, true); }
      f.rearm = null;
    }
    for (const u of guardsOf(s, f)) guardAct(s, f, c, u);
  }
  quests(s);
}

function muster(s: GameState, f: FreeCity, kind: UnitKind, x: number, y: number, levy: boolean) {
  const u = spawnNeutral(s, kind, x, y);
  u.data = levy ? { free: f.id, levy: true } : { free: f.id };
}

function guardAct(s: GameState, f: FreeCity, c: City, u: Unit) {
  if (u.hp < maxHp(u)) {
    const before = u.hp;
    u.hp = Math.min(maxHp(u), u.hp + FREE_HEAL);
    emit({ type: 'heal', unitId: u.id, x: u.x, y: u.y, amount: u.hp - before });
  }
  u.moved = u.attacked = false;
  const foes = freeFoes(s, f);
  const best = foes.length ? attackOptions(s, u)
    .filter((e) => foes.includes(e.owner) && dist(e.x, e.y, c.x, c.y) <= 2 && (def(u).range > 1 || !tileAt(s, e.x, e.y)!.ruin))
    .map((e) => ({ e, ...previewCombat(s, u, e) }))
    .filter((o) => o.kills || (o.dmg >= o.ret && u.hp > o.ret))
    .sort((a, b) => (b.kills ? 100 : 0) + b.dmg - b.ret - ((a.kills ? 100 : 0) + a.dmg - a.ret) || a.e.id - b.e.id)[0] : undefined;
  if (best) {
    const home = { x: u.x, y: u.y };
    const who = best.e.owner;
    attack(s, u, best.e);
    emit({ type: 'toast', player: who, text: `The guards of ${c.name} ${s.units.includes(best.e) ? 'strike' : 'cut down'} one of your units${f.suz !== null && f.suz !== who && !angryWith(s, f, who) ? ` for their suzerain, the ${TRIBES[s.players[f.suz].tribe].people} empire` : ''}!` });
    // a guard that cleared its foe's tile goes back to its post
    if (s.units.includes(u) && (u.x !== home.x || u.y !== home.y) && !unitAt(s, home.x, home.y)) {
      emit({ type: 'move', unitId: u.id, owner: u.owner, path: [{ x: u.x, y: u.y }, home], embark: false, disembark: false });
      u.x = home.x;
      u.y = home.y;
    }
  }
  u.moved = u.attacked = true;
}

/** A new quest now and then; quests done are rewarded, and old ones lapse. */
function quests(s: GameState) {
  const st = s.free!;
  for (const f of st.cities) {
    const q = f.quest;
    if (!q) continue;
    const c = cityOfFree(s, f);
    const reward = (pid: number, what: string) => {
      q.done.push(pid);
      addEnvoys(s, f, pid, QUEST_ENVOYS);
      emit({ type: 'toast', player: pid, text: `${c.name} thanks you for ${what}: +${QUEST_ENVOYS} envoy there (${envoysOf(f, pid)}).` });
    };
    if (q.kind === 'camp') {
      if (!s.clans?.camps.some((k) => k.id === q.camp)) { f.quest = null; continue; } // burned by someone (see freeCampBurned) or gone
    } else if (q.kind === 'level') {
      for (const p of empires(s)) {
        if (!p.alive || q.done.includes(p.id) || !metFree(s, p.id, f) || angryWith(s, f, p.id)) continue;
        if (citiesOf(s, p.id).some((k) => k.level >= q.level!)) reward(p.id, `growing a city to level ${q.level}`);
      }
    }
    if (s.turn >= q.until) f.quest = null;
  }
  if (s.turn < QUEST_FROM || s.turn < st.nextQuest || !st.cities.length) return;
  const f = st.cities.filter((x) => !x.quest).sort((a, b) => ((a.id * 7 + s.turn) % 5) - ((b.id * 7 + s.turn) % 5) || a.id - b.id)[0];
  st.nextQuest = s.turn + QUEST_EVERY;
  if (!f) return;
  const c = cityOfFree(s, f);
  const camp = (s.clans?.camps ?? []).filter((k) => dist(k.x, k.y, c.x, c.y) <= 7).sort((a, b) => dist(a.x, a.y, c.x, c.y) - dist(b.x, b.y, c.x, c.y) || a.id - b.id)[0];
  if (camp) f.quest = { kind: 'camp', camp: camp.id, until: s.turn + QUEST_LIFE, done: [] };
  else {
    const top = Math.max(1, ...empires(s).filter((p) => p.alive).flatMap((p) => citiesOf(s, p.id).map((k) => k.level)));
    f.quest = { kind: 'level', level: Math.max(3, top + 1), until: s.turn + QUEST_LIFE, done: [] }; // a level nobody has reached yet
  }
  for (const p of empires(s)) if (p.alive && metFree(s, p.id, f)) emit({ type: 'toast', player: p.id, text: `${c.name} asks a favour: ${questText(s, f)}` });
}

/** Called by game/clans when an empire burns an outlaw camp: a Free City that asked for it gives the burner an envoy. */
export function freeCampBurned(s: GameState, campId: number, pid: number) {
  if (!s.free || !living(s, pid)) return;
  for (const f of s.free.cities) {
    const q = f.quest;
    if (!q || q.kind !== 'camp' || q.camp !== campId) continue;
    const c = cityOfFree(s, f);
    if (!angryWith(s, f, pid)) {
      addEnvoys(s, f, pid, QUEST_ENVOYS);
      emit({ type: 'toast', player: pid, text: `${c.name} thanks you for burning the raiders' camp: +${QUEST_ENVOYS} envoy there (${envoysOf(f, pid)}).` });
    }
    f.quest = null;
  }
}

/** A quest in plain words. */
export function questText(s: GameState, f: FreeCity): string {
  const q = f.quest;
  if (!q) return '';
  const left = Math.max(1, q.until - s.turn);
  if (q.kind === 'camp') {
    const camp = s.clans?.camps.find((k) => k.id === q.camp);
    return `burn the outlaw camp of the ${camp?.name ?? 'raiders'} nearby (+${QUEST_ENVOYS} envoy, ${left} rounds left).`;
  }
  return `grow a city of yours to level ${q.level} (+${QUEST_ENVOYS} envoy for each empire that does, ${left} rounds left).`;
}

// ---------------------------------------------------------------- setup

/**
 * Good land for a Free City: open, unclaimed, clear of villages, with land and resources around. Its score, or -1.
 * `loose`: a second look on crowded maps, taking any open ground with a little land around it.
 */
function siteScore(s: GameState, t: Tile, loose = false): number {
  if (loose ? !isLand(t) || t.terrain === 'mountain' || t.terrain === 'ice' || t.terrain === 'platform' || t.terrain === 'bridge' : t.terrain !== 'field' && t.terrain !== 'forest') return -1;
  if (t.village || t.ruin || t.cityId !== null || t.owner !== null || unitAt(s, t.x, t.y) || isLava(t)) return -1;
  const around = neighbors(s, t.x, t.y);
  if (around.some((n) => n.village || n.cityId !== null || (!loose && n.owner !== null))) return -1;
  const land = around.filter((n) => isLand(n) && n.terrain !== 'mountain').length;
  if (land < (loose ? 3 : 4)) return -1;
  return land + 2 * around.filter((n) => n.resource).length;
}

/** Founds the Free Cities of a new map (called once by createGame when they are on). */
export function setupFreeCities(s: GameState, rng: Rng) {
  const st: FreeState = { cities: [], sent: {}, war: {}, nextQuest: QUEST_FROM };
  s.free = st;
  const want = freeCount(s.players.filter((p) => !p.neutral).length);
  const capitals = s.cities.filter((c) => c.capital).map((c) => ({ x: c.x, y: c.y }));
  const kinds = rng.shuffle([...FREE_KIND_IDS]);
  const used = new Set(s.cities.map((c) => c.name));
  const rank = (loose: boolean) => s.tiles.map((t) => ({ t, loose, v: siteScore(s, t, loose) + rng.next() * 3 })).filter((o) => o.v >= 0).sort((a, b) => b.v - a.v);
  const sites = [...rank(false), ...rank(true)]; // good land first; open ground on crowded maps
  const placed: { x: number; y: number }[] = [];
  for (const { t, loose } of sites) {
    if (st.cities.length >= want) break;
    if (capitals.some((p) => dist(p.x, p.y, t.x, t.y) < CAPITAL_GAP) || placed.some((p) => dist(p.x, p.y, t.x, t.y) < CAPITAL_GAP + 1)) continue;
    if (siteScore(s, t, loose) < 0) continue; // a city placed since may have claimed it
    const coast = neighbors(s, t.x, t.y).some((n) => n.terrain === 'shallow');
    const n = st.cities.length;
    // each type once before any repeats (the least used first, in a shuffled order); Maritime only on a coast
    const uses = (k: FreeKind) => st.cities.filter((f) => f.kind === k).length;
    let kind = kinds.filter((k) => coast || k !== 'maritime').sort((a, b) => uses(a) - uses(b))[0];
    if (coast && !uses('maritime') && n === want - 1) kind = 'maritime'; // the last one takes to the sea if none has
    const owner = ensureNeutral(s);
    const c = foundCity(s, t.x, t.y, owner, false);
    const names = FREE_KINDS[kind].names.filter((x) => !used.has(x));
    c.name = names.length ? names[rng.int(names.length)] : `Free ${FREE_KINDS[kind].name} ${n + 1}`;
    used.add(c.name);
    c.level = 3;
    c.walls = true;
    st.cities.push({ id: c.id, kind, envoys: {}, suz: null, since: 0, last: {}, foes: {}, rearm: null, quest: null });
    muster(s, st.cities[st.cities.length - 1], 'defender', c.x, c.y, false);
    placed.push({ x: t.x, y: t.y });
  }
}

// ---------------------------------------------------------------- AI

/** How much a computer empire wants this type of Free City's favour. */
function kindWant(s: GameState, pid: number, kind: FreeKind): number {
  const p = s.players[pid];
  switch (kind) {
    case 'trade': return 3;
    case 'science': return 3;
    case 'culture': return s.mode === 'perfection' ? 3 : 1;
    case 'military': return s.turn - (p.skill?.war ?? -99) <= 3 ? 5 : 2;
    case 'maritime': return 1 + Math.min(2, citiesOf(s, pid).filter((c) => neighbors(s, c.x, c.y).some(isWater)).length);
  }
}

/** How much a computer empire wants to send its next envoy to `f`: winning or keeping a suzerainty above all. */
export function envoyWant(s: GameState, pid: number, f: FreeCity): number {
  const mine = envoysOf(f, pid);
  const rival = Math.max(0, ...Object.entries(f.envoys).filter(([k]) => Number(k) !== pid && living(s, Number(k))).map(([, n]) => n));
  let w = kindWant(s, pid, f.kind) + ((pid * 3 + f.id) % 3) * 0.4; // each empire has its favourites
  if (f.suz === pid) w += rival >= mine - 1 ? 4 : -8; // defend a close suzerainty, else it is safe
  else if (mine + 1 >= TIER2 && mine + 1 > rival) w += 6; // this envoy wins it
  else if (f.suz !== null && mine + 1 >= rival && s.free!.cities.filter((x) => x.suz === f.suz).length >= 2) w += 4; // a tie takes it from an empire that holds several
  else if (mine + 1 === 1 || mine + 1 === TIER2) w += 2; // the next favour
  else if (rival > mine) w -= 6; // already has the bigger favour: a bidding war is not worth it
  if (mine >= 6) w -= 10;
  return w;
}

/** One Free City step for a computer empire: an envoy when it has Stars to spare. */
export function freeAi(s: GameState, pid: number): boolean {
  if (!s.free || s.turn < 3) return false;
  const p = s.players[pid];
  const cost = envoyCost(s, pid);
  if (p.stars < cost + 8) return false;
  const pick = s.free.cities
    .filter((f) => isNeutral(s, cityOfFree(s, f).owner) && !envoyBar(s, pid, f))
    .map((f) => ({ f, w: envoyWant(s, pid, f) }))
    .sort((a, b) => b.w - a.w || a.f.id - b.f.id)[0];
  if (!pick || pick.w < 3) return false;
  const c = cityOfFree(s, pick.f);
  const t = tileAt(s, c.x, c.y)!;
  const id = `free:envoy:${pick.f.id}`;
  return tileActions(s, pid, t).some((a) => a.id === id && a.enabled) && doAction(s, pid, t, id);
}

// ---------------------------------------------------------------- descriptions

export interface FreeView {
  title: string;
  kind: FreeKind;
  line: string; // type, blurb and guards
  envoys: { pid: number; n: number }[]; // every empire with envoys there, most first
  suz: number | null;
  mine: number;
  tier: 0 | 1 | 2 | 3;
  table: [string, string][]; // standing, bonus
  quest: string;
  foe: string | null; // why it is at odds with the viewer
}

/** What the city panel shows about a Free City. Plain data, no UI. */
export function freeDescribe(s: GameState, c: City, viewer: number): FreeView | null {
  const f = freeCityOf(s, c);
  if (!f) return null;
  const K = FREE_KINDS[f.kind];
  const guards = guardsOf(s, f).length;
  const envoys = Object.entries(f.envoys).map(([k, n]) => ({ pid: Number(k), n })).filter((e) => e.n > 0 && s.players[e.pid] && !s.players[e.pid].neutral)
    .sort((a, b) => b.n - a.n || a.pid - b.pid);
  return {
    title: c.name,
    kind: f.kind,
    line: `Free City · ${K.name} · ${K.blurb} Level ${c.level}, walls, ${guards ? `${guards} guard${guards === 1 ? '' : 's'}` : 'no guards left'}. It never expands.`,
    envoys,
    suz: f.suz,
    mine: envoysOf(f, viewer),
    tier: tierOf(s, f, viewer),
    table: [['1 envoy', K.bonus[0]], [`${TIER2} envoys`, K.bonus[1]], [`Suzerain (most, ${TIER2}+)`, `${K.bonus[2]}; its guards fight your foes`]],
    quest: f.quest ? questText(s, f) : '',
    foe: angryWith(s, f, viewer) ? `You attacked it: it fights you and takes no envoys from you until round ${(f.foes[viewer] ?? 0) + FOE_ROUNDS}.` : null,
  };
}

/** One line for a Free City guard's unit panel. */
export function freeUnitLine(s: GameState, u: Unit): string {
  const f = freeOfUnit(s, u);
  if (!f) return 'A guard of a Free City.';
  const c = cityOfFree(s, f);
  const suz = f.suz !== null ? ` It fights for its suzerain, the ${TRIBES[s.players[f.suz].tribe].people} empire, against their foes nearby.` : '';
  return `${u.data!.levy ? 'A levy' : 'A guard'} of the Free City of ${c.name} (${FREE_KINDS[f.kind].name}). Attacking it sends your envoys there home.${suz}`;
}
