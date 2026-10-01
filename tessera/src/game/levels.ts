// Tile levels, Districts and empire specialities. Every improved resource tile in your land can be raised through
// three levels (tile menu: "Upgrade"); each level pays more Stars a turn and is drawn bigger and richer on the map
// (see render/levels). Every empire does it the same way; the Economy empires' Master Builder does it cheaper (see
// game/roles) and each empire's historical speciality starts a level higher or upgrades cheaper.
//
//  - Levels. Level 1 is the ordinary improvement (Farm, Mine, Lumber Hut, Port, Market, Temple/Shrine). Level 2 needs
//    the kind's tier-2 tech and LEVEL_COST[2]★; level 3 needs its tier-3 tech, LEVEL_COST[3]★ and a city of level
//    L3_CITY or more. A raised tile keeps its improvement, so every rule that counts farms, mines, markets or temples
//    (empire mechanics, perks, wonders) still counts it.
//  - Pasture and Orchard. On a wild-animal or fruit tile, instead of the one-off hunt or harvest, tame the herd or plant
//    the trees: a new improvement (`pasture`, `orchard`) that starts at level 2 and can be raised to level 3.
//  - Level-3 extras. Granary Fields grow each farm beside them once; a Foundry makes units trained in its city cheaper;
//    Timberworks make its city's boats and siege engines cheaper; a Great Harbour gives the city's ships +1 move; an
//    Exchange makes its city's trade routes pay more; a Sanctuary heals your units in its city's land; Stables give
//    the city's mounted units +1 defence; a Vineyard grows its city each time it levels up.
//  - Districts. DISTRICT_MIN or more level-3 tiles of one kind that touch (8 ways) and belong to one empire form a named
//    District: +DISTRICT_STARS★ a turn to the city holding most of it, and a small themed extra (DISTRICTS).
//  - Cost. Every tile an empire raises makes its next upgrade LEVEL_COST_STEP★ dearer (`player.raised`), so the income
//    upgrades add levels off instead of snowballing.
//  - Specialities. Each empire has one kind (SPECIALITY): either new ones are built straight at level 2 (`start`), or
//    upgrading them costs a third less and level 2 needs no tech (`cheap`).
//
// State (JSON-safe; older saves simply have none): on tiles `data.lvl` (2 or 3) with `data.lvk` (the improvement it was
// raised on: a level counts only while that improvement stands). A Master Builder's upgrade from before levels
// (`data.up`) reads as level 2 and is migrated by `migrateLevels`. On cities `data.mbSkip`: a Master Builder has used
// its one tech skip there. The rules call in through `levelActions`/`levelDoAction` (tile menu), `levelCityIncome`
// (city income), `levelTrainDiscount` (the train menu), `levelScore` and `levelGrowOnLevelUp`; the passive effects run
// as the LEVEL_MECH hooks (see mech/index) and the computer players upgrade through `levelAi` (called from game/ai).
import { TRIBES } from '../data/tribes';
import { UNITS } from '../data/units';
import { emit } from './events';
import { neighbors, tileAt } from './grid';
import type { Mechanic } from './mech/types';
import { MOUNTED_KINDS, unitMatches } from './perks';
import { addPop, cityById, citiesOf, doAction, hasTech, maxHp, tileOwnerPlayer, unitAt, type Action } from './rules';
import { routesOfCity } from './trade';
import type { City, GameState, Improvement, Tile, TribeId, Unit, UnitKind } from './types';
import { outOfSupply } from './army';
import { TECH_BY_ID } from '../data/techs';

// ---------------------------------------------------------------- tuning

export type LevelKind = 'farm' | 'mine' | 'lumber' | 'port' | 'market' | 'temple' | 'pasture' | 'orchard';
/** Stars to raise a tile to level 2 and to level 3 (indexed by the level reached). */
export const LEVEL_COST: readonly number[] = [0, 0, 6, 10];
/** A level-3 tile needs a city of at least this level. */
export const L3_CITY = 4;
/** Every tile an empire has raised makes its next upgrade this much dearer, so the income they add levels off. */
export const LEVEL_COST_STEP = 1;
export const DISTRICT_MIN = 3;
export const DISTRICT_STARS = 2;
/** Growth a Vineyard gives its city at each level-up (at most this many vineyards count). */
export const VINEYARD_CAP = 2;
export const SANCTUARY_HEAL = 2;
/** Granary Fields grow their city once for each farm beside them, up to this many. */
export const GRANARY_CAP = 2;
/** What a `cheap` speciality's upgrades cost, as a share of the usual price. */
export const SPECIAL_PCT = 2 / 3;
/** A tile built straight at level 2 (a `start` speciality) counts this many raised tiles toward the rising price. */
export const START_WEIGHT = 2;

