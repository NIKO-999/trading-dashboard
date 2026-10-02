// Civilization bonuses, in the style of an Age of Empires civ sheet: every empire has three short, always-on bonuses
// on top of its signature, plus an Alliance bonus that it and every empire allied with it enjoy. They are plain
// perks (see game/perks), so the rules, the AI and the card text all read the same numbers.
import type { Perk, PerkWho } from '../game/perks';
import type { TribeId } from '../game/types';

export interface CivBonus {
  perks: Perk[];
  /** Grows with the eras: the perks' numbers are multiplied by scale[era] (Ancient, Classical, Medieval, Renaissance). */
  scale?: [number, number, number, number];
  /** Card text when the perks alone don't say it (an era-scaled bonus). */
  text?: string;
}

/** Techs known when each era begins; mirrors ERAS in game/eras (which imports the rules, so it can't be imported here). */
export const ERA_AT = [0, 6, 12, 20] as const;
export const eraOfTechs = (n: number) => ERA_AT.reduce<number>((e, at, i) => (n >= at ? i : e), 0);

const B = (...perks: Perk[]): CivBonus => ({ perks });
const S = (text: string, scale: CivBonus['scale'], ...perks: Perk[]): CivBonus => ({ perks, scale, text });

// shorthand for the common perks
const hp = (n: number, who: PerkWho): Perk => ({ k: 'hp', n, who });
const atk = (n: number, who: PerkWho): Perk => ({ k: 'atk', n, who });
const move = (n: number, who: PerkWho): Perk => ({ k: 'move', n, who });
const cheap = (tech: string, n = 2): Perk => ({ k: 'techcost', tech, n: -n });
const inc = (per: Extract<Perk, { k: 'income' }>['per'], n: number): Perk => ({ k: 'income', per, n });
const grow = (on: Extract<Perk, { k: 'grow' }>['on'], n = 1): Perk => ({ k: 'grow', on, n });
const terrain = (on: Extract<Perk, { k: 'terrain' }>['on'], n = 0.5): Perk => ({ k: 'terrain', on, n });
const cost = (of: Extract<Perk, { k: 'cost' }>['of'], n = 1): Perk => ({ k: 'cost', of, n });
const heal: Perk = { k: 'heal', n: 1 };
const vision: Perk = { k: 'vision', n: 1 };
const kill: Perk = { k: 'kill', n: 1 };
const route = (n: number): Perk => ({ k: 'route', n });
const wonder: Perk = { k: 'wonderpct', n: 0.15 };
const late = [0, 0, 1, 2] as CivBonus['scale']; // nothing until the Medieval era, double in the Renaissance

