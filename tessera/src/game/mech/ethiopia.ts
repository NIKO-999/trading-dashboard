import { emit } from '../events';
import { dist, isLand, tileAt } from '../grid';
import { citiesOf, removeUnit, tileOwnerPlayer, unitAt } from '../rules';
import type { Action } from '../rules';
import type { GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

// Aksum: Monolithic Spire Network + Crossroad Tariffs.
//
// (A) Stone Stelae (`improvement: 'stele'`, `data.stele` = owner) are built on own land for STELE_COST stars (`mech:stele`).
//     At the end of the owner's turn each active stele (its tile still in Aksumite territory) sends a light ray into every
//     enemy unit within RAY_RANGE tiles (RAY_DAMAGE each; one unit never takes more than RAY_CAP from rays in a turn).
//     Two stelae on the same row, column or diagonal, at most LINK_RANGE apart with no mountain between them, are linked
//     in a laser grid; enemies standing on the tiles between take GRID_DAMAGE.
//     Simplifications: rays themselves need no line of sight; a stele cannot be built on mountains; the number of
//     stelae is capped at STELE_PER_CITY per city so a stele wall cannot swamp the map.
// (B) Crossroad Tariffs: every foreign unit that ended a move on or next to Aksumite land is a "traveller" (recorded in
//     player.mech.seen on arrival, and counted again by position when income is paid). Each traveller is worth 1 point,
//     2 at a choke point (an Aksumite tile with at most CHOKE_OPEN open land neighbours: mountains, water and forest
//     hem it in). Income = ceil(points / 2), capped at TARIFF_CAP a turn. No improvements needed. Population is not
//     touched: this economy is Stars only.

export const STELE_COST = 3;
export const STELE_PER_CITY = 4;
export const RAY_RANGE = 3;
export const RAY_DAMAGE = 2;
export const RAY_CAP = 4;
export const LINK_RANGE = 6;
export const GRID_DAMAGE = 1;
export const TARIFF_CAP = 8;
export const CARAVAN_PER_CITY = 1; // a flat road-tax per city
export const CHOKE_OPEN = 4;

export const isStele = (t: Tile) => t.improvement === 'stele' && typeof t.data?.stele === 'number';

/** Steles of `owner` that still stand on Aksumite land (a stele on lost ground goes dark). */
export function activeSteles(s: GameState, owner: number): Tile[] {
  return s.tiles.filter((t) => isStele(t) && t.data!.stele === owner && tileOwnerPlayer(s, t) === owner);
}

const steleCount = (s: GameState, owner: number) => s.tiles.filter((t) => isStele(t) && t.data!.stele === owner).length;
export const steleCap = (s: GameState, owner: number) => citiesOf(s, owner).length * STELE_PER_CITY;

/** The tiles strictly between two steles when they can see each other, else null. */
export function lineBetween(s: GameState, a: Tile, b: Tile): Tile[] | null {
  const dx = b.x - a.x, dy = b.y - a.y;
  const n = Math.max(Math.abs(dx), Math.abs(dy));
  if (n < 2 || n > LINK_RANGE) return null;
  if (dx !== 0 && dy !== 0 && Math.abs(dx) !== Math.abs(dy)) return null; // straight or diagonal only
  const sx = Math.sign(dx), sy = Math.sign(dy);
  const out: Tile[] = [];
  for (let i = 1; i < n; i++) {
    const t = tileAt(s, a.x + sx * i, a.y + sy * i);
    if (!t || t.terrain === 'mountain') return null;
    out.push(t);
  }
  return out;
}

export interface Link { a: Tile; b: Tile; between: Tile[] }

/** All laser links of `owner`'s grid. */
export function gridLinks(s: GameState, owner: number): Link[] {
  const st = activeSteles(s, owner);
  const links: Link[] = [];
  for (let i = 0; i < st.length; i++)
    for (let j = i + 1; j < st.length; j++) {
      const between = lineBetween(s, st[i], st[j]);
      if (between) links.push({ a: st[i], b: st[j], between });
    }
  return links;
}

function hurt(s: GameState, d: Unit, amount: number) {
  d.hp -= amount;
  emit({ type: 'damage', unitId: d.id, x: d.x, y: d.y, amount });
  if (d.hp <= 0) {
    removeUnit(s, d, null);
    emit({ type: 'death', unitId: d.id, x: d.x, y: d.y, owner: d.owner, kind: d.kind });
  }
}

/** Fire every ray and grid beam of `owner`. Each enemy takes at most RAY_CAP from rays plus GRID_DAMAGE once from the grid. */
export function fireSpires(s: GameState, owner: number) {
  const st = activeSteles(s, owner);
  const dealt = new Map<number, number>();
  for (const t of st) {
    for (const e of s.units.filter((u) => u.owner !== owner && dist(u.x, u.y, t.x, t.y) <= RAY_RANGE).sort((a, b) => a.id - b.id)) {
      const got = dealt.get(e.id) ?? 0;
      const n = Math.min(RAY_DAMAGE, RAY_CAP - got);
      if (n <= 0) continue;
      dealt.set(e.id, got + n);
      hurt(s, e, n);
    }
  }
  const burned = new Set<number>();
  for (const l of gridLinks(s, owner))
    for (const bt of l.between) {
      const e = unitAt(s, bt.x, bt.y);
      if (e && e.owner !== owner && !burned.has(e.id)) { burned.add(e.id); hurt(s, e, GRID_DAMAGE); }
    }
}

// ------------------------------------------------------------ tariffs

/** A tile with few open land neighbours: a pass, a ford, a gap between mountains. */
export function isChoke(s: GameState, t: Tile): boolean {
  let open = 0;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const n = tileAt(s, t.x + dx, t.y + dy);
      if (n && isLand(n) && n.terrain !== 'mountain' && n.terrain !== 'forest') open++;
    }
  return open <= CHOKE_OPEN;
}

