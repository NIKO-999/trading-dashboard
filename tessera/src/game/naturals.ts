// Natural Wonders: eight rare landmarks laid down with the map (a waterfall, a crystal grotto, a sacred peak, a giant
// tree, a reef, a salt mirror, a geyser field and a glacier under the aurora). State lives in `GameState.naturals`, so
// saves keep working and older saves simply have none. The art is in render/naturals.ts.
//
//  - Placement. About one for every TILES_PER_NATURAL tiles (at least MIN_NATURALS, each kind at most once), on
//    terrain that suits it, never within CAPITAL_GAP tiles of a capital, never on a village, ruin, resource or camp.
//    They draw from their own random stream, so the rest of the map is the same as without them.
//  - Discovery. The first empire to see one (in sight of its units or cities) gets FIRST_STARS★ and FIRST_SCORE score; everyone who
//    finds it later gets LATER_SCORE. A wonder a few tiles past the edge of the known map is "glimpsed": a light rises
//    through the clouds over it, and the computer sends units and scouts to find it.
//  - Holding. While one lies inside your borders its bonus is yours: each is different and plugs into an existing
//    system (city income, healing, defence, tech costs, growth, movement, perks). It changes hands with its land.
//  - It cannot be improved, harvested, built on or settled; units may stand on a land wonder and ships sail over the reef.
import { ELDER_EVERY, FLATS_STARS, GROTTO_OFF, NATURAL_IDS, NATURALS, naturalAt, naturalCity, naturalDef, naturalHolder, naturalsHeldBy, naturalSites, PEAK_DEF, SPRINGS_MOVE, type NaturalDef, type NaturalId } from '../data/naturals';
import { TRIBES } from '../data/tribes';
import { outOfSupply } from './army';
import { emit } from './events';
import { dist, isWater, neighbors, tileAt } from './grid';
import { addPop, maxHp } from './rules';
import type { Rng } from './rng';
import { campAt, isLava } from './wild';
import type { City, GameState, NaturalSite, Tile, Unit } from './types';

// ---------------------------------------------------------------- tuning

/** One wonder for about this many tiles of map. */
export const TILES_PER_NATURAL = 150;
/** Every map gets at least this many (when there is room). */
export const MIN_NATURALS = 2;
/** No wonder lies within this many tiles of a capital. */
export const CAPITAL_GAP = 3;
/** Wonders keep at least this far apart. */
const SPACING = 4;
/** The first discoverer's reward. */
export const FIRST_STARS = 5;
export const FIRST_SCORE = 100;
/** Everyone who finds it later. */
export const LATER_SCORE = 50;
/** How far past the known map a wonder is glimpsed (a light over the clouds). */
export const GLIMPSE = 2;

// ---------------------------------------------------------------- small queries

const held = (s: GameState, pid: number, id: NaturalId) => naturalsHeldBy(s, pid).filter((n) => n.id === id);
export const isNaturalTile = (s: GameState, t: Tile) => !!s.naturals && !!naturalAt(s, t.x, t.y);
/** Has `pid` found this wonder? */
export const hasFound = (n: NaturalSite, pid: number) => n.found.includes(pid);
/**
 * Not yet found by `pid`, but on its map or within GLIMPSE tiles of it (a light shows over the clouds): somewhere to
 * send a unit. A wonder is only found when a unit or city of the empire has it in sight, so one seen on a shared map
 * still waits for a visit.
 */
export function glimpsed(s: GameState, pid: number, n: NaturalSite): boolean {
  const p = s.players[pid];
  if (!p || hasFound(n, pid)) return false;
  return p.explored[n.y * s.size + n.x] || neighbors(s, n.x, n.y, GLIMPSE).some((t) => p.explored[t.y * s.size + t.x]);
}

// ---------------------------------------------------------------- placement

/** Could wonder `d` stand on tile `t`? `loose`: a second pass may take a tile with a resource on it. */
function fits(s: GameState, t: Tile, d: NaturalDef, loose: boolean): boolean {
  if (!d.terrain.includes(t.terrain)) return false;
  if (t.x === 0 || t.y === 0 || t.x === s.size - 1 || t.y === s.size - 1) return false;
  if (t.village || t.ruin || t.improvement || t.cityId !== null || t.owner !== null || t.road || t.data) return false;
  if (t.resource && !loose) return false;
  if (campAt(s, t.x, t.y) || isLava(t) || s.units.some((u) => u.x === t.x && u.y === t.y)) return false;
  if (s.cities.some((c) => dist(c.x, c.y, t.x, t.y) <= CAPITAL_GAP)) return false;
  if (naturalSites(s).some((n) => dist(n.x, n.y, t.x, t.y) < (loose ? SPACING - 1 : SPACING))) return false;
  if (d.coast && !neighbors(s, t.x, t.y, 1).some(isWater)) return false;
  return true;
}

