// Wild events: third-party forces that belong to no empire. They are switched on per game (`NewGameOptions.wild`) and
// keep their state in `GameState.wild` and in tile data, so saves work and older saves simply have none.
//
//  - The NEUTRAL owner. Great Beasts and Rogue States (rebel cities, see game/rebels) are owned by a hidden
//    neutral Player appended after every empire. It is never `alive`, so it takes no turns, is never eliminated, has
//    no mechanic, earns nothing, meets no one and cannot win; `empires(s)` lists everyone else. Use these helpers:
//      isNeutral(s, pid)          is this player (or unit/city owner) the neutral one?
//      neutralId(s)               its index in `s.players`, or -1 if the game has none yet
//      ensureNeutral(s)           its index, adding it first if needed (safe on any game, old saves included)
//      spawnNeutral(s, kind, x, y) a unit for it (homeless, full health)
//      empires(s)                 every real empire, alive or not (use it for rankings, menus and lists)
//    Neutral units act once a round, after the last empire's turn (`wildRound`, called by endTurn).
//  - Great Beasts. The Kraken roams the deep ocean and attacks one ship next to it each round, whoever owns it. It
//    heals between rounds; whoever kills it earns a big Star bounty, and another rises elsewhere some rounds later.
//  - Volcanoes. A few mountains are active (tile.data.volcano = the round of the next eruption). A round before they
//    blow they rumble; then lava floods the land around them: improvements, roads, forests and crops are lost and
//    units there are burnt. Lava (tile.data.lava = the round it cools) can't be entered; it cools into volcanic ash
//    (tile.data.ash), often sprouting wild crops, and the next harvest or building on ash grows the city 1 more and
//    pays 1★.
//  - Mercenary camps. Each camp offers one veteran for hire. Empires that have seen the camp place sealed bids from
//    the camp's tile menu during their own turn; the stars are held in escrow. At the end of the round the highest
//    bid (earliest on a tie) hires the unit on the spot, everyone else is refunded, and the camp restocks later.
import { TRIBE_IDS } from '../data/tribes';
import { UNITS } from '../data/units';
import { emit } from './events';
import { area, dist, isLand, isWater, neighbors, tileAt } from './grid';
import { spawnUnit } from './mapgen';
import { attack, attackOptions, citiesOf, doAction, maxHp, removeUnit, tileActions, tileOwnerPlayer, unitAt, type Action } from './rules';
import { rogueRound } from './rebels';
import type { Rng } from './rng';
import type { GameState, Player, Tile, Unit, UnitKind, WildCamp } from './types';

// ---------------------------------------------------------------- the neutral owner

/** Index of the neutral player, or -1 when this game has none. */
export const neutralId = (s: GameState) => s.players.findIndex((p) => p.neutral);
/** Is `pid` the neutral owner? (Also false for any id that is not a player at all.) */
export const isNeutral = (s: GameState, pid: number) => !!s.players[pid]?.neutral;
/** Every real empire, alive or not: rankings, menus and lists of rivals should use this rather than `s.players`. */
export const empires = (s: GameState): Player[] => s.players.filter((p) => !p.neutral);

/** The neutral player's index, adding it after every empire if the game does not have one yet. */
export function ensureNeutral(s: GameState): number {
  const have = neutralId(s);
  if (have >= 0) return have;
  // it borrows the look of an empire that is not playing (it has no traits, perks or mechanic of its own)
  const used = new Set(s.players.map((p) => p.tribe));
  const p: Player = {
    id: s.players.length,
    tribe: TRIBE_IDS.find((t) => !used.has(t)) ?? TRIBE_IDS[0],
    human: false,
    stars: 0,
    techs: [],
    explored: new Array(s.size * s.size).fill(true), // it sees everything, so its units can always find their prey
    alive: false,
    kills: 0,
    bonusScore: 0,
    met: [],
    neutral: true,
  };
  s.players.push(p);
  return p.id;
}

