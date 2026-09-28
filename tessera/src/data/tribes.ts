import type { Resource, Terrain, TribeId, UnitKind } from '../game/types';

export interface BiomePalette {
  field: string; // top colour of field tiles
  fieldSide: string;
  forest: string; // tree foliage
  trunk: string;
  mountain: string;
  mountainShade: string;
  snow: string;
  shallow: string;
  ocean: string;
}

export interface TribeDef {
  id: TribeId;
  name: string; // empire name
  people: string; // adjective / demonym
  color: string; // territory / banner colour
  colorDark: string;
  roof: string;
  startTech: string;
  unique: UnitKind;
  replaces: UnitKind; // the standard unit the unique unit stands in for
  bonus: string;
  blurb: string;
  terrain: Record<Terrain, number>; // relative weights for land/water generation
  resources: Partial<Record<Resource, number>>; // spawn chance multipliers
  palette: BiomePalette;
  cityNames: string[];
}

export const TRIBES: Record<TribeId, TribeDef> = {
  egypt: {
    id: 'egypt',
    name: 'Kingdom of the Nile',
    people: 'Egyptian',
    color: '#e0a526',
    colorDark: '#8a5f0a',
    roof: '#d9c27a',
    startTech: 'gathering',
    unique: 'chariot',
    replaces: 'rider',
    bonus: 'Nile Floods — farms grant +1 extra population.',
    blurb: 'Sun-baked dunes and fertile river banks full of grain.',
    terrain: { field: 62, forest: 8, mountain: 12, shallow: 12, ocean: 6 },
    resources: { crop: 2.2, fruit: 0.7, animal: 0.5, fish: 1, ore: 1 },
    palette: { field: '#f0d58c', fieldSide: '#b98f4d', forest: '#62b33c', trunk: '#8a6433', mountain: '#d9b57a', mountainShade: '#aa8550', snow: '#fbeccb', shallow: '#76dde2', ocean: '#2b9bd0' },
    cityNames: ['Waset', 'Iunu', 'Abdju', 'Men-nefer', 'Khmun', 'Swenett', 'Nekhen', 'Djedu', 'Behdet', 'Zau', 'Per-Bast', 'Taremu'],
  },
  aztec: {
    id: 'aztec',
    name: 'Jaguar Empire',
    people: 'Aztec',
    color: '#1faa6b',
    colorDark: '#0c5a37',
    roof: '#c7563a',
    startTech: 'hunting',
    unique: 'jaguar',
    replaces: 'rider',
    bonus: 'Sacred Hunt — hunting refunds 1★.',
    blurb: 'Steaming jungle alive with game, crowned by stepped temples.',
    terrain: { field: 34, forest: 42, mountain: 12, shallow: 8, ocean: 4 },
    resources: { animal: 2, fruit: 1.4, crop: 0.6, fish: 0.8, ore: 0.8 },
    palette: { field: '#5cbc3f', fieldSide: '#7a5230', forest: '#1f9a45', trunk: '#5b3b1c', mountain: '#909c8c', mountainShade: '#636e60', snow: '#f1fbf4', shallow: '#5fdac6', ocean: '#1f8fb8' },
    cityNames: ['Tlacopan', 'Texcoco', 'Cholula', 'Xochimilco', 'Tlatelolco', 'Coyoacan', 'Chalco', 'Culhuacan', 'Azcapotzalco', 'Tollan', 'Malinalco', 'Cuauhnahuac'],
  },
  polynesia: {
    id: 'polynesia',
    name: 'Isles of the Navigators',
    people: 'Polynesian',
    color: '#ff6f91',
    colorDark: '#9e2f4c',
    roof: '#c89b5a',
    startTech: 'fishing',
    unique: 'waka',
    replaces: 'boat',
    bonus: 'Wayfinding — board boats from any coast, no port needed.',
    blurb: 'Turquoise lagoons, palm-fringed islands and teeming reefs.',
    terrain: { field: 34, forest: 14, mountain: 6, shallow: 28, ocean: 18 },
    resources: { fish: 2.2, fruit: 1.3, whale: 1.6, crop: 0.6, animal: 0.5, ore: 0.5 },
    palette: { field: '#9be05a', fieldSide: '#e3cf8f', forest: '#2fae4d', trunk: '#8a6a3b', mountain: '#6a6f73', mountainShade: '#44484c', snow: '#eef9f6', shallow: '#6ce8e8', ocean: '#1ca0dc' },
    cityNames: ['Motu Nui', 'Hiva', 'Rarotonga', 'Moana', 'Tahaa', 'Nukuhiva', 'Aitutaki', 'Mauke', 'Havaiki', 'Rangiroa', 'Mangaia', 'Uvea'],
  },
  rome: {
    id: 'rome',
    name: 'Eternal Republic',
    people: 'Roman',
    color: '#c1272d',
    colorDark: '#6d1216',
    roof: '#d0643b',
    startTech: 'riding',
    unique: 'legionary',
    replaces: 'warrior',
    bonus: 'All Roads — roads cost 1★ less.',
    blurb: 'Rolling olive hills, vineyards and marble quarries.',
    terrain: { field: 48, forest: 18, mountain: 18, shallow: 10, ocean: 6 },
    resources: { fruit: 1.8, crop: 1, animal: 1, fish: 1, ore: 1.3 },
    palette: { field: '#7ccf4c', fieldSide: '#8d5c35', forest: '#3aad52', trunk: '#6a4526', mountain: '#a6abb3', mountainShade: '#71777f', snow: '#f6fdff', shallow: '#86dcf4', ocean: '#3288d8' },
    cityNames: ['Ostia', 'Capua', 'Veii', 'Tibur', 'Neapolis', 'Ravenna', 'Mediolanum', 'Aquileia', 'Brundisium', 'Arretium', 'Pisae', 'Verona'],
  },
  pirates: {
    id: 'pirates',
    name: 'Brethren of the Coast',
    people: 'Pirate',
    color: '#7a8394',
    colorDark: '#2b2f38',
    roof: '#5a3b2a',
    startTech: 'fishing',
    unique: 'buccaneer',
    replaces: 'archer',
    bonus: 'Sea Raiders — boats and ships move 1 extra tile and attack +1; ports cost 4★ and earn +1★ a turn.',
    blurb: 'Craggy islets, hidden coves, iron ore and passing whales.',
    terrain: { field: 30, forest: 12, mountain: 24, shallow: 18, ocean: 16 },
    resources: { ore: 2, whale: 2, fish: 1.2, fruit: 0.7, crop: 0.6, animal: 0.7 },
    palette: { field: '#8dbb6a', fieldSide: '#5a4838', forest: '#2d7a4f', trunk: '#4a3322', mountain: '#7e7b86', mountainShade: '#53505a', snow: '#e6eff7', shallow: '#66c6d8', ocean: '#1f6aa8' },
    cityNames: ['Blackwater', 'Skull Cove', 'Port Rum', 'Gallows Bay', 'Tortuga Rock', "Kraken's Rest", 'Saltmarsh', 'Barnacle Key', 'Cutlass Point', 'Driftwood', 'Stormhaven', 'Gunpowder Isle'],
  },
};

export const TRIBE_IDS: TribeId[] = ['egypt', 'aztec', 'polynesia', 'rome', 'pirates'];

/** The unit used as an empire's face in menus: its unique unit, or its warrior when that unit is a boat. */
export function portraitKind(tribe: TribeId): UnitKind {
  const u = TRIBES[tribe].unique;
  return u === 'waka' ? unitFor(tribe, 'warrior') : u;
}

export function unitFor(tribe: TribeId, base: UnitKind): UnitKind {
  const t = TRIBES[tribe];
  return t.replaces === base ? t.unique : base;
}
