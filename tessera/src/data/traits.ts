// What each people was historically good and bad at. Every empire has its signature bonus (see tribes.ts), plus one
// more strength and two weaknesses drawn from its history. They are always active, for players and the AI alike.
import type { Perk } from '../game/perks';
import type { TribeId } from '../game/types';

export interface Trait {
  name: string;
  why: string; // the history behind it
  perks: Perk[];
}

const T = (name: string, why: string, ...perks: Perk[]): Trait => ({ name, why, perks });

export const TRAITS: Record<TribeId, { pros: Trait[]; cons: Trait[] }> = {
  egypt: {
    pros: [T('Pyramid Builders', 'Thousands of workers raised the great monuments.', { k: 'cost', of: 'temple', n: 2 })],
    cons: [
      T('Late to Iron', 'Egypt worked bronze long after its rivals had iron.', { k: 'techcost', tech: 'smithing', n: 2 }, { k: 'def', n: -0.5, who: 'melee' }),
      T('Children of the River', 'Life clung to the Nile; the open sea was rarely sailed.', { k: 'move', n: -1, who: 'naval' }),
    ],
  },
  aztec: {
    pros: [T('Warriors Take Captives', 'Aztec wars sought prisoners and glory.', { k: 'kill', n: 1 })],
    cons: [
      T('No Horses', 'The Americas had no draft animals or war-horses.', { k: 'cost', of: 'mounted', n: -2 }),
      T('Stone-Age Weapons', 'Obsidian, not iron, edged their clubs.', { k: 'techcost', tech: 'smithing', n: 2 }, { k: 'terrain', on: 'city', n: -0.5 }),
    ],
  },
  polynesia: {
    pros: [T('Master Navigators', 'Wayfinders crossed the greatest ocean on Earth.', { k: 'move', n: 1, who: 'naval' })],
    cons: [
      T('No Metal', 'Pounamu and wood, never bronze or iron.', { k: 'techcost', tech: 'mining', n: 1 }, { k: 'techcost', tech: 'smithing', n: 1 }),
      T('No Beasts of Burden', 'There were no horses in Aotearoa.', { k: 'cost', of: 'mounted', n: -2 }),
    ],
  },
  rome: {
    pros: [T('Legion Discipline', 'Drill and iron order made the legions.', { k: 'def', n: 0.5, who: 'melee' })],
    cons: [
      T('Senatorial Politics', 'Endless debate slowed every reform.', { k: 'cost', of: 'tech', n: -1 }),
      T('Reluctant Sailors', 'Rome only took to the sea when it had to.', { k: 'move', n: -1, who: 'naval' }),
    ],
  },
  pirates: {
    pros: [T('Loot and Ransom', 'Every prize ship paid.', { k: 'kill', n: 1 })],
    cons: [
      T('No Farmland', 'The brotherhood lived off the sea, not the soil.', { k: 'grow', on: 'farm', n: -1 }),
      T('Sailors, not Soldiers', 'A crew fights hard, but not in a shield-wall.', { k: 'def', n: -0.5, who: 'melee' }),
    ],
  },
  vikings: {
    pros: [T('Raiders of the Coast', 'Longships struck from the sea, and struck again.', { k: 'move', n: 1, who: 'naval' })],
    cons: [
      T('Short Growing Season', 'Greenland and Norway grew thin crops.', { k: 'grow', on: 'farm', n: -1 }),
      T('Oral Tradition', 'Sagas were spoken, not written; learning spread slowly.', { k: 'cost', of: 'tech', n: -1 }),
    ],
  },
  japan: {
    pros: [T('Way of the Warrior', 'The samurai class lived for the blade.', { k: 'atk', n: 0.5, who: 'melee' })],
    cons: [
      T('Seclusion', 'Japan closed its ports for centuries.', { k: 'move', n: -1, who: 'naval' }),
      T('Rigid Feudal Order', 'Loyalty was to the lord and the home domain.', { k: 'terrain', on: 'away', n: -0.5 }),
    ],
  },
  mongols: {
    pros: [T('Horse Archers', 'Riders shot from the saddle at a gallop.', { k: 'atk', n: 0.5, who: 'mounted' })],
    cons: [
      T('Nomads, not Builders', 'They moved with the herds and raised few monuments.', { k: 'cost', of: 'build', n: -2 }),
      T('Herders, not Farmers', 'The steppe grew grass, not grain.', { k: 'grow', on: 'farm', n: -2 }),
    ],
  },
  greeks: {
    pros: [T('Phalanx Discipline', 'Bronze-shielded citizen hoplites stood shoulder to shoulder.', { k: 'def', n: 0.5, who: 'melee' })],
    cons: [
      T('Quarrelling City-States', 'Athens, Sparta and Thebes were forever at odds.', { k: 'cost', of: 'melee', n: -1 }),
      T('Rocky, Thin Soil', 'Greek hills gave poor harvests, so building cost dear.', { k: 'cost', of: 'build', n: -1 }),
    ],
  },
  zulu: {
    pros: [T('Age-Regiments', 'Shaka drilled the impis into a single fighting machine.', { k: 'move', n: 1, who: 'unique' })],
    cons: [
      T('No Sea Tradition', 'The kingdom looked inland, to cattle and the veldt.', { k: 'move', n: -1, who: 'naval' }),
      T('Oral Learning', 'Knowledge passed by word of mouth.', { k: 'cost', of: 'tech', n: -1 }),
      T('Cattle Economy', 'Wealth was counted in cattle, not fields.', { k: 'grow', on: 'farm', n: -1 }),
    ],
  },
  persia: {
    pros: [T('The King’s Eyes and Ears', 'Royal messengers and spies watched every satrapy.', { k: 'vision', n: 1 })],
    cons: [
      T('Multi-Ethnic Levies', 'Conscripts of a dozen nations fought without one drill.', { k: 'atk', n: -0.5, who: 'melee' }),
      T('Alexander’s Lesson', 'Rich cities fell to a bold enemy.', { k: 'terrain', on: 'city', n: -0.5 }),
    ],
  },
  celts: {
    pros: [T('Fierce in Battle', 'Roman writers feared the charge of the Celts.', { k: 'atk', n: 0.5, who: 'melee' })],
    cons: [
      T('Tribal Fragmentation', 'Clans seldom stood together for long.', { k: 'cost', of: 'tech', n: -1 }),
      T('Timber Hillforts', 'Earth and wood, not Roman stone.', { k: 'terrain', on: 'city', n: -0.5 }),
    ],
  },
  inuit: {
    pros: [T('Masters of the Hunt', 'Every hunt feeds a whole camp through the winter.', { k: 'harvestStar', n: 1 })],
    cons: [
      T('No Agriculture', 'Nothing grows on the ice.', { k: 'grow', on: 'farm', n: -2 }),
      T('No Metal', 'Bone, ivory and stone, but no smelting.', { k: 'techcost', tech: 'smithing', n: 2 }, { k: 'techcost', tech: 'mining', n: 2 }),
    ],
  },
  inca: {
    pros: [T('Qhapaq Ñan', 'A road network of 40,000 km across the Andes.', { k: 'cost', of: 'road', n: 1 })],
    cons: [
      T('No Wheel or Horse', 'Llamas carried loads; no cavalry rode out.', { k: 'cost', of: 'mounted', n: -2 }),
      T('Landlocked Highlands', 'The empire looked to the mountains, not the sea.', { k: 'move', n: -1, who: 'naval' }),
    ],
  },
  ethiopia: {
    pros: [T('Christian Kingdom', 'Churches and monasteries anchored the realm.', { k: 'income', per: 'temple', n: 1 }, { k: 'terrain', on: 'mountain', n: 0.5 })],
    cons: [
      T('Cut Off from the Sea', 'The Red Sea coast was lost to rivals.', { k: 'move', n: -1, who: 'naval' }),
      T('Isolated Highlands', 'Contact with the wider world was slow.', { k: 'vision', n: -1 }),
    ],
  },
  aboriginal: {
    pros: [T('Knowledge of Country', 'Every waterhole and track is known and sung.', { k: 'vision', n: 1 })],
    cons: [
      T('No Farming Tradition', 'Fire-managed hunting and gathering, not ploughing.', { k: 'techcost', tech: 'farming', n: 2 }, { k: 'grow', on: 'farm', n: -1 }, { k: 'cost', of: 'tech', n: -1 }),
      T('No Beasts of Burden', 'No horses or oxen before European ships.', { k: 'cost', of: 'mounted', n: -2 }, { k: 'techcost', tech: 'smithing', n: 2 }),
    ],
  },
  china: {
    pros: [T('Teeming Population', 'The largest population in the world fed its cities.', { k: 'levelstar', n: 1 })],
    cons: [
      T('Closed Empire', 'Ming China turned its treasure fleets around.', { k: 'move', n: -1, who: 'naval' }),
      T('Slow Bureaucracy', 'Officials were many; siege trains were slow to fund.', { k: 'cost', of: 'siege', n: -1 }),
    ],
  },
  india: {
    pros: [T('Fertile Ganges', 'The river plains fed some of the earliest great cities.', { k: 'grow', on: 'farm', n: 1 })],
    cons: [
      T('Imported Horses', 'Good war-horses came over the mountains at great cost.', { k: 'cost', of: 'mounted', n: -2 }),
      T('Warring Rajas', 'Rival kingdoms rarely united against a common foe.', { k: 'terrain', on: 'city', n: -0.5 }),
    ],
  },
  mali: {
    pros: [T('Hajj Wealth', 'Mansa Musa’s pilgrimage flooded Cairo with gold.', { k: 'levelstar', n: 1 })],
    cons: [
      T('Landlocked Sahel', 'The empire lay far from the coast.', { k: 'move', n: -1, who: 'naval' }),
      T('Fragile Union', 'After Mansa Musa the great empire began to fray.', { k: 'vision', n: -1 }),
    ],
  },
  lakota: {
    pros: [T('The Buffalo Nation', 'The bison gave food, hide and shelter.', { k: 'grow', on: 'animal', n: 1 })],
    cons: [
      T('Nomads of the Plains', 'Camps moved with the herds and built little that lasted.', { k: 'cost', of: 'build', n: -1 }),
      T('No Metalworking', 'Stone and bone until trade brought iron.', { k: 'techcost', tech: 'smithing', n: 2 }, { k: 'techcost', tech: 'farming', n: 2 }),
    ],
  },
  ottoman: {
    pros: [T('Janissary Corps', 'The sultan’s slave-soldiers were the first standing army.', { k: 'atk', n: 0.5, who: 'ranged' })],
    cons: [
      T('Conservative Ulema', 'Religious scholars resisted new learning.', { k: 'cost', of: 'tech', n: -1 }),
      T('Tax-Farming', 'Corrupt tax collectors drained the markets.', { k: 'income', per: 'market', n: -0.5 }),
    ],
  },
  maya: {
    pros: [T('Sky Watchers', 'Astronomers charted Venus and the eclipses.', { k: 'vision', n: 1 })],
    cons: [
      T('No Horses or Iron', 'Flint, obsidian and feet.', { k: 'cost', of: 'mounted', n: -2 }, { k: 'techcost', tech: 'smithing', n: 1 }),
      T('Warring City-States', 'Tikal, Calakmul and their neighbours fought endlessly.', { k: 'terrain', on: 'city', n: -0.5 }),
    ],
  },
  korea: {
    pros: [T('Turtle Ships', 'Yi Sun-sin’s armoured ships broke the Japanese fleet.', { k: 'atk', n: 1, who: 'naval' })],
    cons: [
      T('Hermit Kingdom', 'Joseon shut its gates to outsiders.', { k: 'vision', n: -1 }),
      T('Invaded from All Sides', 'Mongols, Japanese and Manchus each came in turn.', { k: 'terrain', on: 'city', n: -0.5 }),
    ],
  },
  khmer: {
    pros: [T('Jungle Fighters', 'Khmer armies fought in the forests around Angkor.', { k: 'terrain', on: 'forest', n: 0.5 })],
    cons: [
      T('Landbound Empire', 'Angkor’s fleets were rivers, not oceans.', { k: 'move', n: -1, who: 'naval' }),
      T('Forced Labour', 'The great temples cost a fortune in work.', { k: 'cost', of: 'temple', n: -2 }),
    ],
  },
  swahili: {
    pros: [T('Coastal Fortresses', 'Coral-stone walls defended the trading cities.', { k: 'terrain', on: 'city', n: 0.5 })],
    cons: [
      T('Traders, not Soldiers', 'Merchant-princes hired guards rather than raising legions.', { k: 'atk', n: -0.5, who: 'melee' }),
      T('Rival Sultanates', 'Kilwa, Mombasa and Lamu seldom cooperated.', { k: 'vision', n: -1 }),
    ],
  },
  tibet: {
    pros: [T('High-Altitude Endurance', 'Thin air toughens body and lungs.', { k: 'heal', n: 1 })],
    cons: [
      T('Thin Soil', 'Barley grows only in the valleys.', { k: 'grow', on: 'farm', n: -1 }),
      T('Landlocked Plateau', 'No sea for a thousand miles.', { k: 'move', n: -1, who: 'naval' }),
    ],
  },
  carthage: {
    pros: [T('Merchant Princes', 'Carthage ran the trade of the western sea.', { k: 'route', n: 0.25 })],
    cons: [
      T('Hired Armies', 'Carthage paid mercenaries rather than raising its own citizens.', { k: 'def', n: -0.5, who: 'melee' }),
      T('Borrowed Horsemen', 'Its cavalry was Numidian, lent by allies.', { k: 'techcost', tech: 'riding', n: 2 }),
    ],
  },
  byzantium: {
    pros: [T('Imperial Bureaucracy', 'Tax rolls, mints and logothetes in every province.', { k: 'levelstar', n: 2 })],
    cons: [
      T('Endless Frontiers', 'Enemies on every border stretched its armies thin.', { k: 'terrain', on: 'away', n: -0.5 }),
      T('Iconoclasm', 'Quarrels over holy images split the church.', { k: 'cost', of: 'temple', n: -2 }),
    ],
  },
  arabia: {
    pros: [T('Desert Caravans', 'Camel trains linked India, Africa and the Mediterranean.', { k: 'route', n: 0.25 })],
    cons: [
      T('Few Forests', 'Timber for ships had to be brought from afar.', { k: 'cost', of: 'naval', n: -1 }),
      T('Tribal Rivalries', 'Old clan feuds never quite died.', { k: 'def', n: -0.5, who: 'melee' }),
    ],
  },
  rus: {
    pros: [T('Stubborn Defenders', 'Besieged towns of Rus fought to the last log wall.', { k: 'def', n: 0.5, who: 'melee' })],
    cons: [
      T('Frozen Ports', 'Ice shut the northern harbours half the year.', { k: 'move', n: -1, who: 'naval' }),
      T('Rasputitsa', 'Spring mud swallowed every road.', { k: 'techcost', tech: 'roads', n: 2 }),
    ],
  },
  vietnam: {
    pros: [T('Rice Bowl', 'Two harvests a year from the river deltas.', { k: 'income', per: 'farm', n: 0.5 })],
    cons: [
      T('Few Horses', 'Rice country bred buffalo, not war-horses.', { k: 'cost', of: 'mounted', n: -1 }),
      T('Northern Shadow', 'A giant neighbour always watched the border.', { k: 'vision', n: -1 }),
    ],
  },
};
