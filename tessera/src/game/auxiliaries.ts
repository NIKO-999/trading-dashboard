// Auxiliaries: three units every empire can train, named and drawn in each empire's own style (see render/auxiliaries).
//
//  - Spearman (Hunting). Cheap anti-cavalry foot. It defends at double strength (×SPEAR_BRACE) against a mounted
//    attacker and strikes mounted units for +50% (×SPEAR_CHARGE). Mounted means the MOUNTED list of game/perks (Riders,
//    Knights, Chariots, Horse Archers, War Elephants and the other mounted uniques) plus the heroes who ride
//    (HORSE_HEROES), and never a unit in a boat.
//  - Scout (no tech). A fast explorer the player steers: no attack, moves 3, sees 3, walks through forest (forestwalk)
//    and cannot capture. Opening a ruin pays it SCOUT_RUIN★ on top of the ruin's own find.
//  - Healer (Meditation). No attack, cannot capture. At the start of your turn every unit of yours next to it heals
//    HEAL_HP. Its action "Convert" (ids `aux:convert:<healer id>:<target tile>`, in the healer's own menu and in the
//    target's) wins over a wounded enemy unit next to it at ≤ half health: the unit changes owner (it arrives spent and
//    unsupported, like the garrison of a captured city). Uses the healer's turn, then CONVERT_COOLDOWN turns of rest.
//    Heroes, Great Beasts, Rogue State units and siege engines cannot be converted, nor (with Diplomacy on) the units
//    of an empire you hold a treaty with.
//
// State (JSON-safe; older saves simply have none): `unit.data.conv` on a healer, the turn Convert is ready again.
//
// The hooks run through the empire-mechanic framework (see mech/index): AUX_MECH is called for every living empire, so
// each hook checks `owner`. The computer players use the units through `auxAi` (called from game/ai): a scout early on,
// spearmen when cavalry threatens, healers beside a large army, and Convert whenever it can.
import { TRIBES } from '../data/tribes';
import { UNITS } from '../data/units';
import { diploFought, hostile } from './diplomacy';
import { emit } from './events';
import { dist, isLand, neighbors, tileAt } from './grid';
import { meet, revealAround } from './mapgen';
import type { Mechanic } from './mech/types';
import { unitMatches } from './perks';
import { isRogueUnit } from './rebels';
import {
  cityById, citiesOf, doAction, hasTech, isExplored, maxHp, moveOptions, moveUnit, tileActions, unitAt, type Action,
} from './rules';
import { isHero } from './heroes';
import { roleSweep } from './roles';
import { naturalGoals } from './naturals';
import type { GameState, Tile, TribeId, Unit, UnitKind } from './types';
import { isNeutral, nearBeast } from './wild';

// ---------------------------------------------------------------- tuning

/** A Spearman's defence against a mounted attacker is multiplied by this. */
export const SPEAR_BRACE = 2;
/** A Spearman's blow against a mounted unit is multiplied by this. */
export const SPEAR_CHARGE = 1.5;
/** Extra Stars a Scout finds in a ruin. */
export const SCOUT_RUIN = 3;
/** Health a Healer gives each unit of its empire beside it, at the start of the turn. */
export const HEAL_HP = 2;
/** Turns between two Converts of one healer. */
export const CONVERT_COOLDOWN = 5;
/** A unit can be converted at this share of its full health or less. */
export const CONVERT_HP = 0.5;

export const AUX_KINDS: UnitKind[] = ['spearman', 'scout', 'healer'];
export const isAuxKind = (k: UnitKind | null | undefined) => !!k && AUX_KINDS.includes(k);
/** The auxiliaries that never fight and never capture: the Scout and the Healer (also one carried in a boat). */
export const isSupport = (u: Unit) => { const k = u.carrying ?? u.kind; return k === 'scout' || k === 'healer'; };

