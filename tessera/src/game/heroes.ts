// Heroes: every empire has one named champion. The hero joins when the capital (or, without one, the largest city)
// reaches HERO_JOIN_LEVEL, there is only ever one at a time, and a fallen hero returns to the capital HERO_RESPAWN turns
// later. Heroes gain XP by fighting (levels 1-5, each level +HP and +attack), steady the ranks of friendly units beside
// them (a small defence aura), and have one active ability tied to their empire, offered as the `hero:ability` action on
// the hero's tile with a cooldown.
//
// State: `player.hero` (HeroState: which unit is the hero, level, XP, cooldown, respawn turn; missing in older saves and
// created on first use), and on units `data.lvl` (the hero's level, so maxHp can read it) and the short-lived marks an
// ability leaves: `data.hb` (a buff on the caster's units), `data.hc` (a curse on an enemy) and `data.htrap` (a trapped
// enemy). Every mark is cleared at the start of the caster's next turn (a trap when the trapped empire's turn ends).
//
// The hooks run through the empire-mechanic framework (see mech/index): HERO_MECH is called for every living empire as a
// second mechanic, so each hook checks `owner`.
import { unitFor } from '../data/tribes';
import { emit } from './events';
import { area, dist, isLand, isWater, neighbors, tileAt } from './grid';
import { revealAround, spawnUnit } from './mapgen';
import { canFreeze } from './mech/inuit';
import type { Mechanic } from './mech/types';
import { MOUNTED_KINDS } from './perks';
import type { Action, MoveOption } from './rules';
import { addPop, citiesOf, def, doAction, hasTech, maxHp, removeUnit, tileActions, tileOwnerPlayer, unitAt } from './rules';
import type { GameState, HeroState, Tile, TribeId, Unit } from './types';

/** The capital level at which the hero joins. */
export const HERO_JOIN_LEVEL = 3;
/** Rounds a fallen hero is away before returning to the capital. */
export const HERO_RESPAWN = 4;
export const HERO_MAX_LEVEL = 5;
/** Total XP needed for each level (index = level). */
export const HERO_XP = [0, 0, 4, 10, 18, 28];
export const HERO_HP_PER_LEVEL = 3;
export const HERO_ATK_PER_LEVEL = 0.5;
/** Friendly units next to the hero stand steadier. */
export const HERO_AURA_DEF = 0.5;
/** XP for fighting (attacking or surviving an attack) and for a kill. */
export const XP_FIGHT = 1;
export const XP_KILL = 2;

/** One part of an ability. `r` is a radius around the hero, 'all' every unit of the empire, 'land' those in its borders. */
type Reach = number | 'all' | 'land';
type Effect =
  | { k: 'buff'; r: Reach; who?: 'mounted'; atk?: number; def?: number; move?: number; veil?: boolean; nc?: boolean }
  | { k: 'curse'; r: number; def: number }
  | { k: 'heal'; r: Reach; n: number }
  | { k: 'strike'; r: number; n: number }
  | { k: 'trap'; r: number }
  | { k: 'stars'; n: number }
  | { k: 'starsPer'; per: 'city' | 'sea'; n: number; min: number; max: number }
  | { k: 'pop'; n: number }
  | { k: 'refresh' }
  | { k: 'summon' }
  | { k: 'reveal'; r: number }
  | { k: 'freeze'; r: number }
  | { k: 'turtle'; turns: number; def: number }
  | { k: 'discount' };

export interface HeroDef {
  name: string;
  title: string;
  ability: string;
  desc: string; // what the ability does, for the menus
  cd: number; // turns between uses
  fx: Effect[];
  /** Walks the waves as if on land (Anne Bonny). */
  sea?: boolean;
}

