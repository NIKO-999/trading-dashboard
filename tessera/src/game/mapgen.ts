import { TRIBES, unitFor } from '../data/tribes';
import { UNITS } from '../data/units';
import { area, dist, isLand, isWater, neighbors, tileAt } from './grid';
import { makeRng, weighted, type Rng } from './rng';
import type { City, Difficulty, GameMode, GameState, Player, Resource, Terrain, TribeId, Unit, UnitKind } from './types';

export type MapSize = 'normal' | 'large' | 'huge';

export interface NewGameOptions {
  seed?: number;
  human: TribeId | null; // null = all AI (used by simulations)
  humans?: TribeId[]; // pass & play: every human seat in turn order (takes precedence over `human`)
  opponents: TribeId[];
  mode: GameMode;
  difficulty?: Difficulty;
  maxTurns?: number;
  mapSize?: MapSize;
}

// Map edge length by map size and number of empires.
const SIZES: Record<MapSize, Record<number, number>> = {
  normal: { 2: 11, 3: 13, 4: 15, 5: 16 },
  large: { 2: 15, 3: 17, 4: 19, 5: 20 },
  huge: { 2: 20, 3: 22, 4: 24, 5: 26 },
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
  generateTerrain(state, rng, capitals, tribes);

  capitals.forEach((c, i) => {
    const city = foundCity(state, c.x, c.y, i, true);
    city.name = TRIBES[tribes[i]].cityNames[0];
    guaranteeStarterResources(state, rng, c.x, c.y, tribes[i]);
    const kind = unitFor(tribes[i], 'warrior');
    spawnUnit(state, kind, i, c.x, c.y, city.id);
  });

  placeVillagesAndRuins(state, rng, capitals);
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

function generateTerrain(state: GameState, rng: Rng, capitals: { x: number; y: number }[], tribes: TribeId[]) {
  const { size } = state;
  // Land-ness field: a few random blobs plus a strong bump around each capital.
  const blobs = Array.from({ length: Math.round(size * 0.9) }, () => ({
    x: rng.next() * size,
    y: rng.next() * size,
    r: 1.5 + rng.next() * 3.5,
    w: 0.6 + rng.next() * 0.6,
  }));

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
      for (const c of capitals) land += 1.6 * Math.exp(-(((x - c.x) ** 2 + (y - c.y) ** 2) / 5));
      const edge = Math.min(x, y, size - 1 - x, size - 1 - y);
      if (edge === 0) land -= 0.35;
      land += (rng.next() - 0.5) * 0.5;
      const isLandTile = land > 0.35 + waterShare * 1.1;

      let terrain: Terrain;
      if (isLandTile) terrain = weighted(rng, { field: w.field, forest: w.forest, mountain: w.mountain });
      else terrain = 'ocean';

      state.tiles.push({
        x, y, terrain, biome: tribes[bi],
        resource: null, improvement: null, road: false, village: false, ruin: false,
        cityId: null, owner: null, seed: rng.int(1_000_000),
      });
    }
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
    pirates: [{ terrain: 'mountain', res: 'ore' }, { terrain: 'shallow', res: 'fish' }, { terrain: 'field', res: 'fruit' }],
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
  const mark = (x: number, y: number, r: number) => {
    for (const t of area(state, x, y, r)) p.explored[t.y * state.size + t.x] = true;
  };
  for (const c of state.cities) if (c.owner === playerId) mark(c.x, c.y, c.borderRadius + 1);
  for (const u of state.units) {
    if (u.owner !== playerId) continue;
    const t = tileAt(state, u.x, u.y)!;
    mark(u.x, u.y, t.terrain === 'mountain' || u.kind === 'explorer' ? 2 : 1);
  }
}