/** Heroes who ride to war: they count as mounted against a Spearman (the rest fight on foot). */
export const HORSE_HEROES: TribeId[] = ['mongols', 'egypt', 'lakota', 'tibet'];
/** Is this unit mounted, as far as a Spearman is concerned? (A unit in a boat is not.) */
export function isMounted(s: GameState, u: Unit): boolean {
  if (u.carrying) return false;
  const tribe = s.players[u.owner]?.tribe;
  if (!tribe) return false;
  return unitMatches(tribe, u.kind, 'mounted') || (u.kind === 'hero' && HORSE_HEROES.includes(tribe));
}
/** The Spearman's brace: its defence multiplier when `a` attacks `d` (1 when it doesn't apply; called from rules.previewCombat). */
export const braceOf = (s: GameState, a: Unit, d: Unit) => (d.kind === 'spearman' && isMounted(s, a) ? SPEAR_BRACE : 1);

// ---------------------------------------------------------------- each empire's auxiliaries

/** What each empire calls its three auxiliaries (the look comes from the empire too; see render/auxiliaries). */
export const AUX_NAMES: Record<TribeId, Record<'spearman' | 'scout' | 'healer', string>> = {
  egypt: { spearman: 'Menfat Spearman', scout: 'Medjay Scout', healer: 'Priest of Sekhmet' },
  aztec: { spearman: 'Tepoztopilli Spearman', scout: 'Quimichin Spy', healer: 'Ticitl Healer' },
  polynesia: { spearman: 'Tao Spearman', scout: 'Tūtei Scout', healer: 'Tohunga Healer' },
  rome: { spearman: 'Triarius', scout: 'Explorator', healer: 'Medicus' },
  pirates: { spearman: 'Boarding Pikeman', scout: 'Lookout', healer: 'Ship’s Surgeon' },
  vikings: { spearman: 'Spjót Spearman', scout: 'Njósnari Scout', healer: 'Læknir Healer' },
  japan: { spearman: 'Yari Ashigaru', scout: 'Shinobi Scout', healer: 'Yamabushi Monk' },
  mongols: { spearman: 'Jida Spearman', scout: 'Steppe Tracker', healer: 'Böö Shaman' },
  greeks: { spearman: 'Phalangite', scout: 'Hemerodromos', healer: 'Asklepian Healer' },
  zulu: { spearman: 'Umkhonto Spearman', scout: 'Izinhloli Scout', healer: 'Inyanga Healer' },
  persia: { spearman: 'Sparabara', scout: 'Royal Courier', healer: 'Magus Healer' },
  celts: { spearman: 'Gaesatae Spearman', scout: 'Fian Scout', healer: 'Druid Healer' },
  inuit: { spearman: 'Unaaq Spearman', scout: 'Ice Tracker', healer: 'Angakkuq' },
  inca: { spearman: 'Chuki Spearman', scout: 'Chaski Scout', healer: 'Hampikamayuq' },
  ethiopia: { spearman: 'Tor Spearman', scout: 'Highland Scout', healer: 'Debtera Healer' },
  aboriginal: { spearman: 'Gidgee Spearman', scout: 'Songline Tracker', healer: 'Ngangkari Healer' },
  china: { spearman: 'Qiang Spearman', scout: 'Chihou Scout', healer: 'Daoist Physician' },
  india: { spearman: 'Bhala Spearman', scout: 'Chara Scout', healer: 'Vaidya Healer' },
  mali: { spearman: 'Sahel Spearman', scout: 'Desert Runner', healer: 'Marabout Healer' },
  lakota: { spearman: 'Wahukeza Spearman', scout: 'Wolf Scout', healer: 'Pejuta Healer' },
  ottoman: { spearman: 'Azap Pikeman', scout: 'Çarhacı Scout', healer: 'Cerrah Surgeon' },
  maya: { spearman: 'Obsidian Spearman', scout: 'Jungle Runner', healer: 'Ah Men Healer' },
  korea: { spearman: 'Changsu Spearman', scout: 'Cheokhu Scout', healer: 'Uinyeo Healer' },
  khmer: { spearman: 'Lompeng Spearman', scout: 'Forest Tracker', healer: 'Kru Khmer Healer' },
  swahili: { spearman: 'Mkuki Spearman', scout: 'Mpelelezi Scout', healer: 'Mganga Healer' },
  tibet: { spearman: 'Dung Spearman', scout: 'Lung-gom-pa Runner', healer: 'Amchi Healer' },
};
/** The name an empire gives its auxiliary of this kind. */
export const auxName = (tribe: TribeId, kind: UnitKind) => AUX_NAMES[tribe]?.[kind as 'spearman'] ?? UNITS[kind].name;