// Real people are shown as the leaders history remembers; where a figure is legendary the title says so.
export const HEROES: Record<TribeId, HeroDef> = {
  egypt: { name: 'Ramesses II', title: 'Pharaoh of the Two Lands', ability: 'Charge at Kadesh', cd: 4,
    desc: 'Every mounted unit gets +1 attack and +1 move until your next turn.', fx: [{ k: 'buff', r: 'all', who: 'mounted', atk: 1, move: 1 }] },
  aztec: { name: 'Cuauhtémoc', title: 'The Descending Eagle', ability: 'Eagle’s Descent', cd: 4,
    desc: 'Swoop on the foe: every enemy next to the hero takes 4 damage.', fx: [{ k: 'strike', r: 1, n: 4 }] },
  polynesia: { name: 'Te Rauparaha', title: 'Chief of Ngāti Toa', ability: 'Ka Mate', cd: 4,
    desc: 'The haka: enemies within 2 lose 1 defence and your units within 2 gain +1 attack until your next turn.', fx: [{ k: 'curse', r: 2, def: 1 }, { k: 'buff', r: 2, atk: 1 }] },
  rome: { name: 'Julius Caesar', title: 'Dictator of Rome', ability: 'Veni, Vidi, Vici', cd: 4,
    desc: 'The hero may move and attack again this turn, with +1 attack.', fx: [{ k: 'refresh' }, { k: 'buff', r: 0, atk: 1 }] },
  pirates: { name: 'Anne Bonny', title: 'Terror of the Caribbean', ability: 'Broadside', cd: 4, sea: true,
    desc: 'Every enemy within 2 takes 3 damage. Anne walks the waves as if on land.', fx: [{ k: 'strike', r: 2, n: 3 }] },
  vikings: { name: 'Ragnar Lothbrok', title: 'Sea-King of the Sagas', ability: 'Berserkergang', cd: 4,
    desc: 'The hero and your units beside him get +1.5 attack until your next turn.', fx: [{ k: 'buff', r: 1, atk: 1.5 }] },
  japan: { name: 'Tomoe Gozen', title: 'Onna-musha of Kiso', ability: 'Iaijutsu', cd: 4,
    desc: 'A lightning draw: +1 attack, and the hero’s strikes take no counter-blow until your next turn.', fx: [{ k: 'buff', r: 0, atk: 1, nc: true }] },
  mongols: { name: 'Genghis Khan', title: 'Great Khan of the Steppe', ability: 'Ride of the Horde', cd: 3,
    desc: 'Every mounted unit and the Khan himself get +1 move until your next turn.', fx: [{ k: 'buff', r: 'all', who: 'mounted', move: 1 }, { k: 'buff', r: 0, move: 1 }] },
  greeks: { name: 'Leonidas', title: 'King of Sparta', ability: 'Hold the Pass', cd: 3,
    desc: 'The hero and your units beside him get +3 defence until your next turn.', fx: [{ k: 'buff', r: 1, def: 3 }] },
  zulu: { name: 'Shaka', title: 'Founder of the Zulu Kingdom', ability: 'Horns of the Buffalo', cd: 4,
    desc: 'Enemies next to Shaka are trapped: they cannot move on their next turn and cannot strike back at Zulu attacks. Shaka gets +1 attack.', fx: [{ k: 'trap', r: 1 }, { k: 'buff', r: 0, atk: 1 }] },
  persia: { name: 'Cyrus the Great', title: 'King of the Four Corners', ability: 'Satrap Tribute', cd: 5,
    desc: 'Every satrapy pays: +2★ for each of your cities (up to 16★).', fx: [{ k: 'starsPer', per: 'city', n: 2, min: 2, max: 16 }] },
  celts: { name: 'Boudica', title: 'Queen of the Iceni', ability: 'Rally the Tribes', cd: 4,
    desc: 'Your units within 2 heal 4 HP and get +1 attack until your next turn.', fx: [{ k: 'heal', r: 2, n: 4 }, { k: 'buff', r: 2, atk: 1 }] },
  inuit: { name: 'Kiviuq', title: 'The Eternal Wanderer (legend)', ability: 'Walk the Sea-Ice', cd: 3,
    desc: 'Open water next to the hero freezes into ice bridges, and the hero heals 4 HP.', fx: [{ k: 'freeze', r: 1 }, { k: 'heal', r: 0, n: 4 }] },
  inca: { name: 'Pachacuti', title: 'The Earth-Shaker', ability: 'Rope Bridges', cd: 4,
    desc: 'All your units get +1 move until your next turn.', fx: [{ k: 'buff', r: 'all', move: 1 }] },
  ethiopia: { name: 'Ezana', title: 'King of Aksum', ability: 'Stele Blaze', cd: 3,
    desc: 'Every enemy within 2 takes 2 damage.', fx: [{ k: 'strike', r: 2, n: 2 }] },
  aboriginal: { name: 'Pemulwuy', title: 'Bidjigal Resistance Leader', ability: 'Songline Run', cd: 3,
    desc: 'Your units within 2 heal 2 HP and get +1 move until your next turn.', fx: [{ k: 'heal', r: 2, n: 2 }, { k: 'buff', r: 2, move: 1 }] },
  china: { name: 'Qin Shi Huang', title: 'The First Emperor', ability: 'Terracotta Guard', cd: 6,
    desc: 'A free soldier joins the army beside the hero.', fx: [{ k: 'summon' }] },
  india: { name: 'Ashoka', title: 'The Dharma King', ability: 'Rock Edicts', cd: 5,
    desc: 'All your units heal 3 HP and the capital grows +1 population.', fx: [{ k: 'heal', r: 'all', n: 3 }, { k: 'pop', n: 1 }] },
  mali: { name: 'Mansa Musa', title: 'Lord of the Gold Road', ability: 'Gift of Gold', cd: 7,
    desc: 'A pilgrimage of gold: +15★ and +1 population in the capital.', fx: [{ k: 'stars', n: 15 }, { k: 'pop', n: 1 }] },
  lakota: { name: 'Sitting Bull', title: 'Leader of the Hunkpapa', ability: 'Stand Together', cd: 4,
    desc: 'Your units within 2 get +1 attack and +1 defence until your next turn.', fx: [{ k: 'buff', r: 2, atk: 1, def: 1 }] },
  ottoman: { name: 'Suleiman', title: 'the Magnificent', ability: 'Imperial Largesse', cd: 4,
    desc: 'The next thing you build or train costs half (rounded up).', fx: [{ k: 'discount' }] },
  maya: { name: 'Pakal', title: 'Lord of Palenque', ability: 'Reading the Stars', cd: 4,
    desc: 'Reveal the land within 5 tiles of the hero and gain 4★.', fx: [{ k: 'reveal', r: 5 }, { k: 'stars', n: 4 }] },
  korea: { name: 'Yi Sun-sin', title: 'Admiral of the Turtle Ships', ability: 'Turtle Ship', cd: 5,
    desc: 'For 3 turns the Admiral sails the water like land with +3 defence (the ship stays until he lands).', fx: [{ k: 'turtle', turns: 3, def: 3 }] },
  khmer: { name: 'Jayavarman VII', title: 'Builder King of Angkor', ability: 'Houses of Healing', cd: 4,
    desc: 'Every one of your units inside your borders heals 5 HP.', fx: [{ k: 'heal', r: 'land', n: 5 }] },
  swahili: { name: 'al-Hasan ibn Sulaiman', title: 'Sultan of Kilwa', ability: 'Monsoon Fortune', cd: 5,
    desc: 'Trade comes in on the wind: +2★ for each of your ports and ships (4★ to 14★).', fx: [{ k: 'starsPer', per: 'sea', n: 2, min: 4, max: 14 }] },
  tibet: { name: 'Songtsen Gampo', title: 'Emperor of the Plateau', ability: 'Mountain Mist', cd: 4,
    desc: 'Your units within 2 vanish into the mist (unseen by enemies) and get +1 defence until your next turn.', fx: [{ k: 'buff', r: 2, def: 1, veil: true }] },
};

