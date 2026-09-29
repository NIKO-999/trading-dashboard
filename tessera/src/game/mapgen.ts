import { TRIBES, unitFor } from '../data/tribes';
import { UNITS } from '../data/units';
import { perkSum } from './perks';
import { area, dist, isLand, isWater, neighbors, tileAt } from './grid';
import { makeRng, weighted, type Rng } from './rng';
import type { City, Difficulty, GameMode, GameState, Player, Resource, Terrain, Tile, TribeId, Unit, UnitKind } from './types';

export type MapSize = 'normal' | 'large' | 'huge';

/** How the land is laid out. 'balanced' lets each empire's own terrain decide; the rest reshape the whole world. */
export type MapTerrain = 'balanced' | 'continents' | 'islands' | 'archipelago' | 'pangaea' | 'lakes' | 'highlands' | 'forests' | 'plains';

export const TERRAIN_STYLES: { id: MapTerrain; name: string; blurb: string }[] = [
  { id: 'balanced', name: 'Balanced', blurb: 'Each empire’s homeland shapes the land around it.' },
  { id: 'continents', name: 'Continents', blurb: 'A few big landmasses with seas between them.' },
  { id: 'islands', name: 'Islands', blurb: 'Many islands. Boats matter.' },
  { id: 'archipelago', name: 'Archipelago', blurb: 'Tiny islands scattered over open sea. Sail or starve.' },
  { id: 'pangaea', name: 'Pangaea', blurb: 'One huge landmass. Everyone is a neighbour.' },
  { id: 'lakes', name: 'Lakes', blurb: 'Solid land dotted with lakes and inland seas.' },
  { id: 'highlands', name: 'Highlands', blurb: 'Mountains everywhere: ore and high ground.' },
  { id: 'forests', name: 'Forests', blurb: 'Deep woods: game and lumber, slow going.' },
  { id: 'plains', name: 'Plains', blurb: 'Wide open fields, few mountains and woods.' },
];

interface Style { target?: number; blobs: number; radius: number; bias: number; lakes: number; field: number; forest: number; mountain: number; cap: number }
const STYLE: Record<MapTerrain, Style> = {
  balanced: { blobs: 1, radius: 1, bias: 0, lakes: 0, field: 1, forest: 1, mountain: 1, cap: 1 },
  continents: { target: 0.56, blobs: 0.55, radius: 1.5, bias: -0.08, lakes: 0, field: 1, forest: 1, mountain: 1, cap: 1 },
  islands: { target: 0.48, blobs: 1.5, radius: 0.65, bias: 0.1, lakes: 0, field: 1, forest: 1, mountain: 1, cap: 1 },
  archipelago: { target: 0.3, blobs: 2.1, radius: 0.42, bias: 0.16, lakes: 0, field: 1, forest: 1, mountain: 0.8, cap: 1.15 },
  pangaea: { target: 0.9, blobs: 1.3, radius: 2.3, bias: -0.22, lakes: 0, field: 1, forest: 1, mountain: 1, cap: 1 },
  lakes: { target: 0.84, blobs: 1.2, radius: 1.5, bias: -0.16, lakes: 0.5, field: 1, forest: 1, mountain: 1, cap: 1 },
  highlands: { target: 0.88, blobs: 1, radius: 1.2, bias: -0.06, lakes: 0, field: 0.7, forest: 0.7, mountain: 3.6, cap: 1 },
  forests: { target: 0.88, blobs: 1, radius: 1.2, bias: -0.06, lakes: 0, field: 0.7, forest: 3.4, mountain: 0.6, cap: 1 },
  plains: { target: 0.88, blobs: 1, radius: 1.3, bias: -0.06, lakes: 0, field: 2.4, forest: 0.5, mountain: 0.25, cap: 1 },
};