/** The Aksumite tile a traveller at (x,y) is using: its own tile or an adjacent one, preferring a choke point. */
function borderTile(s: GameState, owner: number, x: number, y: number): Tile | null {
  let best: Tile | null = null;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const t = tileAt(s, x + dx, y + dy);
      if (!t || tileOwnerPlayer(s, t) !== owner) continue;
      if (!best || (isChoke(s, t) && !isChoke(s, best))) best = t;
    }
  return best;
}

const seenOf = (s: GameState, owner: number): number[] => (s.players[owner].mech as { seen?: number[] } | undefined)?.seen ?? [];

/** Points earned by foreign travellers: units near the border now, plus 1 for each that passed by and moved on. */
export function travellerPoints(s: GameState, owner: number): number {
  const ids = new Set(seenOf(s, owner));
  let pts = 0;
  for (const u of s.units) {
    if (u.owner === owner) continue;
    const bt = borderTile(s, owner, u.x, u.y);
    if (!bt) continue;
    ids.delete(u.id);
    pts += isChoke(s, bt) ? 2 : 1;
  }
  return pts + ids.size;
}

export const tariff = (s: GameState, owner: number) => Math.min(TARIFF_CAP, Math.ceil(travellerPoints(s, owner) / 2));

export const mech: Mechanic = {
  name: 'Monolithic Spire Network',
  blurb: 'Stone Stelae ray enemies within three tiles and link into a laser grid, while crossroad tariffs pay Stars for foreign traffic past your borders.',

  setup(s, owner) { s.players[owner].mech = { seen: [] }; },

  // Record foreign units that arrive on or beside Aksumite land (they may move on before Aksum's income is paid).
  afterMove(s, owner, u, _from, to) {
    if (u.owner === owner || !borderTile(s, owner, to.x, to.y)) return;
    const p = s.players[owner];
    const m = (p.mech ?? (p.mech = { seen: [] })) as { seen?: number[] };
    const seen = m.seen ?? (m.seen = []);
    if (!seen.includes(u.id)) seen.push(u.id);
  },

  income(s, owner) { return tariff(s, owner) + CARAVAN_PER_CITY * citiesOf(s, owner).length; },

  // income was paid just before this hook runs: start counting travellers afresh
  turnStart(s, owner) { s.players[owner].mech = { seen: [] }; },

  turnEnd(s, owner) { fireSpires(s, owner); },

  actions(s, owner, t): Action[] {
    if (tileOwnerPlayer(s, t) !== owner || !isLand(t) || t.cityId !== null) return [];
    if (t.improvement || t.terrain === 'mountain') return [];
    const p = s.players[owner];
    const why = steleCount(s, owner) >= steleCap(s, owner) ? `At most ${STELE_PER_CITY} stelae per city` : p.stars < STELE_COST ? 'Not enough stars' : undefined;
    return [{
      id: 'mech:stele', label: 'Raise Stele', cost: STELE_COST, icon: 'temple', enabled: !why, reason: why,
      desc: `A great carved stele: at the end of your turn it rays each enemy within ${RAY_RANGE} tiles for ${RAY_DAMAGE}, and links to steles in line of sight (${LINK_RANGE} tiles) to burn enemies on the beam.`,
    }];
  },

  doAction(s, owner, t, id) {
    if (id !== 'mech:stele' || tileOwnerPlayer(s, t) !== owner || t.improvement || t.cityId !== null) return false;
    t.improvement = 'stele';
    t.data = { ...(t.data ?? {}), stele: owner };
    return true;
  },

  ai(s, owner) {
    const p = s.players[owner];
    if (p.stars < STELE_COST || steleCount(s, owner) >= steleCap(s, owner)) return false;
    const enemies = s.units.filter((u) => u.owner !== owner);
    const enemyCities = s.cities.filter((c) => c.owner !== owner);
    const mine = activeSteles(s, owner);
    let best: { t: Tile; score: number } | null = null;
    for (const t of s.tiles) {
      if (tileOwnerPlayer(s, t) !== owner || !isLand(t) || t.cityId !== null || t.improvement || t.terrain === 'mountain') continue;
      let score = enemies.filter((e) => dist(e.x, e.y, t.x, t.y) <= RAY_RANGE + 2).length * 3;
      if (isChoke(s, t)) score += 2;
      const far = Math.min(99, ...enemyCities.map((c) => dist(c.x, c.y, t.x, t.y)));
      score += Math.max(0, 12 - far) * 0.3;
      score += mine.filter((m) => lineBetween(s, m, t)).length * 2; // extends the grid
      if (mine.some((m) => dist(m.x, m.y, t.x, t.y) < 2)) score -= 4; // do not clump
      score -= ((t.x * 7 + t.y * 13) % 5) * 0.01; // deterministic tie-break
      if (!best || score > best.score) best = { t, score };
    }
    if (!best || best.score < 2) return false;
    p.stars -= STELE_COST; // the AI acts directly, not through the tile menu
    return mech.doAction!(s, owner, best.t, 'mech:stele');
  },
};