/** A neutral unit at (x, y): homeless and at full health. */
export function spawnNeutral(s: GameState, kind: UnitKind, x: number, y: number): Unit {
  const u = spawnUnit(s, kind, ensureNeutral(s), x, y, null);
  u.hp = maxHp(u);
  return u;
}

// ---------------------------------------------------------------- tuning

/** Great Beasts and the Star bounty for slaying each. */
export const BEASTS: Partial<Record<UnitKind, number>> = { kraken: 15 };
export const isBeast = (s: GameState, u: Unit) => isNeutral(s, u.owner) && BEASTS[u.kind] !== undefined;
export const KRAKEN_HEAL = 2;
/** Rounds before a slain beast rises again elsewhere. */
export const BEAST_RESPAWN = 12;
/** Ocean tiles per Kraken (at most 3 of them; none on maps with little open sea). */
const OCEAN_PER_KRAKEN = 55;

/** Rounds between one eruption of a volcano and the next. */
export const ERUPT_EVERY = 6;
export const LAVA_DAMAGE = 5;
/** Extra population and stars for the first harvest or building on volcanic ash. */
export const ASH_POP = 1;
export const ASH_STARS = 1;
/** Improvements lava destroys (the empires' own monuments are built to last). */
const MELTS = ['farm', 'mine', 'lumber', 'temple', 'market'];

/** What mercenaries offer, with the lowest bid a camp accepts and how often each is on offer. */
export const OFFERS: { kind: UnitKind; min: number; w: number }[] = [
  { kind: 'archer', min: 5, w: 2 },
  { kind: 'swordsman', min: 7, w: 3 },
  { kind: 'knight', min: 10, w: 3 },
  { kind: 'catapult', min: 10, w: 2 },
  { kind: 'giant', min: 16, w: 1 },
];
/** Bids go up in these steps above the minimum. */
export const BID_STEPS = [0, 3, 6];
/** Rounds a camp needs to find new recruits after a hire. */
export const RESTOCK = 3;
export const minBid = (kind: UnitKind) => OFFERS.find((o) => o.kind === kind)?.min ?? 8;

// ---------------------------------------------------------------- small queries

const num = (t: Tile, key: string) => (typeof t.data?.[key] === 'number' ? (t.data[key] as number) : null);
/** Round of this volcano's next eruption, or null if the tile is not an active volcano. */
export const volcanoDue = (t: Tile) => num(t, 'volcano');
export const isLava = (t: Tile) => num(t, 'lava') !== null;
export const isAsh = (t: Tile) => t.data?.ash === true;
export const campAt = (s: GameState, x: number, y: number): WildCamp | undefined => s.wild?.camps.find((c) => c.x === x && c.y === y);
export const wildOn = (s: GameState) => !!s.wild;

