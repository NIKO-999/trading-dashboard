// Raider Clans: outlaw camps in the unclaimed wilds whose raiders pillage the empires' land. Switched on per game
// (`NewGameOptions.clans`, on by default on the new-game screen) and independent of Wild events, like Rebellions: the
// first camp adds the hidden neutral owner (game/wild `ensureNeutral`) if the game has none. State lives in
// `GameState.clans` and in unit data, so saves work and older saves simply have none.
//
//  - CAMPS. From round CAMP_FROM a camp appears every CAMP_EVERY rounds, up to `maxCamps` (by map size), on open,
//    unclaimed land no empire can see: no city within CITY_GAP tiles and no unit within 2. Each has a temper picked at
//    random (CLANS: Horse, Sea, Hill or Wolf clan; a Sea clan only on a coast) and a guard standing on it.
//  - RAIDERS. Every few rounds (by temper) a camp sends out a raider (`unit.data.clan` = the camp id), up to
//    `raidCap` at once. Once a round, after the last empire (`clanRound`, run by game/wild.wildRound), each raider:
//    pillages the empire tile it stands on (a raised improvement loses a level, an ordinary one is torn down, else the
//    road is torn up; a raider on a city takes 1★ from its owner), strikes a weak unit in reach, and otherwise heads for
//    the nearest empire land within RAID_RANGE of its camp. It never captures anything: from SIEGE_FROM it may stand on
//    a city that is not a capital, which blocks training there. A badly hurt raider goes home to heal.
//  - ESCALATION. `clanTier` rises with the rounds: warriors and archers first, riders from round 12, swordsmen and
//    knights from round 20 (a Horse clan rides from the start; a Hill clan's guards are Defenders).
//  - WHAT EMPIRES CAN DO (tile menu on the camp, ids `wild:clan:*`, run through game/wild): step onto the camp once
//    its guard is dead to burn it (any move or a melee kill that advances; or "Clear Camp" for a unit beside it) for
//    `campReward` Stars, CAMP_SCORE score and a kill, and the rest of the clan scatters; pay a bribe (`bribeCost`) and
//    it leaves you alone for TRUCE rounds; or pay more (`recruitCost`) to hire one of its raiders (or a fresh one).
//    A raider slain pays RAIDER_BOUNTY★.
//  - AI. Computer empires hunt raiders near their cities, march on camps near them once they have an army, and pay
//    off a clan whose raiders are in their land while they are weak (`clanAi`, called from game/ai).
import { TRIBES } from '../data/tribes';
import { UNITS } from '../data/units';
import { eraIndex } from './eras';
import { emit } from './events';
import { dist, isLand, neighbors, tileAt } from './grid';
import { tileLevel } from './levels';
import { attack, attackOptions, citiesOf, cityById, def, doAction, maxHp, moveOptions, moveUnit, previewCombat, removeUnit, tileActions, tileOwnerPlayer, unitAt, type Action } from './rules';
import type { ClanCamp, ClanKind, GameState, Improvement, Tile, Unit, UnitKind } from './types';
import { campAt, empires, ensureNeutral, isLava, isNeutral, spawnNeutral, volcanoDue } from './wild';

// ---------------------------------------------------------------- tuning

/** The first round a camp may appear, and the rounds between new camps. */
export const CAMP_FROM = 4;
export const CAMP_EVERY = 5;
/** No camp appears within this many tiles of a city. */
export const CITY_GAP = 3;
/** How far from its camp a raider goes looking for land to pillage. */
export const RAID_RANGE = 8;
/** From this round raiders may stand on (besiege) a city that is not a capital. */
export const SIEGE_FROM = 12;
/** Rounds a bribe buys. */
export const TRUCE = 8;
/** Score for burning a camp (on top of the kill). */
export const CAMP_SCORE = 100;
/** Stars for slaying a raider. */
export const RAIDER_BOUNTY = 1;
/** Health a raider recovers each round (a guard, or a raider back at its camp, twice as much). */
export const RAIDER_HEAL = 1;