// ---------------------------------------------------------------- state

const fresh = (): HeroState => ({ unit: null, lvl: 1, xp: 0, ready: 0, back: null, joined: false });
/** An empire's hero record (created on first use, so older saves work). */
export function heroState(s: GameState, pid: number): HeroState {
  const p = s.players[pid];
  return (p.hero ??= fresh());
}
export const heroDef = (s: GameState, pid: number): HeroDef => HEROES[s.players[pid].tribe];
/** Is this unit its empire's hero? (Checked by id, so a hero in a boat is still the hero.) */
export const isHero = (s: GameState, u: Unit) => !s.players[u.owner]?.neutral && s.players[u.owner]?.hero?.unit === u.id;
export const heroUnit = (s: GameState, pid: number): Unit | undefined => {
  const id = s.players[pid]?.hero?.unit;
  return id == null ? undefined : s.units.find((u) => u.id === id && u.owner === pid);
};
/** Extra health a hero has from its levels (maxHp reads the level from the unit, as it has no game state). */
export const heroHp = (u: Unit) => ((u.carrying ?? u.kind) === 'hero' ? HERO_HP_PER_LEVEL * ((Number(u.data?.lvl) || 1) - 1) : 0);
/** Turns until the ability is ready again (0 = ready). */
export const cooldownLeft = (s: GameState, pid: number) => Math.max(0, heroState(s, pid).ready - s.turn);
/** XP still needed for the next level, or null at the top level. */
export const xpToNext = (h: HeroState) => (h.lvl >= HERO_MAX_LEVEL ? null : HERO_XP[h.lvl + 1] - h.xp);