export interface LevelDef {
  names: [string, string, string]; // levels 1-3 (a pasture or orchard has no level 1: it is the wild herd or fruit)
  tech: [string | null, string, string]; // what each level needs (level 1: the ordinary build)
  stars: [number, number, number]; // Stars a turn the tile adds at each level, on top of what the improvement already pays
  pop: [number, number, number]; // one-off growth on reaching the level
  score: [number, number, number]; // one-off score on reaching the level
  extra: string; // the level-3 extra, in words
}

export const LEVELS: Record<LevelKind, LevelDef> = {
  farm: { names: ['Farm', 'Estate', 'Granary Fields'], tech: ['farming', 'farming', 'masonry'], stars: [0, 1, 2], pop: [0, 1, 2], score: [0, 0, 0], extra: 'every farm beside it grows its city by 1 once (up to 2)' },
  mine: { names: ['Mine', 'Deep Mine', 'Foundry'], tech: ['mining', 'mining', 'smithing'], stars: [0, 1, 2], pop: [0, 0, 0], score: [0, 0, 0], extra: 'units trained in its city cost 1★ less' },
  lumber: { names: ['Lumber Hut', 'Sawmill', 'Timberworks'], tech: ['forestry', 'forestry', 'carpentry'], stars: [0, 1, 2], pop: [0, 0, 0], score: [0, 0, 0], extra: 'boats and siege engines from its city cost 2★ less' },
  port: { names: ['Port', 'Harbour', 'Great Harbour'], tech: ['fishing', 'sailing', 'navigation'], stars: [0, 1, 2], pop: [0, 1, 0], score: [0, 0, 0], extra: "its city's ships and boats move 1 further" },
  market: { names: ['Market', 'Bazaar', 'Exchange'], tech: ['carpentry', 'roads', 'trade'], stars: [0, 1, 2], pop: [0, 0, 0], score: [0, 0, 0], extra: "its city's trade routes pay +1★ each" },
  temple: { names: ['Temple', 'Great Temple', 'Sanctuary'], tech: ['masonry', 'meditation', 'philosophy'], stars: [0, 0, 0], pop: [0, 1, 2], score: [0, 100, 150], extra: `your units in its city's land heal ${SANCTUARY_HEAL} HP a turn` },
  pasture: { names: ['Wild Herd', 'Pasture', 'Stables'], tech: ['hunting', 'horsemanship', 'chivalry'], stars: [0, 1, 2], pop: [0, 0, 0], score: [0, 0, 0], extra: "its city's mounted units defend +1" },
  orchard: { names: ['Wild Fruit', 'Orchard', 'Vineyard'], tech: ['gathering', 'farming', 'masonry'], stars: [0, 1, 2], pop: [0, 0, 0], score: [0, 0, 0], extra: 'its city grows +1 more each time it levels up' },
};
export const LEVEL_KINDS = Object.keys(LEVELS) as LevelKind[];
const isKind = (k: Improvement | null): k is LevelKind => !!k && k in LEVELS;

/** The Districts and their themed extras. */
export const DISTRICTS: Record<LevelKind, { name: string; extra: string; color: string }> = {
  farm: { name: 'Agricultural Heartland', extra: 'its city grows +1 every 3rd turn', color: '#e9c55a' },
  mine: { name: 'Industrial District', extra: 'units trained in its city cost 1★ more less', color: '#9aa3ad' },
  lumber: { name: 'Timber Yards', extra: 'your units on its tiles defend +1 behind the log palisades', color: '#a8743e' },
  port: { name: 'Great Docks', extra: "ships and boats in its city's waters heal 3 HP a turn", color: '#5fb8e0' },
  market: { name: 'Merchant Quarter', extra: "its city's trade routes pay +1★ more each", color: '#f2b93b' },
  temple: { name: 'Holy District', extra: '+300 score while it stands', color: '#f4efe0' },
  pasture: { name: 'Horse Country', extra: 'mounted units trained in its city cost 1★ less', color: '#c98f5a' },
  orchard: { name: 'Garden Country', extra: 'its city grows +1 every 3rd turn', color: '#8fce5a' },
};
export const HOLY_SCORE = 300;

