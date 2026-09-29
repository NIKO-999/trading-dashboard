import { emit } from '../events';
import { dist, isLand, isWater, neighbors, tileAt } from '../grid';
import { claimTerritory, foundCity, revealAround } from '../mapgen';
import { addPop, citiesOf, tileOwnerPlayer, unitAt, wakaSpawn } from '../rules';
import type { Action } from '../rules';
import type { City, GameState, Tile } from '../types';
import type { Mechanic } from './types';

// Maori (`polynesia`): Ta Moko & Waka Surge, with Tane's Tapu underneath.
//
// (A) Ta Moko & Waka Surge. The Maori have NO land capital. At game start (`setup`) the capital City is lifted onto a sea
//     tile (deep ocean when there is any nearby, else shallow) as the Great Waka: `city.data.waka = true`, still
//     `capital: true` so score and income work. The core copes with a city on water: it trains units onto a free tile
//     beside it (`rules.wakaSpawn`, land first, else a boat "voyager" that may cross deep ocean), enemy ships can capture it
//     from the water, its borders/fog/labels work as for any city, and draw.ts leaves its art to render/mech/polynesia.
//       - `mech:sail`   (tap a water tile within SAIL_RANGE of a Great Waka): the city and its borders glide there, once per
//                       turn, through water tiles free of enemy units.
//       - `mech:anchor` (tap a coastal land tile next to a Great Waka): the city settles there as a normal land city (still
//                       the capital). It can never sail again.
//       - `mech:waka`   (tap an own-territory shallow harbour tile beside your land): a NEW Great Waka city is founded for
//                       WAKA_COST stars (at most MAX_WAKAS afloat). Simplification of "at a port": Tane's Tapu forbids
//                       building ports, so any owned coastal shallow tile is a harbour.
//     While a city floats, every fish and whale in its borders is absorbed into its population at the start of the owner's
//     turn (fish +1, whale +2; at most ABSORB_CAP resources a turn), no port or harvest needed.
// (B) Tane's Tapu. The Maori may not spend stars to build farms, mines, lumber huts or ports (`block`); wild land is left
//     to the gods. Instead each city earns +1 star per orthogonally adjacent pair of WILD tiles (owned, natural: no
//     improvement, road, village or city) in its borders, capped per city at min(WILD_CAP, city level). The cap growing
//     with every level is the simplification of "each level-up lifts every wild tile's output by one".
//     Temples, markets, shrines, roads, harvesting resources and clearing land are all still allowed (each removes wild tiles).
// State: city.data = { waka, sailed (turn), anchored? }; player.mech = { sails, anchors, wakas, absorbed }.

export const SAIL_RANGE = 3;
export const WAKA_COST = 10;
export const MAX_WAKAS = 2;
export const ABSORB_CAP = 4;
export const WILD_CAP = 4;
const BLOCKED = ['farm', 'mine', 'lumber', 'port'];

const isMaori = (s: GameState, owner: number) => s.players[owner].tribe === 'polynesia';
export const isWaka = (c: City) => !!c.data?.waka;
export const wakasOf = (s: GameState, owner: number) => citiesOf(s, owner).filter(isWaka);
export const hasSailed = (s: GameState, c: City) => c.data?.sailed === s.turn;
const bump = (s: GameState, owner: number, key: 'sails' | 'anchors' | 'wakas' | 'absorbed', n = 1) => {
  const p = s.players[owner];
  p.mech = { ...(p.mech ?? {}), [key]: ((p.mech?.[key] as number) ?? 0) + n };
};
export const counter = (s: GameState, owner: number, key: 'sails' | 'anchors' | 'wakas' | 'absorbed') => (s.players[owner].mech?.[key] as number) ?? 0;

// ---------------------------------------------------------------- Tane's Tapu

/** A wild tile: natural land or sea nobody has worked. */
export const isWild = (t: Tile) => !t.improvement && !t.road && !t.village && t.cityId === null;

export const wildCap = (c: City) => Math.min(WILD_CAP, c.level);