const people = (s: GameState, pid: number) => TRIBES[s.players[pid].tribe].people;
const cap = (t: string) => t[0].toUpperCase() + t.slice(1);
/** "a Roman", "an Egyptian". */
const an = (word: string) => `${/^[AEIOUÆ]/i.test(word) ? 'an' : 'a'} ${word}`;
const log = (s: GameState, text: string) => s.log.push({ turn: s.turn, text });
const idx = (s: GameState, t: { x: number; y: number }) => t.y * s.size + t.x;

// ---------------------------------------------------------------- the healer

/** Turns until this healer may Convert again (0 = ready). */
export const convertLeft = (s: GameState, u: Unit) => Math.max(0, Number(u.data?.conv ?? 0) - s.turn);

/** Why the healer's empire `pid` can't convert `e` (null when it can), leaving the cooldown and health aside. */
export function convertBar(s: GameState, pid: number, e: Unit): string | null {
  if (e.owner === pid) return 'One of your own';
  if (isHero(s, e)) return 'A hero cannot be converted';
  if (isRogueUnit(s, e)) return 'Rebels of a Rogue State will not listen';
  if (isNeutral(s, e.owner)) return 'A Great Beast cannot be converted';
  if (unitMatches(s.players[e.owner].tribe, e.carrying ?? e.kind, 'siege')) return 'A siege engine cannot be converted';
  if (!hostile(s, pid, e.owner)) return 'You hold a treaty with its empire';
  return null;
}
/** Is `e` hurt enough to be converted? */
export const convertible = (e: Unit) => e.hp <= maxHp(e) * CONVERT_HP;

/** Heals every unit of `pid` next to one of its healers (called at the start of its turn). */
export function healerTurn(s: GameState, pid: number) {
  for (const h of s.units) {
    if (h.owner !== pid || h.kind !== 'healer') continue;
    for (const u of s.units) {
      if (u === h || u.owner !== pid || dist(u.x, u.y, h.x, h.y) !== 1 || u.hp >= maxHp(u)) continue;
      const before = u.hp;
      u.hp = Math.min(maxHp(u), u.hp + HEAL_HP);
      emit({ type: 'heal', unitId: u.id, x: u.x, y: u.y, amount: u.hp - before });
    }
  }
}

// ---------------------------------------------------------------- actions

interface AuxAct extends Action { unit: number; target: number }
/** The healer and target tile an action id names (a healer's panel lists its own, a unit's those aimed at it). */
export function auxParts(id: string): { verb: string; unit: number; target: number } | null {
  const m = /^aux:(\w+):(\d+):(\d+)$/.exec(id);
  return m ? { verb: m[1], unit: Number(m[2]), target: Number(m[3]) } : null;
}
/** Which way a neighbouring tile lies on the isometric screen. */
const arrow = (dx: number, dy: number) => ({ '1,0': '↘', '0,1': '↙', '1,1': '↓', '-1,-1': '↑', '1,-1': '→', '-1,1': '←', '-1,0': '↖', '0,-1': '↗' } as Record<string, string>)[`${dx},${dy}`] ?? '';