/** Each empire's historical speciality: `start` builds them straight at level 2; otherwise upgrading them is cheap. */
export interface Speciality { kind: LevelKind; start: boolean; name: string; why: string }
export const SPECIALITY: Record<TribeId, Speciality> = {
  egypt: { kind: 'farm', start: true, name: 'Nile Estates', why: 'The flood plains fed an empire: farms are built straight as Estates.' },
  aztec: { kind: 'farm', start: false, name: 'Chinampas', why: 'Floating gardens on the lake: farm upgrades cost a third less and Estates need no tech.' },
  polynesia: { kind: 'orchard', start: false, name: 'Māra Kai', why: 'Breadfruit and kūmara gardens: orchards cost a third less and need no tech.' },
  rome: { kind: 'mine', start: false, name: 'Imperial Quarries', why: 'Stone and iron for the legions: mine upgrades cost a third less and Deep Mines need no tech.' },
  pirates: { kind: 'port', start: false, name: 'Pirate Havens', why: 'Every cove a haven: port upgrades cost a third less and Harbours need no tech.' },
  vikings: { kind: 'lumber', start: true, name: 'Longship Yards', why: 'Timber for the fleets: lumber huts are built straight as Sawmills.' },
  japan: { kind: 'lumber', start: false, name: 'Satoyama Woods', why: 'Tended forests of cedar: lumber upgrades cost a third less and Sawmills need no tech.' },
  mongols: { kind: 'pasture', start: false, name: 'Steppe Herds', why: 'A people of horses: pastures cost a third less and need no tech.' },
  greeks: { kind: 'orchard', start: false, name: 'Olive Groves', why: 'Oil and wine of the Aegean: orchards cost a third less and need no tech.' },
  zulu: { kind: 'pasture', start: false, name: 'Cattle Kraals', why: 'Wealth was counted in cattle: pastures cost a third less and need no tech.' },
  persia: { kind: 'market', start: false, name: 'Royal Bazaars', why: 'The bazaars of the Royal Road: market upgrades cost a third less and Bazaars need no tech.' },
  celts: { kind: 'pasture', start: false, name: 'Cattle Lords', why: 'Herds were the chieftains’ wealth: pastures cost a third less and need no tech.' },
  inuit: { kind: 'port', start: false, name: 'Kayak Landings', why: 'Life came from the sea: port upgrades cost a third less and Harbours need no tech.' },
  inca: { kind: 'farm', start: false, name: 'Andén Terraces', why: 'Terraced slopes feed the Andes: farm upgrades cost a third less and Estates need no tech.' },
  ethiopia: { kind: 'temple', start: false, name: 'Rock-hewn Churches', why: 'Churches carved from the living rock: temple upgrades cost a third less and Great Temples need no tech.' },
  aboriginal: { kind: 'port', start: false, name: 'Stone Fish Traps', why: 'Budj Bim’s weirs and traps: port upgrades cost a third less and Harbours need no tech.' },
  china: { kind: 'market', start: true, name: 'Silk Markets', why: 'The Silk Road ends here: markets are built straight as Bazaars (and Silk Road doubles what their levels pay).' },
  india: { kind: 'temple', start: false, name: 'Temple Towns', why: 'Great temple towns of the south: temple upgrades cost a third less and Great Temples need no tech.' },
  mali: { kind: 'mine', start: true, name: 'Gold of Bambuk', why: 'The richest gold fields known: mines are built straight as Deep Mines.' },
  lakota: { kind: 'pasture', start: false, name: 'Horse Herds', why: 'The horse nation: pastures cost a third less and need no tech.' },
  ottoman: { kind: 'mine', start: false, name: 'Imperial Foundries', why: 'The cannon foundries of Tophane: mine upgrades cost a third less and Deep Mines need no tech.' },
  maya: { kind: 'temple', start: false, name: 'Pyramid Temples', why: 'Every city a temple city: temple upgrades cost a third less and Great Temples need no tech.' },
  korea: { kind: 'farm', start: false, name: 'Rice Paddies', why: 'Terraced paddies of the peninsula: farm upgrades cost a third less and Estates need no tech.' },
  khmer: { kind: 'temple', start: false, name: 'Temple Mountains', why: 'Angkor’s temple mountains: temple upgrades cost a third less and Great Temples need no tech.' },
  swahili: { kind: 'port', start: false, name: 'Coral Harbours', why: 'Stone ports of the monsoon trade: port upgrades cost a third less and Harbours need no tech.' },
  tibet: { kind: 'pasture', start: false, name: 'Yak Herds', why: 'Yak herds of the high plateau: pastures cost a third less and need no tech.' },
  carthage: { kind: 'port', start: false, name: 'Cothon Harbours', why: 'The round harbours of Carthage: port upgrades cost a third less and Harbours need no tech.' },
  byzantium: { kind: 'market', start: false, name: 'Silk Workshops', why: 'Smuggled silkworms and imperial looms: market upgrades cost a third less and Bazaars need no tech.' },
  arabia: { kind: 'orchard', start: false, name: 'Date Palm Oases', why: 'Gardens in the desert: orchard upgrades cost a third less and need no tech.' },
  rus: { kind: 'lumber', start: false, name: 'Forest Lodges', why: 'Timber, fur and honey of the great forest: lumber upgrades cost a third less and need no tech.' },
  vietnam: { kind: 'farm', start: false, name: 'Wet-rice Paddies', why: 'Two harvests a year from the delta: farm upgrades cost a third less and Estates need no tech.' },
};

