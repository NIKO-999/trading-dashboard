// Perks: the lasting effects of an empire's unique skill line (see data/uniqueTechs.ts). Kept free of game rules so
// both the rules and the map code can ask "how much of X does this empire have?".
import { TRAITS } from '../data/traits';
import { UNIQUE_BY_ID } from '../data/uniqueTechs';
import { SKILL_BY_ID } from '../data/skills';
import { govPerks } from '../data/governments';
import { condActive } from './alignment';
import { TRIBES } from '../data/tribes';
import { UNITS } from '../data/units';
import { WONDER_BY_ID, wondersHeldBy } from '../data/wonders';
import { naturalPerks } from '../data/naturals';
import type { GameState, Unit, UnitKind } from './types';

export type PerkWho = 'all' | 'ranged' | 'mounted' | 'naval' | 'melee' | 'siege' | 'unique' | 'recon';
export type PerkImp = 'farm' | 'mine' | 'temple' | 'port' | 'market' | 'lumber' | 'altar';

export type Perk =
  | { k: 'atk' | 'def' | 'move'; n: number; who?: PerkWho }
  | { k: 'income'; per: 'city' | 'capital' | 'road' | 'bigcity' | PerkImp; n: number } // road: per 4 road tiles inside your borders; bigcity: per city of level 3+
  | { k: 'grow'; on: PerkImp | 'harvest' | 'fish' | 'animal' | 'fruit'; n: number } // extra population when you do it
  | { k: 'cost'; of: 'melee' | 'ranged' | 'mounted' | 'naval' | 'siege' | 'tech' | 'build' | 'temple' | 'road'; n: number } // ★ cheaper (negative: dearer)
  | { k: 'techcost'; tech: string; n: number } // this one tech costs n★ more
  | { k: 'terrain'; on: 'forest' | 'mountain' | 'own' | 'city' | 'capital' | 'away' | 'ice'; n: number } // added to the defence multiplier (away: outside your borders)
  | { k: 'heal'; n: number } // HP every unit on your land recovers at the start of your turn
  | { k: 'kill'; n: number } // ★ for every kill
  | { k: 'vision'; n: number } // see one tile further around every unit and city
  | { k: 'levelstar'; n: number } // ★ whenever a city levels up
  | { k: 'harvestStar'; n: number } // ★ whenever you harvest a resource
  // the skill tree's rings (data/skills.ts and the reworked empire lines)
  | { k: 'note'; text: string } // an effect an empire mechanic applies itself (game/mech): only describes it
  | { k: 'range'; n: number; who?: PerkWho; on?: 'mountain' } // attack range (on: only while standing there)
  | { k: 'fogsight'; n: number } // ranged units on a mountain see as far as they can shoot
  | { k: 'refund'; n: number } // share of a defeated enemy's ★ cost paid back
  | { k: 'highway'; n: number } // stepping onto any road costs half a move and never stops for forest or swamp
  | { k: 'spill'; n: number } // a levelling city's surplus population flows to a smaller road-linked city
  | { k: 'clearStar'; n: number } // extra ★ for clearing a forest
  | { k: 'canopy'; n: number } // forests may not be cut; +n★ a turn per forest in your borders (capped at city level); units in forest hide
  | { k: 'trade'; n: number } // trade Stars (the Trade bonus and markets) earn n times more on top
  | { k: 'unitcost'; n: number } // every unit costs n★ more
  | { k: 'unitpct'; n: number } // every unit costs this share less
  | { k: 'halfgrow'; n: number } // population gains are halved (the odd half is banked)
  | { k: 'pax'; n: number } // +n★ a turn per road-linked city while no city has been lost lately
  // policy cards and governments (data/governments.ts)
  | { k: 'route'; n: number } // trade routes pay this share more
  | { k: 'levelpop'; n: number } // extra population whenever a city levels up
  | { k: 'stock'; of: 'iron' | 'horses'; n: number } // strategic resources a turn on top of mines and pastures
  | { k: 'wonderpct'; n: number } // World Wonders cost this share less
  | { k: 'raidheal'; n: number }; // HP a unit heals when it pillages

export const MOUNTED_KINDS: UnitKind[] = ['rider', 'chariot', 'jaguar', 'knight', 'horsearcher', 'elephant', 'buffalorider', 'khampa'];
const SIEGE_KINDS: UnitKind[] = ['catapult', 'hwacha'];