/** Orthogonally adjacent pairs of wild tiles in a city's borders (each pair once). */
export function wildPairs(s: GameState, c: City): number {
  const wild = new Set<number>();
  for (const t of s.tiles) if (t.owner === c.id && isWild(t)) wild.add(t.y * s.size + t.x);
  let pairs = 0;
  for (const i of wild) {
    if (wild.has(i + 1) && (i + 1) % s.size !== 0) pairs++;
    if (wild.has(i + s.size)) pairs++;
  }
  return pairs;
}

export const wildIncome = (s: GameState, c: City) => Math.min(wildCap(c), wildPairs(s, c));
export const tapuIncome = (s: GameState, owner: number) => citiesOf(s, owner).reduce((n, c) => n + wildIncome(s, c), 0);
export const wildTiles = (s: GameState, owner: number) => s.tiles.filter((t) => t.owner !== null && tileOwnerPlayer(s, t) === owner && isWild(t)).length;

// ---------------------------------------------------------------- moving a city

/** Uncover the sea around a Great Waka: its navigators read swells and birds three tiles out. */
function survey(s: GameState, c: City) {
  const p = s.players[c.owner];
  for (const t of neighbors(s, c.x, c.y, SAIL_RANGE)) p.explored[t.y * s.size + t.x] = true;
  p.explored[c.y * s.size + c.x] = true;
}

/** Eat the resource on a tile the city has come to stand on or beside. */
function absorbResource(s: GameState, c: City, t: Tile) {
  if (!t.resource) return 0;
  const pop = t.resource === 'whale' ? 2 : t.resource === 'crop' || t.resource === 'ore' ? 2 : 1;
  t.resource = null;
  addPop(s, c, pop);
  emit({ type: 'harvest', player: c.owner, x: t.x, y: t.y, pop });
  return pop;
}

/** Lift a city off its tile and set it on `to`; its territory follows. */
export function moveCity(s: GameState, c: City, to: Tile) {
  const from = tileAt(s, c.x, c.y)!;
  from.cityId = null;
  for (const t of s.tiles) if (t.owner === c.id) t.owner = null;
  c.x = to.x;
  c.y = to.y;
  to.cityId = c.id;
  to.owner = null;
  claimTerritory(s, c.id);
  to.owner = c.id;
  revealAround(s, c.owner);
  if (isWaka(c)) survey(s, c);
}

// ---------------------------------------------------------------- sailing

/** Water tiles the Great Waka `c` can sail to (within SAIL_RANGE, through explored water free of enemy units). */
export function sailTargets(s: GameState, c: City): Tile[] {
  const pid = c.owner;
  const p = s.players[pid];
  const seen = new Map<Tile, number>([[tileAt(s, c.x, c.y)!, 0]]);
  const queue = [tileAt(s, c.x, c.y)!];
  const out: Tile[] = [];
  while (queue.length) {
    const cur = queue.shift()!;
    const d = seen.get(cur)!;
    if (d >= SAIL_RANGE) continue;
    for (const n of neighbors(s, cur.x, cur.y)) {
      if (seen.has(n) || !isWater(n) || !p.explored[n.y * s.size + n.x] || n.cityId !== null) continue;
      const u = unitAt(s, n.x, n.y);
      if (u && u.owner !== pid) continue; // an enemy hull bars the way
      const host = tileOwnerPlayer(s, n);
      if (host !== null && host !== pid) continue; // never into another empire's waters
      seen.set(n, d + 1);
      queue.push(n);
      if (!u) out.push(n);
    }
  }
  return out;
}

/** Why `c` cannot sail to `t` (null: it can). */
function sailCheck(s: GameState, c: City, t: Tile): string | null {
  if (!isWaka(c)) return 'Only a floating city can sail';
  if (hasSailed(s, c)) return 'The Great Waka already sailed this turn';
  if (!sailTargets(s, c).includes(t)) return 'Out of reach';
  return null;
}

