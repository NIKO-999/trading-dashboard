// Ottoman: Sublime Porte & Great Bombards, with the Devshirme Tribute economy.
//
// (A) Core.
//  - `cityCaptured` records `city.data.origin` (the TribeId of the city's first owner; kept through later captures) and
//    `city.data.conquered` (true while an Ottoman holds a city that was not originally Ottoman).
//  - In every conquered city the Ottoman may train the ELITE of the conquered people (`mech:train-elite` on the city tile):
//    that tribe's unique unit (`portraitKind`, so Polynesians give a warrior rather than a canoe), no tech needed, at the
//    unit's normal star cost, subject to the usual free-tile / unit-cap rules.
//  - Great Bombards: Ottoman catapults ignore the defender's fortification: the city-walls / garrison bonus of a city
//    (the walls x4 or x1.5) and the def bonus from a fort or wall tile improvement. Done in the `combat` hook.
// (B) Economy: Devshirme Tribute.
//  - each conquered city pays tribute every turn = ceil(level / 2)★ (max 4 per city), total capped at TRIBUTE_CAP per turn;
//  - the first time a city is captured it levies +1 Population on the nearest other Ottoman city (once per city, and at most
//    LEVY_CAP levies per empire, `player.mech.levies`).
//  Simplification: the elite's tech requirement is waived instead of copying the whole tech tree of the conquered.
import { TRIBES, portraitKind } from '../../data/tribes';
import { UNITS } from '../../data/units';
import { perkUnit } from '../perks';
import { emit } from '../events';
import { spawnUnit } from '../mapgen';
import { dist, tileAt } from '../grid';
import { addPop, cityById, def, defenseBonus, doAction, maxHp, seaBonus, tileActions, unitAt, unitCap, unitDef } from '../rules';
import type { Action } from '../rules';
import { hookStat } from './index';
import type { City, GameState, TribeId, UnitKind } from '../types';
import type { Mechanic } from './types';

export const TRIBUTE_CAP = 8;
export const PORTE_PER_CITY = 2; // the Porte's own revenue per city // stars per turn, whole empire
export const TRIBUTE_PER_CITY = 4;
export const LEVY_CAP = 6; // Population levies per empire

const isOttoman = (s: GameState, pid: number) => s.players[pid]?.tribe === 'ottoman';

/** The people a city was taken from (its first owner), or null for a city nobody has conquered. */
export const originOf = (c: City): TribeId | null => (typeof c.data?.origin === 'string' ? (c.data.origin as TribeId) : null);
export const isConquered = (c: City) => c.data?.conquered === true;
/** The elite this conquered city can train. */
export const eliteOf = (c: City): UnitKind | null => { const o = originOf(c); return o && o !== 'ottoman' ? portraitKind(o) : null; };
export const conqueredCities = (s: GameState, owner: number) => s.cities.filter((c) => c.owner === owner && isConquered(c));

export const tributeOf = (c: City) => Math.min(TRIBUTE_PER_CITY, Math.ceil(c.level / 2));
/** Stars per turn of tribute (after the cap). */
export const tributeTotal = (s: GameState, owner: number) => Math.min(TRIBUTE_CAP, conqueredCities(s, owner).reduce((n, c) => n + tributeOf(c), 0));
export const levies = (s: GameState, owner: number) => (s.players[owner].mech?.levies as number | undefined) ?? 0;
export const elitesTrained = (s: GameState, owner: number) => (s.players[owner].mech?.elites as number | undefined) ?? 0;
const bump = (s: GameState, owner: number, key: 'levies' | 'elites') => {
  const p = s.players[owner];
  p.mech = { ...(p.mech ?? {}), [key]: ((p.mech?.[key] as number | undefined) ?? 0) + 1 };
};

/** Great Bombard: an Ottoman catapult. */
export const isBombard = (s: GameState, u: { owner: number; kind: UnitKind }) => isOttoman(s, u.owner) && u.kind === 'catapult';

/** Why a city cannot train its elite now (null when it can). */
function eliteCheck(s: GameState, owner: number, c: City): string | null {
  if (!eliteOf(c)) return 'Not a conquered city';
  if (unitAt(s, c.x, c.y)) return 'City tile is occupied';
  if (c.units >= unitCap(c)) return `City supports ${unitCap(c)} units`;
  return null;
}

