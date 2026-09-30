# Tessera — how the game works

*Generated from the game's source at v0.27.0 (all numbers below are read from the code). Balance is still being tuned, so numbers may shift.*

## 1. The basics

- A turn-based tile strategy game on an isometric square grid. You play one of **26 empires** against 1–25 computer or hot-seat opponents.
- **Two modes:** *Perfection* — the game ends after a turn limit (default **30 turns**) and the highest **score** wins. *Domination* — no turn limit; last empire standing (or last human alive → best score) wins.
- **Difficulty** (easy / normal / hard): computer players get **+0 / +1 / +2 free Stars each turn**.
- **Start:** every empire begins with **5 Stars**, one capital (level 1) and one warrior. Everything else is hidden by fog.
- **Fog of war:** a tile you have seen stays "explored" forever (you still only see enemy units you currently have eyes on). Cities reveal their border radius +1; units reveal 1 tile (2 from a mountain, 2 for a Pathfinder).
- **Actions per turn:** a unit may move, attack, or (if it has *dash*) move then attack. Tapping a tile opens its menu of things you can buy or do there. Then you press **End Turn**.

## 2. The two resources

### Stars (★) — money
- You earn Stars **at the start of your turn**: `income`, summed over all your cities.
- **City income** = city level + 1 (if it is the capital) + 1 (Workshop) + 1 per Grand Garden + 1 per Market in its territory + 1 if you know Trade + road-network income + empire-specific bonuses (see §7).
- **Road network income:** +1★ if the city's road network reaches another of your cities (one paying link per city) and +1★ per 15 connected road tiles.
- Stars are spent on: **researching techs**, **training units**, **building improvements**, roads, and empire-specific actions.
- One-off sources: whales (+10★), ruins (Buried Treasure +10★), Treasury level-up reward (+5★, +8★ from level 6), clearing forest/draining swamp (+1★), empire kill bounties, etc.

### Population — growth
- Each city has a **level** and a **pop** counter. Population needed to go from level L to L+1 is `L + 1 + max(0, L − 1)`: level 1→2 needs 2, 2→3 needs 4, 3→4 needs 6, 4→5 needs 8, …
- Population comes from developing tiles: **Harvest fruit +1**, **Hunt +1**, **Fish +1** (+2 with Aquaculture), **Farm +2**, **Mine +2**, **Lumber hut +1**, **Temple/Shrine +1**, **Desert irrigation +1** (Egypt farms +3). Neighbouring same-kind lumber huts, ports, temples and markets add **+1 pop per neighbour, up to +2**.
- Roads: 6 connected road tiles → +1 pop, 12 → +1 pop; the first time a road links two of your cities both gain +1 pop (first two links per city).
- Population can also be lost (raids, drains) — a city can drop a level.
- **Each level-up gives a reward choice** (pick one of two):
  - Level 2: Workshop (+1★/turn) **or** Pathfinder (a scout that reveals ~18 steps of land).
  - Level 3: City Walls (garrison defence 4× instead of 1.5×) **or** Treasury (+5★).
  - Level 4: Harvest Festival (+3 pop) **or** Border Growth (territory 3×3 → 5×5).
  - Levels 5 & 8: Grand Garden (+1★/turn, +250 score) **or** a **Colossus** (40-HP champion).
  - Other levels: Grand Garden **or** Treasury (+5★, +8★ from level 6).
- A city **supports `level + 1` units**; you cannot train more than that. Units belong to the city that trained them; if it is lost they become unsupported.

## 3. Techs and the skill tree

- The shared tree has **5 roots**, each with two tier-2 branches leading to one tier-3 tech (25 techs). Each empire also has its **own 3-tech skill line** on a sixth spoke (78 in total) — only that empire can learn it.
- **Tech cost** = `tier × (number of your cities) + 4`, so it gets dearer as you expand. Philosophy makes all future techs 33% cheaper; Greeks pay 1 less; empire traits can add or remove Stars.
- A tech must have its parent researched first (tier-1 techs are always available).

