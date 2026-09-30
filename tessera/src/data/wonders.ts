// World Wonders: one-of-a-kind great works drawn from world history. Only the first empire to finish each one gets
// it; the rules live in game/wonders.ts, the art in render/wonders.ts. This file is plain data plus the one question
// the perk and score code must ask cheaply: "which wonders does this empire hold right now?"
import type { Perk } from '../game/perks';
import type { BuiltWonder, GameState, Terrain, TribeId } from '../game/types';

export interface WonderDef {
  id: string;
  name: string;
  /** The tech that lets an empire begin it. */
  tech: string;
  /** Terrain the site tile may have. */
  terrain: Terrain[];
  /** The site must touch water. */
  coast?: boolean;
  /** Empires whose own history it belongs to: they pay less for it. */
  home: TribeId[];
  /** Stars to finish it (before the home discount). */
  cost: number;
  /** Lasting bonus for whoever holds it (see game/perks). */
  perks: Perk[];
  /** A one-off gift on completion, in words (applied by game/wonders). */
  gift?: string;
  flavor: string;
}

export const WONDERS: WonderDef[] = [
  { id: 'pyramids', name: 'Great Pyramids', tech: 'masonry', terrain: ['desert', 'field'], home: ['egypt'], cost: 36,
    perks: [{ k: 'cost', of: 'build', n: 2 }, { k: 'income', per: 'capital', n: 2 }], flavor: 'Tombs of god-kings, raised by a nation of builders.' },
  { id: 'greatwall', name: 'Great Wall', tech: 'engineering', terrain: ['field', 'forest', 'desert', 'tundra', 'mountain'], home: ['china'], cost: 40,
    perks: [{ k: 'terrain', on: 'own', n: 0.5 }], flavor: 'Ten thousand li of rammed earth and brick along the frontier.' },
  { id: 'colosseum', name: 'Colosseum', tech: 'tactics', terrain: ['field'], home: ['rome'], cost: 32,
    perks: [{ k: 'atk', n: 0.5, who: 'melee' }, { k: 'kill', n: 1 }], flavor: 'Bread and games: the arena trains the legions.' },
  { id: 'machupicchu', name: 'Machu Picchu', tech: 'meditation', terrain: ['mountain'], home: ['inca'], cost: 40,
    perks: [{ k: 'income', per: 'city', n: 1 }], flavor: 'A royal estate of terraces on a cloud-wrapped ridge.' },
  { id: 'gardens', name: 'Hanging Gardens', tech: 'farming', terrain: ['field', 'desert'], home: ['persia'], cost: 34,
    perks: [{ k: 'grow', on: 'farm', n: 1 }], gift: 'Every city grows by 2 when it is finished.', flavor: 'Terraced greenery watered by hidden screws.' },
  { id: 'library', name: 'Great Library', tech: 'philosophy', terrain: ['field', 'desert'], home: ['greeks'], cost: 40,
    perks: [{ k: 'cost', of: 'tech', n: 2 }], gift: 'A free tech (the cheapest you can learn) when it is finished.', flavor: 'Every scroll in the known world, copied and kept.' },
  { id: 'stonehenge', name: 'Stonehenge', tech: 'spiritualism', terrain: ['field', 'tundra'], home: ['celts'], cost: 30,
    perks: [{ k: 'vision', n: 1 }, { k: 'income', per: 'capital', n: 1 }], flavor: 'A ring of giants that marks the turning of the sun.' },
  { id: 'angkor', name: 'Angkor Wat', tech: 'forestry', terrain: ['forest', 'field', 'swamp'], home: ['khmer'], cost: 34,
    perks: [{ k: 'levelstar', n: 2 }, { k: 'grow', on: 'temple', n: 1 }], flavor: 'A temple-mountain mirrored in its moat.' },
  { id: 'hagia', name: 'Hagia Sophia', tech: 'masonry', terrain: ['field'], home: ['ottoman'], cost: 34,
    perks: [{ k: 'cost', of: 'temple', n: 3 }, { k: 'income', per: 'temple', n: 1 }], flavor: 'A dome that seems to hang from heaven on a chain.' },
  { id: 'djenne', name: 'Great Mosque of Djenné', tech: 'carpentry', terrain: ['desert', 'field', 'swamp'], home: ['mali'], cost: 34,
    perks: [{ k: 'income', per: 'market', n: 1 }, { k: 'grow', on: 'market', n: 1 }], flavor: 'Sun-baked mud and palm beams, replastered by the whole town.' },
  { id: 'moai', name: 'Moai Row', tech: 'fishing', terrain: ['field', 'forest'], coast: true, home: ['polynesia'], cost: 32,
    perks: [{ k: 'income', per: 'port', n: 2 }, { k: 'grow', on: 'fish', n: 1 }], flavor: 'Stone ancestors on the shore, watching over their people.' },
  { id: 'potala', name: 'Potala Palace', tech: 'meditation', terrain: ['mountain'], home: ['tibet'], cost: 36,
    perks: [{ k: 'terrain', on: 'mountain', n: 0.5 }, { k: 'heal', n: 2 }], flavor: 'White and red walls climbing the Red Hill.' },
  { id: 'chichen', name: 'Chichen Itza', tech: 'roads', terrain: ['forest', 'field'], home: ['maya'], cost: 34,
    perks: [{ k: 'income', per: 'road', n: 1 }, { k: 'income', per: 'capital', n: 1 }], flavor: 'White causeways meet at the serpent’s pyramid.' },
  { id: 'terracotta', name: 'Terracotta Army', tech: 'smithing', terrain: ['field', 'desert'], home: ['china'], cost: 36,
    perks: [{ k: 'cost', of: 'melee', n: 1 }, { k: 'def', n: 0.5, who: 'melee' }], flavor: 'Thousands of clay soldiers guard an emperor forever.' },
  { id: 'lighthouse', name: 'Lighthouse of Alexandria', tech: 'sailing', terrain: ['field', 'desert', 'platform'], coast: true, home: ['egypt'], cost: 32,
    perks: [{ k: 'move', n: 1, who: 'naval' }, { k: 'vision', n: 1 }], flavor: 'A fire on a tower of three tiers guides every ship home.' },
  { id: 'zimbabwe', name: 'Great Zimbabwe', tech: 'mining', terrain: ['field', 'forest'], home: ['swahili'], cost: 34,
    perks: [{ k: 'income', per: 'mine', n: 1 }, { k: 'grow', on: 'mine', n: 1 }], flavor: 'Mortarless granite walls of a gold-trading kingdom.' },
];

export const WONDER_BY_ID: Record<string, WonderDef> = Object.fromEntries(WONDERS.map((w) => [w.id, w]));

/** Score for every wonder an empire holds. */
export const WONDER_SCORE = 600;

/** Who holds a finished wonder now: whoever owns the land it stands on (it changes hands with its city), else its builder. */
export function wonderHolder(s: GameState, b: BuiltWonder): number {
  const t = s.tiles[b.y * s.size + b.x];
  const c = t && t.owner !== null ? s.cities.find((k) => k.id === t.owner) : undefined;
  return c ? c.owner : b.pid;
}

/** Ids of the wonders `pid` holds right now. */
export const wondersHeldBy = (s: GameState, pid: number): string[] =>
  s.wonders ? s.wonders.built.filter((b) => wonderHolder(s, b) === pid).map((b) => b.id) : [];