export interface NewGameOptions {
  seed?: number;
  human: TribeId | null; // null = all AI (used by simulations)
  humans?: TribeId[]; // pass & play: every human seat in turn order (takes precedence over `human`)
  opponents: TribeId[];
  mode: GameMode;
  difficulty?: Difficulty;
  maxTurns?: number;
  mapSize?: MapSize;
  terrain?: MapTerrain;
}

// Map edge length by map size and number of empires.
const SIZES: Record<MapSize, Record<number, number>> = {
  normal: { 2: 11, 3: 13, 4: 15, 5: 16, 6: 18, 7: 19, 8: 20, 9: 21, 10: 22, 11: 23, 12: 24, 13: 25, 14: 26, 15: 27, 16: 28, 17: 29, 18: 30, 19: 31, 20: 32, 21: 33, 22: 34, 23: 35, 24: 36, 25: 37, 26: 38 },
  large: { 2: 15, 3: 17, 4: 19, 5: 20, 6: 22, 7: 23, 8: 24, 9: 25, 10: 26, 11: 27, 12: 28, 13: 29, 14: 30, 15: 31, 16: 32, 17: 33, 18: 34, 19: 35, 20: 36, 21: 37, 22: 38, 23: 39, 24: 40, 25: 41, 26: 42 },
  huge: { 2: 20, 3: 22, 4: 24, 5: 26, 6: 27, 7: 28, 8: 29, 9: 30, 10: 30, 11: 31, 12: 32, 13: 33, 14: 34, 15: 35, 16: 36, 17: 37, 18: 38, 19: 39, 20: 40, 21: 41, 22: 42, 23: 43, 24: 44, 25: 45, 26: 46 },
};

export function createGame(opts: NewGameOptions): GameState {
  const seed = opts.seed ?? Math.floor(Math.random() * 2 ** 31);
  const rng = makeRng(seed);
  const humanTribes = opts.humans ?? (opts.human ? [opts.human] : []);
  const tribes: TribeId[] = [...humanTribes, ...opts.opponents];
  const size = SIZES[opts.mapSize ?? 'normal'][tribes.length] ?? 16;

  const players: Player[] = tribes.map((tribe, i) => ({
    id: i,
    tribe,
    human: i < humanTribes.length,
    stars: 5,
    techs: [TRIBES[tribe].startTech],
    explored: new Array(size * size).fill(false),
    alive: true,
    kills: 0,
    bonusScore: 0,
    met: [],
  }));

  const state: GameState = {
    version: 1,
    seed,
    size,
    tiles: [],
    cities: [],
    units: [],
    players,
    current: 0,
    turn: 0,
    maxTurns: opts.mode === 'perfection' ? (opts.maxTurns ?? 30) : 0,
    mode: opts.mode,
    difficulty: opts.difficulty ?? 'normal',
    nextId: 1,
    over: false,
    winner: null,
    log: [],
    hintStep: 0,
  };

  const capitals = placeCapitals(rng, size, tribes.length);
  generateTerrain(state, rng, capitals, tribes, STYLE[opts.terrain ?? 'balanced']);

  capitals.forEach((c, i) => {
    const city = foundCity(state, c.x, c.y, i, true);
    city.name = TRIBES[tribes[i]].cityNames[0];
    guaranteeStarterResources(state, rng, c.x, c.y, tribes[i]);
    const kind = unitFor(tribes[i], 'warrior');
    spawnUnit(state, kind, i, c.x, c.y, city.id);
  });

  placeVillagesAndRuins(state, rng, capitals);
  ensureGrowthResources(state, rng);
  for (const p of players) revealAround(state, p.id);
  return state;
}

function placeCapitals(rng: Rng, size: number, n: number) {
  let best: { x: number; y: number }[] = [];
  let bestScore = -1;
  const m = 2;
  for (let attempt = 0; attempt < 400; attempt++) {
    const pts = Array.from({ length: n }, () => ({ x: m + rng.int(size - 2 * m), y: m + rng.int(size - 2 * m) }));
    let minD = Infinity;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) minD = Math.min(minD, dist(pts[i].x, pts[i].y, pts[j].x, pts[j].y));
    if (minD > bestScore) {
      bestScore = minD;
      best = pts;
    }
  }
  return best;
}