/** The Convert actions of healer `h` (of `pid`): one per enemy unit beside it, or a single disabled one saying why not. */
function healerActs(s: GameState, pid: number, h: Unit): AuxAct[] {
  if (h.owner !== pid || h.kind !== 'healer' || h.carrying) return [];
  const name = auxName(s.players[pid].tribe, 'healer');
  const left = convertLeft(s, h);
  const busy = h.attacked ? 'Unit has already acted' : left > 0 ? `Ready in ${left} turn${left === 1 ? '' : 's'}` : null;
  const out: AuxAct[] = [];
  for (const n of neighbors(s, h.x, h.y)) {
    const e = unitAt(s, n.x, n.y);
    if (!e || e.owner === pid || !isExplored(s, pid, n.x, n.y)) continue;
    const bar = convertBar(s, pid, e);
    if (bar === 'One of your own') continue;
    const reason = busy ?? bar ?? (!convertible(e) ? `Only a unit at half health or less (${Math.ceil(e.hp)}/${maxHp(e)})` : undefined);
    const who = TRIBES[s.players[e.owner].tribe]?.people ?? 'enemy';
    out.push({
      id: `aux:convert:${h.id}:${idx(s, n)}`, unit: h.id, target: idx(s, n),
      label: `Convert ${arrow(n.x - h.x, n.y - h.y)}`,
      desc: `${name}: win this wounded ${who} ${UNITS[e.carrying ?? e.kind].name} over to your side. Uses its turn; then ${CONVERT_COOLDOWN} turns before it can convert again.`,
      cost: 0, icon: 'aux:convert', enabled: !reason, reason: reason ?? undefined,
    });
  }
  if (!out.length) { // nothing beside it: the button still shows the cooldown
    out.push({
      id: `aux:convert:${h.id}:${idx(s, h)}`, unit: h.id, target: idx(s, h), label: 'Convert',
      desc: `${name}: win a wounded enemy unit beside it (at half health or less) over to your side. Every ${CONVERT_COOLDOWN} turns.`,
      cost: 0, icon: 'aux:convert', enabled: false, reason: busy ?? 'No enemy unit beside it',
    });
  }
  return out;
}

/** The tile menu: a healer's Convert on its own tile, and those of healers beside `t` aimed at the unit on it. */
export function auxActions(s: GameState, pid: number, t: Tile): Action[] {
  const i = idx(s, t);
  const here = unitAt(s, t.x, t.y);
  const out: AuxAct[] = here && here.owner === pid ? healerActs(s, pid, here) : [];
  if (here && here.owner !== pid) {
    for (const n of neighbors(s, t.x, t.y)) {
      const h = unitAt(s, n.x, n.y);
      if (h && h.owner === pid && h.kind === 'healer') out.push(...healerActs(s, pid, h).filter((a) => a.target === i));
    }
  }
  return out.map(({ unit: _u, target: _t, ...a }) => a as Action);
}

export function auxDoAction(s: GameState, pid: number, _t: Tile, id: string): boolean {
  const parts = auxParts(id);
  if (!parts || parts.verb !== 'convert') return false;
  const h = s.units.find((x) => x.id === parts.unit && x.owner === pid);
  const tg = s.tiles[parts.target];
  const e = tg && unitAt(s, tg.x, tg.y);
  if (!h || !e || e.owner === pid) return false;
  const from = e.owner;
  meet(s, pid, from);
  diploFought(s, pid, from); // an act of war, remembered like an attack (see game/diplomacy)
  (s.players[pid].skill ??= {}).war = s.turn;
  (s.players[from].skill ??= {}).war = s.turn;
  // the unit leaves its old city's support and arrives spent; only a boat's leave to cross the ocean stays with it
  const home = cityById(s, e.homeCity);
  if (home) home.units = Math.max(0, home.units - 1);
  e.owner = pid;
  e.homeCity = null;
  e.moved = e.attacked = true;
  e.fortified = false;
  e.data = e.data?.voyager ? { voyager: true } : undefined;
  h.moved = h.attacked = true;
  h.data = { ...(h.data ?? {}), conv: s.turn + CONVERT_COOLDOWN };
  roleSweep(s); // a stationed unit's post is dropped (see game/roles)
  const name = auxName(s.players[pid].tribe, 'healer');
  const what = UNITS[e.carrying ?? e.kind].name;
  emit({ type: 'harvest', player: pid, x: e.x, y: e.y, pop: 0 });
  emit({ type: 'toast', player: pid, text: `${name} converts ${an(people(s, from))} ${what}: it fights for you now.` });
  emit({ type: 'toast', player: from, text: `${cap(an(people(s, pid)))} ${name} has turned one of your ${what}s against you!` });
  log(s, `${cap(an(people(s, pid)))} ${name} converts ${an(people(s, from))} ${what}.`);
  revealAround(s, pid);
  return true;
}