export interface ClanDef { name: string; names: string[]; blurb: string; every: number; raiders: [UnitKind[], UnitKind[], UnitKind[]]; guard: [UnitKind, UnitKind, UnitKind] }
/** The four tempers a clan can have: its raiders by tier, its guard by tier and how often it raids. */
export const CLANS: Record<ClanKind, ClanDef> = {
  horse: {
    name: 'Horse clan', names: ['Dust Riders', 'Red Mane Riders', 'Thunder Hooves'], every: 3,
    blurb: 'Raiders on horseback: fast, and they raid often.',
    raiders: [['rider', 'warrior'], ['rider', 'horsearcher'], ['knight', 'rider']], guard: ['warrior', 'rider', 'knight'],
  },
  sea: {
    name: 'Sea clan', names: ['Salt Reavers', 'Gull Raiders', 'Tide Wolves'], every: 4,
    blurb: 'Raiders who come by canoe and land on the coasts.',
    raiders: [['warrior', 'archer'], ['warrior', 'archer'], ['swordsman', 'archer']], guard: ['warrior', 'archer', 'swordsman'],
  },
  hill: {
    name: 'Hill clan', names: ['Stonebacks', 'Crag Folk', 'Iron Brows'], every: 5,
    blurb: 'Tough fighters: their camp is held by shield-bearers and they raid less often.',
    raiders: [['warrior'], ['warrior', 'archer'], ['swordsman']], guard: ['defender', 'defender', 'swordsman'],
  },
  wolf: {
    name: 'Wolf clan', names: ['Grey Wolves', 'Ash Pack', 'Howlers'], every: 4,
    blurb: 'Bowmen of the woods who shoot from afar.',
    raiders: [['archer', 'warrior'], ['archer', 'rider'], ['archer', 'swordsman']], guard: ['warrior', 'archer', 'defender'],
  },
};

/** Improvements raiders tear down (a temple is sacred to them too: they only knock a level off one). */
const TEAR_DOWN: Improvement[] = ['farm', 'mine', 'lumber', 'port', 'market', 'pasture', 'orchard', 'estate'];

// ---------------------------------------------------------------- queries

export const clansOn = (s: GameState) => !!s.clans;
export const clanById = (s: GameState, id: unknown): ClanCamp | undefined => (typeof id === 'number' ? s.clans?.camps.find((c) => c.id === id) : undefined);
export const clanCampAt = (s: GameState, x: number, y: number): ClanCamp | undefined => s.clans?.camps.find((c) => c.x === x && c.y === y);
/** Is this a Raider Clan's unit (a raider or a camp guard)? */
export const isRaider = (s: GameState, u: Unit) => isNeutral(s, u.owner) && typeof u.data?.clan === 'number';
export const isGuard = (s: GameState, u: Unit) => isRaider(s, u) && u.data?.guard === true;
export const raidersOf = (s: GameState, c: ClanCamp) => s.units.filter((u) => isRaider(s, u) && u.data!.clan === c.id);
/** The camp a raider belongs to. */
export const clanOf = (s: GameState, u: Unit) => (isRaider(s, u) ? clanById(s, u.data!.clan) : undefined);

/** 0 early, 1 from round SIEGE_FROM, 2 from round 20: what the clans send out. */
export const clanTier = (s: GameState) => (s.turn >= 20 ? 2 : s.turn >= SIEGE_FROM ? 1 : 0);
/** Roaming raiders a camp keeps out at once. */
export const raidCap = (s: GameState) => 1 + clanTier(s);
/** How many camps the map holds at once: about one per 150 tiles, 1 to 4. */
export const maxCamps = (s: GameState) => Math.max(1, Math.min(4, Math.round((s.size * s.size) / 150)));

/** Is `pid` paying this clan off right now? */
export const truceWith = (s: GameState, c: ClanCamp, pid: number) => c.truce.some((t) => t.pid === pid && t.until > s.turn);
/** Does this clan's raider leave `pid` alone? (Rogue States, beasts and other clans are never its prey.) */
const spares = (s: GameState, c: ClanCamp, pid: number) => isNeutral(s, pid) || truceWith(s, c, pid) || !s.players[pid]?.alive;

/** Stars to buy a truce: more as the clans grow stronger. */
export const bribeCost = (s: GameState) => 5 + 3 * clanTier(s);
/** Stars to hire one of the clan's raiders. */
export const recruitCost = (s: GameState, c: ClanCamp) => 6 + 2 * clanTier(s) + UNITS[raidKind(s, c)].cost;
/** Stars for burning a camp: 8, and 2 more for each era the empire has reached and each tier the clans have grown. */
export const campReward = (s: GameState, pid: number) => 8 + 2 * eraIndex(s.players[pid]) + 2 * clanTier(s);

