// Each empire's own skill line: three techs in a chain that only that people can research. They form the middle
// "Master Culture" ring of the skill tree: the chain branches off a relevant base tech (PARENT), so the line opens once
// that tech is known. What they do is a list of perks (see game/perks.ts), so the rules and the AI treat them alike; a
// `note` perk describes an effect the empire's own mechanic applies (game/mech/<id>.ts checks for the tech).
import type { Perk } from '../game/perks';
import type { TribeId } from '../game/types';

export interface UniqueTech {
  id: string; // e.g. 'egypt:2'
  name: string;
  tier: 1 | 2 | 3;
  tribe: TribeId;
  parent: string; // the tech this one follows: the base tech for tier 1, the previous one after
  flavor: string;
  perks: Perk[];
}

type Row = [name: string, flavor: string, perks: Perk[]];

// Solar Ascension (the Aztec line's capstone; applied by game/mech/aztec.ts)
export const SOLAR_SUN_COST = 2;
export const SOLAR_CITY_STARS = 1;

const LINES: Record<TribeId, [Row, Row, Row]> = {
  egypt: [
    ['Nilometer', 'Priests read the river to plan the harvest.', [{ k: 'income', per: 'farm', n: 0.5 }]],
    ['Chariot Corps', 'Royal charioteers, trained from boyhood.', [{ k: 'atk', n: 0.5, who: 'mounted' }, { k: 'cost', of: 'mounted', n: 1 }]],
    ['Temples of Ra', 'Gold and grain flow to the temple granaries.', [{ k: 'income', per: 'temple', n: 1 }, { k: 'income', per: 'capital', n: 1 }]],
  ],
  aztec: [
    ['Sacrificial Rites', 'Every defeated foe is a gift to the sun.', [{ k: 'refund', n: 0.2 }]],
    ['Sun Altars', 'Gold-leafed altars atop every pyramid.', [{ k: 'income', per: 'altar', n: 2 }, { k: 'levelstar', n: 1 }]],
    ['Solar Ascension', 'The fifth sun rises over Tenochtitlan.', [{ k: 'note', text: `A Sun Age needs ${SOLAR_SUN_COST} captives instead of 3, and while it burns every city pays +${SOLAR_CITY_STARS}★ a turn.` }]],
  ],
  polynesia: [
    ['Double-Hulled Waka', 'Lashed hulls carry whole families over the ocean.', [{ k: 'move', n: 1, who: 'naval' }]],
    ['Wayfinding Chants', 'Songs that hold a map of stars, swells and birds.', [{ k: 'vision', n: 1 }]],
    ['Kūmara Gardens', 'Sweet potato and a sea full of fish.', [{ k: 'grow', on: 'fish', n: 1 }, { k: 'income', per: 'port', n: 1 }]],
  ],
  rome: [
    ['Paved Highways', 'All roads lead to the city, whatever the ground.', [{ k: 'highway', n: 1 }]],
    ['Castra Outposts', 'Every marching camp a fortress.', [{ k: 'cost', of: 'melee', n: 1 }, { k: 'note', text: 'Building a Castra is free, it gives +1 more defence, and every standing fort pays +1★ a turn.' }]],
    ['Pax Romana', 'Peace, order and taxes.', [{ k: 'pax', n: 1 }]],
  ],
  pirates: [
    ['Cutlass Drill', 'Boarding parties who fight like fiends.', [{ k: 'atk', n: 1, who: 'naval' }]],
    ['Ransom Trade', 'Every prisoner has a price.', [{ k: 'kill', n: 1 }]],
    ['Pieces of Eight', 'A hoard in every harbour.', [{ k: 'income', per: 'port', n: 1 }, { k: 'income', per: 'capital', n: 1 }]],
  ],
  vikings: [
    ['Longship Raiders', 'Shallow-draught ships that strike from nowhere.', [{ k: 'move', n: 1, who: 'naval' }]],
    ['Shield Wall', 'Overlapping shields in the woods.', [{ k: 'def', n: 0.5, who: 'melee' }, { k: 'terrain', on: 'forest', n: 0.5 }]],
    ['Valhalla’s Call', 'The fallen feast; the living fight on.', [{ k: 'kill', n: 1 }, { k: 'heal', n: 2 }]],
  ],
  japan: [
    ['Bushidō', 'The way of the warrior.', [{ k: 'atk', n: 0.5, who: 'unique' }, { k: 'terrain', on: 'own', n: 0.5 }]],
    ['Tea Ceremony', 'Calm, craft and refinement.', [{ k: 'income', per: 'temple', n: 1 }, { k: 'grow', on: 'temple', n: 1 }]],
    ['Castle Towns', 'Stone keeps above thriving markets.', [{ k: 'terrain', on: 'city', n: 1 }, { k: 'income', per: 'capital', n: 1 }]],
  ],
  mongols: [
    ['Composite Bows', 'Horn, wood and sinew: a bow that outshoots any.', [{ k: 'atk', n: 0.5, who: 'ranged' }]],
    ['Yam Relay', 'A chain of post-horses across the steppe.', [{ k: 'move', n: 1, who: 'mounted' }]],
    ['Khan’s Tribute', 'Conquered peoples pay in silver and horses.', [{ k: 'kill', n: 1 }, { k: 'cost', of: 'mounted', n: 1 }]],
  ],
  greeks: [
    ['Phalanx', 'A wall of bronze and spears.', [{ k: 'def', n: 0.5, who: 'melee' }]],
    ['Agora', 'The open market of the polis.', [{ k: 'income', per: 'market', n: 1 }]],
    ['Lyceum', 'Teachers and students of every science.', [{ k: 'cost', of: 'tech', n: 1 }, { k: 'levelstar', n: 2 }]],
  ],
  zulu: [
    ['Iklwa Drill', 'The short stabbing spear and how to use it.', [{ k: 'atk', n: 0.5, who: 'unique' }]],
    ['Cow-Horn Formation', 'Chest and horns: encircle the enemy.', [{ k: 'move', n: 1, who: 'unique' }]],
    ['Shaka’s Regiments', 'Age-regiments, drilled and devoted.', [{ k: 'atk', n: 0.5, who: 'melee' }, { k: 'cost', of: 'melee', n: 1 }]],
  ],
  persia: [
    ['Royal Post', 'Messengers race the royal road.', [{ k: 'vision', n: 1 }]],
    ['Immortal Guard', 'Ten thousand, always at full strength.', [{ k: 'atk', n: 0.5, who: 'unique' }, { k: 'def', n: 0.5, who: 'unique' }]],
    ['Satrapies', 'Provinces that send tribute to the king.', [{ k: 'income', per: 'capital', n: 2 }, { k: 'levelstar', n: 2 }]],
  ],
  celts: [
    ['Oak Groves', 'Sacred woods that hide the clans.', [{ k: 'terrain', on: 'forest', n: 0.5 }]],
    ['Druidic Lore', 'Healers and keepers of the forest.', [{ k: 'grow', on: 'lumber', n: 1 }, { k: 'heal', n: 1 }]],
    ['High Kings', 'Chieftains who rally every clan.', [{ k: 'atk', n: 0.5, who: 'melee' }, { k: 'kill', n: 1 }]],
  ],
  inuit: [
    ['Glacial Footing', 'Sure feet on the sea ice.', [{ k: 'terrain', on: 'ice', n: 0.5 }, { k: 'note', text: 'Every tile of water you freeze pays +1★.' }]],
    ['Deep Whaling', 'Umiak crews that hunt the great whales.', [{ k: 'note', text: 'Renewable whale and fish harvests pay 50% more Stars and re-freeze 2 turns sooner.' }]],
    ['Sub-Zero Aura', 'The cold itself fights for the people of the ice.', [{ k: 'note', text: 'Ice chills enemies for 1 more damage, every chilled enemy pays +1★, and cities freeze a shallow every 2 turns.' }]],
  ],
  inca: [
    ['Mit’a Labour', 'Every household lends its hands.', [{ k: 'grow', on: 'mine', n: 1 }]],
    ['Andean Roads', 'A road network across the mountains.', [{ k: 'income', per: 'road', n: 1 }]],
    ['Sapa Inca’s Terraces', 'Stone terraces up every slope.', [{ k: 'terrain', on: 'mountain', n: 0.5 }, { k: 'income', per: 'mine', n: 0.5 }]],
  ],
  ethiopia: [
    ['Rock-Hewn Churches', 'Carved from a single stone.', [{ k: 'income', per: 'temple', n: 1 }]],
    ['Shotel Guard', 'Curved blades that reach round a shield.', [{ k: 'atk', n: 0.5, who: 'unique' }, { k: 'def', n: 0.5, who: 'unique' }]],
    ['Highland Bastion', 'Fortress plateaus of the north.', [{ k: 'terrain', on: 'mountain', n: 0.5 }, { k: 'heal', n: 2 }]],
  ],
  aboriginal: [
    ['Bush Tucker', 'A country that feeds those who know it.', [{ k: 'grow', on: 'fruit', n: 1 }, { k: 'grow', on: 'animal', n: 1 }]],
    ['Songlines', 'Songs that map every waterhole and track.', [{ k: 'vision', n: 1 }]],
    ['Boomerang Masters', 'Hunters whose throws never miss.', [{ k: 'atk', n: 0.5, who: 'ranged' }, { k: 'atk', n: 0.5, who: 'unique' }]],
  ],
  china: [
    ['Paper and Printing', 'Knowledge, copied and spread.', [{ k: 'cost', of: 'tech', n: 1 }]],
    ['Silk Guilds', 'Looms and traders of the Silk Road.', [{ k: 'income', per: 'market', n: 1 }]],
    ['Great Wall', 'A wall the length of a frontier.', [{ k: 'terrain', on: 'own', n: 0.5 }, { k: 'terrain', on: 'city', n: 1 }]],
  ],
  india: [
    ['Ayurveda', 'The science of life and healing.', [{ k: 'heal', n: 2 }]],
    ['Spice Trade', 'Pepper and cinnamon for the world.', [{ k: 'income', per: 'port', n: 1 }, { k: 'income', per: 'market', n: 0.5 }]],
    ['Elephant Corps', 'Armoured giants on the battlefield.', [{ k: 'atk', n: 1, who: 'unique' }]],
  ],
  mali: [
    ['Gold-Salt Caravans', 'Gold from the south, salt from the north.', [{ k: 'income', per: 'market', n: 1 }]],
    ['Timbuktu Scholars', 'Libraries famed across the world.', [{ k: 'cost', of: 'tech', n: 1 }, { k: 'levelstar', n: 1 }]],
    ['Mansa’s Cavalry', 'The emperor’s riders, gold-harnessed.', [{ k: 'atk', n: 0.5, who: 'mounted' }, { k: 'move', n: 1, who: 'mounted' }]],
  ],
  lakota: [
    ['Buffalo Hunt', 'The herds feed the nation.', [{ k: 'grow', on: 'animal', n: 1 }]],
    ['Pony Herds', 'Riders raised with their horses.', [{ k: 'cost', of: 'mounted', n: 1 }, { k: 'atk', n: 0.5, who: 'mounted' }]],
    ['Warrior Societies', 'Bands sworn to protect the people.', [{ k: 'atk', n: 0.5, who: 'melee' }, { k: 'kill', n: 1 }]],
  ],
  ottoman: [
    ['Timar Fiefs', 'Land granted for service to the sultan.', [{ k: 'income', per: 'farm', n: 0.5 }]],
    ['Great Bombards', 'Cannon that breach any wall.', [{ k: 'atk', n: 1, who: 'siege' }, { k: 'cost', of: 'siege', n: 1 }]],
    ['Devşirme', 'The corps of the sultan’s own soldiers.', [{ k: 'atk', n: 0.5, who: 'unique' }, { k: 'cost', of: 'ranged', n: 1 }]],
  ],
  maya: [
    ['Long Count Calendar', 'Time counted in ages.', [{ k: 'income', per: 'temple', n: 1 }]],
    ['Observatory', 'Astronomers who follow Venus.', [{ k: 'vision', n: 1 }, { k: 'grow', on: 'temple', n: 1 }]],
    ['Stelae of the Kings', 'Carved histories in stone.', [{ k: 'levelstar', n: 3 }, { k: 'income', per: 'capital', n: 1 }]],
  ],
  korea: [
    ['Hangul', 'An alphabet anyone can learn.', [{ k: 'cost', of: 'tech', n: 1 }]],
    ['Geobukseon Yards', 'Armoured turtle ships.', [{ k: 'atk', n: 1, who: 'naval' }, { k: 'def', n: 1, who: 'naval' }]],
    ['Hwacha Arsenals', 'Racks of rocket arrows.', [{ k: 'atk', n: 1, who: 'siege' }, { k: 'cost', of: 'siege', n: 2 }]],
  ],
  khmer: [
    ['Barays', 'Vast reservoirs for the rice.', [{ k: 'income', per: 'farm', n: 0.5 }]],
    ['Temple-Mountains', 'Angkor rises tier by tier.', [{ k: 'income', per: 'temple', n: 1 }, { k: 'grow', on: 'temple', n: 1 }]],
    ['Naga Guard', 'Serpent-guardians of the gates.', [{ k: 'def', n: 1, who: 'unique' }]],
  ],
  swahili: [
    ['Dhow Trade', 'Cloth, ivory and gold by monsoon.', [{ k: 'income', per: 'port', n: 1 }]],
    ['Coral-Stone Cities', 'Whitewashed walls on the shore.', [{ k: 'terrain', on: 'city', n: 0.5 }, { k: 'levelstar', n: 2 }]],
    ['Monsoon Winds', 'Sailing with the season.', [{ k: 'move', n: 1, who: 'naval' }, { k: 'income', per: 'port', n: 1 }]],
  ],
  tibet: [
    ['Mani Walls', 'Long walls of carved prayer stones.', [{ k: 'terrain', on: 'mountain', n: 0.5 }]],
    ['Yak Herds', 'Wool, milk and hardy mounts.', [{ k: 'grow', on: 'animal', n: 1 }, { k: 'cost', of: 'mounted', n: 1 }]],
    ['Monasteries', 'Learning on every hilltop.', [{ k: 'income', per: 'temple', n: 1 }, { k: 'heal', n: 2 }]],
  ],
};