export const CIV_BONUSES: Record<TribeId, { bonuses: CivBonus[]; team: CivBonus }> = {
  egypt: { bonuses: [B(cheap('farming', 3)), B(hp(3, 'mounted')), B(inc('mine', 0.5))], team: B(cost('temple')) },
  aztec: {
    bonuses: [B(hp(2, 'melee')), B(grow('animal')), S('Foot soldiers hit 0.5 harder in the Medieval era, 1 harder in the Renaissance.', late, atk(0.5, 'melee'))],
    team: B(heal),
  },
  polynesia: { bonuses: [B(hp(2, 'naval')), B(grow('fish')), B(move(1, 'recon'))], team: B(cheap('sailing')) },
  rome: { bonuses: [B(hp(2, 'melee')), B(inc('road', 1)), B(cost('siege'))], team: B(cheap('masonry')) },
  pirates: { bonuses: [B(atk(0.5, 'naval')), B({ k: 'raidheal', n: 3 }), B({ k: 'start', n: 5 })], team: B(inc('port', 0.5)) },
  vikings: {
    bonuses: [B(hp(2, 'melee')), B(hp(2, 'naval')), S('From the Classical era, +1★ for every enemy you defeat.', [0, 1, 1, 1], kill)],
    team: B(cheap('forestry')),
  },
  japan: { bonuses: [B(hp(3, 'unique')), B(cheap('sailing')), B(grow('fish'))], team: B(cheap('meditation')) },
  mongols: { bonuses: [B(hp(2, 'mounted')), B(cheap('horsemanship')), B(grow('animal'))], team: B(move(1, 'recon')) },
  greeks: { bonuses: [B(move(1, 'naval')), B(cheap('philosophy')), B(inc('market', 0.5))], team: B(route(0.15)) },
  zulu: { bonuses: [B(hp(2, 'melee')), B(kill), B(terrain('away'))], team: B(cheap('tactics')) },
  persia: { bonuses: [B(atk(0.5, 'mounted')), B(route(0.25)), B(terrain('city'))], team: B(cheap('riding')) },
  celts: { bonuses: [B(hp(2, 'melee')), B(inc('lumber', 0.5)), B(cost('siege'))], team: B(cheap('forestry')) },
  inuit: { bonuses: [B(cheap('whaling')), B(terrain('ice')), B(hp(2, 'ranged'))], team: B(heal) },
  inca: { bonuses: [B(cheap('mining')), B(terrain('mountain')), B(atk(0.5, 'ranged'))], team: B(cost('road')) },
  ethiopia: { bonuses: [B(hp(2, 'melee')), B(cheap('meditation')), B(route(0.25))], team: B(cost('temple')) },
  aboriginal: { bonuses: [B(hp(2, 'ranged')), B({ k: 'clearStar', n: 1 }), B(move(1, 'recon'))], team: B(vision) },
  china: { bonuses: [B({ k: 'start', n: 5 }), B(atk(0.5, 'ranged')), B(cheap('philosophy'))], team: B(inc('farm', 0.5)) },
  india: { bonuses: [B(hp(3, 'mounted')), B(inc('temple', 0.5)), B(cheap('meditation'))], team: B(heal) },
  mali: { bonuses: [B(inc('market', 0.5)), B(hp(2, 'melee')), B(cheap('trade'))], team: B(cheap('mining')) },
  lakota: { bonuses: [B(hp(2, 'mounted')), B(vision), B(cheap('horsemanship'))], team: B(move(1, 'recon')) },
  ottoman: { bonuses: [B(hp(3, 'siege')), B(hp(2, 'ranged')), B(cheap('engineering'))], team: B(cheap('smithing')) },
  maya: { bonuses: [B(grow('temple')), B(hp(2, 'melee')), B(cheap('spiritualism'))], team: B(cheap('farming')) },
  korea: { bonuses: [B(cost('siege')), B(hp(3, 'naval')), B(cheap('philosophy'))], team: B(terrain('city')) },
  khmer: { bonuses: [B(hp(3, 'mounted')), B({ k: 'levelstar', n: 1 }), B(wonder)], team: B(cheap('farming')) },
  swahili: { bonuses: [B(inc('port', 0.5)), B(route(0.25)), B(hp(2, 'naval'))], team: B(inc('market', 0.5)) },
  tibet: { bonuses: [B(hp(2, 'mounted')), B(cheap('meditation')), B(inc('temple', 0.5))], team: B(terrain('mountain')) },
  carthage: { bonuses: [B(atk(0.5, 'naval')), B(hp(3, 'unique')), B(inc('capital', 1))], team: B(inc('port', 0.5)) },
  byzantium: { bonuses: [B(hp(2, 'mounted')), B(inc('temple', 0.5)), B(atk(0.5, 'naval'))], team: B(cheap('philosophy')) },
  arabia: { bonuses: [B(hp(2, 'mounted')), B(inc('market', 0.5)), B(cheap('trade'))], team: B(route(0.15)) },
  rus: { bonuses: [B(atk(0.5, 'mounted')), B(terrain('own')), B(inc('lumber', 0.5))], team: B(cheap('forestry')) },
  vietnam: { bonuses: [B(hp(2, 'melee')), B(atk(0.5, 'ranged')), B(terrain('own'))], team: B(heal) },
  babylon: { bonuses: [B(cheap('masonry')), B(hp(2, 'melee')), B(wonder)], team: B({ k: 'levelstar', n: 1 }) },
  nubia: {
    bonuses: [B(hp(2, 'ranged')), S('Ranged units hit 0.5 harder in the Medieval era, 1 harder in the Renaissance.', late, atk(0.5, 'ranged')), B(inc('capital', 1))],
    team: B(cheap('archery')),
  },
  majapahit: { bonuses: [B(hp(2, 'naval')), B(grow('fruit')), B(hp(3, 'unique'))], team: B(route(0.15)) },
  spain: { bonuses: [B(hp(2, 'mounted')), B(cheap('navigation')), B(inc('capital', 1))], team: B(move(1, 'recon')) },
  haudenosaunee: { bonuses: [B(hp(2, 'melee')), B(cheap('forestry')), B(inc('lumber', 0.5))], team: B(cheap('farming')) },
  assyria: { bonuses: [B(hp(3, 'siege')), B(atk(0.5, 'siege')), B(kill)], team: B(cheap('engineering')) },
  poland: { bonuses: [B(hp(2, 'mounted')), B(inc('farm', 0.5)), B(cheap('chivalry'))], team: B(cheap('horsemanship')) },
  scotland: { bonuses: [B(hp(2, 'melee')), B(terrain('mountain')), B(cheap('philosophy'))], team: B(cheap('mining')) },
  england: { bonuses: [B(hp(2, 'ranged')), B(hp(2, 'naval')), B({ k: 'levelstar', n: 1 })], team: B(inc('port', 0.5)) },
  france: { bonuses: [B(hp(2, 'mounted')), B(wonder), B(inc('market', 0.5))], team: B(cheap('chivalry')) },
  germany: { bonuses: [B(hp(2, 'melee')), B(cheap('smithing')), B(cost('siege'))], team: B(cheap('trade')) },
  sweden: { bonuses: [B(hp(2, 'melee')), B({ k: 'levelstar', n: 1 }), B(terrain('own'))], team: B(heal) },
  portugal: { bonuses: [B(hp(2, 'naval')), B(cheap('navigation')), B(inc('port', 0.5))], team: B(vision) },
  venice: { bonuses: [B(atk(0.5, 'naval')), B(inc('market', 0.5)), B(route(0.25))], team: B(cheap('trade')) },
  kongo: { bonuses: [B(hp(2, 'melee')), B(grow('fruit')), B(atk(0.5, 'ranged'))], team: B(inc('market', 0.5)) },
  ashanti: { bonuses: [B(hp(2, 'melee')), B(terrain('forest')), B(cheap('mining'))], team: B(inc('mine', 0.5)) },
  mapuche: { bonuses: [B(hp(2, 'mounted')), B({ k: 'raidheal', n: 3 }), B(kill)], team: B(terrain('forest')) },
  georgia: { bonuses: [B(hp(2, 'melee')), B(inc('temple', 0.5)), B(atk(0.5, 'mounted'))], team: B(cheap('meditation')) },
  nepal: {
    bonuses: [B(hp(2, 'melee')), B(cheap('meditation')), S('Foot soldiers hit 0.5 harder in the Medieval era, 1 harder in the Renaissance.', late, atk(0.5, 'melee'))],
    team: B(terrain('mountain')),
  },
  cree: { bonuses: [B(grow('animal')), B(move(1, 'recon')), B(terrain('away'))], team: B(cheap('forestry')) },
};

/** The perks a civilization bonus gives right now, scaled to the empire's era. */
export function bonusPerks(b: CivBonus, techs: number): Perk[] {
  if (!b.scale) return b.perks;
  const m = b.scale[eraOfTechs(techs)];
  if (!m) return [];
  return b.perks.map((p) => ('n' in p ? ({ ...p, n: p.n * m } as Perk) : p));
}

/** Starting Stars on top of the usual 5. */
export const startStars = (tribe: TribeId) =>
  CIV_BONUSES[tribe].bonuses.reduce((a, b) => a + b.perks.reduce((x, p) => x + (p.k === 'start' ? p.n : 0), 0), 0);