/** Lays the wonders down on a new map (called by createGame, with its own random stream). */
export function placeNaturals(s: GameState, rng: Rng) {
  const want = Math.min(NATURAL_IDS.length, Math.max(MIN_NATURALS, Math.round((s.size * s.size) / TILES_PER_NATURAL)));
  s.naturals = { sites: [] };
  const kinds = rng.shuffle([...NATURAL_IDS]);
  for (const loose of [false, true]) {
    for (const id of kinds) {
      if (s.naturals.sites.length >= want) return;
      if (s.naturals.sites.some((n) => n.id === id)) continue;
      const spots = s.tiles.filter((t) => fits(s, t, NATURALS[id], loose));
      if (!spots.length) continue;
      const t = rng.pick(spots);
      t.resource = null; // a wonder is never harvested
      s.naturals.sites.push({ id, x: t.x, y: t.y, found: [] });
    }
  }
}

// ---------------------------------------------------------------- discovery

/** Called by revealAround with the tiles `pid`'s units and cities see right now: every wonder among them is found. */
export function discoverNaturals(s: GameState, pid: number, sight: Set<number>) {
  if (!s.naturals) return;
  const p = s.players[pid];
  if (!p || p.neutral || !p.alive) return;
  for (const n of s.naturals.sites) {
    if (hasFound(n, pid) || !sight.has(n.y * s.size + n.x)) continue;
    const d = naturalDef(n);
    const first = !n.found.length;
    n.found.push(pid);
    if (first) {
      n.turn = s.turn;
      p.stars += FIRST_STARS;
      p.bonusScore += FIRST_SCORE;
      emit({ type: 'stars', player: pid, x: n.x, y: n.y, amount: FIRST_STARS });
      emit({ type: 'toast', player: pid, text: `🌄 You discovered ${d.name}! The first to find it: +${FIRST_STARS}★ and +${FIRST_SCORE} score. Hold it in your borders: ${d.bonus}` });
      s.log.push({ turn: s.turn, text: `The ${TRIBES[p.tribe].people}s discover ${d.name}.` });
    } else {
      p.bonusScore += LATER_SCORE;
      const by = s.players[n.found[0]];
      emit({ type: 'toast', player: pid, text: `🌄 You discovered ${d.name} (first found by the ${TRIBES[by.tribe].people}s): +${LATER_SCORE} score.` });
    }
  }
}

// ---------------------------------------------------------------- the bonuses

/** Skymirror Flats: extra Stars for the city whose land holds them. */
export function naturalCityIncome(s: GameState, c: City): number {
  if (!s.naturals) return 0;
  return held(s, c.owner, 'flats').filter((n) => naturalCity(s, n) === c).length * FLATS_STARS;
}

/** Glimmerdeep Grotto: Stars off a tech whose price (before other discounts) is `base`. */
export function naturalTechOff(s: GameState, pid: number, base: number): number {
  if (!s.naturals || !held(s, pid, 'grotto').length) return 0;
  return Math.max(1, Math.round(base * GROTTO_OFF));
}

/** Mount Halcyra: defence for `u` standing on the land of the peak's city, while its owner holds it. */
export function naturalDefence(s: GameState, u: Unit): number {
  if (!s.naturals) return 0;
  const t = tileAt(s, u.x, u.y);
  if (!t || t.owner === null) return 0;
  return held(s, u.owner, 'peak').some((n) => naturalCity(s, n)?.id === t.owner) ? PEAK_DEF : 0;
}

/** Emberbreath Springs: extra movement for a land unit starting its move next to them (movement is only offered to a unit that has not moved yet). */
export function naturalMove(s: GameState, u: Unit): number {
  if (!s.naturals || u.carrying) return 0;
  return held(s, u.owner, 'springs').some((n) => dist(n.x, n.y, u.x, u.y) <= 1) ? SPRINGS_MOVE : 0;
}

/**
 * At the start of `pid`'s turn: news of wonders won or lost, Thundermantle Falls heals, and the Hollowcrown Elder
 * grows its city every ELDER_EVERY turns.
 */