/** A deterministic 0..1 roll for this game, round and purpose (play-time events must not use Math.random). */
function roll(s: GameState, salt: number) {
  let h = (s.seed ^ Math.imul(s.turn + 1, 0x9e3779b1) ^ Math.imul(salt + 7, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39) >>> 0;
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

const setData = (t: Tile, patch: Record<string, unknown>) => { t.data = { ...t.data, ...patch }; };
function clearData(t: Tile, key: string) {
  if (!t.data || !(key in t.data)) return;
  const { [key]: _gone, ...rest } = t.data;
  t.data = rest;
}

/** Tells every empire that has seen tile (x, y). */
function tell(s: GameState, x: number, y: number, text: string, except = -1) {
  for (const p of empires(s)) if (p.alive && p.id !== except && p.explored[y * s.size + x]) emit({ type: 'toast', player: p.id, text });
}

// ---------------------------------------------------------------- setup

/** Scatters the wild across a new map: called once by createGame when wild events are on. Kept rare on small maps. */
export function setupWild(s: GameState, rng: Rng) {
  s.wild = { camps: [], respawn: [] };
  ensureNeutral(s);
  const capitals = s.cities.map((c) => ({ x: c.x, y: c.y }));
  const farFrom = (pts: { x: number; y: number }[], t: Tile, d: number) => pts.every((p) => dist(p.x, p.y, t.x, t.y) >= d);
  const tiles = rng.shuffle([...s.tiles]);

  // Krakens: only where there is real open sea, and never right off anyone's capital
  const ocean = s.tiles.filter((t) => t.terrain === 'ocean');
  const krakens = Math.min(3, Math.floor(ocean.length / OCEAN_PER_KRAKEN));
  const lairs: Tile[] = [];
  for (const t of tiles) {
    if (lairs.length >= krakens) break;
    if (t.terrain !== 'ocean' || unitAt(s, t.x, t.y) || !farFrom(capitals, t, 4) || !farFrom(lairs, t, 5)) continue;
    if (neighbors(s, t.x, t.y).filter((n) => n.terrain === 'ocean').length < 5) continue; // deep water all around
    lairs.push(t);
    spawnNeutral(s, 'kraken', t.x, t.y);
  }

  // Volcanoes: roughly one per 170 tiles (1 on the smallest maps, at most 4), away from the capitals
  const volcanoes = Math.max(1, Math.min(4, Math.round((s.size * s.size) / 170)));
  const peaks: Tile[] = [];
  for (const t of tiles) {
    if (peaks.length >= volcanoes) break;
    if (t.terrain !== 'mountain' || !farFrom(capitals, t, 3) || !farFrom(peaks, t, 4)) continue;
    if (neighbors(s, t.x, t.y).some((n) => n.village || n.cityId !== null)) continue;
    peaks.push(t);
    t.resource = null; // no ore to mine in a live crater
    setData(t, { volcano: 4 + rng.int(ERUPT_EVERY) }); // the first eruptions are staggered
  }

  // Mercenary camps: one on small maps, up to four on big ones, on open ground nobody owns
  const camps = Math.max(1, Math.min(4, Math.round(s.size / 12)));
  const taken: { x: number; y: number }[] = [...capitals, ...peaks];
  for (const t of tiles) {
    if (s.wild.camps.length >= camps) break;
    if (t.terrain !== 'field' || t.village || t.ruin || t.cityId !== null || t.owner !== null || unitAt(s, t.x, t.y)) continue;
    if (!farFrom(taken, t, 3) || neighbors(s, t.x, t.y).some((n) => n.village)) continue;
    if (neighbors(s, t.x, t.y).filter((n) => isLand(n) && n.terrain !== 'mountain').length < 3) continue; // room to muster
    t.resource = null;
    s.wild.camps.push({ x: t.x, y: t.y, offer: pickOffer(rng.next()), restock: 0, bids: [] });
    taken.push(t);
  }
}

function pickOffer(r: number): UnitKind {
  const total = OFFERS.reduce((a, o) => a + o.w, 0);
  let x = r * total;
  for (const o of OFFERS) if ((x -= o.w) <= 0) return o.kind;
  return OFFERS[OFFERS.length - 1].kind;
}

// ---------------------------------------------------------------- the neutral phase

/** The wild's own turn, once a round after the last empire has played (called by endTurn). */
export function wildRound(s: GameState) {
  rogueRound(s); // Rogue States hold their cities whether or not wild events are on (see game/rebels)
  if (!s.wild) return;
  coolLava(s);
  for (const t of s.tiles) {
    const due = volcanoDue(t);
    if (due === null) continue;
    if (s.turn === due - 1) tell(s, t.x, t.y, 'A volcano rumbles and smokes: it will erupt at the end of the next round!');
    if (s.turn >= due) erupt(s, t);
  }
  for (const u of s.units.filter((x) => x.kind === 'kraken' && isNeutral(s, x.owner))) krakenAct(s, u);
  riseAgain(s);
  for (const c of s.wild.camps) runCamp(s, c);
}

// ---------------------------------------------------------------- volcanoes

/** Lava from `v` floods the land around it. */
export function erupt(s: GameState, v: Tile) {
  setData(v, { volcano: s.turn + ERUPT_EVERY });
  const lost = new Map<number, string[]>(); // player -> what they lost
  let flooded = 0;
  for (const t of area(s, v.x, v.y, 1)) {
    // units on the slopes and around are burnt, the crater included
    const u = unitAt(s, t.x, t.y);
    if (u && !isBeast(s, u)) burn(s, u);
    if (t === v || !isLand(t) || t.terrain === 'mountain' || t.terrain === 'ice' || t.terrain === 'platform' || t.terrain === 'bridge') continue; // not ice, decks or bridges over the water
    if (t.cityId !== null || t.village || t.ruin || campAt(s, t.x, t.y)) continue;
    const owner = tileOwnerPlayer(s, t);
    if (t.improvement && MELTS.includes(t.improvement) && owner !== null) lost.set(owner, [...(lost.get(owner) ?? []), t.improvement === 'lumber' ? 'lumber hut' : t.improvement]);
    if (t.improvement && MELTS.includes(t.improvement)) t.improvement = null;
    t.road = false;
    if (t.resource !== 'ore') t.resource = null; // fruit, game and crops burn; ore is left in the rock
    if (t.terrain !== 'field') t.terrain = 'field'; // forest burns, marsh and sand are buried
    clearData(t, 'ash');
    setData(t, { lava: s.turn + 1 });
    flooded++;
  }
  tell(s, v.x, v.y, `A volcano erupts! Lava floods ${flooded} tiles around it.`);
  for (const [pid, what] of lost) emit({ type: 'toast', player: pid, text: `Lava destroyed your ${what.join(', ')}. The ash will be fertile once it cools.` });
}

function burn(s: GameState, u: Unit) {
  u.hp -= LAVA_DAMAGE;
  emit({ type: 'damage', unitId: u.id, x: u.x, y: u.y, amount: LAVA_DAMAGE });
  if (u.hp <= 0) {
    removeUnit(s, u, null);
    emit({ type: 'death', unitId: u.id, x: u.x, y: u.y, owner: u.owner, kind: u.kind });
  }
}

/** Lava that has had its round cools into ash, and half the ash fields sprout wild crops. */
function coolLava(s: GameState) {
  for (const t of s.tiles) {
    const until = num(t, 'lava');
    if (until === null || s.turn < until) continue;
    clearData(t, 'lava');
    setData(t, { ash: true });
    if (!t.resource && t.terrain === 'field' && !t.improvement && roll(s, t.y * s.size + t.x) < 0.5) t.resource = 'crop';
  }
}

/**
 * Extra growth from building or harvesting on volcanic ash (called by the rules when a tile is developed): pays the
 * stars now, returns the extra population, and uses the ash up.
 */
export function ashBonus(s: GameState, pid: number, t: Tile): number {
  if (!isAsh(t)) return 0;
  clearData(t, 'ash');
  s.players[pid].stars += ASH_STARS;
  emit({ type: 'stars', player: pid, x: t.x, y: t.y, amount: ASH_STARS });
  return ASH_POP;
}

// ---------------------------------------------------------------- great beasts

/** Can a Kraken swim here? Only open, deep ocean. */
const deep = (t: Tile | undefined) => !!t && t.terrain === 'ocean';

/** Anything afloat next to the beast is prey, whoever owns it. */
const preyOf = (s: GameState, k: Unit) => attackOptions(s, k).filter((e) => !isNeutral(s, e.owner) && isWater(tileAt(s, e.x, e.y)!) && dist(e.x, e.y, k.x, k.y) === 1);

function krakenAct(s: GameState, k: Unit) {
  if (k.hp < maxHp(k)) {
    const before = k.hp;
    k.hp = Math.min(maxHp(k), k.hp + KRAKEN_HEAL);
    emit({ type: 'heal', unitId: k.id, x: k.x, y: k.y, amount: k.hp - before });
  }
  k.moved = k.attacked = false;
  if (!preyOf(s, k).length) {
    // drift toward the nearest ship within reach, else wander the deep
    const ships = s.units.filter((e) => !isNeutral(s, e.owner) && isWater(tileAt(s, e.x, e.y)!) && dist(e.x, e.y, k.x, k.y) <= 4);
    const steps = neighbors(s, k.x, k.y).filter((t) => deep(t) && !unitAt(s, t.x, t.y));
    if (steps.length) {
      const near = (t: Tile) => Math.min(99, ...ships.map((e) => dist(e.x, e.y, t.x, t.y)));
      const to = ships.length
        ? steps.sort((a, b) => near(a) - near(b) || a.y - b.y || a.x - b.x)[0]
        : steps[Math.floor(roll(s, k.id) * steps.length)];
      emit({ type: 'move', unitId: k.id, owner: k.owner, path: [{ x: k.x, y: k.y }, { x: to.x, y: to.y }], embark: false, disembark: false });
      k.x = to.x;
      k.y = to.y;
    }
  }
  const prey = preyOf(s, k).sort((a, b) => a.hp - b.hp || a.id - b.id)[0];
  if (prey) {
    const home = { x: k.x, y: k.y };
    const who = prey.owner;
    attack(s, k, prey);
    emit({ type: 'toast', player: who, text: s.units.includes(prey) ? 'The Kraken lashes one of your ships!' : 'The Kraken drags one of your ships into the deep!' });
    // a beast that sank its prey may have surged into the shallows: it sinks back to the deep
    if (s.units.includes(k) && !deep(tileAt(s, k.x, k.y)) && !unitAt(s, home.x, home.y)) { k.x = home.x; k.y = home.y; }
  }
  k.moved = k.attacked = true;
}

/** Called by the rules whenever a unit is removed: a slain Great Beast pays its bounty to the empire that killed it. */
export function beastSlain(s: GameState, u: Unit, killer: Unit | null) {
  if (!isBeast(s, u) || !s.wild) return;
  s.wild.respawn.push({ kind: u.kind, turn: s.turn + BEAST_RESPAWN });
  if (!killer || isNeutral(s, killer.owner)) return;
  const bounty = BEASTS[u.kind] ?? 0;
  s.players[killer.owner].stars += bounty;
  emit({ type: 'stars', player: killer.owner, x: u.x, y: u.y, amount: bounty });
  emit({ type: 'toast', player: killer.owner, text: `The ${UNITS[u.kind].name} is slain! Its hoard pays a bounty of ${bounty}★.` });
  tell(s, u.x, u.y, `The ${UNITS[u.kind].name} has been slain.`, killer.owner);
}

/** A slain beast rises again in open water no one is close to. */
function riseAgain(s: GameState) {
  const w = s.wild!;
  for (const r of [...w.respawn]) {
    if (s.turn < r.turn) continue;
    const spots = s.tiles.filter((t) => deep(t) && !unitAt(s, t.x, t.y) && neighbors(s, t.x, t.y).filter(deep).length >= 5
      && s.units.every((e) => dist(e.x, e.y, t.x, t.y) > 2) && s.cities.every((c) => dist(c.x, c.y, t.x, t.y) > 3));
    if (!spots.length) continue; // try again next round
    const t = spots[Math.floor(roll(s, 991) * spots.length)];
    spawnNeutral(s, r.kind, t.x, t.y);
    w.respawn.splice(w.respawn.indexOf(r), 1);
    tell(s, t.x, t.y, `A ${UNITS[r.kind].name} rises from the deep!`);
  }
}

// ---------------------------------------------------------------- mercenary camps

/** May `pid` bid at this camp right now? */
export function canBid(s: GameState, pid: number, c: WildCamp): boolean {
  const p = s.players[pid];
  return !!c.offer && !!p && p.alive && !p.neutral && p.explored[c.y * s.size + c.x];
}
export const bidOf = (c: WildCamp, pid: number) => c.bids.find((b) => b.pid === pid)?.stars ?? 0;

/** The camp's entries in `pid`'s tile menu: sealed bids at three levels, or raising and withdrawing your own. */
export function wildActions(s: GameState, pid: number, t: Tile): Action[] {
  const c = campAt(s, t.x, t.y);
  if (!c || !c.offer || !canBid(s, pid, c)) return [];
  const p = s.players[pid];
  const mine = bidOf(c, pid);
  const d = UNITS[c.offer];
  const acts: Action[] = [];
  for (const step of BID_STEPS) {
    const amount = minBid(c.offer) + step;
    if (amount <= mine) continue;
    const cost = amount - mine;
    acts.push({
      id: `wild:bid:${amount}`, label: mine ? `Raise to ${amount}★` : `Bid ${amount}★`, cost, icon: c.offer,
      desc: `Sealed bid for a veteran ${d.name} (⚔${d.atk} 🛡${d.def} ❤${d.hp + 5}). The highest bid at the end of the round hires it; every other bid is refunded.`,
      enabled: p.stars >= cost, reason: p.stars < cost ? 'Not enough stars' : undefined,
    });
  }
  if (mine) acts.push({ id: 'wild:withdraw', label: 'Withdraw Bid', desc: `Take back your ${mine}★.`, cost: 0, icon: 'star', enabled: true });
  return acts;
}

/** Performs a camp action from the tile menu (the rules have already charged its cost). */
export function wildDoAction(s: GameState, pid: number, t: Tile, id: string): boolean {
  const c = campAt(s, t.x, t.y);
  if (!c) return false;
  if (id === 'wild:withdraw') {
    const mine = bidOf(c, pid);
    s.players[pid].stars += mine;
    c.bids = c.bids.filter((b) => b.pid !== pid);
    emit({ type: 'stars', player: pid, x: c.x, y: c.y, amount: mine });
    return true;
  }
  const amount = Number(id.slice('wild:bid:'.length));
  const b = c.bids.find((x) => x.pid === pid);
  if (b) b.stars = amount; // raising keeps your place in the queue for ties
  else c.bids.push({ pid, stars: amount });
  emit({ type: 'toast', player: pid, text: `Your sealed bid of ${amount}★ is in. The camp chooses at the end of the round.` });
  return true;
}

/** End of round at one camp: settle its auction, or restock it. */
function runCamp(s: GameState, c: WildCamp) {
  // bids of empires that fell this round are void
  c.bids = c.bids.filter((b) => s.players[b.pid]?.alive);
  if (c.offer && c.bids.length) {
    const ranked = [...c.bids].sort((a, b) => b.stars - a.stars); // stable: the earliest bid wins a tie
    const win = ranked[0];
    const spot = area(s, c.x, c.y, 2).find((t) => isLand(t) && t.terrain !== 'mountain' && !isLava(t) && !unitAt(s, t.x, t.y)
      && (t.cityId === null || s.cities.find((k) => k.id === t.cityId)?.owner === win.pid));
    if (!spot) {
      for (const b of c.bids) refund(s, c, b, 'No room at the mercenary camp: your bid is refunded.');
      c.bids = [];
      return;
    }
    const u = spawnUnit(s, c.offer, win.pid, spot.x, spot.y, null);
    u.veteran = true;
    u.hp = maxHp(u);
    emit({ type: 'toast', player: win.pid, text: `Your bid of ${win.stars}★ wins: a veteran ${UNITS[c.offer].name} joins you at the camp!` });
    for (const b of ranked.slice(1)) refund(s, c, b, `Outbid at the mercenary camp (${win.stars}★ won): your ${b.stars}★ is refunded.`);
    c.offer = null;
    c.bids = [];
    c.restock = s.turn + RESTOCK;
    return;
  }
  if (!c.offer && s.turn >= c.restock) {
    c.offer = pickOffer(roll(s, 500 + c.y * s.size + c.x));
    tell(s, c.x, c.y, `New mercenaries at the camp: a veteran ${UNITS[c.offer].name} is for hire. Tap the camp to bid.`);
  }
}

function refund(s: GameState, c: WildCamp, b: { pid: number; stars: number }, text: string) {
  s.players[b.pid].stars += b.stars;
  emit({ type: 'stars', player: b.pid, x: c.x, y: c.y, amount: b.stars });
  emit({ type: 'toast', player: b.pid, text });
}

// ---------------------------------------------------------------- AI

/**
 * One wild step for a computer empire: a sealed bid at a camp near its cities when it can spare the stars.
 * It bids once per offer, a little above the minimum (by an amount of its own, so rivals seldom tie).
 */
export function wildAi(s: GameState, pid: number): boolean {
  if (!s.wild || s.turn < 3) return false;
  const p = s.players[pid];
  for (const c of s.wild.camps) {
    if (!c.offer || !canBid(s, pid, c) || bidOf(c, pid)) continue;
    const near = citiesOf(s, pid).some((k) => dist(k.x, k.y, c.x, c.y) <= 5) || s.units.some((u) => u.owner === pid && dist(u.x, u.y, c.x, c.y) <= 2);
    if (!near) continue;
    const min = minBid(c.offer);
    const spare = p.stars - 5; // keep a little for the economy
    if (spare < min) continue;
    const eager = (pid * 7 + c.x * 3 + c.y + s.turn) % 3; // how much above the minimum this empire goes
    const step = [...BID_STEPS].reverse().find((k) => k <= eager * 3 && min + k <= spare) ?? 0;
    const t = tileAt(s, c.x, c.y)!;
    const id = `wild:bid:${min + step}`;
    if (tileActions(s, pid, t).some((a) => a.id === id && a.enabled)) return doAction(s, pid, t, id);
  }
  return false;
}

/** Is tile (x, y) within a Great Beast's reach? The AI keeps its boats out of it. */
export const nearBeast = (s: GameState, x: number, y: number) => s.units.some((b) => isBeast(s, b) && dist(b.x, b.y, x, y) <= 1);

// ---------------------------------------------------------------- tile descriptions

/** Title and text for a wild tile's panel, or null for an ordinary tile. Plain text, no UI. */
export function wildDescribe(s: GameState, t: Tile, viewer: number): { title: string; desc: string } | null {
  const c = campAt(s, t.x, t.y);
  if (c) {
    if (!c.offer) return { title: 'Mercenary Camp', desc: `The sellswords are out recruiting. New recruits in ${Math.max(1, c.restock - s.turn)} round(s).` };
    const d = UNITS[c.offer];
    const mine = bidOf(c, viewer);
    const n = c.bids.length;
    return {
      title: 'Mercenary Camp',
      desc: `A veteran ${d.name} is for hire. Sealed bids from ${minBid(c.offer)}★; ${n ? `${n} bid${n === 1 ? '' : 's'} so far` : 'no bids yet'}${mine ? `, yours is ${mine}★` : ''}. At the end of the round the highest bid hires it on the spot and the rest are refunded.`,
    };
  }
  const due = volcanoDue(t);
  if (due !== null) {
    const left = due - s.turn;
    return { title: 'Volcano', desc: left <= 1 ? 'It rumbles and smokes: lava will flood the land around it at the end of this round!' : `Active. It erupts in ${left} rounds, destroying improvements around it and leaving fertile ash.` };
  }
  if (isLava(t)) return { title: 'Lava Flow', desc: 'Molten rock: nothing can enter it. It cools into fertile ash at the end of the round.' };
  return null;
}

/** A line to add to an ash tile's description. */
export const ASH_NOTE = `Volcanic ash: the first harvest or building here grows the city by ${ASH_POP} more and pays ${ASH_STARS}★.`;