interface Buff { atk?: number; def?: number; move?: number; veil?: boolean; nc?: boolean }
const buffOf = (u: Unit) => u.data?.hb as Buff | undefined;
const curseOf = (u: Unit) => u.data?.hc as { by: number; def: number } | undefined;
/** Does a hero's mark rest on this unit right now? (The map draws them.) */
export const heroMarks = (u: Unit) => ({ buff: buffOf(u), curse: curseOf(u), trapped: typeof u.data?.htrap === 'number' });

/** The capital, or without one the largest city. */
function seat(s: GameState, pid: number) {
  const cs = citiesOf(s, pid);
  return cs.find((c) => c.capital) ?? cs.sort((a, b) => b.level - a.level || a.id - b.id)[0];
}

const log = (s: GameState, text: string) => s.log.push({ turn: s.turn, text });

// ---------------------------------------------------------------- joining, levels and falling

/** Puts the hero on the map at (or near) the seat. Returns the unit, or null when there is no room. */
function summonHero(s: GameState, pid: number): Unit | null {
  const c = seat(s, pid);
  if (!c) return null;
  const h = heroState(s, pid);
  const sea = !!heroDef(s, pid).sea;
  const ok = (t: Tile) => !unitAt(s, t.x, t.y) && t.terrain !== 'mountain' && (sea || isLand(t));
  let spot: Tile | undefined;
  for (let r = 0; r <= 2 && !spot; r++) spot = area(s, c.x, c.y, r).find(ok);
  let u: Unit;
  if (spot) {
    u = spawnUnit(s, 'hero', pid, spot.x, spot.y, null);
  } else { // a city afloat or ringed by water: the hero arrives in a boat
    const w = area(s, c.x, c.y, 1).find((t) => isWater(t) && !unitAt(s, t.x, t.y));
    if (!w) return null;
    u = spawnUnit(s, s.players[pid].tribe === 'polynesia' ? 'waka' : 'boat', pid, w.x, w.y, null);
    u.carrying = 'hero';
  }
  u.data = { lvl: h.lvl };
  u.hp = maxHp(u);
  u.moved = u.attacked = false; // ready to act on arrival
  h.unit = u.id;
  h.back = null;
  return u;
}

function arrive(s: GameState, pid: number, again: boolean) {
  const u = summonHero(s, pid);
  if (!u) return;
  const d = heroDef(s, pid);
  heroState(s, pid).joined = true;
  const text = again ? `${d.name} returns to lead your armies!` : `A hero joins you: ${d.name}, ${d.title}!`;
  emit({ type: 'toast', player: pid, text });
  emit({ type: 'heal', unitId: u.id, x: u.x, y: u.y, amount: u.hp });
  log(s, `${d.name} ${again ? 'returns to' : 'joins'} the ${s.players[pid].tribe} empire.`);
}

/** Adds XP to `pid`'s hero, levelling it up (each level: +HP, healed, and +attack). */
export function gainXp(s: GameState, pid: number, n: number) {
  const h = heroState(s, pid);
  if (h.lvl >= HERO_MAX_LEVEL) return;
  h.xp += n;
  const u = heroUnit(s, pid);
  while (h.lvl < HERO_MAX_LEVEL && h.xp >= HERO_XP[h.lvl + 1]) {
    h.lvl++;
    if (u) {
      u.data = { ...u.data, lvl: h.lvl };
      u.hp = Math.min(maxHp(u), u.hp + HERO_HP_PER_LEVEL);
      emit({ type: 'heal', unitId: u.id, x: u.x, y: u.y, amount: HERO_HP_PER_LEVEL });
    }
    emit({ type: 'toast', player: pid, text: `${heroDef(s, pid).name} reaches level ${h.lvl}!` });
    log(s, `${heroDef(s, pid).name} reaches level ${h.lvl}.`);
  }
}