/** A line about an empire's speciality for the empire screens. */
export const specialityLine = (tribe: TribeId) => {
  const sp = SPECIALITY[tribe];
  return { name: sp.name, text: sp.why };
};

// ---------------------------------------------------------------- reading levels

/** A tile's level: 0 with nothing to raise, 1 an ordinary improvement, 2 or 3 once raised (pastures and orchards start at 2). */
export function tileLevel(t: Tile): number {
  const k = t.improvement;
  if (!isKind(k)) return 0;
  const d = t.data;
  if (d && d.lvk === k && typeof d.lvl === 'number') return d.lvl;
  if (d && d.up === k) return 2; // a Master Builder's grand work from before levels
  return k === 'pasture' || k === 'orchard' ? 2 : 1;
}
/** The name of a tile's improvement at its level ("Estate", "Foundry"...), or undefined when it has none. */
export function levelName(t: Tile): string | undefined {
  const l = tileLevel(t);
  return l ? LEVELS[t.improvement as LevelKind].names[l - 1] : undefined;
}
const setLevel = (t: Tile, lvl: number) => { t.data = { ...(t.data ?? {}), lvl, lvk: t.improvement }; delete t.data.up; };

/** Older saves: a Master Builder's upgrade (`data.up`) becomes level 2. */
export function migrateLevels(s: GameState) {
  for (const t of s.tiles) if (t.data?.up !== undefined) { if (t.data.up === t.improvement) setLevel(t, 2); else delete t.data.up; }
}

/** Does city `c` hold a tile of this kind at this level or more? */
const cityHas = (s: GameState, cid: number | null, kind: LevelKind, lvl: number) =>
  cid !== null && s.tiles.some((t) => t.owner === cid && t.improvement === kind && tileLevel(t) >= lvl);

// ---------------------------------------------------------------- districts

export interface District { kind: LevelKind; owner: number; city: number; tiles: number[]; name: string }

/** Every District on the map (or `pid`'s): touching level-3 tiles of one kind, one empire's, DISTRICT_MIN or more. */
export function districtsOf(s: GameState, pid?: number): District[] {
  const seen = new Set<number>();
  const out: District[] = [];
  for (let i = 0; i < s.tiles.length; i++) {
    const t = s.tiles[i];
    if (seen.has(i) || tileLevel(t) < 3) continue;
    const owner = tileOwnerPlayer(s, t);
    if (owner === null || (pid !== undefined && owner !== pid)) continue;
    const kind = t.improvement as LevelKind;
    const group = [i];
    seen.add(i);
    for (let h = 0; h < group.length; h++) {
      const g = s.tiles[group[h]];
      for (const n of neighbors(s, g.x, g.y)) {
        const j = n.y * s.size + n.x;
        if (seen.has(j) || n.improvement !== kind || tileLevel(n) < 3 || tileOwnerPlayer(s, n) !== owner) continue;
        seen.add(j);
        group.push(j);
      }
    }
    if (group.length < DISTRICT_MIN) continue;
    // it belongs to the city holding most of its tiles (the oldest on a tie)
    const count = new Map<number, number>();
    for (const j of group) count.set(s.tiles[j].owner!, (count.get(s.tiles[j].owner!) ?? 0) + 1);
    const city = [...count].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
    out.push({ kind, owner, city, tiles: group, name: `${DISTRICTS[kind].name} of ${cityById(s, city)?.name ?? '?'}` });
  }
  return out;
}
/** The District a tile belongs to, if any. */
export const districtAt = (s: GameState, t: Tile) => (tileLevel(t) >= 3 ? districtsOf(s, tileOwnerPlayer(s, t) ?? -1).find((d) => d.tiles.includes(t.y * s.size + t.x)) : undefined);

// ---------------------------------------------------------------- economy

