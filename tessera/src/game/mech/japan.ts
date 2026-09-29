// Japan: Way of the Blade (Kiai). A critical strike takes no counter-blow, and a unit at 1 HP fights its final turn
// with fourfold attack (Last Stand). Crits are decided by a hash of the seed, turn and unit ids, so the preview, the
// real attack and the AI's plan always agree.
import { UNITS } from '../../data/units';
import { attack, attackOptions, previewCombat } from '../rules';
import type { GameState, Unit } from '../types';
import type { Mechanic } from './types';

export const KIAI_CHANCE = 0.3;

const isJapan = (s: GameState, u: Unit) => s.players[u.owner].tribe === 'japan';

/** Is this unit fighting its Last Stand (a Japanese unit at 1 HP)? */
export const lastStand = (s: GameState, u: Unit) => u.hp === 1 && isJapan(s, u);

/** Deterministic 0..1 roll for one attacker/defender pairing this turn. */
function roll(s: GameState, a: Unit, d: Unit): number {
  let h = (s.seed ^ Math.imul(s.turn + 1, 0x9e3779b1) ^ Math.imul(a.id + 1, 0x85ebca6b) ^ Math.imul(d.id + 1, 0xc2b2ae35)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Does a Japanese attacker land a critical strike (Kiai) on this defender? */
export const isKiai = (s: GameState, a: Unit, d: Unit) => isJapan(s, a) && roll(s, a, d) < KIAI_CHANCE;

export const mech: Mechanic = {
  name: 'Way of the Blade (Kiai)',
  blurb: 'A critical strike takes no counter-blow, and a dying warrior strikes with fourfold force.',

  stat(s, owner, u, stat) {
    if (stat !== 'atk' || u.owner !== owner || u.hp !== 1) return 0;
    return UNITS[u.kind].atk * 3; // total attack x4
  },

  combat(s, owner, a, d, ctx) {
    if (a.owner !== owner || !isKiai(s, a, d)) return;
    ctx.ret = 0;
  },

  afterAttack(s, owner, a, d) {
    if (a.owner !== owner || !isKiai(s, a, d)) return;
    a.data = { ...a.data, kiai: s.turn };
    s.log.push({ turn: s.turn, text: 'Kiai! A critical strike lands without a counter-blow.' });
  },

  ai(s, owner) {
    for (const u of s.units) {
      if (u.owner !== owner || u.attacked) continue;
      let best: { d: Unit; score: number } | null = null;
      for (const d of attackOptions(s, u)) {
        const p = previewCombat(s, u, d);
        if (p.dmg <= 0) continue;
        const crit = isKiai(s, u, d);
        if (!lastStand(s, u) && !crit && !p.kills) continue; // a wounded warrior fights on; others take only safe blows
        const score = (p.kills ? 100 : 0) + (crit ? 30 : 0) + p.dmg * 3 - p.ret * 2;
        if (!best || score > best.score) best = { d, score };
      }
      if (best && attack(s, u, best.d)) return true;
    }
    return false;
  },
};