/** The hero is gone (slain, captured...): it comes back to the seat after HERO_RESPAWN turns. */
function fall(s: GameState, pid: number, killer: number | null) {
  const h = heroState(s, pid);
  h.unit = null;
  h.back = s.turn + HERO_RESPAWN;
  const d = heroDef(s, pid);
  emit({ type: 'toast', player: pid, text: `${d.name} has fallen! The hero returns in ${HERO_RESPAWN} turns.` });
  if (killer !== null && killer !== pid) emit({ type: 'toast', player: killer, text: `You have struck down ${d.name}, ${d.title}!` });
  log(s, `${d.name} has fallen.`);
}

/** Heroes serve no other banner: a hero taken alive or aboard a captured ship slips away home. */
function audit(s: GameState) {
  for (const p of s.players) {
    if (p.hero?.unit == null || s.units.some((u) => u.id === p.hero!.unit && u.owner === p.id)) continue;
    if (p.alive) fall(s, p.id, null);
    else p.hero.unit = null; // the empire is gone, and its hero with it
  }
  const strays = s.units.filter((u) => (u.carrying ?? u.kind) === 'hero' && !isHero(s, u));
  for (const u of strays) s.units = s.units.filter((x) => x !== u);
}

// ---------------------------------------------------------------- the ability

/** Why the ability cannot be used now, or null. */
export function abilityBlock(s: GameState, pid: number): string | null {
  const u = heroUnit(s, pid);
  if (!u) return 'No hero on the field';
  const left = cooldownLeft(s, pid);
  if (left > 0) return `Ready in ${left} turn${left === 1 ? '' : 's'}`;
  if (u.carrying) return 'Not while at sea in a boat';
  return null;
}

/** Units reached by an effect. */
function reach(s: GameState, pid: number, hero: Unit, r: Reach): Unit[] {
  const mine = s.units.filter((u) => u.owner === pid);
  if (r === 'all') return mine;
  if (r === 'land') return mine.filter((u) => tileOwnerPlayer(s, tileAt(s, u.x, u.y)!) === pid);
  return mine.filter((u) => dist(u.x, u.y, hero.x, hero.y) <= r);
}
const enemiesNear = (s: GameState, pid: number, hero: Unit, r: number) =>
  s.units.filter((e) => e.owner !== pid && dist(e.x, e.y, hero.x, hero.y) <= r && !s.players[e.owner]?.neutral);

function heal(u: Unit, n: number) {
  const before = u.hp;
  u.hp = Math.min(maxHp(u), u.hp + n);
  if (u.hp > before) emit({ type: 'heal', unitId: u.id, x: u.x, y: u.y, amount: u.hp - before });
}
function pay(s: GameState, pid: number, n: number, at: Unit) {
  s.players[pid].stars += n;
  emit({ type: 'stars', player: pid, x: at.x, y: at.y, amount: n });
}