function sail(s: GameState, c: City, t: Tile): boolean {
  if (sailCheck(s, c, t)) return false;
  moveCity(s, c, t);
  absorbResource(s, c, t); // the waka rides over whatever fish or whale was there
  c.data = { ...(c.data ?? {}), sailed: s.turn };
  bump(s, c.owner, 'sails');
  return true;
}

// ---------------------------------------------------------------- anchoring

/** Why the waka `c` cannot anchor on land tile `t` (null: it can). */
export function anchorCheck(s: GameState, c: City, t: Tile): string | null {
  if (!isWaka(c)) return 'Only a floating city can anchor';
  if (!isLand(t) || t.terrain === 'mountain') return 'Needs a coast to settle on';
  if (t.cityId !== null || t.village || t.improvement) return 'The ground is taken';
  const host = tileOwnerPlayer(s, t);
  if (host !== null && host !== c.owner) return "Another empire's land";
  const u = unitAt(s, t.x, t.y);
  if (u && u.owner !== c.owner) return 'Enemy on the shore';
  return null;
}

function anchor(s: GameState, c: City, t: Tile): boolean {
  if (anchorCheck(s, c, t)) return false;
  absorbResource(s, c, t);
  t.terrain = 'field'; // a city stands on level ground
  t.ruin = false;
  const { waka: _w, ...rest } = c.data ?? {};
  c.data = { ...rest, anchored: s.turn };
  moveCity(s, c, t);
  bump(s, c.owner, 'anchors');
  return true;
}

/** The Great Waka of `owner` beside land tile `t`, if any. */
const wakaBeside = (s: GameState, owner: number, t: Tile) => wakasOf(s, owner).find((c) => dist(c.x, c.y, t.x, t.y) === 1);

// ---------------------------------------------------------------- building a new Great Waka

/** Why a new Great Waka cannot be built on shallow tile `t` (null: it can). */
export function wakaCheck(s: GameState, owner: number, t: Tile): string | null {
  if (t.terrain !== 'shallow') return 'Needs a sheltered harbour (shallow water)';
  if (tileOwnerPlayer(s, t) !== owner) return 'Only in your own waters';
  if (t.cityId !== null || unitAt(s, t.x, t.y)) return 'The water is occupied';
  if (!neighbors(s, t.x, t.y).some((n) => isLand(n) && tileOwnerPlayer(s, n) === owner)) return 'Needs a harbour beside your land';
  if (s.cities.some((c) => dist(c.x, c.y, t.x, t.y) < 2)) return 'Too close to a city';
  if (wakasOf(s, owner).length >= MAX_WAKAS) return `At most ${MAX_WAKAS} Great Wakas afloat`;
  return null;
}

/** Found a Great Waka (a level-1 non-capital city afloat) on water tile `t`. */
export function buildWaka(s: GameState, owner: number, t: Tile): City {
  const orig = t.terrain;
  const res = t.resource;
  const c = foundCity(s, t.x, t.y, owner, false);
  t.terrain = orig; // foundCity levels the ground; a waka stays on the water
  c.data = { waka: true, sailed: s.turn };
  if (res) { t.resource = res; absorbResource(s, c, t); }
  survey(s, c);
  revealAround(s, owner);
  bump(s, owner, 'wakas');
  return c;
}

// ---------------------------------------------------------------- floating growth

/** A floating city draws the fish and whales of its waters straight into its people. */
function absorb(s: GameState, owner: number) {
  for (const c of wakasOf(s, owner)) {
    const rich = s.tiles.filter((t) => t.owner === c.id && (t.resource === 'fish' || t.resource === 'whale'))
      .sort((a, b) => (a.resource === b.resource ? 0 : a.resource === 'whale' ? -1 : 1));
    for (const t of rich.slice(0, ABSORB_CAP)) bump(s, owner, 'absorbed', absorbResource(s, c, t));
  }
}

// ---------------------------------------------------------------- setup