/** All perks an empire has earned so far. */
export function perksOf(s: GameState, pid: number): Perk[] {
  const tribe = s.players[pid].tribe;
  const out: Perk[] = [];
  if (s.players[pid].neutral) return out; // the neutral owner only borrows an empire's look (see game/wild)
  for (const t of [...TRAITS[tribe].pros, ...TRAITS[tribe].cons]) out.push(...t.perks); // the empire's historical strengths and weaknesses
  for (const id of s.players[pid].techs) {
    const t = UNIQUE_BY_ID[id];
    if (t) { out.push(...t.perks); continue; }
    const k = SKILL_BY_ID[id]; // forks, Aether Links and Wildcards (which surge while their condition holds)
    if (!k) continue;
    out.push(...k.perks);
    if (k.surge && k.cond && condActive(s, pid, k.cond)) out.push(...k.surge);
  }
  for (const a of s.players[pid].culture?.adopted ?? []) out.push(...(a.perks ?? [])); // traditions taken from conquered peoples (see culture.ts)
  for (const id of wondersHeldBy(s, pid)) out.push(...WONDER_BY_ID[id].perks); // World Wonders it holds (see game/wonders)
  out.push(...govPerks(s.players[pid], s.turn)); // its government and the policy cards in force (see game/government)
  out.push(...naturalPerks(s, pid)); // Natural Wonders in its borders (see game/naturals)
  return out;
}

export function unitMatches(tribe: keyof typeof TRIBES, kind: UnitKind, who: PerkWho | undefined): boolean {
  if (!who || who === 'all') return true;
  const d = UNITS[kind];
  switch (who) {
    case 'ranged': return d.range > 1 && !d.naval && !SIEGE_KINDS.includes(kind);
    case 'mounted': return MOUNTED_KINDS.includes(kind);
    case 'naval': return d.naval;
    case 'siege': return SIEGE_KINDS.includes(kind);
    case 'melee': return !d.naval && d.range === 1 && !MOUNTED_KINDS.includes(kind) && kind !== 'explorer' && kind !== 'giant';
    case 'unique': return kind === TRIBES[tribe].unique;
    case 'recon': return kind === 'scout' || kind === 'voyager' || kind === 'explorer';
  }
}

/** The bonus a unit gets to attack, defence or movement from its empire's perks. */
export function perkUnit(s: GameState, u: Unit, stat: 'atk' | 'def' | 'move'): number {
  const p = s.players[u.owner];
  if (!p.techs.length) return 0;
  let n = 0;
  for (const pk of perksOf(s, u.owner)) if (pk.k === stat && unitMatches(p.tribe, u.kind, pk.who)) n += pk.n;
  return n;
}

export function perkSum<K extends Perk['k']>(s: GameState, pid: number, k: K, match?: (p: Extract<Perk, { k: K }>) => boolean): number {
  let n = 0;
  for (const pk of perksOf(s, pid)) if (pk.k === k && (!match || match(pk as Extract<Perk, { k: K }>))) n += (pk as { n: number }).n;
  return n;
}

/** Extra attack range from perks (Naval Bombardment, Highland Snipers on a mountain). */
export function perkRange(s: GameState, u: Unit): number {
  const p = s.players[u.owner];
  if (!p.techs.length) return 0;
  const mountain = s.tiles[u.y * s.size + u.x]?.terrain === 'mountain';
  let n = 0;
  for (const pk of perksOf(s, u.owner)) if (pk.k === 'range' && (!pk.on || mountain) && unitMatches(p.tribe, u.kind, pk.who)) n += pk.n;
  return n;
}