/** Uses `pid`'s hero ability. Returns false if it cannot be used. */
export function useAbility(s: GameState, pid: number): boolean {
  if (abilityBlock(s, pid)) return false;
  const hero = heroUnit(s, pid)!;
  const d = heroDef(s, pid);
  const h = heroState(s, pid);
  for (const f of d.fx) {
    switch (f.k) {
      case 'buff':
        for (const u of reach(s, pid, hero, f.r)) {
          if (f.who === 'mounted' && !MOUNTED_KINDS.includes(u.kind)) continue;
          const b = { ...(buffOf(u) ?? {}) };
          if (f.atk) b.atk = (b.atk ?? 0) + f.atk;
          if (f.def) b.def = (b.def ?? 0) + f.def;
          if (f.move) b.move = (b.move ?? 0) + f.move;
          if (f.veil) b.veil = true;
          if (f.nc) b.nc = true;
          u.data = { ...u.data, hb: b };
        }
        break;
      case 'curse':
        for (const e of enemiesNear(s, pid, hero, f.r)) e.data = { ...e.data, hc: { by: pid, def: f.def } };
        break;
      case 'heal':
        for (const u of reach(s, pid, hero, f.r)) heal(u, f.n);
        break;
      case 'strike':
        for (const e of enemiesNear(s, pid, hero, f.r)) {
          emit({ type: 'attack', unitId: hero.id, kind: hero.kind, player: pid, from: { x: hero.x, y: hero.y }, to: { x: e.x, y: e.y }, ranged: dist(e.x, e.y, hero.x, hero.y) > 1 });
          e.hp -= f.n;
          emit({ type: 'damage', unitId: e.id, x: e.x, y: e.y, amount: f.n });
          if (e.hp <= 0) {
            removeUnit(s, e, hero); // the kill pays its XP through unitDied
            emit({ type: 'death', unitId: e.id, x: e.x, y: e.y, owner: e.owner, kind: e.kind });
            s.players[pid].kills++;
          }
        }
        break;
      case 'trap':
        for (const e of enemiesNear(s, pid, hero, f.r)) e.data = { ...e.data, htrap: pid };
        break;
      case 'stars': pay(s, pid, f.n, hero); break;
      case 'starsPer': {
        const n = f.per === 'city' ? citiesOf(s, pid).length
          : s.units.filter((u) => u.owner === pid && def(u).naval).length + s.tiles.filter((t) => t.improvement === 'port' && tileOwnerPlayer(s, t) === pid).length;
        pay(s, pid, Math.max(f.min, Math.min(f.max, n * f.n)), hero);
        break;
      }
      case 'pop': {
        const c = seat(s, pid);
        if (c) { addPop(s, c, f.n); emit({ type: 'harvest', player: pid, x: c.x, y: c.y, pop: f.n }); }
        break;
      }
      case 'refresh': hero.moved = hero.attacked = false; break;
      case 'summon': {
        const spot = neighbors(s, hero.x, hero.y).find((t) => isLand(t) && t.terrain !== 'mountain' && !unitAt(s, t.x, t.y));
        if (spot) spawnUnit(s, unitFor(s.players[pid].tribe, 'warrior'), pid, spot.x, spot.y, null);
        else pay(s, pid, 3, hero); // no room: the workshop pays out instead
        break;
      }
      case 'reveal': {
        const p = s.players[pid];
        for (const t of area(s, hero.x, hero.y, f.r)) p.explored[t.y * s.size + t.x] = true;
        revealAround(s, pid);
        break;
      }
      case 'freeze':
        for (const t of neighbors(s, hero.x, hero.y, f.r)) {
          if (!canFreeze(s, t) || unitAt(s, t.x, t.y)) continue;
          t.terrain = 'ice';
          t.data = { ...t.data, ice: pid };
        }
        break;
      case 'turtle': hero.data = { ...hero.data, turtle: s.turn + f.turns, turtleDef: f.def }; break;
      case 'discount': h.discount = true; break;
    }
  }
  h.ready = s.turn + d.cd;
  h.uses = (h.uses ?? 0) + 1;
  emit({ type: 'toast', player: pid, text: `${d.name}: ${d.ability}!` });
  log(s, `${d.name} uses ${d.ability}.`);
  return true;
}

// ---------------------------------------------------------------- Suleiman's discount (called from rules)

/** Halves the cost of the build and train actions in a tile menu while Imperial Largesse is waiting to be spent. */
export function heroDiscount(s: GameState, pid: number, acts: Action[]) {
  if (!s.players[pid].hero?.discount) return;
  const stars = s.players[pid].stars;
  for (const a of acts) {
    if (a.cost <= 0) continue;
    a.cost = Math.ceil(a.cost / 2);
    a.desc = `${a.desc} (Imperial Largesse: half price)`;
    if (!a.enabled && a.reason === 'Not enough stars' && stars >= a.cost) { a.enabled = true; a.reason = undefined; }
  }
}
/** A discounted action was paid for: the largesse is spent. */
export function heroSpent(s: GameState, pid: number) {
  const h = s.players[pid].hero;
  if (h?.discount) h.discount = false;
}

// ---------------------------------------------------------------- sailing heroes

/** Does this hero walk the water right now (Anne Bonny, or the Admiral's turtle ship, which lasts until he lands)? */
export const heroSails = (s: GameState, u: Unit) => isHero(s, u) && !u.carrying && (!!heroDef(s, u.owner).sea || typeof u.data?.turtle === 'number');

