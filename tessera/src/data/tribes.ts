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
    name: 'Iwi of Aotearoa',
    people: 'Māori',
    color: '#33333d',
    colorDark: '#0e0e13',
    roof: '#c9a45a',
    startTech: 'fishing',
    unique: 'waka',
    replaces: 'boat',
    bonus: 'Wayfinding — board boats from any coast, no port needed.',
    blurb: 'Black, red and white on green hills, tree ferns and carved meeting houses along a long, fish-rich coast.',
    terrain: { field: 34, forest: 22, mountain: 12, shallow: 20, ocean: 12 },
    resources: { fish: 2, fruit: 0.9, crop: 1.3, whale: 1.4, animal: 0.9, ore: 0.6 },
    palette: { field: '#7ccb52', fieldSide: '#8a6a3f', forest: '#1f8a4c', trunk: '#6b5a3a', mountain: '#6c7884', mountainShade: '#454e58', snow: '#f4fbff', shallow: '#62dccf', ocean: '#1c86c4' },
    cityNames: ['Rotorua', 'Tauranga', 'Whanganui', 'Taupo', 'Kaikoura', 'Whakatane', 'Otaki', 'Waitomo', 'Rangiora', 'Maketu', 'Kaitaia', 'Hokianga'],
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
  vikings: {
    id: 'vikings',
    name: 'Northern Jarldom',
    people: 'Viking',
    color: '#3a78c9',
    colorDark: '#173b6b',
    roof: '#5a4030',
    startTech: 'climbing',
    unique: 'berserker',
    replaces: 'swordsman',
    bonus: 'Victory Feast — a unit heals 3 HP whenever it wins a fight.',
    blurb: 'Snowy fjords, dark pine woods and ore-rich peaks.',
    terrain: { field: 30, forest: 26, mountain: 22, shallow: 12, ocean: 10 },
    resources: { ore: 1.6, animal: 1.5, fish: 1.3, fruit: 0.6, crop: 0.5, whale: 1.3 },
    palette: { field: '#b9d69a', fieldSide: '#7c6a58', forest: '#2e6b4f', trunk: '#4a3526', mountain: '#9aa4b2', mountainShade: '#6a7482', snow: '#ffffff', shallow: '#7fcfe0', ocean: '#27679e' },
    cityNames: ['Hedeby', 'Birka', 'Kaupang', 'Uppsala', 'Jorvik', 'Trondheim', 'Ribe', 'Sigtuna', 'Roskilde', 'Lade', 'Skiringssal', 'Gokstad'],
  },
  japan: {
    id: 'japan',
    name: 'Rising Sun Shogunate',
    people: 'Japanese',
    color: '#8b4fc4',
    colorDark: '#472370',
    roof: '#3e4550',
    startTech: 'fishing',
    unique: 'samurai',
    replaces: 'swordsman',
    bonus: 'Home Ground — units get +1 defence inside your borders.',
    blurb: 'Misty mountains, cherry blossom groves and rich fishing bays.',
    terrain: { field: 34, forest: 20, mountain: 22, shallow: 16, ocean: 8 },
    resources: { fish: 1.8, fruit: 1.2, crop: 1, animal: 0.8, ore: 1 },
    palette: { field: '#92cf62', fieldSide: '#7a5a3a', forest: '#f2a7c3', trunk: '#5a3a2a', mountain: '#8e95a0', mountainShade: '#5f6670', snow: '#ffffff', shallow: '#78dcd8', ocean: '#2a86c4' },
    cityNames: ['Kamakura', 'Nara', 'Heian', 'Edo', 'Sakai', 'Hakata', 'Nagato', 'Izumo', 'Kiso', 'Odawara', 'Kanazawa', 'Hirado'],
  },
  mongols: {
    id: 'mongols',
    name: 'Horde of the Endless Sky',
    people: 'Mongol',
    color: '#e0762a',
    colorDark: '#7a3a0c',
    roof: '#f2ecde',
    startTech: 'riding',
    unique: 'horsearcher',
    replaces: 'archer',
    bonus: 'Steppe Riders — mounted units cost 1★ less.',
    blurb: 'Wide grassy steppe under a huge sky, dotted with herds.',
    terrain: { field: 64, forest: 6, mountain: 14, shallow: 10, ocean: 6 },
    resources: { animal: 1.8, fruit: 1.2, crop: 0.9, fish: 0.7, ore: 1 },
    palette: { field: '#b3d36a', fieldSide: '#8a6a42', forest: '#5f9a3c', trunk: '#6a4a2a', mountain: '#b09a80', mountainShade: '#80705c', snow: '#fbf6ea', shallow: '#88d8d0', ocean: '#3a8cc4' },
    cityNames: ['Karakorum', 'Avarga', 'Khar Balgas', 'Otrar', 'Almalik', 'Sarai', 'Khovd', 'Delgerkhaan', 'Olon Nuur', 'Tsetserleg', 'Bulgan', 'Onon'],
  },
  greeks: {
    id: 'greeks',
    name: 'League of the Aegean',
    people: 'Greek',
    color: '#19a3b8',
    colorDark: '#0a5663',
    roof: '#3f7fc2',
    startTech: 'gathering',
    unique: 'hoplite',
    replaces: 'defender',
    bonus: 'Academy — every tech costs 1★ less.',
    blurb: 'Sunny olive groves, white rocky hills and a sparkling sea.',
    terrain: { field: 44, forest: 14, mountain: 18, shallow: 16, ocean: 8 },
    resources: { fruit: 1.8, crop: 1.2, fish: 1.2, animal: 0.7, ore: 1 },
    palette: { field: '#a9cf6a', fieldSide: '#b99a72', forest: '#7a9a4a', trunk: '#6a5a44', mountain: '#d8d2c4', mountainShade: '#a8a090', snow: '#ffffff', shallow: '#6ee0f0', ocean: '#1e78c8' },
    cityNames: ['Delphi', 'Corinth', 'Argos', 'Thebes', 'Mycenae', 'Olympia', 'Rhodes', 'Ephesus', 'Miletus', 'Knossos', 'Syracuse', 'Megara'],
  },
  zulu: {
    id: 'zulu',
    name: 'Kingdom of the Heavens',
    people: 'Zulu',
    color: '#8a9a2b',
    colorDark: '#434c10',
    roof: '#c9a45a',
    startTech: 'hunting',
    unique: 'impi',
    replaces: 'warrior',
    bonus: 'Great Hunt — hunting grows a city by 2 instead of 1.',
    blurb: 'Golden savanna, flat-topped acacias and roaming herds.',
    terrain: { field: 54, forest: 14, mountain: 14, shallow: 10, ocean: 8 },
    resources: { animal: 2.2, fruit: 1.2, crop: 0.8, fish: 0.7, ore: 0.9 },
    palette: { field: '#d6c768', fieldSide: '#9a6a3a', forest: '#6a9a3a', trunk: '#5a3a22', mountain: '#b08a6a', mountainShade: '#80604a', snow: '#f6e8d0', shallow: '#80d8c8', ocean: '#2a88b8' },
    cityNames: ['Ulundi', 'Dukuza', 'Nobamba', 'Mgungundlovu', 'Bulawayo', 'Mahlabathini', 'Nongoma', 'Eshowe', 'Isandlwana', 'Kwadukuza', 'Emakhosini', 'Babanango'],
  },
};

export const TRIBE_IDS: TribeId[] = ['egypt', 'aztec', 'polynesia', 'rome', 'pirates', 'vikings', 'japan', 'mongols', 'greeks', 'zulu'];

/** The unit used as an empire's face in menus: its unique unit, or its warrior when that unit is a boat. */
export function portraitKind(tribe: TribeId): UnitKind {
  const u = TRIBES[tribe].unique;
  return u === 'waka' ? unitFor(tribe, 'warrior') : u;
}

export function unitFor(tribe: TribeId, base: UnitKind): UnitKind {
  const t = TRIBES[tribe];
  return t.replaces === base ? t.unique : base;
}