| Root | Tier 2 | Tier 3 |
|---|---|---|
| **Gathering** – harvest fruit | Farming (farms +2 pop); Tactics (Defenders) | Masonry (temples, walls); Engineering (Catapults) |
| **Hunting** – hunt animals | Archery (Archers, forest defence 1.5×); Forestry (lumber huts, clear forest, drain swamp) | Spiritualism (grove shrines +1 pop); Carpentry (markets +1★/turn) |
| **Fishing** – fish, ports | Sailing (Galleys, open ocean); Whaling (+10★ per whale) | Navigation (Triremes); Aquaculture (fish +2 pop) |
| **Riding** – Riders | Roads (roads, network income); Horsemanship (mounted +1 defence) | Trade (+1★ per city); Chivalry (Knights) |
| **Climbing** – walk onto mountains, ×2 defence on them | Mining (mines on ore +2 pop); Meditation (mountain shrines +1 pop) | Smithing (Swordsmen); Philosophy (techs −33%) |

## 4. Units and combat

**Trainable in a city (cost ★):** Warrior 2 · Rider 3 (Riding) · Archer 3 (Archery) · Defender 3 (Tactics) · Swordsman 5 (Smithing) · Catapult 8 (Engineering) · Knight 8 (Chivalry). Each empire replaces some of these with its own unique unit (§7). **Boats** are made by moving a land unit into a port (a boat carries it; upgrades: Canoe → Galley 5★ with Sailing → Trireme 15★ with Navigation). **Colossus** (40 HP) comes from level-up rewards; **Pathfinders** from ruins/rewards.

**Stats** (base): Warrior 10 HP, attack 2, defence 2, move 1 · Rider 10/2/1, move 2 · Archer 10/2/1, range 2 · Defender 15/1/3 · Swordsman 15/3/3 · Catapult 10/4/0, range 3 · Knight 10/3.5/1, move 3 · Galley 10/2/2 move 3 range 2 · Trireme 15/4/3.

**Unit skills:** *dash* – can attack after moving · *escape* – can move after attacking · *persist* – can attack again after a kill · *fortify* – strong defence in own city · *forestwalk* – moves freely through forest · *amphibious* – wades through shallows · *carry* – carries a land unit · *plunder* – loots on kills · *scout* – Pathfinder.

**Movement:** each tile costs 1 point; roads (or city tiles) linked road-to-road cost 0.5. A unit must **stop** when it enters: a mountain (needs Climbing), forest (unless forestwalk or road), swamp (unless road), any tile next to an enemy (zone of control), a port when boarding. You cannot walk through units. Boats: shallows freely, deep ocean only as Galley/Trireme; landing ends the move.

**Combat formula:**
- attack force = attack × (attacker HP / max HP)
- defence force = defence × (defender HP / max HP) × **terrain bonus**
- damage dealt = `round( attackForce / (attackForce + defenceForce) × attack × 4.5 )`
- If the defender survives and the attacker is within the defender's range, it **counter-attacks** with `round( defenceForce / total × defence × 4.5 )`.
- **Terrain bonus:** ×1.5 in your own city (×4 with City Walls, for fortify units), ×2 on a mountain (Climbing), ×1.5 in forest with Archery, ×1.5 in swamp, ×1.5 afloat with Aquaculture, else ×1.
- **Veterans:** 3 kills → +5 max HP, healed. **Recover** action heals 4 HP (2 outside your borders) and uses the unit's turn.
- **Capturing:** a unit standing on an enemy city or an unclaimed **village** can capture it (villages become level-1 cities). A captured city loses its capital status and pending rewards; the capturer joins its garrison. Eliminating an empire's last city removes it. Taking a city founded by another people also offers one of that people's traditions (§10).

## 5. Terrain, resources, improvements

**Terrain:** field, forest, mountain, shallow water, deep ocean — plus **climate terrain**: **desert** (no farms; irrigate for +1 pop with Farming), **swamp** (units stop; cover 1.5×; drain with Forestry), **tundra** (units outside your borders lose 1 HP/turn). Special terrain from empire mechanics: **ice** (Inuit, walkable land made from water) and **platform** (Pirate floating decks).

**Resources** on tiles (spawn rates): fruit 22% / crop 17% of fields, animals 27% of forests, ore on mountains (30%) and a little on fields/forests, fish on shallows (30%), whales on ocean (9%). Every capital and village start is guaranteed enough resources to level up.

**Improvements** (built on your own territory, cost ★ → effect): Farm 5 (+2 pop, Farming) · Mine 5 (+2 pop, Mining) · Lumber hut 3 (+1 pop, Forestry) · Port 7 (shallows; +1 pop, lets land units board boats, Fishing) · Temple 10 (+1 pop, +100 score, Masonry) · Market 8 (+1★/turn, Carpentry) · Grove/Mountain shrine 8 (+1 pop, +100 score) · Road 3 (Roads; Romans 2). Harvest actions cost 2★ (fruit, hunt, fish, whale).