/** One line of plain English for a perk. */
export function describePerk(p: Perk): string {
  const who = (w?: PerkWho) => ({ all: 'all units', ranged: 'ranged units', mounted: 'mounted units', naval: 'boats and ships', melee: 'foot soldiers', siege: 'siege engines', unique: 'your unique unit', recon: 'scouts and voyagers' })[w ?? 'all'];
  const cap = (x: string) => x[0].toUpperCase() + x.slice(1);
  const abs = (n: number) => Math.abs(n);
  const imp = (i: string) => ({ farm: 'farm', mine: 'mine', temple: 'temple', port: 'port', market: 'market', lumber: 'lumber hut', altar: 'altar' })[i] ?? i;
  switch (p.k) {
    case 'atk': return p.n >= 0 ? `${cap(who(p.who))} hit ${p.n} harder.` : `${cap(who(p.who))} hit ${abs(p.n)} weaker.`;
    case 'def': return p.n >= 0 ? `${cap(who(p.who))} defend ${p.n} better.` : `${cap(who(p.who))} defend ${abs(p.n)} worse.`;
    case 'move': return p.n >= 0 ? `${cap(who(p.who))} move ${p.n} further.` : `${cap(who(p.who))} move ${abs(p.n)} less.`;
    case 'income': {
      const sign = p.n >= 0 ? '+' : '−';
      const n = abs(p.n);
      return p.per === 'city' ? `${sign}${n}★ a turn from every city.` : p.per === 'capital' ? `${sign}${n}★ a turn from your capital.` : p.per === 'road' ? `${sign}${n}★ a turn for every 4 road tiles in your borders.` : p.per === 'bigcity' ? `${sign}${n}★ a turn from every city of level 3 or more.` : n < 1 ? `${sign}1★ a turn for every 2 ${imp(p.per)}s.` : `${sign}${n}★ a turn for every ${imp(p.per)}.`;
    }
    case 'grow': {
      const what = p.on === 'harvest' ? 'harvest' : p.on === 'fish' || p.on === 'animal' || p.on === 'fruit' ? `${p.on} harvest` : imp(p.on);
      return p.n >= 0 ? `Every ${what} grows the city by ${p.n} more.` : `Every ${what} grows the city by ${abs(p.n)} less.`;
    }
    case 'cost': {
      const thing = ({ tech: 'Research', melee: 'Foot soldiers', ranged: 'Ranged units', mounted: 'Mounted units', naval: 'Ships', siege: 'Siege engines', build: 'Buildings', temple: 'Temples and shrines', road: 'Roads' })[p.of];
      return p.n >= 0 ? `${thing} cost ${p.n}★ less.` : `${thing} cost ${abs(p.n)}★ more.`;
    }
    case 'techcost': return `${p.tech[0].toUpperCase()}${p.tech.slice(1)} costs ${p.n}★ more to research.`;
    case 'terrain': {
      const where = p.on === 'city' ? 'in your cities' : p.on === 'capital' ? 'in your capital' : p.on === 'own' ? 'on your own land' : p.on === 'away' ? 'outside your borders' : p.on === 'forest' ? 'in forests' : p.on === 'ice' ? 'on ice' : 'in the mountains';
      return p.n >= 0 ? `Units ${where} defend ${p.n} better.` : `Units ${where} defend ${abs(p.n)} worse.`;
    }
    case 'heal': return `Units on your land heal ${p.n} HP every turn.`;
    case 'kill': return `+${p.n}★ for every enemy you defeat.`;
    case 'vision': return p.n >= 0 ? `See ${p.n} tile further around every unit and city.` : `See ${abs(p.n)} tile less around every unit and city.`;
    case 'levelstar': return `+${p.n}★ whenever a city levels up.`;
    case 'harvestStar': return `+${p.n}★ whenever you harvest a resource.`;
    case 'note': return p.text;
    case 'range': return `${cap(who(p.who))}${p.on ? ' on a mountain' : ''} shoot ${p.n} tile${p.n === 1 ? '' : 's'} further${p.who === 'naval' ? ', over land too' : ''}.`;
    case 'fogsight': return 'Ranged units on a mountain see through the fog as far as they can shoot.';
    case 'refund': return `Every enemy you defeat refunds ${Math.round(p.n * 100)}% of its ★ cost.`;
    case 'highway': return 'Roads ignore terrain: stepping onto any road costs half a move and never stops for forest or swamp.';
    case 'spill': return 'When a city levels up, its surplus population spills along the road to a smaller linked city.';
    case 'clearStar': return `Clearing a forest pays ${p.n}★ more.`;
    case 'canopy': return `Forests cannot be cut. +${p.n}★ a turn for every forest in your borders (up to half the city's level, rounded up). Your units in forest are hidden from enemies more than 1 tile away.`;
    case 'trade': return 'Trade Stars (the Trade bonus and markets) are doubled.';
    case 'unitcost': return p.n >= 0 ? `Every unit costs ${p.n}★ more.` : `Every unit costs ${abs(p.n)}★ less.`;
    case 'unitpct': return `Every unit costs ${Math.round(p.n * 100)}% less.`;
    case 'halfgrow': return 'Cities grow at half speed: every 2 population gained counts as 1.';
    case 'route': return `Trade routes pay ${Math.round(p.n * 100)}% more.`;
    case 'levelpop': return `A city that levels up gains ${p.n} extra population.`;
    case 'stock': return `+${p.n} ${p.of === 'iron' ? 'Iron' : 'Horse'}${p.n === 1 || p.of === 'iron' ? '' : 's'} a turn.`;
    case 'wonderpct': return `World Wonders cost ${Math.round(p.n * 100)}% less.`;
    case 'raidheal': return `Pillaging heals the raider ${p.n} HP.`;
    case 'pax': return `+${p.n}★ a turn for every road-linked city while you have not lost a city in the last 5 turns.`;
  }
}