/** The kind the camp sends out next (it alternates through its list). */
export function raidKind(s: GameState, c: ClanCamp): UnitKind {
  const list = CLANS[c.kind].raiders[clanTier(s)];
  return list[(c.spawn + c.id) % list.length];
}

/** A deterministic 0..1 roll for this game, round and purpose (play-time events must not use Math.random). */
function roll(s: GameState, salt: number) {
  let h = (s.seed ^ Math.imul(s.turn + 3, 0x9e3779b1) ^ Math.imul(salt + 11, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39) >>> 0;
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}


/** Tells every empire that has seen (x, y), except `but`. */
function tell(s: GameState, x: number, y: number, text: string, but = -1) {
  for (const p of empires(s)) if (p.alive && p.id !== but && p.explored[y * s.size + x]) emit({ type: 'toast', player: p.id, text });
}

// ---------------------------------------------------------------- camps appear

/** Open ground a raider can stand on (not a city, village, ruin, camp or lava). */
const open = (s: GameState, t: Tile) => isLand(t) && t.terrain !== 'mountain' && t.terrain !== 'ice' && t.terrain !== 'bridge' && t.terrain !== 'platform'
  && t.cityId === null && !t.village && !t.ruin && !isLava(t) && !campAt(s, t.x, t.y) && !clanCampAt(s, t.x, t.y);

/** Can a camp be pitched here? Unclaimed, out of every empire's sight, away from cities and other camps. */
export function campSite(s: GameState, t: Tile): boolean {
  if (!open(s, t) || t.owner !== null || t.resource || t.improvement || unitAt(s, t.x, t.y) || volcanoDue(t) !== null) return false;
  if (s.cities.some((c) => dist(c.x, c.y, t.x, t.y) <= CITY_GAP)) return false;
  if (s.units.some((u) => !isNeutral(s, u.owner) && dist(u.x, u.y, t.x, t.y) <= 2)) return false;
  if ((s.wild?.camps ?? []).some((c) => dist(c.x, c.y, t.x, t.y) < 4) || (s.clans?.camps ?? []).some((c) => dist(c.x, c.y, t.x, t.y) < 5)) return false;
  if (neighbors(s, t.x, t.y).some((n) => n.village || n.cityId !== null || volcanoDue(n) !== null)) return false;
  return neighbors(s, t.x, t.y).filter((n) => open(s, n)).length >= 3; // room to muster
}

/** A coast with room for canoes: a Sea clan may camp here. */
const coastal = (s: GameState, t: Tile) => neighbors(s, t.x, t.y).filter((n) => n.terrain === 'shallow').length >= 2;

/** Pitches a new camp (if there is room) on the best site, with its guard. Returns it. */
export function pitchCamp(s: GameState, at?: Tile, kind?: ClanKind): ClanCamp | undefined {
  const st = s.clans!;
  const sites = at ? [at] : s.tiles.filter((t) => campSite(s, t));
  if (!sites.length) return undefined;
  const t = sites[Math.floor(roll(s, 17 + st.seq) * sites.length)];
  const kinds: ClanKind[] = coastal(s, t) ? ['horse', 'hill', 'wolf', 'sea', 'sea'] : ['horse', 'hill', 'wolf'];
  const k = kind ?? kinds[Math.floor(roll(s, 29 + st.seq) * kinds.length)];
  const names = CLANS[k].names;
  const c: ClanCamp = { id: st.seq++, x: t.x, y: t.y, kind: k, name: names[Math.floor(roll(s, 41 + st.seq) * names.length)], founded: s.turn, spawn: s.turn + 2, truce: [] };
  st.camps.push(c);
  t.road = false;
  t.resource = null; // trampled into the camp
  ensureNeutral(s);
  muster(s, c, CLANS[k].guard[clanTier(s)], true);
  s.log.push({ turn: s.turn, text: `An outlaw camp of the ${c.name} (${CLANS[k].name.toLowerCase()}) is pitched in the wilds.` });
  return c;
}

/** A new unit for the clan: the guard on the camp itself, a raider beside it (a Sea clan's afloat in a canoe). */
function muster(s: GameState, c: ClanCamp, kind: UnitKind, guard: boolean): Unit | null {
  let spot: Tile | undefined;
  let afloat = false;
  if (guard) spot = unitAt(s, c.x, c.y) ? undefined : tileAt(s, c.x, c.y);
  else {
    const around = neighbors(s, c.x, c.y).sort((a, b) => a.y - b.y || a.x - b.x);
    if (c.kind === 'sea') { spot = around.find((n) => n.terrain === 'shallow' && !unitAt(s, n.x, n.y)); afloat = !!spot; }
    spot ??= around.find((n) => open(s, n) && !unitAt(s, n.x, n.y));
  }
  if (!spot) return null;
  const u = spawnNeutral(s, afloat ? 'boat' : kind, spot.x, spot.y);
  if (afloat) { u.carrying = kind; u.hp = maxHp(u); }
  u.data = guard ? { clan: c.id, guard: true } : { clan: c.id };
  return u;
}

// ---------------------------------------------------------------- the clans' round

/** Once a round, after the last empire (called by game/wild.wildRound): raiders act, camps muster, new camps appear. */
export function clanRound(s: GameState) {
  const st = s.clans;
  if (!st) return;
  // raiders whose camp is gone scatter to the winds
  for (const u of s.units.filter((x) => isRaider(s, x) && !clanOf(s, x))) {
    removeUnit(s, u, null);
    emit({ type: 'death', unitId: u.id, x: u.x, y: u.y, owner: u.owner, kind: u.kind });
  }
  for (const c of st.camps) c.truce = c.truce.filter((t) => t.until > s.turn);
  for (const u of s.units.filter((x) => isRaider(s, x)).sort((a, b) => a.id - b.id)) if (s.units.includes(u)) raiderAct(s, u, clanOf(s, u)!);
  for (const c of st.camps) {
    const band = raidersOf(s, c);
    if (!band.some((u) => isGuard(s, u)) && !unitAt(s, c.x, c.y)) { muster(s, c, CLANS[c.kind].guard[clanTier(s)], true); continue; } // a new chief's guard
    if (s.turn < c.spawn) continue;
    if (band.filter((u) => !isGuard(s, u)).length < raidCap(s)) {
      const kind = raidKind(s, c);
      if (muster(s, c, kind, false)) tell(s, c.x, c.y, `Raiders of the ${c.name} ride out from their camp!`);
    }
    c.spawn = s.turn + CLANS[c.kind].every;
  }
  if (s.turn >= CAMP_FROM && s.turn >= st.next && st.camps.length < maxCamps(s)) {
    if (pitchCamp(s)) st.next = s.turn + CAMP_EVERY;
  }
}

/** Can the raider's clan pillage this tile, and what would it do? */
export function pillageable(s: GameState, c: ClanCamp, t: Tile): boolean {
  const owner = tileOwnerPlayer(s, t);
  if (owner === null || spares(s, c, owner)) return false;
  if (t.cityId !== null) return siegeable(s, c, t);
  return tileLevel(t) >= 2 || (!!t.improvement && TEAR_DOWN.includes(t.improvement)) || t.road;
}

/** May raiders stand on this city? Only later in the game, never on a capital, never one of a spared empire. */
function siegeable(s: GameState, c: ClanCamp, t: Tile) {
  const city = cityById(s, t.cityId);
  return !!city && s.turn >= SIEGE_FROM && !city.capital && !city.data?.waka && !spares(s, c, city.owner);
}

/** The raider wrecks what it stands on (its owner is told). False when there is nothing to wreck. */
function pillage(s: GameState, u: Unit, c: ClanCamp): boolean {
  const t = tileAt(s, u.x, u.y)!;
  if (!pillageable(s, c, t)) return false;
  const owner = tileOwnerPlayer(s, t)!;
  const city = cityById(s, t.owner);
  let what: string;
  if (t.cityId !== null) {
    const loot = Math.min(1, s.players[owner].stars);
    s.players[owner].stars -= loot;
    what = loot ? `besiege ${city!.name} and carry off ${loot}★` : `besiege ${city!.name}`;
  } else {
    const lvl = tileLevel(t);
    const base = t.improvement === 'pasture' || t.improvement === 'orchard' ? 2 : 1;
    if (lvl > base) {
      t.data = { ...t.data, lvl: lvl - 1 };
      if (lvl - 1 <= 1) { const { lvl: _l, lvk: _k, ...rest } = t.data; t.data = rest; }
      what = `knock down a level of your ${t.improvement === 'temple' ? 'temple' : t.improvement}`;
    } else if (t.improvement && TEAR_DOWN.includes(t.improvement)) {
      what = `tear down your ${t.improvement === 'estate' ? 'luxury works' : t.improvement === 'lumber' ? 'lumber hut' : t.improvement}`;
      t.improvement = null;
      if (t.data?.lvl !== undefined) { const { lvl: _l, lvk: _k, ...rest } = t.data; t.data = rest; }
    } else {
      t.road = false;
      what = 'tear up your road';
    }
  }
  emit({ type: 'toast', player: owner, text: `Raiders of the ${c.name} ${what}${city && t.cityId === null ? ` near ${city.name}` : ''}! Drive them off, burn their camp, or pay them off.` });
  return true;
}

/** Strike a weak unit in reach (one the blow will kill, or that will hurt it less than it hurts them). */
function strike(s: GameState, u: Unit, c: ClanCamp): boolean {
  const best = attackOptions(s, u)
    .filter((e) => !spares(s, c, e.owner) && (def(u).range > 1 || mayTread(s, c, e.x, e.y))) // a melee kill advances: never into a ruin or a city it may not besiege
    .map((e) => ({ e, ...previewCombat(s, u, e) }))
    .filter((o) => o.kills || (o.dmg > o.ret && u.hp > o.ret + 1))
    .sort((a, b) => (b.kills ? 100 : 0) + b.dmg - b.ret - ((a.kills ? 100 : 0) + a.dmg - a.ret) || a.e.id - b.e.id)[0];
  if (!best) return false;
  const who = best.e.owner;
  const guardHome = isGuard(s, u) ? { x: u.x, y: u.y } : null;
  attack(s, u, best.e);
  emit({ type: 'toast', player: who, text: s.units.includes(best.e) ? `Raiders of the ${c.name} attack one of your units!` : `Raiders of the ${c.name} cut down one of your units!` });
  // a guard that cleared its foe's tile goes back to its camp
  if (guardHome && s.units.includes(u) && (u.x !== guardHome.x || u.y !== guardHome.y) && !unitAt(s, guardHome.x, guardHome.y)) {
    emit({ type: 'move', unitId: u.id, owner: u.owner, path: [{ x: u.x, y: u.y }, guardHome], embark: false, disembark: false });
    u.x = guardHome.x;
    u.y = guardHome.y;
  }
  return true;
}

/** Where a raider is heading: home when hurt, else the nearest empire land worth pillaging within reach of its camp. */
export function raidTarget(s: GameState, u: Unit, c: ClanCamp): { x: number; y: number } | null {
  if (u.hp <= maxHp(u) * 0.4) return { x: c.x, y: c.y };
  let best: Tile | null = null, bd = Infinity;
  for (const t of s.tiles) {
    if (dist(t.x, t.y, c.x, c.y) > RAID_RANGE || !pillageable(s, c, t)) continue;
    const other = unitAt(s, t.x, t.y);
    if (other && other !== u) continue;
    const d = dist(t.x, t.y, u.x, u.y) + (t.cityId !== null ? 1 : 0);
    if (d < bd) { bd = d; best = t; }
  }
  if (best) return best;
  // nothing to wreck: go after a unit near the camp, else keep close to it
  const prey = s.units.filter((e) => !isNeutral(s, e.owner) && !spares(s, c, e.owner) && dist(e.x, e.y, c.x, c.y) <= 4)
    .sort((a, b) => dist(a.x, a.y, u.x, u.y) - dist(b.x, b.y, u.x, u.y) || a.id - b.id)[0];
  if (prey) return prey;
  return dist(u.x, u.y, c.x, c.y) > 2 ? { x: c.x, y: c.y } : null;
}

/** May a raider step here? Never onto ruins, villages, camps or a city it may not besiege. */
function mayTread(s: GameState, c: ClanCamp, x: number, y: number) {
  const t = tileAt(s, x, y)!;
  if (t.ruin || t.village || campAt(s, x, y) || clanCampAt(s, x, y)) return false;
  return t.cityId === null || siegeable(s, c, t);
}

function raiderAct(s: GameState, u: Unit, c: ClanCamp) {
  const atCamp = dist(u.x, u.y, c.x, c.y) <= 1;
  if (u.hp < maxHp(u)) {
    const before = u.hp;
    u.hp = Math.min(maxHp(u), u.hp + (isGuard(s, u) || atCamp ? RAIDER_HEAL * 2 : RAIDER_HEAL));
    emit({ type: 'heal', unitId: u.id, x: u.x, y: u.y, amount: u.hp - before });
  }
  u.moved = u.attacked = false;
  if (isGuard(s, u)) { strike(s, u, c); u.moved = u.attacked = true; return; }
  const hurt = u.hp <= maxHp(u) * 0.4;
  if (!hurt && pillage(s, u, c)) { strike(s, u, c); u.moved = u.attacked = true; return; } // it stays to finish the job
  if (!hurt && strike(s, u, c)) { u.moved = u.attacked = true; return; }
  const goal = raidTarget(s, u, c);
  if (goal) {
    const here = dist(u.x, u.y, goal.x, goal.y);
    const step = moveOptions(s, u)
      .filter((o) => !o.embark && mayTread(s, c, o.x, o.y) && !(o.disembark && def(u).naval && !u.carrying))
      .map((o) => ({ o, d: dist(o.x, o.y, goal.x, goal.y) }))
      .filter((m) => m.d < here)
      .sort((a, b) => a.d - b.d || a.o.y - b.o.y || a.o.x - b.o.x)[0];
    if (step) moveUnit(s, u, step.o.x, step.o.y);
    u.attacked = false; // raiders move and then pillage or strike in one round
    if (s.units.includes(u) && !hurt && !pillage(s, u, c)) strike(s, u, c);
  }
  if (s.units.includes(u)) u.moved = u.attacked = true;
}

// ---------------------------------------------------------------- the empires strike back

/**
 * Called by the rules when a unit of an empire ends a move (or a melee kill's advance) on a clan camp: the camp is
 * burned, its owner rewarded, and the rest of the clan scatters at the end of the round.
 */
export function enterCamp(s: GameState, u: Unit, t: Tile): boolean {
  const c = clanCampAt(s, t.x, t.y);
  if (!c || isNeutral(s, u.owner) || !s.clans) return false;
  const pid = u.owner;
  const p = s.players[pid];
  const pay = campReward(s, pid);
  p.stars += pay;
  p.bonusScore += CAMP_SCORE;
  p.kills++;
  s.clans.camps = s.clans.camps.filter((x) => x !== c);
  s.clans.cleared++;
  s.clans.next = Math.max(s.clans.next, s.turn + CAMP_EVERY);
  emit({ type: 'stars', player: pid, x: t.x, y: t.y, amount: pay });
  emit({ type: 'ruin', player: pid, title: 'Outlaw Camp Burned', text: `Your troops burn the camp of the ${c.name} and seize its loot: +${pay}★ and +${CAMP_SCORE} score. The rest of the clan scatters.` });
  tell(s, t.x, t.y, `The camp of the ${c.name} has been burned.`, pid);
  s.log.push({ turn: s.turn, text: `${TRIBES[p.tribe].people} forces burn the outlaw camp of the ${c.name}.` });
  return true;
}

/** Called by the rules whenever a unit is removed: a slain raider pays a small bounty to the empire that killed it. */
export function raiderSlain(s: GameState, u: Unit, killer: Unit | null) {
  if (!isRaider(s, u) || !killer || isNeutral(s, killer.owner)) return;
  s.players[killer.owner].stars += RAIDER_BOUNTY;
  emit({ type: 'stars', player: killer.owner, x: u.x, y: u.y, amount: RAIDER_BOUNTY });
}

/** A unit of `pid`'s beside the camp that could walk onto it now. */
function clearer(s: GameState, pid: number, c: ClanCamp): Unit | undefined {
  return s.units.filter((u) => u.owner === pid && dist(u.x, u.y, c.x, c.y) === 1 && !def(u).naval && def(u).atk > 0)
    .sort((a, b) => a.id - b.id)
    .find((u) => moveOptions(s, u).some((o) => o.x === c.x && o.y === c.y));
}

/** The camp's entries in `pid`'s tile menu (ids `wild:clan:*`, listed and run by game/wild). */
export function clanActions(s: GameState, pid: number, t: Tile): Action[] {
  const c = clanCampAt(s, t.x, t.y);
  const p = s.players[pid];
  if (!c || !p || p.neutral || !p.alive || !p.explored[t.y * s.size + t.x]) return [];
  const acts: Action[] = [];
  const guard = unitAt(s, c.x, c.y);
  const by = guard ? undefined : clearer(s, pid, c);
  acts.push({
    id: 'wild:clan:clear', label: 'Clear Camp', cost: 0, icon: 'flag',
    desc: `March a unit onto the camp and burn it: +${campReward(s, pid)}★, +${CAMP_SCORE} score and a kill. The rest of the clan scatters.`,
    enabled: !!by, reason: guard ? 'Defeat the camp’s guard first' : by ? undefined : 'Needs a unit of yours beside the camp that can still move',
  });
  const bribe = bribeCost(s);
  const paid = truceWith(s, c, pid);
  acts.push({
    id: 'wild:clan:bribe', label: 'Pay Off', cost: bribe, icon: 'star',
    desc: `Pay the ${c.name} ${bribe}★ to leave your land and units alone for ${TRUCE} rounds. They raid someone else instead.`,
    enabled: !paid && p.stars >= bribe, reason: paid ? `Paid off until round ${c.truce.find((x) => x.pid === pid)!.until}` : p.stars < bribe ? 'Not enough stars' : undefined,
  });
  const kind = raidKind(s, c);
  const hire = recruitCost(s, c);
  const d = UNITS[kind];
  acts.push({
    id: 'wild:clan:recruit', label: `Hire a Raider`, cost: hire, icon: kind,
    desc: `Buy one of the ${c.name}'s raiders to fight for you (a ${d.name}, ⚔${d.atk} 🛡${d.def}, or the one roaming nearest your land). It has no home city.`,
    enabled: p.stars >= hire && !!hireSpot(s, pid, c), reason: p.stars < hire ? 'Not enough stars' : !hireSpot(s, pid, c) ? 'No room beside the camp' : undefined,
  });
  return acts;
}

/** The raider a hire would take: the roaming one nearest the buyer's cities, or null (a fresh one steps out). */
function hireable(s: GameState, pid: number, c: ClanCamp): Unit | null {
  const band = raidersOf(s, c).filter((u) => !isGuard(s, u) && !u.carrying);
  const near = (u: Unit) => Math.min(99, ...citiesOf(s, pid).map((k) => dist(k.x, k.y, u.x, u.y)));
  return band.sort((a, b) => near(a) - near(b) || a.id - b.id)[0] ?? null;
}
const hireSpot = (s: GameState, pid: number, c: ClanCamp) => hireable(s, pid, c) ?? neighbors(s, c.x, c.y).find((n) => open(s, n) && !unitAt(s, n.x, n.y));

/** Runs a camp action (the rules have already charged its cost). */
export function clanDoAction(s: GameState, pid: number, t: Tile, id: string): boolean {
  const c = clanCampAt(s, t.x, t.y);
  if (!c) return false;
  if (id === 'wild:clan:clear') {
    const u = clearer(s, pid, c);
    return !!u && moveUnit(s, u, c.x, c.y); // the rules burn the camp as the unit arrives (enterCamp)
  }
  if (id === 'wild:clan:bribe') {
    c.truce = [...c.truce.filter((x) => x.pid !== pid), { pid, until: s.turn + TRUCE }];
    emit({ type: 'toast', player: pid, text: `The ${c.name} take your ${bribeCost(s)}★ and will leave you alone until round ${s.turn + TRUCE}.` });
    return true;
  }
  if (id === 'wild:clan:recruit') {
    let u = hireable(s, pid, c);
    if (u) {
      u.owner = pid;
      u.data = undefined;
      u.homeCity = null;
    } else {
      const spot = neighbors(s, c.x, c.y).find((n) => open(s, n) && !unitAt(s, n.x, n.y));
      if (!spot) return false;
      u = spawnNeutral(s, raidKind(s, c), spot.x, spot.y);
      u.owner = pid;
    }
    u.moved = u.attacked = true;
    emit({ type: 'toast', player: pid, text: `A ${UNITS[u.kind].name} of the ${c.name} takes your pay and joins you. It is ready next turn.` });
    return true;
  }
  return false;
}

// ---------------------------------------------------------------- AI

/** Raiders a computer empire should hunt: those near its cities or in its land that are not leaving it alone. */
export function raidThreats(s: GameState, pid: number): Unit[] {
  if (!s.clans) return [];
  const cities = citiesOf(s, pid);
  return s.units.filter((u) => {
    const c = clanOf(s, u);
    if (!c || isGuard(s, u) || truceWith(s, c, pid)) return false;
    const t = tileAt(s, u.x, u.y)!;
    return tileOwnerPlayer(s, t) === pid || cities.some((k) => dist(k.x, k.y, u.x, u.y) <= 3);
  });
}

/** Camps a computer empire should march on: seen, near its cities, and it has an army to spare. */
export function campTargets(s: GameState, pid: number): ClanCamp[] {
  if (!s.clans) return [];
  const army = s.units.filter((u) => u.owner === pid && def(u).atk > 0 && !def(u).naval).length;
  const cities = citiesOf(s, pid);
  if (army < Math.max(3, cities.length + 1)) return [];
  return s.clans.camps.filter((c) => s.players[pid].explored[c.y * s.size + c.x] && cities.some((k) => dist(k.x, k.y, c.x, c.y) <= 7));
}

/** One clan step for a computer empire: pay off a clan whose raiders are in its land while it is too weak to fight. */
export function clanAi(s: GameState, pid: number): boolean {
  if (!s.clans) return false;
  const p = s.players[pid];
  const threats = raidThreats(s, pid);
  if (!threats.length) return false;
  for (const c of s.clans.camps) {
    if (truceWith(s, c, pid) || !p.explored[c.y * s.size + c.x]) continue;
    const mine = threats.filter((u) => u.data!.clan === c.id);
    if (!mine.length) continue;
    const guards = s.units.filter((u) => u.owner === pid && def(u).atk > 0 && mine.some((r) => dist(r.x, r.y, u.x, u.y) <= 3)).length;
    const cost = bribeCost(s);
    if (guards >= mine.length || p.stars < cost + 4) continue; // strong enough to fight, or too poor to pay
    const t = tileAt(s, c.x, c.y)!;
    if (tileActions(s, pid, t).some((a) => a.id === 'wild:clan:bribe' && a.enabled)) return doAction(s, pid, t, 'wild:clan:bribe');
  }
  return false;
}

// ---------------------------------------------------------------- descriptions

/** Title and text for a camp's panel. Plain text, no UI. */
export function clanDescribe(s: GameState, t: Tile, viewer: number): { title: string; desc: string } | null {
  const c = clanCampAt(s, t.x, t.y);
  if (!c) return null;
  const d = CLANS[c.kind];
  const out = raidersOf(s, c).filter((u) => !isGuard(s, u)).length;
  const truce = c.truce.find((x) => x.pid === viewer && x.until > s.turn);
  return {
    title: `Outlaw Camp · ${c.name}`,
    desc: `${d.name}: ${d.blurb} ${out ? `${out} raider${out === 1 ? '' : 's'} out raiding` : 'No raiders out right now'}; next ride-out in ${Math.max(1, c.spawn - s.turn)} round(s).`
      + `${truce ? ` They leave you alone until round ${truce.until}.` : ''} Burn it (+${campReward(s, viewer)}★), pay it off (${bribeCost(s)}★) or hire a raider.`,
  };
}

/** One line for a raider's unit panel. */
export function raiderLine(s: GameState, u: Unit, viewer: number): string {
  const c = clanOf(s, u);
  if (!c) return 'An outlaw raider.';
  if (isGuard(s, u)) return `The guard of the ${c.name}'s camp (${CLANS[c.kind].name.toLowerCase()}). Defeat it, then step onto the camp to burn it.`;
  return `A raider of the ${c.name} (${CLANS[c.kind].name.toLowerCase()}). It pillages farms, mines and roads, attacks weak units and can besiege a city, but never takes one.${truceWith(s, c, viewer) ? ' Paid off: it leaves you alone for now.' : ''}`;
}