/** What raised tiles and Districts add to a city's Stars a turn (part of rules.cityIncome). */
export function levelCityIncome(s: GameState, c: City): number {
  let n = 0, any = false, exchange = false;
  const silk = s.players[c.owner].tribe === 'china';
  for (const t of s.tiles) {
    if (t.owner !== c.id) continue;
    const l = tileLevel(t);
    if (l < 2) continue;
    any = true;
    n += LEVELS[t.improvement as LevelKind].stars[l - 1] * (t.improvement === 'market' && silk ? 2 : 1); // Silk Road doubles a Bazaar's or Exchange's Stars too
    if (t.improvement === 'market' && l === 3) exchange = true;
  }
  if (!any) return 0;
  const ds = districtsOf(s, c.owner).filter((d) => d.city === c.id);
  n += ds.length * DISTRICT_STARS;
  if (exchange) n += routesOfCity(s, c).length * (1 + (ds.some((d) => d.kind === 'market') ? 1 : 0));
  return n;
}
/** Stars a turn `pid` earns from raised tiles and Districts. */
export const levelIncome = (s: GameState, pid: number) => citiesOf(s, pid).reduce((n, c) => n + levelCityIncome(s, c), 0);
/** Raised tiles `pid` holds (level 2 or 3). */
export const upgradeCount = (s: GameState, pid: number) => s.tiles.filter((t) => tileLevel(t) >= 2 && tileOwnerPlayer(s, t) === pid).length;
/** Holy Districts add to the score while they stand. */
export const levelScore = (s: GameState, pid: number) => districtsOf(s, pid).filter((d) => d.kind === 'temple').length * HOLY_SCORE;

const isSiege = (tribe: TribeId, k: UnitKind) => unitMatches(tribe, k, 'siege');
/** Stars off a unit trained in city `c`: a Foundry, Timberworks for boats and siege, Industrial District and Horse Country. */
export function levelTrainDiscount(s: GameState, c: City, k: UnitKind): number {
  const tribe = s.players[c.owner].tribe;
  let n = 0;
  if (cityHas(s, c.id, 'mine', 3)) n += 1;
  if ((UNITS[k].naval || isSiege(tribe, k)) && cityHas(s, c.id, 'lumber', 3)) n += 2;
  const ds = districtsOf(s, c.owner).filter((d) => d.city === c.id);
  if (ds.some((d) => d.kind === 'mine')) n += 1;
  if (MOUNTED_KINDS.includes(k) && ds.some((d) => d.kind === 'pasture')) n += 1;
  return n;
}
/** A boat upgraded in a port of city `cid`: Timberworks take 2★ off. */
export const levelBoatDiscount = (s: GameState, cid: number | null) => (cityHas(s, cid, 'lumber', 3) ? 2 : 0);

/** A Vineyard grows its city once more each time it levels up (called from rules.addPop). */
export function levelGrowOnLevelUp(s: GameState, c: City, levels: number) {
  const v = Math.min(VINEYARD_CAP, s.tiles.filter((t) => t.owner === c.id && t.improvement === 'orchard' && tileLevel(t) >= 3).length);
  if (!v || levels <= 0) return;
  emit({ type: 'harvest', player: c.owner, x: c.x, y: c.y, pop: v * levels });
  addPop(s, c, v * levels, true);
}

// ---------------------------------------------------------------- actions

interface Next { kind: LevelKind; lvl: number; cost: number; tech: string; reason?: string; needs?: string }
export type { Next as NextLevel };

/** Does `pid`'s speciality make this kind cheap (a third off, no tech for level 2)? */
const cheapFor = (s: GameState, pid: number, kind: LevelKind) => SPECIALITY[s.players[pid].tribe]?.kind === kind && !SPECIALITY[s.players[pid].tribe].start;

/**
 * The next level of tile `t` for `pid`, its price and what stops it (`half`: a Master Builder's price; `skip`: it may
 * skip the tech). A wild herd or fruit tile's next level is a new Pasture or Orchard.
 */
export function nextLevel(s: GameState, pid: number, t: Tile, opts: { half?: boolean; skip?: boolean } = {}): Next | null {
  if (tileOwnerPlayer(s, t) !== pid || t.cityId !== null) return null;
  let kind: LevelKind, lvl: number;
  if (!t.improvement && (t.resource === 'animal' || t.resource === 'fruit')) { kind = t.resource === 'animal' ? 'pasture' : 'orchard'; lvl = 2; }
  else if (isKind(t.improvement) && tileLevel(t) < 3) { kind = t.improvement; lvl = tileLevel(t) + 1; }
  else return null;
  const d = LEVELS[kind];
  const cheap = cheapFor(s, pid, kind);
  let cost = LEVEL_COST[lvl] + LEVEL_COST_STEP * (s.players[pid].raised ?? 0);
  if (cheap) cost = Math.ceil(cost * SPECIAL_PCT);
  if (opts.half) cost = Math.ceil(cost / 2);
  const tech = d.tech[lvl - 1]!;
  const c = cityById(s, t.owner)!;
  const techOk = hasTech(s, pid, tech) || (cheap && lvl === 2);
  const skipOk = !techOk && !!opts.skip && !c.data?.mbSkip;
  const n: Next = { kind, lvl, cost, tech };
  if (!techOk && !skipOk) { n.reason = `Needs ${TECH_BY_ID[tech].name}`; n.needs = tech; }
  else if (lvl === 3 && c.level < L3_CITY) n.reason = `Needs a level-${L3_CITY} city (${c.name} is level ${c.level})`;
  else if (s.players[pid].stars < cost) n.reason = 'Not enough stars';
  const foe = unitAt(s, t.x, t.y);
  if (!n.reason && foe && foe.owner !== pid) n.reason = 'An enemy stands here';
  return n;
}