/** A few words for an auxiliary's panel: what it does, and the healer's Convert cooldown. */
export function auxPreview(s: GameState, u: Unit): string {
  switch (u.kind) {
    case 'spearman': return `Braced spears: defends ×${SPEAR_BRACE} against mounted units and strikes them for +${Math.round((SPEAR_CHARGE - 1) * 100)}%.`;
    case 'scout': return `Moves ${UNITS.scout.move}, sees ${UNITS.scout.vision} tiles and walks through forest. Opens ruins for +${SCOUT_RUIN}★ more. Cannot fight or capture.`;
    case 'healer': {
      const left = convertLeft(s, u);
      return `Heals your units beside it ${HEAL_HP} HP at the start of each turn. Convert: ${left ? `ready in ${left} turn${left === 1 ? '' : 's'}` : 'ready'} (a wounded enemy beside it at half health or less; every ${CONVERT_COOLDOWN} turns). Cannot fight or capture.`;
    }
  }
  return '';
}

/** A scout that opens a ruin pays SCOUT_RUIN★ (called from rules.openRuin). */
export function scoutRuin(s: GameState, u: Unit, t: Tile) {
  if (u.kind !== 'scout') return;
  s.players[u.owner].stars += SCOUT_RUIN;
  emit({ type: 'stars', player: u.owner, x: t.x, y: t.y, amount: SCOUT_RUIN });
}

// ---------------------------------------------------------------- the mechanic hooks

export const AUX_MECH: Mechanic = {
  name: 'Auxiliaries',
  blurb: 'Spearmen, Scouts and Healers.',

  turnStart(s, owner) { healerTurn(s, owner); },

  combat(s, owner, a, d, ctx) {
    if (a.owner !== owner || a.kind !== 'spearman' || !isMounted(s, d)) return;
    ctx.dmg *= SPEAR_CHARGE; // set spears against the horse
    ctx.tag ??= 'Spears!';
  },
};

// ---------------------------------------------------------------- computer players

const foes = (s: GameState, pid: number) => s.units.filter((e) => e.owner !== pid && hostile(s, pid, e.owner) && !isNeutral(s, e.owner) && isExplored(s, pid, e.x, e.y));
const armed = (u: Unit) => UNITS[u.carrying ?? u.kind].atk > 0;
/** Mounted enemies within 6 of `pid`'s cities, and how much of the enemy host near them rides. */
function cavalryThreat(s: GameState, pid: number): number {
  const cs = citiesOf(s, pid);
  const near = foes(s, pid).filter((e) => armed(e) && cs.some((c) => dist(c.x, c.y, e.x, e.y) <= 6));
  const riders = near.filter((e) => isMounted(s, e)).length;
  return riders >= 2 && riders * 3 >= near.length ? riders : 0;
}
const army = (s: GameState, pid: number) => s.units.filter((u) => u.owner === pid && armed(u) && !UNITS[u.carrying ?? u.kind].naval);
const mine = (s: GameState, pid: number, k: UnitKind) => s.units.filter((u) => u.owner === pid && (u.carrying ?? u.kind) === k).length;
const unknownShare = (s: GameState, pid: number) => s.players[pid].explored.filter((x) => !x).length / s.players[pid].explored.length;