/** The base tech each empire's line branches off (tied to what the line and the empire's mechanic are about). */
export const LINE_PARENT: Record<TribeId, string> = {
  egypt: 'gathering', aztec: 'hunting', polynesia: 'fishing', rome: 'roads', pirates: 'fishing', vikings: 'fishing',
  japan: 'tactics', mongols: 'riding', greeks: 'tactics', zulu: 'hunting', persia: 'riding', celts: 'hunting',
  inuit: 'sailing', inca: 'climbing', ethiopia: 'climbing', aboriginal: 'gathering', china: 'gathering', india: 'gathering',
  mali: 'riding', lakota: 'hunting', ottoman: 'gathering', maya: 'gathering', korea: 'fishing', khmer: 'gathering',
  swahili: 'fishing', tibet: 'climbing',
};

export const UNIQUE_TECHS: UniqueTech[] = (Object.keys(LINES) as TribeId[]).flatMap((tribe) =>
  LINES[tribe].map(([name, flavor, perks], i) => ({
    id: `${tribe}:${i + 1}`, name, tier: (i + 1) as 1 | 2 | 3, tribe, flavor, perks, parent: i === 0 ? LINE_PARENT[tribe] : `${tribe}:${i}`,
  })));
export const UNIQUE_BY_ID: Record<string, UniqueTech> = Object.fromEntries(UNIQUE_TECHS.map((t) => [t.id, t]));