/** Put the starting capital on the sea. */
function launchCapital(s: GameState, owner: number) {
  const city = citiesOf(s, owner).find((c) => c.capital);
  if (!city || isWaka(city)) return;
  const site = tileAt(s, city.x, city.y)!;
  const others = s.cities.filter((c) => c.owner !== owner);
  // sizes of the connected bodies of water: a Great Waka wants open sea to sail, not a pond
  const body = new Map<Tile, number>();
  const sizes: number[] = [];
  for (const w of s.tiles) {
    if (!isWater(w) || body.has(w)) continue;
    const id = sizes.length;
    let n = 0;
    const stack = [w];
    body.set(w, id);
    while (stack.length) {
      const cur = stack.pop()!;
      n++;
      for (const k of neighbors(s, cur.x, cur.y)) if (isWater(k) && !body.has(k)) { body.set(k, id); stack.push(k); }
    }
    sizes.push(n);
  }
  const score = (t: Tile) => {
    const ring = neighbors(s, t.x, t.y);
    const seas = ring.filter(isWater).length;
    const lands = neighbors(s, t.x, t.y, 2).filter((n) => isLand(n) && n.terrain !== 'mountain').length;
    const food = ring.filter((n) => n.resource === 'fish' || n.resource === 'whale').length;
    const d = dist(t.x, t.y, site.x, site.y);
    return (t.terrain === 'ocean' ? 3 : 0) + Math.min(seas, 5) * 0.5 + (lands > 0 ? 2 : 0) - Math.abs(Math.min(d, 3) - 2) - Math.max(0, d - 3) * 0.7 + food;
  };
  const ok = (t: Tile) => isWater(t) && t.cityId === null && !unitAt(s, t.x, t.y) && t.x > 0 && t.y > 0 && t.x < s.size - 1 && t.y < s.size - 1
    && others.every((c) => dist(c.x, c.y, t.x, t.y) >= 3) && !neighbors(s, t.x, t.y).some((n) => n.village);
  let cands = s.tiles.filter((t) => ok(t) && sizes[body.get(t)!] >= 14 && dist(t.x, t.y, site.x, site.y) <= 9);
  const bare = cands.filter((t) => !t.resource);
  if (bare.length) cands = bare; // keep the map's fishing grounds where they are
  if (!cands.length) { // an inland start: a sacred lagoon opens beside the old site (a rounded 5x5 pool, else 3x3, of shallow water)
    const clear = (t: Tile, r: number) => neighbors(s, t.x, t.y, r).concat(t).every((n) => n.cityId === null && !unitAt(s, n.x, n.y) && others.every((c) => dist(c.x, c.y, n.x, n.y) >= 3));
    const near = s.tiles.filter((t) => dist(t.x, t.y, site.x, site.y) >= 2 && dist(t.x, t.y, site.x, site.y) <= 5)
      .sort((a, b) => dist(a.x, a.y, site.x, site.y) - dist(b.x, b.y, site.x, site.y) || a.y - b.y || a.x - b.x);
    const spare = (t: Tile) => t.village || !!t.resource || neighbors(s, t.x, t.y).some((n) => n.village); // keep villages and their food on dry land
    const wide = near.find((t) => t.x > 2 && t.y > 2 && t.x < s.size - 3 && t.y < s.size - 3 && !spare(t) && clear(t, 2));
    const mid = wide ?? near.find((t) => t.x > 1 && t.y > 1 && t.x < s.size - 2 && t.y < s.size - 2 && !spare(t) && clear(t, 1)) ?? neighbors(s, site.x, site.y).find((t) => t.cityId === null && !unitAt(s, t.x, t.y))!;
    const r = wide ? 2 : 1;
    mid.village = false;
    mid.resource = null;
    mid.terrain = 'shallow';
    for (const t of neighbors(s, mid.x, mid.y, r)) {
      if (t.cityId !== null || spare(t) || unitAt(s, t.x, t.y)) continue;
      if (Math.abs(t.x - mid.x) + Math.abs(t.y - mid.y) > r * 2 - (r === 2 ? 1 : 0)) continue; // round off the corners
      t.terrain = 'shallow';
      t.resource = null;
      t.ruin = false;
    }
    cands = [mid];
  }
  cands.sort((a, b) => score(b) - score(a) || a.y - b.y || a.x - b.x);
  const sea = cands[0];
  sea.village = false;
  sea.ruin = false;
  sea.resource = null; // the waka sits where it sits: nothing is left under the hulls
  moveCity(s, city, tileAt(s, sea.x, sea.y)!);
  city.data = { ...(city.data ?? {}), waka: true, sailed: -1 };
  // enough to grow on in the first waters (fish, or fruit and game on any shore): the ring is worth 3 population
  const pop = (t: Tile) => (t.resource === 'fish' || t.resource === 'fruit' || t.resource === 'animal' ? 1 : t.resource === 'crop' || t.resource === 'ore' ? 2 : 0);
  const worth = () => neighbors(s, sea.x, sea.y).reduce((n, t) => n + pop(t), 0);
  for (const t of neighbors(s, sea.x, sea.y)) {
    if (worth() >= 3) break;
    if (t.resource || t.cityId !== null || t.village || t.ruin) continue;
    if (isWater(t)) t.resource = 'fish';
    else if (t.terrain === 'field') t.resource = 'fruit';
    else if (t.terrain === 'forest') t.resource = 'animal';
  }
  // the starting warrior comes aboard beside the waka
  for (const u of s.units) {
    if (u.owner !== owner || u.homeCity !== city.id) continue;
    const spot = wakaSpawn(s, city);
    if (!spot) break;
    u.x = spot.x;
    u.y = spot.y;
    if (isWater(spot)) {
      u.carrying = u.kind;
      u.kind = 'waka';
      u.data = { ...(u.data ?? {}), voyager: true };
    }
    break;
  }
  survey(s, city);
}