function generateTerrain(state: GameState, rng: Rng, capitals: { x: number; y: number }[], tribes: TribeId[], style: Style) {
  const { size } = state;
  // Land-ness field: a few random blobs plus a strong bump around each capital.
  const blobs = Array.from({ length: Math.round(size * 0.9 * style.blobs) }, () => ({
    x: rng.next() * size,
    y: rng.next() * size,
    r: (1.5 + rng.next() * 3.5) * style.radius,
    w: 0.6 + rng.next() * 0.6,
  }));
  // lakes: round dips in the land field
  const lakes = Array.from({ length: Math.round(size * style.lakes) }, () => ({ x: rng.next() * size, y: rng.next() * size, r: 1 + rng.next() * 1.8 }));

  const landVals: number[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Biome: nearest capital, with a little jitter so borders aren't straight lines.
      let bi = 0;
      let bd = Infinity;
      capitals.forEach((c, i) => {
        const d = Math.hypot(c.x - x, c.y - y) + rng.next() * 1.6;
        if (d < bd) {
          bd = d;
          bi = i;
        }
      });
      const tribe = TRIBES[tribes[bi]];
      const w = tribe.terrain;
      const waterShare = (w.shallow + w.ocean) / 100;

      let land = 0;
      for (const b of blobs) land += b.w * Math.exp(-(((x - b.x) ** 2 + (y - b.y) ** 2) / (b.r * b.r)));
      for (const c of capitals) land += 1.6 * style.cap * Math.exp(-(((x - c.x) ** 2 + (y - c.y) ** 2) / 5));
      for (const l of lakes) if (!capitals.some((c) => Math.hypot(c.x - x, c.y - y) < 2.6)) land -= 1.5 * Math.exp(-(((x - l.x) ** 2 + (y - l.y) ** 2) / (l.r * l.r)));
      const edge = Math.min(x, y, size - 1 - x, size - 1 - y);
      if (edge === 0) land -= 0.35;
      land += (rng.next() - 0.5) * 0.5;
      // a styled map keeps a set share of land: decide once every tile has its land value (below)
      if (style.target !== undefined) land -= (waterShare - 0.2) * 0.6;
      const isLandTile = style.target !== undefined ? true : land > 0.35 + waterShare * 1.1 + style.bias;
      landVals.push(land);

      let terrain: Terrain;
      if (isLandTile) terrain = weighted(rng, { field: w.field * style.field, forest: w.forest * style.forest, mountain: w.mountain * style.mountain });
      else terrain = 'ocean';

      state.tiles.push({
        x, y, terrain, biome: tribes[bi],
        resource: null, improvement: null, road: false, village: false, ruin: false,
        cityId: null, owner: null, seed: rng.int(1_000_000),
      });
    }
  }

  if (style.target !== undefined) {
    // sea level = the land value that leaves `target` of the map dry
    const sorted = [...landVals].sort((a, b) => b - a);
    const sea = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * style.target))];
    state.tiles.forEach((t, i) => {
      if (landVals[i] > sea) return;
      t.terrain = 'ocean';
    });
  }

  // Capitals and their ring are always land; capital tile is a field.
  for (const c of capitals) {
    for (const t of area(state, c.x, c.y, 1)) if (isWater(t)) t.terrain = rng.chance(0.7) ? 'field' : 'forest';
    tileAt(state, c.x, c.y)!.terrain = 'field';
  }

  // Water touching land is shallow.
  for (const t of state.tiles) {
    if (t.terrain === 'ocean' && neighbors(state, t.x, t.y).some(isLand)) t.terrain = 'shallow';
  }

  // Resources.
  for (const t of state.tiles) {
    const mult = TRIBES[t.biome].resources;
    const roll = (r: Resource, base: number) => rng.chance(base * (mult[r] ?? 1));
    if (t.terrain === 'field') {
      if (roll('fruit', 0.17)) t.resource = 'fruit';
      else if (roll('crop', 0.12)) t.resource = 'crop';
    } else if (t.terrain === 'forest') {
      if (roll('animal', 0.2)) t.resource = 'animal';
    } else if (t.terrain === 'mountain') {
      if (roll('ore', 0.14)) t.resource = 'ore';
    } else if (t.terrain === 'shallow') {
      if (roll('fish', 0.22)) t.resource = 'fish';
    } else if (t.terrain === 'ocean') {
      if (roll('whale', 0.06)) t.resource = 'whale';
    }
  }
}