/** Water tiles a sailing hero can reach: a walk over the waves, landing ends the move. */
function seaMoves(s: GameState, u: Unit): MoveOption[] {
  const range = Math.max(1, def(u).move + (buffOf(u)?.move ?? 0));
  const out: MoveOption[] = [];
  const seen = new Map<number, number>([[u.y * s.size + u.x, 0]]);
  const queue: { t: Tile; n: number; path: { x: number; y: number }[] }[] = [{ t: tileAt(s, u.x, u.y)!, n: 0, path: [] }];
  while (queue.length) {
    const { t, n, path } = queue.shift()!;
    for (const to of neighbors(s, t.x, t.y)) {
      const i = to.y * s.size + to.x;
      if (seen.has(i) || n + 1 > range || unitAt(s, to.x, to.y) || !s.players[u.owner].explored[i]) continue;
      if (to.terrain === 'mountain' && !hasTech(s, u.owner, 'climbing')) continue;
      if (isLand(to) && isLand(t)) continue; // walking on land is the ordinary move
      seen.set(i, n + 1);
      const p = [...path, { x: to.x, y: to.y }];
      out.push({ x: to.x, y: to.y, path: p });
      const enemyNear = s.units.some((e) => e.owner !== u.owner && dist(e.x, e.y, to.x, to.y) === 1);
      if (isWater(to) && !enemyNear) queue.push({ t: to, n: n + 1, path: p });
    }
  }
  return out;
}

// ---------------------------------------------------------------- the mechanic

export const HERO_MECH: Mechanic = {
  name: 'Heroes',
  blurb: 'A named champion joins when the capital reaches level 3.',

  turnStart(s, owner) {
    audit(s);
    for (const u of s.units) { // the marks this empire's hero left last turn fade
      if (!u.data) continue;
      if (u.owner === owner && u.data.hb) { const { hb: _b, ...rest } = u.data; u.data = rest; }
      if (curseOf(u)?.by === owner) { const { hc: _c, ...rest } = u.data; u.data = rest; }
    }
    const h = heroState(s, owner);
    const hero = heroUnit(s, owner);
    if (hero && typeof hero.data?.turtle === 'number' && (hero.data.turtle as number) < s.turn && isLand(tileAt(s, hero.x, hero.y)!)) {
      const { turtle: _t, turtleDef: _d, ...rest } = hero.data;
      hero.data = rest;
    }
    if (!hero && h.back !== null && s.turn >= h.back) arrive(s, owner, true);
    else if (!hero && !h.joined && (seat(s, owner)?.level ?? 0) >= HERO_JOIN_LEVEL) arrive(s, owner, false);
  },
  turnEnd(s, owner) {
    for (const u of s.units) if (u.owner === owner && u.data && 'htrap' in u.data) { const { htrap: _t, ...rest } = u.data; u.data = rest; }
  },

  stat(s, owner, u, stat) {
    let n = 0;
    if (stat === 'def' && curseOf(u)?.by === owner) n -= curseOf(u)!.def; // a curse is counted once, by its caster
    if (u.owner !== owner) return n;
    const b = buffOf(u);
    if (b && stat !== 'range') n += b[stat] ?? 0;
    if (isHero(s, u)) {
      if (stat === 'atk') n += HERO_ATK_PER_LEVEL * (heroState(s, owner).lvl - 1);
      if (stat === 'def' && typeof u.data?.turtle === 'number' && isWater(tileAt(s, u.x, u.y)!)) n += Number(u.data.turtleDef ?? 0);
    } else if (stat === 'def') {
      const hero = heroUnit(s, owner);
      if (hero && dist(hero.x, hero.y, u.x, u.y) === 1) n += HERO_AURA_DEF;
    }
    return n;
  },

  combat(s, owner, a, d, ctx) {
    if (a.owner !== owner) return;
    if (buffOf(a)?.nc || d.data?.htrap === owner) ctx.ret = 0; // Iaijutsu; the Horns hold a trapped foe
  },
  moveStep(s, owner, u, _from, _to, ctx) {
    if (u.data?.htrap === owner && u.owner !== owner) ctx.forbid = true;
  },
  extraMoves(s, owner, u) {
    return u.owner === owner && heroSails(s, u) && !u.moved ? seaMoves(s, u) : [];
  },
  unitVisible(s, owner, viewer, u) {
    return u.owner === owner && viewer !== owner && buffOf(u)?.veil ? false : undefined;
  },

  afterAttack(s, owner, a, d, info) {
    if (a.owner === owner && isHero(s, a)) gainXp(s, owner, XP_FIGHT);
    if (d.owner === owner && isHero(s, d) && !info.killed && s.units.includes(d)) gainXp(s, owner, XP_FIGHT);
  },
  unitDied(s, owner, u, killer) {
    if (killer && killer.owner === owner && isHero(s, killer) && u.owner !== owner) gainXp(s, owner, XP_KILL);
    if (u.owner === owner && heroState(s, owner).unit === u.id) fall(s, owner, killer?.owner ?? null);
  },
  block(s, owner, pid, id, t) {
    if (pid === owner || id !== 'mech:board') return undefined;
    const u = unitAt(s, t.x, t.y);
    return u && u.owner === owner && isHero(s, u) ? 'A hero cannot be taken' : undefined;
  },

  actions(s, owner, t): Action[] {
    const u = unitAt(s, t.x, t.y);
    if (!u || u.owner !== owner || !isHero(s, u)) return [];
    const d = heroDef(s, owner);
    const why = abilityBlock(s, owner);
    return [{ id: 'hero:ability', label: d.ability, desc: `${d.desc} (Cooldown ${d.cd} turns.)`, cost: 0, enabled: !why, reason: why ?? undefined, icon: 'hero' }];
  },
  doAction(s, owner, _t, id) {
    return id === 'hero:ability' && useAbility(s, owner);
  },

  ai(s, owner) {
    if (s.players[owner].human) return false;
    const hero = heroUnit(s, owner);
    if (!hero) return false;
    if (!abilityBlock(s, owner) && aiWants(s, owner)) return useAbility(s, owner);
    // a badly hurt hero catches its breath before it goes back in, rather than throwing its life away
    if (!hero.moved && !hero.attacked && hero.hp < maxHp(hero) * 0.5) {
      const t = tileAt(s, hero.x, hero.y)!;
      if (tileActions(s, owner, t).some((a) => a.id === 'recover' && a.enabled)) return doAction(s, owner, t, 'recover');
    }
    return false;
  },
};