/** "a Foundry", "an Estate". */
export const aName = (name: string) => `${/^[AEIOU]/.test(name) ? 'an' : 'a'} ${name}`;

/** What reaching a level gives, in a few words. */
export function levelGain(kind: LevelKind, lvl: number): string {
  const d = LEVELS[kind];
  const bits: string[] = [];
  const st = d.stars[lvl - 1];
  if (st) bits.push(`+${st}★ a turn${kind === 'market' ? ' (on top of the market’s own)' : ''}`);
  if (d.pop[lvl - 1]) bits.push(`+${d.pop[lvl - 1]} population`);
  if (d.score[lvl - 1]) bits.push(`+${d.score[lvl - 1]} score`);
  if (lvl === 3) bits.push(d.extra);
  return bits.join(', ');
}

/** The level actions on tile `t`: Upgrade an improved tile, or plant a Pasture or Orchard on a herd or fruit. */
export function levelActions(s: GameState, pid: number, t: Tile): Action[] {
  const n = nextLevel(s, pid, t);
  if (!n) return [];
  const d = LEVELS[n.kind];
  const name = d.names[n.lvl - 1];
  const where = n.lvl === 3 ? ` Needs ${TECH_BY_ID[n.tech].name} and a level-${L3_CITY} city.` : cheapFor(s, pid, n.kind) ? ` ${SPECIALITY[s.players[pid].tribe].name}: a third off, no tech needed.` : ` Needs ${TECH_BY_ID[n.tech].name}.`;
  const fresh = n.kind === 'pasture' || n.kind === 'orchard' ? !t.improvement : false;
  const label = fresh ? (n.kind === 'pasture' ? 'Tame a Pasture' : 'Plant an Orchard') : `Upgrade to ${name}`;
  const desc = fresh
    ? `${n.kind === 'pasture' ? 'Tame the herd instead of hunting it' : 'Plant the trees instead of harvesting them'}: ${aName(name)} (level 2 of 3), ${levelGain(n.kind, 2)}. Level 3 (${d.names[2]}): ${levelGain(n.kind, 3)}.${where}`
    : `Level ${n.lvl} of 3: ${levelGain(n.kind, n.lvl)}.${where}`;
  return [{ id: fresh ? `level:${n.kind}` : 'level:up', label, desc, cost: n.cost, icon: fresh ? `level:${n.kind}` : 'level:up', enabled: !n.reason, reason: n.reason, needs: n.needs }];
}

/** Raise tile `t` to its next level (the cost is already paid). `skip`: a Master Builder used its city's tech skip. */
export function raiseTile(s: GameState, pid: number, t: Tile, skip = false): boolean {
  const n = nextLevel(s, pid, t, { skip });
  if (!n) return false;
  const c = cityById(s, t.owner)!;
  if (skip && !hasTech(s, pid, n.tech) && !(cheapFor(s, pid, n.kind) && n.lvl === 2)) c.data = { ...(c.data ?? {}), mbSkip: true };
  if (n.kind === 'pasture' || n.kind === 'orchard') { if (t.improvement) return false; t.improvement = n.kind; }
  setLevel(t, n.lvl);
  s.players[pid].raised = (s.players[pid].raised ?? 0) + 1;
  applyGains(s, pid, t, n.kind, n.lvl);
  const name = LEVELS[n.kind].names[n.lvl - 1];
  emit({ type: 'toast', player: pid, text: `${c.name} raises ${aName(name)}: ${levelGain(n.kind, n.lvl)}.` });
  s.log.push({ turn: s.turn, text: `${TRIBES[s.players[pid].tribe].people} ${c.name} raises ${aName(name)}.` });
  const dist = districtAt(s, t);
  if (dist && tileLevel(t) === 3 && dist.tiles.length === DISTRICT_MIN) {
    emit({ type: 'toast', player: pid, text: `A District is born: the ${dist.name}! +${DISTRICT_STARS}★ a turn and ${DISTRICTS[dist.kind].extra}.` });
    s.log.push({ turn: s.turn, text: `The ${TRIBES[s.players[pid].tribe].people}s found the ${dist.name}.` });
  }
  return true;
}

