import { emit } from '../events';
import { dist, isLand, isWater, neighbors } from '../grid';
import { addPop, citiesOf, maxHp, tileOwnerPlayer } from '../rules';
import type { Action } from '../rules';
import type { GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

// Pemmican (empire bonus) + Trading Posts & the Winter Count (signature).
//
// Pemmican: at the start of the Cree turn, every wounded Cree unit standing OUTSIDE Cree borders heals PEMMICAN_HEAL HP
// (dried meat and berries carried on the trail). Units at home get nothing from it.
//
// Trading posts (improvement `tradingpost`, the `mech:post` tile action): built on a forest or shore land tile (land
// beside water) inside Cree borders, with no improvement, resource, city, village or ruin, and not next to another post.
// The first costs POST_COST★, each further one POST_STEP★ more for every post already standing.
//  - Income: each post pays POST_PAY★ a turn, +1★ for every animal resource within 1 tile, at most POST_CAP★.
//  - Contact: every unit of another empire (a trader included) standing on or next to a post when the Cree turn starts
//    pays +CONTACT_PAY★, at most CONTACT_CAP★ a turn. The visitors lose nothing: it is the trade they bring.
//
// The Winter Count: every WINTER_EVERY turns (turns 10, 20, ...) the Cree record the year's story. If no Cree city was
// lost in those turns, every Cree city grows by WINTER_POP. The last WINTER_KEEP years are kept in `player.mech.winter`.

export const PEMMICAN_HEAL = 2;
export const POST_COST = 5;
export const POST_STEP = 1;
export const POST_PAY = 1;
export const POST_CAP = 2;
export const CONTACT_PAY = 1;
export const CONTACT_CAP = 2;
export const WINTER_EVERY = 10;
export const WINTER_POP = 1;
export const WINTER_KEEP = 6;
/** The AI keeps this many stars back after building a post. */
const AI_RESERVE = 3;

const isCree = (s: GameState, pid: number) => s.players[pid]?.tribe === 'cree';

/** One recorded winter: the turn, whether the cities grew, and how many did. */
export interface Winter { turn: number; good: boolean; cities: number }

// ---------------------------------------------------------------- pemmican

/** Turn start: Cree wounded outside Cree borders heal PEMMICAN_HEAL. */
export function pemmican(s: GameState, owner: number) {
  for (const u of s.units) {
    if (u.owner !== owner || u.hp >= maxHp(u)) continue;
    const t = s.tiles[u.y * s.size + u.x];
    if (!t || tileOwnerPlayer(s, t) === owner) continue;
    const before = u.hp;
    u.hp = Math.min(maxHp(u), u.hp + PEMMICAN_HEAL);
    emit({ type: 'heal', unitId: u.id, x: u.x, y: u.y, amount: u.hp - before });
  }
}

// ---------------------------------------------------------------- trading posts

/** Every trading post inside `owner`'s borders. */
export const posts = (s: GameState, owner: number): Tile[] =>
  s.tiles.filter((t) => t.improvement === 'tradingpost' && tileOwnerPlayer(s, t) === owner);

/** What the next post costs: 5★, +1★ for each standing. */
export const postCost = (s: GameState, owner: number) => POST_COST + POST_STEP * posts(s, owner).length;

/** Land beside water. */
const shore = (s: GameState, t: Tile) => isLand(t) && neighbors(s, t.x, t.y).some(isWater);

/** Is this a bare forest or shore tile a post could stand on? */
const postGround = (s: GameState, t: Tile) =>
  isLand(t) && t.terrain !== 'mountain' && t.terrain !== 'ice' && t.terrain !== 'bridge' && t.terrain !== 'platform'
  && (t.terrain === 'forest' || shore(s, t))
  && !t.improvement && t.cityId === null && !t.village && !t.ruin && !t.resource;

/** Why a trading post can't be built here (stars aside), or null if it can. */
export function postWhy(s: GameState, owner: number, t: Tile): string | null {
  if (tileOwnerPlayer(s, t) !== owner) return 'Only inside your borders';
  if (!postGround(s, t)) return 'Needs an empty forest or shore tile';
  if (neighbors(s, t.x, t.y).some((n) => n.improvement === 'tradingpost')) return 'Too close to another post';
  if (s.units.some((u) => u.x === t.x && u.y === t.y && u.owner !== owner)) return 'Enemy on the tile';
  return null;
}

/** Stars one post pays a turn: 1, +1 for each animal resource around it, at most 3. */
export const postStars = (s: GameState, t: Tile) =>
  Math.min(POST_CAP, POST_PAY + neighbors(s, t.x, t.y).filter((n) => n.resource === 'animal').length);

export const postIncome = (s: GameState, owner: number) => posts(s, owner).reduce((n, t) => n + postStars(s, t), 0);

/** Units of other empires on or next to one of `owner`'s posts (each counted once; neutral beasts and clans excluded). */
export function visitors(s: GameState, owner: number): Unit[] {
  const ps = posts(s, owner);
  if (!ps.length) return [];
  return s.units.filter((u) => u.owner !== owner && !s.players[u.owner]?.neutral && ps.some((p) => dist(p.x, p.y, u.x, u.y) <= 1))
    .sort((a, b) => a.id - b.id);
}
export const contactIncome = (s: GameState, owner: number) => Math.min(CONTACT_CAP, visitors(s, owner).length * CONTACT_PAY);

// ---------------------------------------------------------------- the winter count

export const winters = (s: GameState, owner: number): Winter[] => (s.players[owner].mech?.winter as Winter[] | undefined) ?? [];
/** The last turn a Cree city was lost (-1: never). */
export const lastLoss = (s: GameState, owner: number) => Number(s.players[owner].mech?.lostTurn ?? -1);
/** Turns until the next Winter Count (on a count turn, the one after it: the count is taken as the turn starts). */
export const turnsToWinter = (s: GameState) => WINTER_EVERY - (s.turn % WINTER_EVERY);
/** Has a city been lost in the current count (so the coming winter will be a hard one)? */
export const hardWinter = (s: GameState, owner: number) => {
  const lost = lastLoss(s, owner);
  return lost >= 0 && lost > s.turn + turnsToWinter(s) - WINTER_EVERY;
};

/** The Winter Count: record the year, and if no city was lost every Cree city grows. */
export function winterCount(s: GameState, owner: number): Winter {
  const lost = lastLoss(s, owner);
  const good = !(lost >= 0 && lost > s.turn - WINTER_EVERY);
  const cities = citiesOf(s, owner);
  if (good) {
    for (const c of cities) {
      addPop(s, c, WINTER_POP);
      emit({ type: 'harvest', player: owner, x: c.x, y: c.y, pop: WINTER_POP });
    }
  }
  const w: Winter = { turn: s.turn, good, cities: good ? cities.length : 0 };
  const p = s.players[owner];
  p.mech = { ...(p.mech ?? {}), winter: [...winters(s, owner), w].slice(-WINTER_KEEP) };
  emit({ type: 'toast', player: owner, text: good
    ? `🦌 The Winter Count: a good year is painted on the hide. Every city grows by ${WINTER_POP}.`
    : '❄ The Winter Count: a hard year, a city was lost. No growth this winter.' });
  return w;
}

const bump = (s: GameState, owner: number, k: string, n: number) => {
  const p = s.players[owner];
  p.mech = { ...(p.mech ?? {}), [k]: Number(p.mech?.[k] ?? 0) + n };
};

// ---------------------------------------------------------------- the mechanic

export const mech: Mechanic = {
  name: 'Trading Posts & the Winter Count',
  blurb: `Pemmican: your units outside your borders heal ${PEMMICAN_HEAL} HP a turn. Build Trading Posts on forest or shore (${POST_COST}★, +${POST_STEP}★ each): +${POST_PAY}★ a turn, +1★ per animal beside it (at most ${POST_CAP}★), and foreign units or traders beside a post pay +${CONTACT_PAY}★ each (at most ${CONTACT_CAP}★). Every ${WINTER_EVERY} turns the Winter Count: if no city was lost, every city grows by ${WINTER_POP}.`,

  income(s, owner) {
    if (!isCree(s, owner)) return 0;
    return postIncome(s, owner) + contactIncome(s, owner);
  },

  turnStart(s, owner) {
    if (!isCree(s, owner)) return;
    pemmican(s, owner);
    if (s.turn === 0) return;
    const met = visitors(s, owner);
    const paid = Math.min(CONTACT_CAP, met.length);
    for (const u of met.slice(0, paid)) emit({ type: 'stars', player: owner, x: u.x, y: u.y, amount: CONTACT_PAY });
    if (paid) bump(s, owner, 'contact', paid * CONTACT_PAY);
    if (s.turn % WINTER_EVERY === 0) winterCount(s, owner);
  },

  cityCaptured(s, owner, c, from) {
    if (!isCree(s, owner) || from !== owner || c.owner === owner) return;
    const p = s.players[owner];
    p.mech = { ...(p.mech ?? {}), lostTurn: s.turn };
  },

  actions(s, owner, t): Action[] {
    if (!isCree(s, owner) || tileOwnerPlayer(s, t) !== owner || !postGround(s, t)) return [];
    const why = postWhy(s, owner, t);
    const cost = postCost(s, owner);
    const poor = s.players[owner].stars < cost;
    return [{
      id: 'mech:post', label: 'Build Trading Post',
      desc: `A log trading post with a fur press: +${POST_PAY}★ a turn, +1★ per animal beside it (at most ${POST_CAP}★). Foreign units and traders beside it pay +${CONTACT_PAY}★ each (at most ${CONTACT_CAP}★ a turn). Each post makes the next cost ${POST_STEP}★ more.`,
      cost, icon: 'market', enabled: !why && !poor, reason: why ?? (poor ? 'Not enough stars' : undefined),
    }];
  },

  doAction(s, owner, t, id) {
    if (id !== 'mech:post' || !isCree(s, owner) || postWhy(s, owner, t)) return false;
    t.improvement = 'tradingpost';
    bump(s, owner, 'posts', 1);
    return true;
  },

  // Build a post where there are animals to trap, or by the water where visitors pass; keep a few stars back.
  ai(s, owner) {
    if (!isCree(s, owner)) return false;
    const p = s.players[owner];
    const cost = postCost(s, owner);
    if (p.stars < cost + AI_RESERVE || posts(s, owner).length >= citiesOf(s, owner).length * 2) return false;
    let best: Tile | null = null, bestScore = -Infinity;
    for (const t of s.tiles) {
      if (t.owner === null || postWhy(s, owner, t)) continue;
      let score = postStars(s, t) * 3;
      score += neighbors(s, t.x, t.y, 2).some((n) => n.owner !== null && tileOwnerPlayer(s, n) !== owner) ? 2 : 0; // a border post meets visitors
      score += shore(s, t) ? 1 : 0;
      score += (t.seed % 7) / 10; // a stable tie-break
      if (score > bestScore) { best = t; bestScore = score; }
    }
    if (!best || bestScore < 3) return false;
    p.stars -= cost; // the core charges only human-issued actions; the AI pays here
    return mech.doAction!(s, owner, best, 'mech:post');
  },
};
