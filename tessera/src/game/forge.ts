// The Armoury: permanent upgrades for a whole unit type, bought at a Barracks with Stars and luxury goods (1 a turn
// for every developed luxury, see game/goods). Each military unit type has FORGE_MAX tiers (data/forge): attack,
// then +1 movement, attack, +1 range (attack for melee), attack. Tiers 4 and 5 need the Barracks expanded to a Drill
// Yard and a War College. A tier counts for every unit of that type the empire has, now and later, all game long.
import { FORGE_MAX, FORGE_TIERS, forgeTier, ROMAN, tierGives } from '../data/forge';
import { UNITS } from '../data/units';
import { barracksLevel, BARRACKS_NAMES, isBarracks } from './barracks';
import { emit } from './events';
import { goodsOf, stockOf } from './goods';
import { isLand } from './grid';
import { doAction, hasTech, tileOwnerPlayer, trainableKinds, type Action } from './rules';
import { isRoleKind } from './roles';
import type { GameState, Tile, UnitKind } from './types';

/** The unit types the Armoury can improve for `pid`: its fighting land units (no merchants, role units, scouts or healers). */
export function forgeKinds(s: GameState, pid: number): UnitKind[] {
  return trainableKinds(s, pid).filter((k) => UNITS[k].atk > 0 && !UNITS[k].naval && !isRoleKind(k) && k !== 'explorer');
}

const gives = (i: number, k: UnitKind) => {
  const g = tierGives(i, k);
  return [g.atk ? `+${g.atk} attack` : '', g.move ? `+${g.move} movement` : '', g.range ? `+${g.range} range` : ''].filter(Boolean).join(', ');
};

export function forgeActions(s: GameState, pid: number, t: Tile): Action[] {
  const p = s.players[pid];
  if (p.neutral || !isBarracks(t) || !isLand(t) || tileOwnerPlayer(s, t) !== pid) return [];
  const lvl = barracksLevel(t);
  const out: Action[] = [];
  for (const k of forgeKinds(s, pid)) {
    const n = forgeTier(p, k);
    if (n >= FORGE_MAX) continue;
    const tier = FORGE_TIERS[n];
    const d = UNITS[k];
    const why = d.tech && !hasTech(s, pid, d.tech) ? `Needs ${d.tech}`
      : lvl < tier.yard ? `Needs a ${BARRACKS_NAMES[tier.yard]}`
      : goodsOf(p) < tier.goods ? `Needs ${tier.goods} luxury goods (you have ${goodsOf(p)}): develop luxuries`
      : p.stars < tier.stars ? 'Not enough stars' : undefined;
    if (d.tech && !hasTech(s, pid, d.tech)) continue; // only types you can field
    out.push({
      id: `forge:${k}`, label: `${d.name} ${ROMAN[n + 1]}`, cost: tier.stars, icon: k, enabled: !why, reason: why,
      desc: `${tier.name}: every ${d.name}, now and later, gets ${gives(n, k)} for the rest of the game. Also uses ${tier.goods} luxury goods 💎. Tier ${n + 1} of ${FORGE_MAX}.`,
    });
  }
  return out;
}

export function forgeDoAction(s: GameState, pid: number, id: string): boolean {
  const k = id.slice(6) as UnitKind;
  const p = s.players[pid];
  const n = forgeTier(p, k);
  if (n >= FORGE_MAX) return false;
  const st = stockOf(p);
  st.goods = Math.max(0, (st.goods ?? 0) - FORGE_TIERS[n].goods);
  p.forge = { ...(p.forge ?? {}), [k]: n + 1 };
  emit({ type: 'toast', player: pid, text: `⚒ ${FORGE_TIERS[n].name}: every ${UNITS[k].name} gets ${gives(n, k)} (tier ${ROMAN[n + 1]}).` });
  return true;
}

/** An AI with goods and Stars to spare improves the type it fields most. */
export function forgeAi(s: GameState, pid: number): boolean {
  const p = s.players[pid];
  if (goodsOf(p) < 1 || p.stars < 12) return false;
  const yard = s.tiles.find((t) => isBarracks(t) && isLand(t) && tileOwnerPlayer(s, t) === pid);
  if (!yard) return false;
  const count = (k: UnitKind) => s.units.filter((u) => u.owner === pid && u.kind === k).length;
  const acts = forgeActions(s, pid, yard).filter((a) => a.enabled && p.stars >= a.cost + 8)
    .sort((a, b) => count(b.id.slice(6) as UnitKind) - count(a.id.slice(6) as UnitKind));
  return acts.length > 0 && count(acts[0].id.slice(6) as UnitKind) > 0 && doAction(s, pid, yard, acts[0].id);
}