function guaranteeStarterResources(state: GameState, rng: Rng, cx: number, cy: number, tribe: TribeId) {
  const ring = neighbors(state, cx, cy, 1);
  const want: Record<TribeId, { terrain: Terrain; res: Resource }[]> = {
    egypt: [{ terrain: 'field', res: 'fruit' }, { terrain: 'field', res: 'fruit' }, { terrain: 'field', res: 'crop' }],
    aztec: [{ terrain: 'forest', res: 'animal' }, { terrain: 'forest', res: 'animal' }, { terrain: 'field', res: 'fruit' }],
    polynesia: [{ terrain: 'shallow', res: 'fish' }, { terrain: 'shallow', res: 'fish' }, { terrain: 'field', res: 'fruit' }],
    rome: [{ terrain: 'field', res: 'fruit' }, { terrain: 'forest', res: 'animal' }, { terrain: 'field', res: 'fruit' }],
    pirates: [{ terrain: 'shallow', res: 'fish' }, { terrain: 'shallow', res: 'fish' }, { terrain: 'mountain', res: 'ore' }],
    vikings: [{ terrain: 'forest', res: 'animal' }, { terrain: 'mountain', res: 'ore' }, { terrain: 'shallow', res: 'fish' }],
    japan: [{ terrain: 'shallow', res: 'fish' }, { terrain: 'shallow', res: 'fish' }, { terrain: 'field', res: 'fruit' }],
    mongols: [{ terrain: 'field', res: 'fruit' }, { terrain: 'forest', res: 'animal' }, { terrain: 'field', res: 'fruit' }],
    greeks: [{ terrain: 'field', res: 'fruit' }, { terrain: 'field', res: 'fruit' }, { terrain: 'field', res: 'crop' }],
    zulu: [{ terrain: 'forest', res: 'animal' }, { terrain: 'forest', res: 'animal' }, { terrain: 'field', res: 'fruit' }],
    persia: [{ terrain: 'field', res: 'crop' }, { terrain: 'field', res: 'fruit' }, { terrain: 'mountain', res: 'ore' }],
    celts: [{ terrain: 'forest', res: 'animal' }, { terrain: 'forest', res: 'animal' }, { terrain: 'field', res: 'fruit' }],
    inuit: [{ terrain: 'shallow', res: 'fish' }, { terrain: 'shallow', res: 'fish' }, { terrain: 'field', res: 'animal' }],
    inca: [{ terrain: 'mountain', res: 'ore' }, { terrain: 'field', res: 'crop' }, { terrain: 'field', res: 'fruit' }],
    aboriginal: [{ terrain: 'forest', res: 'animal' }, { terrain: 'field', res: 'fruit' }, { terrain: 'shallow', res: 'fish' }],
    china: [{ terrain: 'field', res: 'crop' }, { terrain: 'field', res: 'fruit' }, { terrain: 'mountain', res: 'ore' }],
    india: [{ terrain: 'field', res: 'fruit' }, { terrain: 'field', res: 'crop' }, { terrain: 'shallow', res: 'fish' }],
    mali: [{ terrain: 'field', res: 'crop' }, { terrain: 'forest', res: 'animal' }, { terrain: 'mountain', res: 'ore' }],
    lakota: [{ terrain: 'field', res: 'animal' }, { terrain: 'field', res: 'animal' }, { terrain: 'field', res: 'fruit' }],
    ottoman: [{ terrain: 'field', res: 'crop' }, { terrain: 'field', res: 'fruit' }, { terrain: 'mountain', res: 'ore' }],
    maya: [{ terrain: 'forest', res: 'fruit' }, { terrain: 'field', res: 'crop' }, { terrain: 'forest', res: 'animal' }],
    korea: [{ terrain: 'field', res: 'crop' }, { terrain: 'field', res: 'fruit' }, { terrain: 'mountain', res: 'ore' }],
    khmer: [{ terrain: 'field', res: 'crop' }, { terrain: 'shallow', res: 'fish' }, { terrain: 'field', res: 'fruit' }],
    swahili: [{ terrain: 'shallow', res: 'fish' }, { terrain: 'shallow', res: 'fish' }, { terrain: 'field', res: 'fruit' }],
    tibet: [{ terrain: 'field', res: 'animal' }, { terrain: 'mountain', res: 'ore' }, { terrain: 'field', res: 'crop' }],
    ethiopia: [{ terrain: 'field', res: 'crop' }, { terrain: 'mountain', res: 'ore' }, { terrain: 'field', res: 'fruit' }],
  };
  const free = rng.shuffle(ring.filter((t) => !t.resource));
  for (const w of want[tribe]) {
    const already = ring.filter((t) => t.resource === w.res).length;
    const need = want[tribe].filter((x) => x.res === w.res).length;
    if (already >= need) continue;
    let t = free.find((f) => f.terrain === w.terrain && !f.resource);
    if (!t) {
      t = free.find((f) => !f.resource);
      if (!t) continue;
      t.terrain = w.terrain;
      if (w.terrain === 'shallow') {
        // keep the capital reachable: don't strand it
        if (!neighbors(state, cx, cy).some((n) => n !== t && isLand(n))) t.terrain = 'field';
      }
    }
    if (t.terrain === w.terrain) t.resource = w.res;
  }
}