// ---------------------------------------------------------------- the mechanic

export const mech: Mechanic = {
  name: 'Tā Moko & Waka Surge',
  blurb: "The capital is a Great Waka afloat on the sea that sails each turn, drinks the fish and whales around it into its people, and can anchor on a coast; Tāne's Tapu bars farms, mines, huts and ports, paying stars for untouched wilds instead.",

  setup(s, owner) { launchCapital(s, owner); },
  turnStart(s, owner) { if (s.turn > 0) absorb(s, owner); },
  income(s, owner) { return tapuIncome(s, owner); },

  block(s, owner, pid, id, t) {
    if (pid === owner && BLOCKED.includes(id) && isWild(t)) return "Tāne's Tapu: wild land is not to be worked";
    return undefined;
  },

  actions(s, owner, t): Action[] {
    const acts: Action[] = [];
    const mine = wakasOf(s, owner);
    if (isWater(t)) {
      const reach = mine.filter((c) => dist(c.x, c.y, t.x, t.y) <= SAIL_RANGE && dist(c.x, c.y, t.x, t.y) > 0);
      if (reach.length) {
        const c = reach.find((k) => !sailCheck(s, k, t)) ?? reach[0];
        const why = sailCheck(s, c, t);
        acts.push({
          id: 'mech:sail', label: 'Sail the Waka', cost: 0, icon: 'waka', enabled: !why, reason: why ?? undefined,
          desc: `${c.name} and its borders sail here, up to ${SAIL_RANGE} tiles, once a turn. Fish and whales in its waters feed its people.`,
        });
      }
      if (t.terrain === 'shallow' && tileOwnerPlayer(s, t) === owner && t.cityId === null) {
        const why = wakaCheck(s, owner, t) ?? (s.players[owner].stars < WAKA_COST ? 'Not enough stars' : null);
        acts.push({
          id: 'mech:waka', label: 'Build Great Waka', cost: WAKA_COST, icon: 'port', enabled: !why, reason: why ?? undefined,
          desc: 'Launch a new city on the sea: it sails, trains beside itself and feeds on the fish around it.',
        });
      }
    } else if (isLand(t)) {
      const c = wakaBeside(s, owner, t);
      if (c) {
        const why = anchorCheck(s, c, t);
        acts.push({
          id: 'mech:anchor', label: 'Anchor Here', cost: 0, icon: 'flag', enabled: !why, reason: why ?? undefined,
          desc: `${c.name} settles on this shore as a land city and can no longer sail. Build another Great Waka later in a harbour.`,
        });
      }
    }
    return acts;
  },

  doAction(s, owner, t, id) {
    if (!isMaori(s, owner)) return false;
    if (id === 'mech:sail') {
      const c = wakasOf(s, owner).find((k) => !sailCheck(s, k, t));
      return !!c && sail(s, c, t);
    }
    if (id === 'mech:anchor') {
      const c = wakaBeside(s, owner, t);
      return !!c && anchor(s, c, t);
    }
    if (id === 'mech:waka') {
      if (wakaCheck(s, owner, t)) return false;
      buildWaka(s, owner, t);
      return true;
    }
    return false;
  },

  ai(s, owner) {
    const p = s.players[owner];
    const foes = s.units.filter((u) => u.owner !== owner && u.hp > 0);
    const wakas = wakasOf(s, owner);

    // 1. Launch another Great Waka once a land city has a harbour and the treasury is fat.
    if (wakas.length < MAX_WAKAS && p.stars >= WAKA_COST + 6 && s.turn >= 4 && citiesOf(s, owner).some((c) => !isWaka(c))) {
      const spot = s.tiles.filter((t) => !wakaCheck(s, owner, t) && !foes.some((f) => dist(f.x, f.y, t.x, t.y) <= 3))
        .map((t) => ({ t, v: neighbors(s, t.x, t.y).filter((n) => n.resource === 'fish' || n.resource === 'whale').length }))
        .sort((a, b) => b.v - a.v || a.t.y - b.t.y || a.t.x - b.t.x)[0];
      if (spot) { p.stars -= WAKA_COST; buildWaka(s, owner, spot.t); return true; }
    }

    for (const c of wakas) {
      if (hasSailed(s, c)) continue;
      const near = (t: Tile) => foes.filter((f) => f.hp > 0 && dist(f.x, f.y, t.x, t.y) <= 3);
      const food = (t: Tile) => neighbors(s, t.x, t.y).reduce((n, k) => n + (k.owner === null || k.owner === c.id ? (k.resource === 'whale' ? 2 : k.resource === 'fish' ? 1 : 0) : 0), 0);
      const danger = (t: Tile) => near(t).reduce((n, f) => n + (4 - dist(f.x, f.y, t.x, t.y)), 0);
      const here = tileAt(s, c.x, c.y)!;

      // 2. Settle a fertile coast: at once when the empire has no land city yet, or once the waka is well grown (level 4+).
      const landless = !citiesOf(s, owner).some((k) => !isWaka(k));
      if (s.turn >= 8 && c.level >= (landless ? 2 : 4) && danger(here) === 0) {
        const shore = neighbors(s, c.x, c.y)
          .filter((t) => !anchorCheck(s, c, t) && !unitAt(s, t.x, t.y))
          .map((t) => ({ t, v: neighbors(s, t.x, t.y).filter((n) => isLand(n) && (n.resource || n.terrain === 'forest' || n.village)).length }))
          .sort((a, b) => b.v - a.v || a.t.y - b.t.y || a.t.x - b.t.x)[0];
        if (shore && shore.v >= (landless ? 3 : 4)) return anchor(s, c, shore.t);
      }

      // 3. Sail: away from enemies when threatened, otherwise toward richer water (or unexplored sea).
      const unseen = (t: Tile) => neighbors(s, t.x, t.y, 2).filter((n) => !p.explored[n.y * s.size + n.x]).length;
      const value = (t: Tile) => food(t) * 3 + unseen(t) * 0.15 - danger(t) * 4 + (t.terrain === 'ocean' ? 0.2 : 0);
      const best = sailTargets(s, c).map((t) => ({ t, v: value(t) })).sort((a, b) => b.v - a.v || a.t.y - b.t.y || a.t.x - b.t.x)[0];
      if (best && best.v > value(here) + 0.5) return sail(s, c, best.t);
      // nothing better: stay, but do not check again this turn
      c.data = { ...(c.data ?? {}), sailed: s.turn };
    }
    return false;
  },
};