/** The one-off growth and score of reaching a level. */
function applyGains(s: GameState, pid: number, t: Tile, kind: LevelKind, lvl: number) {
  const c = cityById(s, t.owner)!;
  const d = LEVELS[kind];
  let pop = d.pop[lvl - 1];
  if (kind === 'farm' && lvl === 3) pop += Math.min(GRANARY_CAP, neighbors(s, t.x, t.y).filter((n) => n.improvement === 'farm').length); // Granary Fields
  if (d.score[lvl - 1]) s.players[pid].bonusScore += d.score[lvl - 1];
  emit({ type: 'harvest', player: pid, x: t.x, y: t.y, pop });
  if (pop) addPop(s, c, pop);
}

export function levelDoAction(s: GameState, pid: number, t: Tile, id: string): boolean {
  if (id !== 'level:up' && id !== 'level:pasture' && id !== 'level:orchard') return false;
  return raiseTile(s, pid, t);
}

/** An empire whose speciality is built straight at level 2: raise what was just built (called from rules.doAction). */
export function specialStart(s: GameState, pid: number, t: Tile) {
  const sp = SPECIALITY[s.players[pid].tribe];
  if (!sp?.start || t.improvement !== sp.kind || tileLevel(t) !== 1) return;
  setLevel(t, 2);
  s.players[pid].raised = (s.players[pid].raised ?? 0) + START_WEIGHT; // it counts toward the rising price, more than a bought level
  // it pays as a level 2 from the start, but the build's own growth stands in for the level's one-off growth
  if (LEVELS[sp.kind].score[1]) s.players[pid].bonusScore += LEVELS[sp.kind].score[1];
}
/** The build action's note for an empire whose speciality starts at level 2 ("built straight as an Estate"). */
export function specialNote(s: GameState, pid: number, acts: Action[]) {
  const sp = SPECIALITY[s.players[pid].tribe];
  if (!sp?.start) return;
  const ids = sp.kind === 'temple' ? ['temple', 'shrine'] : [sp.kind];
  for (const a of acts) if (ids.includes(a.id)) a.desc += ` ${sp.name}: built straight as ${aName(LEVELS[sp.kind].names[1])} (+${LEVELS[sp.kind].stars[1]}★ a turn).`;
}

/** The tile panel's words about a raised or raisable tile: its level, and what the next one gives, for what and when. */
export function levelDescribe(s: GameState, t: Tile, viewer: number): string | null {
  const l = tileLevel(t);
  if (!l) return null;
  const kind = t.improvement as LevelKind;
  const d = LEVELS[kind];
  const now = l >= 2 ? `Level ${l} of 3: ${levelGain(kind, l)}.` : 'Level 1 of 3.';
  const dist = districtAt(s, t);
  const dl = dist ? ` Part of the ${dist.name}: +${DISTRICT_STARS}★ a turn, ${DISTRICTS[kind].extra}.` : '';
  if (l >= 3 || tileOwnerPlayer(s, t) !== viewer) return `${now}${dl}`;
  const n = nextLevel(s, viewer, t);
  const cost = n ? `${n.cost}★` : `${LEVEL_COST[l + 1]}★`;
  const need = l + 1 === 3 ? `${TECH_BY_ID[d.tech[2]].name} and a level-${L3_CITY} city` : TECH_BY_ID[d.tech[1]].name;
  return `${now} Next: ${d.names[l]} (${levelGain(kind, l + 1)}) for ${cost}, needs ${need}.${dl}`;
}

/** The city panel's line: its raised tiles and Districts. */
export function levelCityLine(s: GameState, c: City): string | null {
  const tiles = s.tiles.filter((t) => t.owner === c.id && tileLevel(t) >= 2);
  const ds = districtsOf(s, c.owner).filter((d) => d.city === c.id);
  if (!tiles.length) return null;
  const l3 = tiles.filter((t) => tileLevel(t) === 3).length;
  const inc = levelCityIncome(s, c);
  return `${tiles.length} raised tile${tiles.length === 1 ? '' : 's'}${l3 ? ` (${l3} at level 3)` : ''}: +${inc}★ a turn${ds.length ? ` · ${ds.map((d) => `${d.name.replace(/ of .*$/, '')} (+${DISTRICT_STARS}★, ${DISTRICTS[d.kind].extra})`).join(' · ')}` : ''}`;
}

// ---------------------------------------------------------------- passive effects and the computer players

const homeHas = (s: GameState, u: Unit, kind: LevelKind) => u.homeCity !== null && cityById(s, u.homeCity)?.owner === u.owner && cityHas(s, u.homeCity, kind, 3);