/** Population a resource adds when harvested (whales only pay stars). */
const RESOURCE_POP: Record<Resource, number> = { fruit: 1, animal: 1, fish: 1, crop: 2, ore: 2, whale: 0 };
/** Population worth of resources every city is guaranteed inside its first borders: a city needs 2 to level up. */
const MIN_GROWTH = 3;

/**
 * Every capital and every village gets enough harvestable resources in its starting ring to grow
 * its city at least one level, however the map rolled. Cheap-to-reach ones (fruit, game, fish) are
 * added first, on whatever the ring's terrain supports.
 */
function ensureGrowthResources(state: GameState, rng: Rng) {
  const spots = [...state.tiles.filter((t) => t.village), ...state.cities.map((c) => tileAt(state, c.x, c.y)!)];
  for (const spot of spots) {
    const ring = neighbors(state, spot.x, spot.y, 1);
    const worth = () => ring.reduce((a, t) => a + (t.resource ? RESOURCE_POP[t.resource] : 0), 0);
    const free = rng.shuffle(ring.filter((t) => !t.resource && !t.village && !t.ruin && t.cityId === null));
    const add = (t: Tile): Resource | null => {
      switch (t.terrain) {
        case 'field': return 'fruit';
        case 'forest': return 'animal';
        case 'shallow': return 'fish';
        case 'mountain': return 'ore';
        default: return null;
      }
    };
    for (const t of free) {
      if (worth() >= MIN_GROWTH) break;
      const r = add(t);
      if (r) t.resource = r;
    }
  }
}