/** Is now a good moment for the computer to use its hero's ability? When any part of it would do some good. */
function aiWants(s: GameState, pid: number): boolean {
  const hero = heroUnit(s, pid)!;
  const d = heroDef(s, pid);
  const foes = (r: number) => enemiesNear(s, pid, hero, r).length;
  const hurt = (r: Reach) => reach(s, pid, hero, r).reduce((n, u) => n + maxHp(u) - u.hp, 0);
  // a second wind is only worth it after the hero has struck and can strike again
  if (d.fx.some((f) => f.k === 'refresh')) return hero.attacked && hero.hp > maxHp(hero) / 2 && foes(3) > 0;
  return d.fx.some((f) => {
    switch (f.k) {
      case 'strike': case 'trap': case 'curse': return foes(f.r) > 0;
      case 'heal': return f.r === 0 ? hero.hp <= maxHp(hero) - 4 : hurt(f.r) >= 6;
      case 'buff':
        if (f.move && !f.atk && !f.def) return s.units.some((u) => u.owner === pid && !u.moved && foesOf(s, pid, u, 4));
        return foes(f.r === 0 ? 2 : typeof f.r === 'number' ? f.r + 2 : 4) > 0;
      case 'summon': return neighbors(s, hero.x, hero.y).some((t) => isLand(t) && t.terrain !== 'mountain' && !unitAt(s, t.x, t.y));
      case 'freeze': return neighbors(s, hero.x, hero.y, f.r).some((t) => canFreeze(s, t) && !unitAt(s, t.x, t.y));
      case 'turtle': return neighbors(s, hero.x, hero.y).some(isWater) && foes(6) > 0;
      case 'reveal': return s.players[pid].explored.some((e) => !e);
      default: return true; // stars, population and the discount are always welcome
    }
  });
}
const foesOf = (s: GameState, pid: number, u: Unit, r: number) => s.units.some((e) => e.owner !== pid && !s.players[e.owner]?.neutral && dist(e.x, e.y, u.x, u.y) <= r);