function heal(s: GameState, u: Unit, n: number) {
  const before = u.hp;
  u.hp = Math.min(maxHp(u), u.hp + n);
  if (u.hp > before) emit({ type: 'heal', unitId: u.id, x: u.x, y: u.y, amount: u.hp - before });
}

export const LEVEL_MECH: Mechanic = {
  name: 'Tile levels',
  blurb: 'Raise improved tiles through three levels; touching level-3 tiles form Districts.',

  stat(s, owner, u, stat) {
    if (u.owner !== owner) return 0;
    if (stat === 'move' && UNITS[u.kind].naval && homeHas(s, u, 'port')) return 1; // Great Harbour
    if (stat === 'def') {
      let n = MOUNTED_KINDS.includes(u.kind) && homeHas(s, u, 'pasture') ? 1 : 0; // Stables
      const t = tileAt(s, u.x, u.y);
      if (t && t.improvement === 'lumber' && tileLevel(t) === 3 && districtAt(s, t)?.owner === owner) n += 1; // Timber Yards
      return n;
    }
    return 0;
  },

  turnStart(s, owner) {
    const ds = districtsOf(s, owner);
    const sanct = new Set(s.tiles.filter((t) => t.improvement === 'temple' && tileLevel(t) === 3 && tileOwnerPlayer(s, t) === owner).map((t) => t.owner!));
    const docks = new Set(ds.filter((d) => d.kind === 'port').map((d) => d.city));
    if (sanct.size || docks.size) {
      for (const u of s.units) {
        if (u.owner !== owner || u.hp >= maxHp(u) || outOfSupply(u)) continue;
        const t = tileAt(s, u.x, u.y)!;
        if (t.owner !== null && sanct.has(t.owner) && tileOwnerPlayer(s, t) === owner) heal(s, u, SANCTUARY_HEAL);
        if (UNITS[u.kind].naval && t.owner !== null && docks.has(t.owner) && tileOwnerPlayer(s, t) === owner) heal(s, u, 3);
      }
    }
    if (s.turn > 0 && s.turn % 3 === 0) {
      for (const d of ds) {
        if (d.kind !== 'farm' && d.kind !== 'orchard') continue;
        const c = cityById(s, d.city);
        if (!c) continue;
        emit({ type: 'harvest', player: owner, x: c.x, y: c.y, pop: 1 });
        emit({ type: 'toast', player: owner, text: `The ${d.name} grows ${c.name} +1.` });
        addPop(s, c, 1);
      }
    }
  },
};

/** Per-turn scratch memory, so the computer looks for an upgrade once a turn after it found none. */
const memo = { key: '', state: null as GameState | null };

/**
 * One upgrade for a computer player when it is rich: its speciality first, then a level 3 beside other level-3 tiles
 * of the kind (a District in the making), then the best Stars a turn for the price.
 */
export function levelAi(s: GameState, pid: number): boolean {
  const p = s.players[pid];
  if (p.human || p.neutral) return false;
  const key = `${s.turn}:${pid}`;
  if (memo.key === key && memo.state === s) return false;
  const cities = citiesOf(s, pid);
  const reserve = AI_RESERVE + cities.length * 2;
  if (p.stars < LEVEL_COST[2] + reserve - 4) { memo.key = key; memo.state = s; return false; }
  const sp = SPECIALITY[p.tribe];
  let best: { t: Tile; id: string; w: number; cost: number } | null = null;
  for (const t of s.tiles) {
    if (t.owner === null || tileOwnerPlayer(s, t) !== pid) continue;
    const [a] = levelActions(s, pid, t);
    if (!a?.enabled || p.stars < a.cost + reserve) continue;
    const n = nextLevel(s, pid, t)!;
    const d = LEVELS[n.kind];
    let w = (d.stars[n.lvl - 1] - d.stars[n.lvl - 2]) * 3 + d.pop[n.lvl - 1] * 2 + d.score[n.lvl - 1] / 100;
    if (n.lvl === 3) w += 1; // the level-3 extra
    if (sp.kind === n.kind) w += 3;
    if (n.lvl === 3) w += 2 * neighbors(s, t.x, t.y).filter((x) => x.improvement === n.kind && tileLevel(x) === 3 && tileOwnerPlayer(s, x) === pid).length;
    w /= a.cost;
    if (!best || w > best.w) best = { t, id: a.id, w, cost: a.cost };
  }
  if (best && doAction(s, pid, best.t, best.id)) return true;
  memo.key = key;
  memo.state = s;
  return false;
}
/** Stars a computer player keeps back before it upgrades (plus 2 a city). */
export const AI_RESERVE = 8;