/** Should `pid` train an auxiliary of `kind` now? */
function wantAux(s: GameState, pid: number, kind: UnitKind): boolean {
  const p = s.players[pid];
  const cost = UNITS[kind].cost;
  switch (kind) {
    case 'scout': // one early on, while much of the map is unknown
      return s.turn >= 1 && s.turn <= 10 && mine(s, pid, 'scout') < 1 && unknownShare(s, pid) > 0.45 && p.stars >= cost + 3;
    case 'spearman': { // enough to meet the horsemen at the gates
      const t = cavalryThreat(s, pid);
      return t > 0 && mine(s, pid, 'spearman') < Math.min(t, citiesOf(s, pid).length + 1) && p.stars >= cost;
    }
    case 'healer': // one beside a large army, two beside a very large one
      return s.turn >= 8 && mine(s, pid, 'healer') < Math.min(2, Math.floor(army(s, pid).length / 8)) && p.stars >= cost + 4;
  }
  return false;
}

/** How much the computer wants a tech that unlocks an auxiliary it needs (0 when it doesn't). */
export function auxTechWant(s: GameState, pid: number, tech: string): number {
  if (tech === UNITS.spearman.tech && cavalryThreat(s, pid) > 0) return 8;
  if (tech === UNITS.healer.tech && army(s, pid).length >= 8) return 4;
  return 0;
}

/** Walk `u` one move closer to the nearest goal (to within `near` of it), shying away from armed enemies. */
function stepToward(s: GameState, u: Unit, goals: { x: number; y: number }[], near = 0): boolean {
  if (u.moved || !goals.length) return false;
  const d = (x: number, y: number) => Math.min(...goals.map((g) => Math.max(0, dist(x, y, g.x, g.y) - near)));
  const danger = (x: number, y: number) => (s.units.some((e) => e.owner !== u.owner && hostile(s, u.owner, e.owner) && armed(e) && dist(e.x, e.y, x, y) <= 1) ? 2 : 0);
  const here = d(u.x, u.y) + danger(u.x, u.y);
  const best = moveOptions(s, u)
    .filter((o) => !o.embark && !o.disembark && !nearBeast(s, o.x, o.y))
    .map((o) => ({ o, v: d(o.x, o.y) + danger(o.x, o.y) }))
    .sort((a, b) => a.v - b.v || a.o.y - b.o.y || a.o.x - b.o.x)[0];
  return !!best && best.v < here && moveUnit(s, u, best.o.x, best.o.y);
}

/** Explored land beside the unknown, and the ruins waiting to be opened. */
function scoutGoals(s: GameState, pid: number): { ruins: Tile[]; frontier: Tile[] } {
  const ruins: Tile[] = [], frontier: Tile[] = [];
  for (const t of s.tiles) {
    if (!isExplored(s, pid, t.x, t.y) || !isLand(t) || unitAt(s, t.x, t.y)) continue;
    if (t.ruin) ruins.push(t);
    else if (neighbors(s, t.x, t.y).some((n) => !isExplored(s, pid, n.x, n.y))) frontier.push(t);
  }
  return { ruins, frontier };
}

/** Where a healer does most good: beside wounded units (and a convertible foe, when Convert is ready), away from harm. */
function healerSpot(s: GameState, h: Unit, x: number, y: number): number {
  const pid = h.owner;
  let v = 0;
  for (const u of s.units) {
    if (u === h || dist(u.x, u.y, x, y) !== 1) continue;
    if (u.owner === pid) v += u.hp < maxHp(u) ? 2 : 0.4;
    else if (!convertLeft(s, h) && !convertBar(s, pid, u) && convertible(u)) v += 4;
    else if (hostile(s, pid, u.owner) && armed(u)) v -= 3;
  }
  return v;
}