**Borders:** a city claims the 3×3 (radius 1) tiles around it; Border Growth makes it 5×5.

**Ruins** scattered on the map give one of: Ancient Scrolls (a free tech), Lost Tribe (+3 pop), Old Maps (reveal map), Forgotten Champion (a veteran), Buried Treasure (+10★).

## 6. The map

- **Size** depends on the number of empires and the setting (Normal / Large / Huge): e.g. 2 empires = 11×11 (normal), 5 = 16×16, 10 = 22×22, 26 = 46×46+.
- **12 terrain styles:** Balanced (each empire's homeland shapes its surroundings), Continents, Islands, Archipelago, Pangaea, Lakes, Highlands, Forests, Plains, Deserts, Wetlands, Frozen. Each fixes the land share, blob size and the mix of fields/forests/mountains/climates.
- Capitals are placed far apart; villages and ruins are scattered; each empire's homeland biome (palette and terrain mix) comes from its climate.

## 7. Score (Perfection mode and tie-breaks)

`explored tiles × 5 + territory tiles × 20 + city levels × 50 + cities × 100 + tech tiers × 100 + army cost × 5 + kills × 20 + bonus score` (temples, shrines and gardens add bonus score).

## 8. How empire mechanics plug in

Every empire has (a) **passive traits** — one signature bonus, extra strengths and weaknesses grounded in its history, (b) a **3-tech unique skill line**, (c) a **unique unit**, and (d) a **game-defining unique mechanic** (with its own actions, readout and AI behaviour). The mechanics are hook-based: they can change movement, combat, income, visibility, tile actions and the AI. Anything listed as "action" appears in the tile menu (tap your own tile, city, unit or a target tile); passive parts show in a one-line readout under the score bar.

## 9. Wild events

An option on the new-game screen (**Wild events**, on by default). Third-party forces that belong to no empire; they act once a round, after the last empire's turn.

- **Kraken** (30 HP, attack 4, defence 2): lives on deep ocean on maps with enough open sea (one per ~55 ocean tiles, at most 3, never within 4 tiles of a capital). Each round it heals 2 HP, swims toward the nearest ship within 4 tiles (or wanders), and attacks one ship or boat next to it — any empire's. Whoever kills it earns **15★**; another rises in open water 12 rounds later. It can't be captured or boarded.
- **Volcanoes:** 1–4 active mountains (about one per 170 tiles, at least 3 tiles from any capital). Each erupts every **6 rounds** (first eruptions staggered over rounds 4–9) and rumbles with heavy smoke the round before. Lava floods the 8 tiles around it (not cities, villages, ruins or camps): farms, mines, lumber huts, temples and markets are destroyed, roads melt, forests burn and marsh/sand/tundra become fields, fruit, game and crops burn (ore stays), and every unit on or around the crater takes **5 damage**. Lava can't be entered; after a round it cools into **volcanic ash**, where half the tiles sprout wild crops. The first harvest or building on ash grows the city **+1 more** and pays **+1★**.
- **Mercenary camps:** 1–4 camps on unclaimed open ground, each offering one veteran (+5 HP) for hire: Archer (from 5★), Swordsman (7★), Knight (10★), Catapult (10★) or, rarely, a Colossus (16★). Any empire that has seen the camp may place a **sealed bid** from the camp's tile menu during its turn (minimum, +3★ or +6★; you can raise it or withdraw it); the stars are held in escrow. At the end of the round the highest bid (earliest on a tie) hires the unit beside the camp, and every other bid is refunded. Mercenaries have no home city (they don't count against a city's unit limit). The camp restocks 3 rounds later. Computer players bid on camps within 5 tiles of their cities when they can spare the stars.

## 10. The 26 empires

### Egyptian (egypt)
- **Signature bonus:** Nile Floods — farms grant +1 extra population.
- **Unique mechanic — Dynastic Wonders & Afterlife:** Megaliths rise over fallen heroes and great souls return to the pyramids as Golden Guardians; fields beside water become free farms that flood every 4th turn with stars and +1 population.
- **Strengths:** Pyramid Builders (Temples and shrines cost 2★ less.)
- **Weaknesses:** Late to Iron (Smithing costs 2★ more to research. Foot soldiers defend 0.5 worse.); Children of the River (Boats and ships move 1 less.)
- **Skill line:** T1 Nilometer: +1★ a turn for every 2 farms. → T2 Chariot Corps: Mounted units hit 0.5 harder. Mounted units cost 1★ less. → T3 Temples of Ra: +1★ a turn for every temple. +1★ a turn from your capital.

### Aztec (aztec)
- **Signature bonus:** Sacred Hunt — hunting refunds 1★.
- **Unique mechanic — Blood Altar Ascension:** Warriors take beaten foes captive and drag them to city altars for a Sun Age (instant growth, full map vision, frenzy); they earn no XP, only Star bounties, and a captive offered in any city gives +1 Population.
- **Strengths:** Warriors Take Captives (+1★ for every enemy you defeat.)
- **Weaknesses:** No Horses (Mounted units cost 2★ more.); Stone-Age Weapons (Smithing costs 2★ more to research. Units in your cities defend 0.5 worse.)
- **Skill line:** T1 Eagle and Jaguar Orders: Your unique unit hit 0.5 harder. → T2 Flower Wars: +1★ for every enemy you defeat. → T3 Chinampas: Every farm grows the city by 1 more. Every fruit harvest grows the city by 1 more.

### Māori (polynesia)
- **Signature bonus:** Wayfinding — board boats from any coast, no port needed.
- **Unique mechanic — Tā Moko & Waka Surge:** The capital is a Great Waka afloat on the sea that sails each turn, drinks the fish and whales around it into its people, and can anchor on a coast; Tāne's Tapu bars farms, mines, huts and ports, paying stars for untouched wilds instead.
- **Strengths:** Master Navigators (Boats and ships move 1 further.)
- **Weaknesses:** No Metal (Mining costs 1★ more to research. Smithing costs 1★ more to research.); No Beasts of Burden (Mounted units cost 2★ more.)
- **Skill line:** T1 Double-Hulled Waka: Boats and ships move 1 further. → T2 Wayfinding Chants: See 1 tile further around every unit and city. → T3 Kūmara Gardens: Every fish harvest grows the city by 1 more. +1★ a turn for every port.

### Roman (rome)
- **Signature bonus:** All Roads — roads cost 1★ less.
- **Unique mechanic — Castra & Via Appia:** Soldiers pave roads as they march, and units on paved roads can dig in as mini-forts.
- **Strengths:** Legion Discipline (Foot soldiers defend 0.5 better.)
- **Weaknesses:** Senatorial Politics (Research cost 1★ more.); Reluctant Sailors (Boats and ships move 1 less.)
- **Skill line:** T1 Roman Roads: +1★ a turn for every 4 road tiles in your borders. → T2 Legion Discipline: Foot soldiers defend 0.5 better. Foot soldiers cost 1★ less. → T3 Aqueducts: +2★ a turn from your capital. +2★ whenever a city levels up.

### Pirate (pirates)
- **Signature bonus:** Sea Raiders — boats and ships move 1 extra tile and attack +1; ports cost 4★ and earn +1★ a turn.
- **Unique mechanic — Flotilla Republic & Black Market Havens:** No land at all: platforms stitch into sea-cities that tow across the waves, and boarded ships join the fleet. Stars come only from tolls and coastal raids, and are spent to recruit people into the platforms.
- **Strengths:** Loot and Ransom (+1★ for every enemy you defeat.)
- **Weaknesses:** No Farmland (Every farm grows the city by 1 less.); Sailors, not Soldiers (Foot soldiers defend 0.5 worse.)
- **Skill line:** T1 Cutlass Drill: Boats and ships hit 1 harder. → T2 Ransom Trade: +1★ for every enemy you defeat. → T3 Pieces of Eight: +1★ a turn for every port. +1★ a turn from your capital.

### Viking (vikings)
- **Signature bonus:** Victory Feast — a unit heals 3 HP whenever it wins a fight.
- **Unique mechanic — Great Heathen Fleet & Raid Havens:** Longships beach on any shore and found Danelaw havens that siphon 20% of a city's gold; Vikings build no markets or temples, but raze enemy improvements for 3x their cost and carry off a citizen.
- **Strengths:** Raiders of the Coast (Boats and ships move 1 further.)
- **Weaknesses:** Short Growing Season (Every farm grows the city by 1 less.); Oral Tradition (Research cost 1★ more.)
- **Skill line:** T1 Longship Raiders: Boats and ships move 1 further. → T2 Shield Wall: Foot soldiers defend 0.5 better. Units in forests defend 0.5 better. → T3 Valhalla’s Call: +1★ for every enemy you defeat. Units on your land heal 2 HP every turn.

### Japanese (japan)
- **Signature bonus:** Home Ground — units get +1 defence inside your borders.
- **Unique mechanic — Way of the Blade (Kiai):** A critical strike takes no counter-blow, and a dying warrior strikes with fourfold force.
- **Strengths:** Way of the Warrior (Foot soldiers hit 0.5 harder.)
- **Weaknesses:** Seclusion (Boats and ships move 1 less.); Rigid Feudal Order (Units outside your borders defend 0.5 worse.)
- **Skill line:** T1 Bushidō: Your unique unit hit 0.5 harder. Units on your own land defend 0.5 better. → T2 Tea Ceremony: +1★ a turn for every temple. Every temple grows the city by 1 more. → T3 Castle Towns: Units in your cities defend 1 better. +1★ a turn from your capital.

### Mongol (mongols)
- **Signature bonus:** Steppe Riders — mounted units cost 1★ less.
- **Unique mechanic — Feigned Retreat & Horde Steppe:** Riders strike, pull back and lure the enemy into an ambush set by waiting archers.
- **Strengths:** Horse Archers (Mounted units hit 0.5 harder.)
- **Weaknesses:** Nomads, not Builders (Buildings cost 2★ more.); Herders, not Farmers (Every farm grows the city by 2 less.)
- **Skill line:** T1 Composite Bows: Ranged units hit 0.5 harder. → T2 Yam Relay: Mounted units move 1 further. → T3 Khan’s Tribute: +1★ for every enemy you defeat. Mounted units cost 1★ less.

### Greek (greeks)
- **Signature bonus:** Academy — every tech costs 1★ less.
- **Unique mechanic — Oracle & Polis Democracy:** No permanent capital: the largest city is the seat and all cities vote a global Edict every few turns; equal-sized cities form an Amphictyony that pays +50% Stars on resource improvements.
- **Strengths:** Phalanx Discipline (Foot soldiers defend 0.5 better.)
- **Weaknesses:** Quarrelling City-States (Foot soldiers cost 1★ more.); Rocky, Thin Soil (Buildings cost 1★ more.)
- **Skill line:** T1 Phalanx: Foot soldiers defend 0.5 better. → T2 Agora: +1★ a turn for every market. → T3 Lyceum: Research cost 1★ less. +2★ whenever a city levels up.

### Zulu (zulu)
- **Signature bonus:** Great Hunt — hunting grows a city by 2 instead of 1.
- **Unique mechanic — Chest & Horns Formation:** Melee units in a V around an enemy trap it, stopping its counter-attack and dealing triple damage.
- **Strengths:** Age-Regiments (Your unique unit move 1 further.)
- **Weaknesses:** No Sea Tradition (Boats and ships move 1 less.); Oral Learning (Research cost 1★ more.); Cattle Economy (Every farm grows the city by 1 less.)
- **Skill line:** T1 Iklwa Drill: Your unique unit hit 0.5 harder. → T2 Cow-Horn Formation: Your unique unit move 1 further. → T3 Shaka’s Regiments: Foot soldiers hit 0.5 harder. Foot soldiers cost 1★ less.

### Persian (persia)
- **Signature bonus:** Royal Tribute — capturing a city pays 3★.
- **Unique mechanic — Royal Road Network & Satrap Extraction:** A fallen Immortal returns at the capital next turn while Stars flow; conquered cities pay double from their tiles but bleed Population unless garrisoned.
- **Strengths:** The King’s Eyes and Ears (See 1 tile further around every unit and city.)
- **Weaknesses:** Multi-Ethnic Levies (Foot soldiers hit 0.5 weaker.); Alexander’s Lesson (Units in your cities defend 0.5 worse.)
- **Skill line:** T1 Royal Post: See 1 tile further around every unit and city. → T2 Immortal Guard: Your unique unit hit 0.5 harder. Your unique unit defend 0.5 better. → T3 Satrapies: +2★ a turn from your capital. +2★ whenever a city levels up.

### Celtic (celts)
- **Signature bonus:** Sacred Groves — your units in a forest defend at ×2.
- **Unique mechanic — Druidic Ley Lines:** Plant Sacred Groves that spread forest and root enemies who enter it; the Celts never cut trees, and uncut forest beside groves pays stars and slowly grows cities.
- **Strengths:** Fierce in Battle (Foot soldiers hit 0.5 harder.)
- **Weaknesses:** Tribal Fragmentation (Research cost 1★ more.); Timber Hillforts (Units in your cities defend 0.5 worse.)
- **Skill line:** T1 Oak Groves: Units in forests defend 0.5 better. → T2 Druidic Lore: Every lumber hut grows the city by 1 more. Units on your land heal 1 HP every turn. → T3 High Kings: Foot soldiers hit 0.5 harder. +1★ for every enemy you defeat.

### Inuit (inuit)
- **Signature bonus:** Sea Hunters — every fish harvest gives +1 extra pop.
- **Unique mechanic — Glacial Freeze:** Land units and cities freeze water into permanent ice bridges that chill enemies without fire techs; whale and fish nodes pay a huge lump of stars and population, then must re-freeze before reuse.
- **Strengths:** Masters of the Hunt (+1★ whenever you harvest a resource.)
- **Weaknesses:** No Agriculture (Every farm grows the city by 2 less.); No Metal (Smithing costs 2★ more to research. Mining costs 2★ more to research.)
- **Skill line:** T1 Harpoon Craft: Every fish harvest grows the city by 1 more. → T2 Kayak Hunters: Boats and ships move 1 further. → T3 Whale Feast: +1★ whenever you harvest a resource. Units on your land heal 2 HP every turn.

### Inca (inca)
- **Signature bonus:** Terraces — every mine adds +1 pop.
- **Unique mechanic — Highland Terracing & Rope Bridges:** Chaski outposts on peaks sling land units by zipline to other outposts or across 4+ mountains, and mountains never block the Inca. Terrace farms on peaks and forest raise Star income x1.5 or x2 for each extra elevation (lowland, hill, peak) a city works.
- **Strengths:** Qhapaq Ñan (Roads cost 1★ less.)
- **Weaknesses:** No Wheel or Horse (Mounted units cost 2★ more.); Landlocked Highlands (Boats and ships move 1 less.)
- **Skill line:** T1 Mit’a Labour: Every mine grows the city by 1 more. → T2 Andean Roads: +1★ a turn for every 4 road tiles in your borders. → T3 Sapa Inca’s Terraces: Units in the mountains defend 0.5 better. +1★ a turn for every 2 mines.

### Aksumite (ethiopia)
- **Signature bonus:** Highland Fortress — your units on mountains defend at ×2.5.
- **Unique mechanic — Monolithic Spire Network:** Stone Stelae ray enemies within three tiles and link into a laser grid, while crossroad tariffs pay Stars for foreign traffic past your borders.
- **Strengths:** Christian Kingdom (+1★ a turn for every temple. Units in the mountains defend 0.5 better.)
- **Weaknesses:** Cut Off from the Sea (Boats and ships move 1 less.); Isolated Highlands (See 1 tile less around every unit and city.)
- **Skill line:** T1 Rock-Hewn Churches: +1★ a turn for every temple. → T2 Shotel Guard: Your unique unit hit 0.5 harder. Your unique unit defend 0.5 better. → T3 Highland Bastion: Units in the mountains defend 0.5 better. Units on your land heal 2 HP every turn.

### Aboriginal (aboriginal)
- **Signature bonus:** Firestick Farming — clearing a forest also grows the city by 1.
- **Unique mechanic — Dreamtime Paths:** Paint invisible Songlines that let your units travel free and unseen; pilgrimages between distant landmarks pay Stars and grow your cities.
- **Strengths:** Knowledge of Country (See 1 tile further around every unit and city.)
- **Weaknesses:** No Farming Tradition (Farming costs 2★ more to research. Every farm grows the city by 1 less. Research cost 1★ more.); No Beasts of Burden (Mounted units cost 2★ more. Smithing costs 2★ more to research.)
- **Skill line:** T1 Bush Tucker: Every fruit harvest grows the city by 1 more. Every animal harvest grows the city by 1 more. → T2 Songlines: See 1 tile further around every unit and city. → T3 Boomerang Masters: Ranged units hit 0.5 harder. Your unique unit hit 0.5 harder.

### Chinese (china)
- **Signature bonus:** Silk Road — every market earns +1★ more.
- **Unique mechanic — Dynastic Mandate & Great Wall:** Border walls stop every enemy but siege engines and improved tiles pay +1★ while the Mandate holds (no city lost, no invader). Losing a city brings a Dynastic Shift (a tech refund, then mourning), and invaders halve your income.
- **Strengths:** Teeming Population (+1★ whenever a city levels up.)
- **Weaknesses:** Closed Empire (Boats and ships move 1 less.); Slow Bureaucracy (Siege engines cost 1★ more.)
- **Skill line:** T1 Paper and Printing: Research cost 1★ less. → T2 Silk Guilds: +1★ a turn for every market. → T3 Great Wall: Units on your own land defend 0.5 better. Units in your cities defend 1 better.

### Indian (india)
- **Signature bonus:** Ahimsa — units heal 2 more HP when they rest.
- **Unique mechanic — Karma & Sacred Beasts:** Defensive kills carry no penalty and turn neutral wildlife into fighting beasts.
- **Strengths:** Fertile Ganges (Every farm grows the city by 1 more.)
- **Weaknesses:** Imported Horses (Mounted units cost 2★ more.); Warring Rajas (Units in your cities defend 0.5 worse.)
- **Skill line:** T1 Ayurveda: Units on your land heal 2 HP every turn. → T2 Spice Trade: +1★ a turn for every port. +1★ a turn for every 2 markets. → T3 Elephant Corps: Your unique unit hit 1 harder.

### Malian (mali)
- **Signature bonus:** Gold of the Sahel — every mine earns +1★ a turn.
- **Unique mechanic — Salt & Gold Inflation:** Flood a foreign city's markets with gold: its costs double and its production halts for 2 turns. Caravans earn Stars from every tile crossed through foreign or neutral lands, more when it is dangerous.
- **Strengths:** Hajj Wealth (+1★ whenever a city levels up.)
- **Weaknesses:** Landlocked Sahel (Boats and ships move 1 less.); Fragile Union (See 1 tile less around every unit and city.)
- **Skill line:** T1 Gold-Salt Caravans: +1★ a turn for every market. → T2 Timbuktu Scholars: Research cost 1★ less. +1★ whenever a city levels up. → T3 Mansa’s Cavalry: Mounted units hit 0.5 harder. Mounted units move 1 further.

### Lakota (lakota)
- **Signature bonus:** Horse Nation — your mounted units move 1 further.
- **Unique mechanic — Great Plains Migration:** Camps pack up, roll up to 3 tiles a turn and re-settle, leaving enriched soil behind; assign herders to Follow Herds that wander the plains for double Stars.
- **Strengths:** The Buffalo Nation (Every animal harvest grows the city by 1 more.)
- **Weaknesses:** Nomads of the Plains (Buildings cost 1★ more.); No Metalworking (Smithing costs 2★ more to research. Farming costs 2★ more to research.)
- **Skill line:** T1 Buffalo Hunt: Every animal harvest grows the city by 1 more. → T2 Pony Herds: Mounted units cost 1★ less. Mounted units hit 0.5 harder. → T3 Warrior Societies: Foot soldiers hit 0.5 harder. +1★ for every enemy you defeat.

### Ottoman (ottoman)
- **Signature bonus:** Imperial Foundry — catapults cost 3★ less.
- **Unique mechanic — Sublime Porte & Great Bombards:** Conquered cities train their old peoples’ elite and Great Bombards ignore walls; each conquest pays Devshirme stars (capped) and levies +1 population.
- **Strengths:** Janissary Corps (Ranged units hit 0.5 harder.)
- **Weaknesses:** Conservative Ulema (Research cost 1★ more.); Tax-Farming (−1★ a turn for every 2 markets.)
- **Skill line:** T1 Timar Fiefs: +1★ a turn for every 2 farms. → T2 Great Bombards: Siege engines hit 1 harder. Siege engines cost 1★ less. → T3 Devşirme: Your unique unit hit 0.5 harder. Ranged units cost 1★ less.

### Maya (maya)
- **Signature bonus:** Sky Watchers — every temple earns +1★ a turn.
- **Unique mechanic — Long Count Prophecies & Katun Cycles:** Every 13 turns an Era rewrites the map (dry seas, storms, a golden age...) and you may pay to choose it; every 5 turns your improvements pay double, and every 20 your cities grow free.
- **Strengths:** Sky Watchers (See 1 tile further around every unit and city.)
- **Weaknesses:** No Horses or Iron (Mounted units cost 2★ more. Smithing costs 1★ more to research.); Warring City-States (Units in your cities defend 0.5 worse.)
- **Skill line:** T1 Long Count Calendar: +1★ a turn for every temple. → T2 Observatory: See 1 tile further around every unit and city. Every temple grows the city by 1 more. → T3 Stelae of the Kings: +3★ whenever a city levels up. +1★ a turn from your capital.

### Korean (korea)
- **Signature bonus:** Scholars — every tech you research grows your capital by 1.
- **Unique mechanic — Singijeon Rocket Fleets:** Rocket salvos arc over fog and cover, setting targets ablaze for turns.
- **Strengths:** Turtle Ships (Boats and ships hit 1 harder.)
- **Weaknesses:** Hermit Kingdom (See 1 tile less around every unit and city.); Invaded from All Sides (Units in your cities defend 0.5 worse.)
- **Skill line:** T1 Hangul: Research cost 1★ less. → T2 Geobukseon Yards: Boats and ships hit 1 harder. Boats and ships defend 1 better. → T3 Hwacha Arsenals: Siege engines hit 1 harder. Siege engines cost 2★ less.

### Khmer (khmer)
- **Signature bonus:** Baray Reservoirs — every farm earns +1★ a turn.
- **Unique mechanic — Great Reservoir Flooding:** Build barays and dams, then blow a dam to flood enemy armies for 2 turns; water and barays pay +1★ per resource they touch, compounding across linked canals.
- **Strengths:** Jungle Fighters (Units in forests defend 0.5 better.)
- **Weaknesses:** Landbound Empire (Boats and ships move 1 less.); Forced Labour (Temples and shrines cost 2★ more.)
- **Skill line:** T1 Barays: +1★ a turn for every 2 farms. → T2 Temple-Mountains: +1★ a turn for every temple. Every temple grows the city by 1 more. → T3 Naga Guard: Your unique unit defend 1 better.

### Swahili (swahili)
- **Signature bonus:** Monsoon Traders — your boats and ships move 1 further.
- **Unique mechanic — Monsoon Trade Currents:** The sea wind turns each season: ships sail fast with it and slow against it, and Lighthouses call it. Ships that sail with the wind past fish, whale and port tiles earn double Stars (half against).
- **Strengths:** Coastal Fortresses (Units in your cities defend 0.5 better.)
- **Weaknesses:** Traders, not Soldiers (Foot soldiers hit 0.5 weaker.); Rival Sultanates (See 1 tile less around every unit and city.)
- **Skill line:** T1 Dhow Trade: +1★ a turn for every port. → T2 Coral-Stone Cities: Units in your cities defend 0.5 better. +2★ whenever a city levels up. → T3 Monsoon Winds: Boats and ships move 1 further. +1★ a turn for every port.

### Tibetan (tibet)
- **Signature bonus:** Roof of the World — your units cross mountains without Climbing.
- **Unique mechanic — Highland Stupa & Mist:** Sky Mist hides your cities until an enemy stands on an adjacent peak, and stupas extend it. Remote mountain and forest resources pay more Stars the farther they lie from any enemy.
- **Strengths:** High-Altitude Endurance (Units on your land heal 1 HP every turn.)
- **Weaknesses:** Thin Soil (Every farm grows the city by 1 less.); Landlocked Plateau (Boats and ships move 1 less.)
- **Skill line:** T1 Mani Walls: Units in the mountains defend 0.5 better. → T2 Yak Herds: Every animal harvest grows the city by 1 more. Mounted units cost 1★ less. → T3 Monasteries: +1★ a turn for every temple. Units on your land heal 2 HP every turn.

## 10. Culture Blending (traditions of the conquered)

- Every city remembers its **origin**: the people who first held it (`city.data.origin`, recorded on capture and kept through later captures).
- **Capturing** a city whose origin people is not your own offers a choice of **one of 2–3 sub-traits** of that people (a card like the level-up reward; the computer picks the option it scores best). A toast announces the offer and the pick.
- Sub-traits come from the donor's historical **strength**, the first suitable step of its **skill line** (anything that names "your unique unit" is skipped) and, for six empires, a **light version of its mechanic**:
  - *Coastal Pillage* (Viking): a unit on an enemy improvement beside water can raze it for 2× its cost in ★; the city loses 1 population.
  - *Horns of the Buffalo* (Zulu): foot soldiers deal 1.5× damage to an enemy with 3+ of your foot soldiers around it.
  - *Kiai Strike* (Japanese): 15% of attacks take no counter-blow.
  - *Feigned Retreat* (Mongol): riders and archers without *escape* may pull back 1 tile after attacking.
  - *Royal Tribute* (Persian): +2★ per city captured. *Devşirme Levy* (Ottoman): each capture grows your nearest other city by 1.
- **Limits:** each origin people can be adopted from once, and an empire holds at most **3** traditions.
- Adopted traditions are listed on the in-game **Empires** screen as "Adopted from the X".
- *Still to come:* conquered cities whose ways were never adopted may rebel into Rogue States (plugs in at `culture.cultureUnrest`).