export function naturalTurnStart(s: GameState, pid: number) {
  if (!s.naturals) return;
  for (const n of s.naturals.sites) {
    const h = naturalHolder(s, n);
    if (h === (n.held ?? null)) continue;
    const d = naturalDef(n);
    if (n.held !== undefined && n.held !== null && s.players[n.held]?.alive) emit({ type: 'toast', player: n.held, text: `${d.name} has passed out of your borders: its bonus is lost.` });
    if (h !== null) {
      emit({ type: 'toast', player: h, text: `🌄 ${d.name} lies within your borders! ${d.bonus}` });
      s.log.push({ turn: s.turn, text: `${d.name} now lies in ${TRIBES[s.players[h].tribe].people} land.` });
    }
    n.held = h;
  }
  for (const n of held(s, pid, 'falls')) {
    const c = naturalCity(s, n)!;
    for (const u of s.units) {
      if (u.owner !== pid || u.hp >= maxHp(u) || outOfSupply(u)) continue;
      if (s.tiles[u.y * s.size + u.x].owner !== c.id) continue;
      const before = u.hp;
      u.hp = maxHp(u);
      emit({ type: 'heal', unitId: u.id, x: u.x, y: u.y, amount: u.hp - before });
    }
  }
  if (s.turn > 0 && s.turn % ELDER_EVERY === 0) {
    for (const n of held(s, pid, 'elder')) {
      const c = naturalCity(s, n)!;
      addPop(s, c, 1);
      emit({ type: 'harvest', player: pid, x: c.x, y: c.y, pop: 1 });
      emit({ type: 'toast', player: pid, text: `The Hollowcrown Elder shelters ${c.name}: +1 population.` });
    }
  }
}

// ---------------------------------------------------------------- the tile menu

/** What may never be done on a wonder's tile: build, harvest, reshape, begin a World Wonder, settle. */
const BLOCKED = ['temple', 'shrine', 'market', 'farm', 'mine', 'lumber', 'harvest', 'port', 'clear', 'irrigate', 'drain', 'road', 'luxury'];
const ROLE_BLOCKED = ['fort', 'bridge', 'outpost', 'upgrade'];
/** Empire works (see game/mech) that would build on, reshape or settle the tile; strikes, boarding and the like stay. */
const MECH_BLOCKED = ['altar', 'anchor', 'baray', 'castra', 'chaski', 'dam', 'flood', 'found', 'freeze', 'grove', 'harvest', 'lighthouse', 'monolith', 'platform', 'raze', 'settle', 'silt', 'songline', 'stele', 'stupa', 'terrace', 'wall', 'waka'];

/** Drops every action that would build on, harvest or settle a wonder's tile. `t` is the tile whose menu this is. */
export function naturalFilter<A extends { id: string }>(s: GameState, pid: number, t: Tile, acts: A[]): A[] {
  if (!s.naturals?.sites.length) return acts;
  const here = isNaturalTile(s, t);
  return acts.filter((a) => {
    const role = a.id.startsWith('role:') ? a.id.split(':') : null; // role:verb:unit:target (see game/roles)
    if (role && ROLE_BLOCKED.includes(role[1])) {
      const i = Number(role[3]);
      const tt = s.tiles[i];
      if (tt && isNaturalTile(s, tt)) return false;
    }
    if (!here) return true;
    if (BLOCKED.includes(a.id) || a.id.startsWith('level:') || a.id.startsWith('wonder:begin:')) return false;
    if (a.id.startsWith('mech:') && MECH_BLOCKED.includes(a.id.split(':')[1])) return false;
    return true;
  });
}

// ---------------------------------------------------------------- AI

/** Wonders `pid` has glimpsed but not found: somewhere worth sending a unit. */
export const naturalGoals = (s: GameState, pid: number): NaturalSite[] => naturalSites(s).filter((n) => glimpsed(s, pid, n));

/** How much a tile is worth to the computer for the wonders around it: a village or city that would bring one in. */
export function naturalWorth(s: GameState, pid: number, x: number, y: number): number {
  if (!s.naturals) return 0;
  return s.naturals.sites.filter((n) => hasFound(n, pid) && naturalHolder(s, n) !== pid && dist(n.x, n.y, x, y) <= 1).length;
}

// ---------------------------------------------------------------- descriptions (plain text, no UI)

/** Who holds it, as the viewer should read it. */
export function holderText(s: GameState, viewer: number, n: NaturalSite): string {
  const h = naturalHolder(s, n);
  if (h === null) return 'Unclaimed: bring it inside your borders to hold it.';
  if (h === viewer) return `Yours (${naturalCity(s, n)!.name}).`;
  const known = (s.players[viewer]?.met ?? []).includes(h);
  return known ? `Held by the ${TRIBES[s.players[h].tribe].people}s (${naturalCity(s, n)!.name}).` : 'Held by an unknown empire.';
}

/** Title and text for a wonder tile's panel, or null. */
export function naturalDescribe(s: GameState, t: Tile, viewer: number): { title: string; desc: string } | null {
  const n = naturalAt(s, t.x, t.y);
  if (!n) return null;
  const d = naturalDef(n);
  const first = n.found.length ? s.players[n.found[0]] : undefined;
  const who = first ? (first.id === viewer ? ' You found it first.' : ` First found by the ${TRIBES[first.tribe].people}s.`) : '';
  const walk = d.id === 'reef' ? ' Ships may sail over it.' : ' Units may stand on it.';
  return { title: d.name, desc: `Natural Wonder. ${d.lore} Bonus while in your borders: ${d.bonus} ${holderText(s, viewer, n)}${who} It cannot be built on or harvested.${walk}` };
}