function placeVillagesAndRuins(state: GameState, rng: Rng, capitals: { x: number; y: number }[]) {
  const { size } = state;
  const taken: { x: number; y: number }[] = [...capitals];
  const candidates = rng.shuffle(state.tiles.filter((t) => t.terrain === 'field' || t.terrain === 'forest'));
  const target = Math.round((size * size) / 20);
  let n = 0;
  for (const t of candidates) {
    if (n >= target) break;
    if (t.x === 0 || t.y === 0 || t.x === size - 1 || t.y === size - 1) continue;
    if (taken.some((c) => dist(c.x, c.y, t.x, t.y) < 3)) continue;
    t.village = true;
    t.terrain = 'field';
    t.resource = null;
    taken.push(t);
    n++;
  }
  const ruins = rng.shuffle(state.tiles.filter((t) => !t.village && !t.cityId && t.terrain !== 'shallow'));
  let r = 0;
  for (const t of ruins) {
    if (r >= Math.round(size / 3)) break;
    if (taken.some((c) => dist(c.x, c.y, t.x, t.y) < 2)) continue;
    t.ruin = true;
    t.resource = null;
    taken.push(t);
    r++;
  }
}

export function foundCity(state: GameState, x: number, y: number, owner: number, capital: boolean) {
  const t = tileAt(state, x, y)!;
  const tribe = TRIBES[state.players[owner].tribe];
  const used = new Set(state.cities.map((c) => c.name));
  const name = tribe.cityNames.find((n) => !used.has(n)) ?? `${tribe.people} Post ${state.cities.length + 1}`;
  const city: City = {
    id: state.nextId++,
    name,
    x, y, owner,
    level: 1, pop: 0, capital,
    workshop: false, walls: false, parks: 0,
    borderRadius: 1,
    pendingRewards: [],
    units: 0,
  };
  state.cities.push(city);
  t.village = false;
  t.cityId = city.id;
  t.resource = null;
  t.terrain = 'field';
  claimTerritory(state, city.id);
  return city;
}

export function claimTerritory(state: GameState, cityId: number) {
  const c = state.cities.find((k) => k.id === cityId)!;
  for (const t of area(state, c.x, c.y, c.borderRadius)) {
    if (t.owner === null || t.owner === c.id) t.owner = c.id;
  }
}

export function spawnUnit(state: GameState, kind: UnitKind, owner: number, x: number, y: number, homeCity: number | null) {
  const def = UNITS[kind];
  const u: Unit = {
    id: state.nextId++,
    kind, owner, x, y,
    hp: def.hp,
    homeCity,
    moved: true,
    attacked: true,
    veteranKills: 0,
    veteran: false,
    carrying: null,
    fortified: false,
  };
  state.units.push(u);
  if (homeCity !== null) {
    const c = state.cities.find((k) => k.id === homeCity);
    if (c) c.units++;
  }
  return u;
}

export function revealAround(state: GameState, playerId: number) {
  const p = state.players[playerId];
  const extra = p.techs.length > 1 ? perkSum(state, playerId, 'vision') : 0; // skill-line perks
  const mark = (x: number, y: number, r: number) => {
    for (const t of area(state, x, y, r + extra)) p.explored[t.y * state.size + t.x] = true;
  };
  for (const c of state.cities) if (c.owner === playerId) mark(c.x, c.y, c.borderRadius + 1);
  for (const u of state.units) {
    if (u.owner !== playerId) continue;
    const t = tileAt(state, u.x, u.y)!;
    mark(u.x, u.y, t.terrain === 'mountain' || u.kind === 'explorer' ? 2 : 1);
  }
  // anyone whose units or cities are now in sight has been met
  const seen = (x: number, y: number) => p.explored[y * state.size + x];
  for (const u of state.units) if (u.owner !== playerId && seen(u.x, u.y)) meet(state, playerId, u.owner);
  for (const c of state.cities) if (c.owner !== playerId && seen(c.x, c.y)) meet(state, playerId, c.owner);
}

/** Records that two empires have met (seen each other's units or cities, or fought). */
export function meet(state: GameState, a: number, b: number) {
  if (a === b) return;
  const pa = state.players[a], pb = state.players[b];
  if (!(pa.met ??= []).includes(b)) pa.met.push(b);
  if (!(pb.met ??= []).includes(a)) pb.met.push(a);
}