function unitStep(s: GameState, pid: number, u: Unit): boolean {
  const t = tileAt(s, u.x, u.y)!;
  if (u.kind === 'healer') {
    // convert the most valuable foe it can, then find the spot where it heals the most
    const conv = tileActions(s, pid, t).filter((a) => a.enabled && auxParts(a.id)?.verb === 'convert')
      .sort((a, b) => worth(s, auxParts(b.id)!.target) - worth(s, auxParts(a.id)!.target))[0];
    if (conv) return doAction(s, pid, t, conv.id);
    if (u.moved) return false;
    const here = healerSpot(s, u, u.x, u.y);
    const best = moveOptions(s, u).filter((o) => !o.embark && !o.disembark)
      .map((o) => ({ o, v: healerSpot(s, u, o.x, o.y) })).sort((a, b) => b.v - a.v || a.o.y - b.o.y || a.o.x - b.o.x)[0];
    if (best && best.v > here && best.v > 0) return moveUnit(s, u, best.o.x, best.o.y);
    if (here > 0) return false; // already where it is needed
    // follow the army: the most wounded soldier first, else the nearest
    const troops = army(s, pid).filter((m) => dist(m.x, m.y, u.x, u.y) > 1);
    const hurt = troops.filter((m) => m.hp < maxHp(m));
    return stepToward(s, u, hurt.length ? hurt : troops, 1);
  }
  if (u.kind === 'scout') {
    const { ruins, frontier } = scoutGoals(s, pid);
    const wonders = naturalGoals(s, pid).filter((n) => isLand(tileAt(s, n.x, n.y)!)); // a Natural Wonder glimpsed past the known map (see game/naturals)
    const close = [...ruins, ...wonders].filter((r) => dist(r.x, r.y, u.x, u.y) <= 8);
    return (close.length > 0 && stepToward(s, u, close)) || stepToward(s, u, frontier);
  }
  return false;
}
const worth = (s: GameState, i: number) => { const e = unitAt(s, s.tiles[i].x, s.tiles[i].y); return e ? UNITS[e.carrying ?? e.kind].cost + e.hp / 10 : 0; };

/**
 * One auxiliary step for a computer player: scouts explore and open ruins, healers convert wounded foes and keep beside
 * the wounded, and a scout, spearmen or a healer are trained when they would pay. Spearmen then fight as ordinary
 * soldiers (game/ai).
 */
export function auxAi(s: GameState, pid: number): boolean {
  const p = s.players[pid];
  if (p.human || p.neutral) return false;
  const key = `${s.turn}:${pid}`;
  if (key !== memo.key || s !== memo.state) Object.assign(memo, { key, state: s, idle: new Set<number>(), trained: false });
  for (const u of s.units) {
    if (u.owner !== pid || u.carrying || !isSupport(u) || (u.moved && u.attacked) || memo.idle.has(u.id)) continue;
    if (unitStep(s, pid, u)) return true;
    memo.idle.add(u.id); // nothing to do this turn: don't ask again
  }
  if (memo.trained) return false;
  memo.trained = true; // one look a turn
  for (const kind of ['spearman', 'scout', 'healer'] as UnitKind[]) {
    if (!hasTech(s, pid, UNITS[kind].tech) || !wantAux(s, pid, kind)) continue;
    // spearmen where the horsemen are, the others from the largest city
    const threat = foes(s, pid).filter((e) => isMounted(s, e));
    const near = (c: { x: number; y: number }) => (kind === 'spearman' && threat.length ? Math.min(...threat.map((e) => dist(e.x, e.y, c.x, c.y))) : 0);
    for (const c of citiesOf(s, pid).sort((a, b) => near(a) - near(b) || b.level - a.level || a.id - b.id)) {
      const ct = tileAt(s, c.x, c.y)!;
      const a = tileActions(s, pid, ct).find((x) => x.id === `train:${kind}`);
      if (a?.enabled) { memo.trained = false; return doAction(s, pid, ct, a.id); }
    }
  }
  return false;
}
/** Per-turn scratch memory of the computer's auxiliaries, so an idle one is not reconsidered at every step. */
const memo: { key: string; state: GameState | null; idle: Set<number>; trained: boolean } = { key: '', state: null, idle: new Set(), trained: false };