export const mech: Mechanic = {
  name: 'Sublime Porte & Great Bombards',
  blurb: 'Conquered cities train their old peoples’ elite and Great Bombards ignore walls; each conquest pays Devshirme stars (capped) and levies +1 population.',

  cityCaptured(s, owner, c, from) {
    c.data = { ...(c.data ?? {}) };
    if (!c.data.origin) c.data.origin = s.players[from].tribe;
    c.data.conquered = c.owner === owner && c.data.origin !== 'ottoman';
    if (!c.data.conquered || c.data.levied || levies(s, owner) >= LEVY_CAP) return;
    let near: City | null = null;
    for (const o of s.cities) if (o.owner === owner && o.id !== c.id && (!near || dist(o.x, o.y, c.x, c.y) < dist(near.x, near.y, c.x, c.y))) near = o;
    if (!near) return;
    c.data.levied = true; // once per city, so a city changing hands back and forth pays no second levy
    bump(s, owner, 'levies');
    emit({ type: 'harvest', player: owner, x: near.x, y: near.y, pop: 1 });
    addPop(s, near, 1);
  },

  income(s, owner) { return tributeTotal(s, owner) + PORTE_PER_CITY * s.cities.filter((c) => c.owner === owner).length; },

  combat(s, owner, a, d, ctx) {
    if (a.owner !== owner || !isBombard(s, a) || d.owner === owner) return;
    const t = tileAt(s, d.x, d.y);
    if (!t) return;
    const c = cityById(s, t.cityId);
    const cityBonus = c && c.owner === d.owner && def(d).skills.includes('fortify') ? (c.walls ? 4 : 1.5) : 1;
    const fort = t.improvement === 'fort' || t.improvement === 'wall';
    if (cityBonus === 1 && !fort) return;
    const atk = Math.max(0.5, def(a).atk + seaBonus(s, a) + perkUnit(s, a, 'atk') + hookStat(s, a, 'atk'));
    const dd = Math.max(0, unitDef(s, d) + perkUnit(s, d, 'def') + hookStat(s, d, 'def'));
    const dd0 = fort ? Math.max(0, dd - Math.max(0, hookStat(s, d, 'def'))) : dd;
    const b = defenseBonus(s, d), b0 = Math.max(0.5, b - (cityBonus - 1));
    const hp = d.hp / maxHp(d), aForce = atk * (a.hp / maxHp(a));
    const force = dd * hp * b, force0 = dd0 * hp * b0;
    const dmg = Math.round((aForce / (aForce + force || 1)) * atk * 4.5);
    const dmg0 = Math.round((aForce / (aForce + force0 || 1)) * atk * 4.5);
    ctx.dmg += dmg0 - dmg;
    if (dmg0 > dmg) ctx.tag = 'Bombard!';
    if (ctx.ret > 0) {
      const ret = Math.round((force / (aForce + force || 1)) * dd * 4.5);
      const ret0 = Math.round((force0 / (aForce + force0 || 1)) * dd0 * 4.5);
      ctx.ret = Math.max(0, ctx.ret + ret0 - ret);
    }
  },

  actions(s, owner, t): Action[] {
    const c = cityById(s, t.cityId);
    if (!c || c.owner !== owner || c.x !== t.x || c.y !== t.y) return [];
    const k = eliteOf(c);
    if (!k) return [];
    const d = UNITS[k];
    const why = eliteCheck(s, owner, c) ?? (s.players[owner].stars < d.cost ? 'Not enough stars' : null);
    return [{
      id: 'mech:train-elite', label: `Elite: ${d.name}`, cost: d.cost, icon: k, enabled: !why, reason: why ?? undefined,
      desc: `${TRIBES[originOf(c)!].people} elite of the conquered city, no tech needed. ${d.blurb} ⚔${d.atk} 🛡${d.def} ❤${d.hp} ➜${d.move}${d.range > 1 ? ` ◎${d.range}` : ''}`,
    }];
  },

  doAction(s, owner, t, id) {
    const c = cityById(s, t.cityId);
    if (id !== 'mech:train-elite' || !c || c.owner !== owner || eliteCheck(s, owner, c)) return false;
    spawnUnit(s, eliteOf(c)!, owner, c.x, c.y, c.id); // the star cost was already charged by the core
    bump(s, owner, 'elites');
    return true;
  },

  ai(s, owner) {
    const p = s.players[owner];
    for (const c of conqueredCities(s, owner)) {
      const k = eliteOf(c);
      if (!k || p.stars < UNITS[k].cost) continue; // keep a small reserve for the ordinary economy
      const t = tileAt(s, c.x, c.y)!;
      if (tileActions(s, owner, t).find((a) => a.id === 'mech:train-elite')?.enabled && doAction(s, owner, t, 'mech:train-elite')) return true;
    }
    return false;
  },
};
