# Tessera — how the game works

*Generated from the game's source at v0.27.0, updated for v0.40.0 (all numbers below are read from the code). Balance is still being tuned, so numbers may shift.*

## 1. The basics

- A turn-based tile strategy game on an isometric square grid. You play one of **51 empires** against 1–50 computer or hot-seat opponents.
- **Three empire types** (§15): ⚔️ **Military**, 💰 **Economy** and ⚓ **Naval**. Each type trains two role units of its own; the New Game picker and the Twenty-Six Empires screen list the empires by type.
- **Three modes:** *Perfection* — the game ends after a turn limit (default **30 turns**) and the highest **score** wins. *Domination* — no turn limit; last empire standing (or last human alive → best score) wins; with Diplomacy on, survivors who are all allied win together (§12). *One City Challenge* — every empire keeps only its capital: no villages, no outposts, Great Wakas or sea-cities; capturing a rival's city razes it (+1,000 score) and knocks that empire out. No turn limit: conquer every empire to win.
- **Difficulty** (easy / normal / hard): computer players get **+0 / +1 / +2 free Stars each turn**.
- **Start:** every empire begins with **5 Stars**, one capital (level 1) and one warrior. Everything else is hidden by fog.
- **Fog of war:** a tile you have seen stays "explored" forever (you still only see enemy units you currently have eyes on). Cities reveal their border radius +1; units reveal 1 tile (2 from a mountain, 2 for a Pathfinder).
- **Actions per turn:** a unit may move, attack, or (if it has *dash*) move then attack. Tapping a tile opens its menu of things you can buy or do there. Then you press **End Turn**.

## 2. The two resources

### Stars (★) — money
- You earn Stars **at the start of your turn**: `income`, summed over all your cities.
- **City income** = city level + 1 (if it is the capital) + 1 (Workshop) + 1 per Grand Garden + 1 per Market in its territory + 1 if you know Trade + road-network income + raised tiles and Districts (§5a) + empire-specific bonuses (see §7).
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
- A city **supports `level + 1` units** (one more with a Recruiter stationed there, §15); you cannot train more than that. Units belong to the city that trained them; if it is lost they become unsupported.

## 3. Techs and the skill tree (the Constellation)

The skill tree is drawn as a constellation on a black sky: **converging rings around the Empire Origin** (your empire's portrait in the centre). Learned stars shine gold (core, forks, your own line) or silver (Aether Links, Wildcards); the rest are faint fine-line outlines whose shape tells the ring (circle core, triangle fork, diamond culture, hexagon link, eight-point star wildcard, pentagon doctrine). The sky is wider than a phone: it scrolls, and **Whole sky** shrinks it to fit.

- **Tech cost** = `tier × (number of your cities) + 4`, so it gets dearer as you expand. Philosophy makes all future techs 33% cheaper; Greeks pay 1 less; empire traits can add or remove Stars.
- A tech needs its parent first (tier-1 techs are always available).

### Inner ring — Core Domain (25 shared techs)
5 roots, each with two tier-2 branches leading to one tier-3 tech.

| Root | Tier 2 | Tier 3 |
|---|---|---|
| **Gathering** – harvest fruit | Farming (farms +2 pop); Tactics (Defenders) | Masonry (temples, walls); Engineering (Catapults) |
| **Hunting** – hunt animals | Archery (Archers, forest defence 1.5×); Forestry (lumber huts, clear forest, drain swamp) | Spiritualism (grove shrines +1 pop); Carpentry (markets +1★/turn) |
| **Fishing** – fish, ports | Sailing (Galleys, open ocean); Whaling (+10★ per whale) | Navigation (Triremes); Aquaculture (fish +2 pop) |
| **Riding** – Riders | Roads (roads, network income); Horsemanship (mounted +1 defence) | Trade (+1★ per city); Chivalry (Knights) |
| **Climbing** – walk onto mountains, ×2 defence on them | Mining (mines on ore +2 pop); Meditation (mountain shrines +1 pop) | Smithing (Swordsmen); Philosophy (techs −33%) |

**Forks (tier 3):** two pairs of mutually exclusive nodes. Learning one side **seals** the other (only a Transmutation Shift reopens it); ruins never hand out a fork.
- *Forestry fork* — **Clear Cutting**: clearing a forest pays 4★ instead of 1 · **Sacred Canopy**: forests cannot be cut, each city earns +1★ a turn per forest in its borders (up to half its level, rounded up), and your units in forest are hidden from enemies not standing right beside them.
- *Trade/Markets fork* (off Roads) — **Caravan Monopoly**: trade Stars (the Trade bonus and market income) are doubled, but every unit costs 1★ more · **Mercenary Contracts**: every unit costs 25% less, but population growth is halved (every 2 population gained counts as 1; the odd half is banked in the city).

### Middle ring — Master Culture and Aether Links
- **Each empire's own 3-tech line** (78 in total, only that empire can learn it) now grows out of a relevant base tech, e.g. Aztec from Hunting, Roman from Roads, Inuit from Sailing (see §9 for each line and its base).
- **Aether Links** open only when **both parent branches are complete** (every listed tech known):
  - **Naval Bombardment** (Sailing → Navigation + Tactics → Engineering): boats and ships shoot 3 tiles, over land too.
  - **Grain Supply Lines** (Roads → Trade + Farming → Masonry): when a city levels up, its surplus population rolls along the road to its smallest road-linked city.
  - **Highland Snipers** (Climbing → Mining + Archery → Spiritualism): ranged units on a mountain shoot 2 tiles further and see through the fog as far as they shoot.
  - **Tidal Granaries** (Whaling → Aquaculture + Gathering → Farming): every port grows its city by 1 more and pays +1★ a turn.
  - **Iron Cavalry** (Horsemanship → Chivalry + Mining → Smithing): mounted units hit and defend 0.5 better.

### Doctrine ring — your empire type's own branch (pentagons)
Between the links and your own line lies a branch that only your **empire type** can research: three tracks of three techs, each growing straight out from a shared tech (the tracks are nudged apart so they never run side by side). They cost like tier 2, 3 and 4 techs. The computer players value them like a good skill (more so for a military empire at war).

- **Doctrine of War** (military empires):
  - *Drill* (from Tactics): Drill Sergeants: Foot soldiers defend 0.5 better. → Veteran Cadres: Units on your land heal 1 HP every turn. +1★ for every enemy you defeat. → Total War: All units hit 0.5 harder.
  - *Siegecraft* (from Engineering): Sappers’ Craft: Siege engines cost 1★ less. → Siege Trains: Siege engines hit 0.5 harder. Siege engines move 1 further. → Grand Batteries: Siege engines shoot 1 tile further.
  - *Cavalry* (from Horsemanship): Remount Depots: Mounted units cost 1★ less. → Light Horse: Scouts and voyagers move 1 further. Mounted units defend 0.5 better. → Shock Cavalry: Mounted units hit 0.5 harder. Mounted units defend 0.5 better.
- **Doctrine of Wealth** (economy empires):
  - *Agrarian* (from Farming): Crop Rotation: +1★ a turn for every 2 farms. → Public Granaries: A city that levels up gains 1 extra population. → Breadbasket: +1★ a turn from every city of level 3 or more.
  - *Commerce* (from Roads): Guild Charters: +1★ a turn for every market. → Banking: Trade routes pay 25% more. +1★ a turn from your capital. → Stock Exchange: +1★ a turn from every city.
  - *Learning* (from Meditation): Libraries: Research cost 1★ less. → Universities: +2★ whenever a city levels up. → Renaissance: World Wonders cost 25% less. Buildings cost 1★ less.
- **Doctrine of the Sea** (naval empires):
  - *Fleet* (from Sailing): Shipwrights: Ships cost 1★ less. → Ships of the Line: Boats and ships defend 1 better. → Admiralty: Boats and ships hit 1 harder.
  - *Fisheries* (from Whaling): Fishing Fleets: Every fish harvest grows the city by 1 more. → Salt Cod: +1★ a turn for every port. → Sea Granaries: A city that levels up gains 1 extra population.
  - *Exploration* (from Navigation): Charts and Compass: See 1 tile further around every unit and city. → Trade Winds: Boats and ships move 1 further. → Colonial Charters: Trade routes pay 50% more.

### Outer ring — Alignment (Wildcards, tier 4)
Each gives its base perk always and **surges** with more while a map condition holds (a toast tells you when a surge starts or stops, and the readout under the score bar lists what is surging):

| Wildcard (after) | Always | Surges while… | Surge |
|---|---|---|---|
| Tidecaller (Navigation) | +1★ per port | the map is ≥50% water | ships +1 move, +1 attack |
| War Host (Chivalry) | +1★ per kill | you fought this turn or last | all units +0.5 attack, heal 2 HP a turn |
| Star Calendar (Philosophy) | research 1★ cheaper | a Maya era is in force | +2★ per city a turn |
| Storm Omens (Aquaculture) | +1 vision | a wild event rages (Maya era, Aztec Sun Age, Khmer flood, Malian inflation) | +0.5 defence, +3★ a turn |
| Greenwood Covenant (Spiritualism) | forest defence +0.5 | forest covers ≥25% of the land | +1★ per lumber hut, heal 1 |
| Mountain Throne (Smithing) | mountain defence +0.5 | mountains cover ≥15% of the land | +1★ per mine, +0.5 attack |
| Twilight Empire (Trade) | +1★ per level-up | turn 20 or later | +1★ per city |

### Transmutation Shift (respec)
Tap a learned star (not a root) and choose **Transmute**: pay `24 + 3 × cities` Stars (about 30) to unlearn that star and everything that grew from it (children, links, a line), and get back what those techs would cost now. Use it to switch a fork or reallocate a branch. The computer players transmute a stale fork (mercenaries in a long peace, clear-cutting with no forest left).

**Score:** a core or culture tech scores its tier; forks, links and wildcards score as tier 1.

## 4. Units and combat

**Trainable in a city (cost ★):** Warrior 2 · Rider 3 (Riding) · Archer 3 (Archery) · Defender 3 (Tactics) · Swordsman 5 (Smithing) · Catapult 8 (Engineering) · Knight 8 (Chivalry). Each empire replaces some of these with its own unique unit (§7). **Boats** are made by moving a land unit into a port (a boat carries it; upgrades: Canoe → Galley 5★ with Sailing → Trireme 15★ with Navigation). **Colossus** (40 HP) comes from level-up rewards; **Pathfinders** from ruins/rewards. Each empire type also trains two **role units** (§15), and every empire trains three **auxiliaries**: Spearman 3★ (Hunting), Scout 2★ and Healer 4★ (Meditation) (§16).

**Stats** (base): Warrior 10 HP, attack 2, defence 2, move 1 · Rider 10/2/1, move 2 · Archer 10/2/1, range 2 · Defender 15/1/3 · Swordsman 15/3/3 · Catapult 10/4/0, range 3 · Knight 10/3.5/1, move 3 · Galley 10/2/2 move 3 range 2 · Trireme 15/4/3.

**Unit skills:** *dash* – can attack after moving · *escape* – can move after attacking · *persist* – can attack again after a kill · *fortify* – strong defence in own city · *forestwalk* – moves freely through forest · *amphibious* – wades through shallows · *carry* – carries a land unit · *plunder* – loots on kills · *scout* – Pathfinder.

**Unique units:** each empire's own unit stands in for one base unit and has one signature ability, shown in the unit panel, the train menu and the empire screens; the attack preview already counts it. The abilities live in `game/uniques.ts` (the combat formula reads their matchup bonuses; the rest is a mechanic run for every empire). Stats are cost, HP/attack/defence.

| Unit | Replaces | Stats | Ability |
|---|---|---|---|
| Chariot | Rider | 4★ 12/3/1, move 2, range 2 | **Archer chariot** — Shoots from 2 tiles and can drive on after shooting. |
| Jaguar Warrior | Rider | 3★ 12/3/1.5, move 2 | **Jungle pounce** — Moves freely through forest; a strike from forest takes no counter-blow. |
| Waka Taua | Canoe | 0★ 12/2/1, move 3, range 2 | **Ramming prow** — The fastest boat (carries a unit); rams adjacent ships for +50% damage. |
| Legionary | Warrior | 2★ 12/2.5/3, move 1 | **Testudo** — Locks shields against missiles, +1 defence against ranged attacks. |
| Buccaneer | Archer | 3★ 12/2.5/1.5, move 1, range 2 | **Plunder** — Wades through shallows and loots +2★ from every kill. |
| Berserker | Swordsman | 4★ 15/4.5/2.5, move 1 | **Battle fury** — Fights at full strength however wounded; its wounds never weaken its blows. |
| Samurai | Swordsman | 5★ 15/4/3.5, move 1 | **Bushidō** — Strikes again after every kill. |
| Horse Archer | Archer | 3★ 12/2.5/1, move 2, range 2 | **Mounted archer** — Shoots from 2 tiles and can ride on after shooting. |
| Hoplite | Defender | 3★ 15/2/3.5, move 1 | **Phalanx** — Its spear wall hits back 50% harder when attacked. |
| Impi | Warrior | 2★ 12/3/2, move 1 | **Bull horns** — After attacking it may still run 1 tile to close the horns around the foe. |
| Immortal | Swordsman | 5★ 18/3.5/3.5, move 1 | **Undying** — Heals 3 HP at the start of every turn, wherever it stands. |
| Clansman | Warrior | 2★ 12/2.5/2, move 1 | **Oak-grove warband** — Moves freely through forest and attacks +1 from forest. |
| Harpooner | Archer | 3★ 12/2.5/1.5, move 1, range 2 | **Harpoon** — Double damage to ships, boats and Great Beasts. |
| Slinger | Archer | 3★ 12/3/1, move 1, range 2 | **Plunging stones** — Shoots from 2 tiles; +1 attack when it slings from a mountain. |
| Shotelai | Swordsman | 5★ 16/4/3, move 1 | **Hooked blade** — Cuts around shields, so the defender gets no terrain, fortify or wall bonus. |
| Woomera Hunter | Archer | 3★ 12/2.5/1, move 1, range 3 | **Spear-thrower** — Throws 3 tiles, further than any archer; moves freely through forest. |
| Crossbowman | Archer | 4★ 12/3/1.5, move 1, range 2 | **Siege bolts** — Shoots from 2 tiles; +1 attack against units in a city or fort. |
| War Elephant | Knight | 8★ 22/4/2, move 2 | **Trample** — A melee blow carries through, and the enemy behind the target takes half the damage. |
| Sofa | Warrior | 3★ 14/2.5/2.5, move 1 | **Mansa's guard** — +2 defence in its own cities. |
| Horse Warrior | Rider | 3★ 13/2.5/1.5, move 2 | **Plains charge** — +1 attack when it charges from open ground (field, desert or tundra). |
| Janissary | Archer | 4★ 12/3/1.5, move 1, range 2 | **Musket volley** — Fires from 2 tiles; +1 attack against melee units. |
| Holcan | Warrior | 2★ 12/2.5/2, move 1 | **Jungle ambush** — Moves freely through forest and is hidden there from enemies not right beside it. |
| Hwacha | Catapult | 8★ 12/5/0.5, move 1, range 3 | **Rocket volley** — Fires 3 tiles; every enemy next to the target takes half the damage too. |
| Temple Guardian | Defender | 3★ 18/1.5/3.5, move 1 | **Temple ward** — Friendly units next to it take a third less damage, and the guardian takes that share instead. |
| Askari | Warrior | 2★ 12/2/3, move 1 | **Coast guard** — +1 defence on land beside water. |
| Khampa Rider | Rider | 3★ 14/2.5/1.5, move 2 | **Highlander** — Mountains never stop its move; it rides over them like open ground. |
| Sacred Band | Defender | 3★ 16/2/3.5, move 1 | **Sacred oath** — Defends at full strength however wounded. |
| Varangian Guard | Swordsman | 5★ 16/4/3, move 1 | **Emperor's guard** — In or beside one of your cities: +1 defence, and it heals 2 HP at the start of every turn. |
| Camel Rider | Rider | 3★ 13/2.5/1.5, move 2 | **Ship of the desert** — Horses shy from camels: +1.5 defence against mounted attackers; +1 attack from the desert. |
| Druzhina | Knight | 8★ 13/4/1.5, move 3 | **Winter host** — Forest never stops it; +1 attack and defence on tundra and ice. |
| Rattan Guard | Warrior | 2★ 12/2.5/2.5, move 1 | **Jungle guerrilla** — Moves freely through forest and swamp, and attacks +1 from them. |
| Sabum Kibittum | Warrior | 2★ 12/2.5/2.5, move 1 | **Royal levy** — +1 attack against mounted units. |
| Pitati Archer | Archer | 3★ 12/3/1, move 1, range 2 | **Eye-shooter** — +1 attack against wounded units. |
| Kris Warrior | Swordsman | 5★ 16/4/3, move 1 | **Island raider** — Wades through shallows; +1 attack from a tile beside water. |
| Conquistador | Knight | 8★ 14/4/2, move 3 | **Conquest** — +1 attack against units in a city or fort. |
| Mohawk Warrior | Warrior | 2★ 12/2.5/2.5, move 1 | **Great Law** — Forest never stops it, and it heals 2 HP at the start of every turn inside your borders. |
| Siege Tower | Catapult | 8★ 14/4/1, move 1, range 2 | **Archers aloft** — +1 attack against units in a city or fort. |
| Winged Hussar | Knight | 8★ 14/4.5/1.5, move 3 | **Wings of terror** — +1 attack against foot soldiers. |
| Highlander | Swordsman | 5★ 16/4/3, move 1 | **Highland charge** — +1 attack while at full health. |
| Longbowman | Archer | 3★ 12/2.5/1, move 1, range 3 | **Longbow** — Shoots 3 tiles; +1 attack against mounted units. |
| Royal Guard | Defender | 3★ 16/2.5/3.5, move 1 | **Esprit de corps** — +1 defence while next to another of your units. |
| Landsknecht | Swordsman | 5★ 16/4.5/2.5, move 1 | **Doppelsöldner** — +1.5 attack against shield units. |
| Carolean | Defender | 3★ 16/2/3, move 1 | **Gå-på** — Charges home: +1.5 attack in melee. |
| Caçador | Archer | 3★ 12/3/1, move 1, range 2 | **Skirmisher** — +1 attack from forest or a mountain. |
| Condottiere | Knight | 8★ 14/4/2, move 3 | **Paid in gold** — +1 attack and defence while you hold 20★ or more. |
| Ngao Shieldbearer | Warrior | 2★ 12/2.5/2.5, move 1 | **Mbeba shield** — +1 defence against ranged attacks and in forest. |
| Asafo Company | Defender | 3★ 16/2.5/3, move 1 | **Asafo company** — +1 attack and defence inside your borders. |
| Malón Rider | Rider | 3★ 13/2.5/1.5, move 2 | **Malón raid** — +2★ for every enemy it defeats. |
| Khevsur Knight | Swordsman | 5★ 16/4/3, move 1 | **Mountain knight** — +1 attack and defence on or next to a mountain. |
| Gurkha | Warrior | 2★ 12/3/2, move 1 | **Kukri** — Mountains never stop it; +1 attack from a mountain or forest. |
| Okihtcitaw | Warrior | 2★ 12/2/1.5, move 2 | **Forest runner** — Moves 2 tiles, and forest never stops it. |

Every unique is a clearly better unit than the one it replaces, about a point and a half of stats ahead (attack, defence, HP) at the same or nearly the same cost, on top of its ability. Only the Berserker trades a little defence (for +1.5 attack) and the War Elephant trades speed for bulk.

Details: a *ranged* attack is one from 2 or more tiles away. *Fortified* (Crossbowman) means on a city tile or a fort/wall tile. *Open ground* (Horse Warrior) is field, desert or tundra. The Temple Guardian only shields a land unit beside it and never drops below 1 HP doing so. The Hwacha's splash also follows a Korean rocket salvo, hits only enemies and can kill; the War Elephant's trample hits the one enemy straight behind the target (seen from where the elephant struck). The impi's extra tile is spent by its next move and lapses at the start of Zulu's next turn. The Holcan is hidden like a unit under the Sacred Canopy: an enemy unit or city right beside it sees it.

**Movement:** each tile costs 1 point; roads (or city tiles) linked road-to-road cost 0.5. A unit must **stop** when it enters: a mountain (needs Climbing), forest (unless forestwalk or road), swamp (unless road), any tile next to an enemy (zone of control), a port when boarding. You cannot walk through units. Boats: shallows freely, deep ocean only as Galley/Trireme; landing ends the move.

**Combat formula:**
- attack force = attack × (attacker HP / max HP)
- defence force = defence × (defender HP / max HP) × **terrain bonus**
- damage dealt = `round( attackForce / (attackForce + defenceForce) × attack × 4.5 )`
- If the defender survives and the attacker is within the defender's range, it **counter-attacks** with `round( defenceForce / total × defence × 4.5 )`.
- **Spearmen** (§16) defend ×2 against a mounted attacker (on top of the terrain bonus) and deal +50% damage when they attack a mounted unit.
- **Terrain bonus:** ×1.5 in your own city (×4 with City Walls, for fortify units; ×1 while Sappers have undermined it, §15), ×2 on a mountain (Climbing), ×1.5 in forest with Archery, ×1.5 in swamp, ×1.5 afloat with Aquaculture, else ×1.
- **Veterans:** 3 kills → +5 max HP, healed. **Recover** action heals 4 HP (2 outside your borders) and uses the unit's turn (not while out of supply, §4a).
- **Formations** add to the attack and defence above (§4a); the attack preview names them.
- **Capturing:** a unit standing on an enemy city or an unclaimed **village** can capture it (villages become level-1 cities). A captured city loses its capital status and pending rewards; the capturer joins its garrison. Eliminating an empire's last city removes it. Taking a city founded by another people also offers one of that people's traditions (§10).

## 4a. Army: formations, upgrades and supply

**Cavalry for every empire** (drawn in each empire's own style; all count as mounted for charges, Spearmen and mounted bonuses):

| Unit | Tech | Cost | ⚔ | 🛡 | ❤ | ➜ | Range | Uses |
|---|---|---|---|---|---|---|---|---|
| Lancer | Roads | 4★ | 2.5 | 1 | 10 | 3 | 1 | 1 Horse |
| Mounted Archer | Horsemanship | 5★ | 2 | 1 | 10 | 2 | 2 | 1 Horse |
| Cataphract | Smithing | 9★ | 3.5 | 3 | 18 | 2 | 1 | 1 Iron, 2 Horses |

**Ground troops for every empire** (each has a job and a weakness):

| Unit | Tech / era | Cost | ⚔ | 🛡 | ❤ | ➜ | Range | Strength | Weakness |
|---|---|---|---|---|---|---|---|---|---|
| Axeman | Smithing | 4★ + 1 Iron | 3 | 1 | 12 | 1 | 1 | +1.5 attack vs shield units | defence 1 |
| Javelineer | Hunting | 3★ | 1.5 | 1 | 8 | 1 | 2 | cheap; moves after throwing | 8 health |
| Ranger | Forestry | 4★ | 2 | 1.5 | 10 | 2 | 1 | free in forest, hidden there, +1 atk/def in forest | ordinary in the open |
| Pikeman | Tactics, Medieval | 5★ | 1.5 | 3 | 15 | 1 | 1 | defence ×2 vs cavalry | weak attack |
| Musketeer | Smithing, Renaissance | 8★ + 1 Iron | 4 | 3 | 15 | 1 | 2 | ignores terrain and wall defence | can't shoot after moving |
| Battering Ram | Engineering | 6★ | 1.5 | 0.5 | 14 | 1 | 1 | ×3 attack vs a unit in a city | useless in the open |
| Ballista | Carpentry | 7★ | 3 | 0 | 8 | 1 | 4 | longest range | no defence; can't shoot after moving |
| Cannon | Engineering, Renaissance | 12★ + 2 Iron | 5 | 0.5 | 12 | 1 | 3 | +50% vs a unit in a city | costly; can't shoot after moving |

Lancers get +1 attack against archers and siege engines; Cataphracts lose 1 defence in forest and swamp. Upgrades: Spearman → Pikeman (Medieval), Archer → Musketeer and Catapult → Cannon (Renaissance).

**Trio formations:** a unit with **two or more friendly units of its own family beside it** (an empire's unique counts as the unit it replaces) fights in its family's formation, on top of everything else: Warband (Warriors, +1 atk), Blade Wall (Swordsmen, +1 def), Iron Wall (Defenders, +1 def), Spear Hedge (+1 def), Hedgehog (Pikemen, +1.5 def vs cavalry), Shield-Breakers (Axemen, +1 atk), Arrow Storm (Archers, +1 atk), Skirmish Screen (Javelineers, +0.5/+0.5), Ambush (Rangers, +1.5 atk from forest), Volley Fire (Musketeers, +1.5 atk), Raiding Party (Riders), Wedge (Lancers), Parthian Circle (Mounted Archers), Lance Charge (Knights) (+1 atk each), Iron Avalanche (Cataphracts, +0.5/+0.5), Grand Battery (Catapults, Ballistae, Cannon, +1 atk), Siege Train (Rams, +1 def), Squadron (Galleys, +1 def), Battle Fleet (Triremes, +1 atk).

**Doctrines** (on top of the formation bonuses below), by empire type, for a unit standing beside a friendly unit of its own line:
- ⚔️ **Military — Drilled Ranks:** +0.5 attack.
- 💰 **Economy — Hometown Guard:** +0.5 defence while on your own land.
- ⚓ **Naval — Line of Battle:** warships form their own line: two side by side get +0.5 attack and +0.5 defence.
- 🛡 **Rome — Testudo:** Roman shield walls rise to +1.5 (not +1) and hold +1 defence more against ranged attacks.

*(game/army.ts; drawn by render/army.ts on the map's ground layer, so the marks are part of the photographed resting map.)*

**Formations.** Friendly units of one line standing side by side (on any of the eight tiles around) help each other. The bonus is added to the attack or defence stat before the combat formula, and the unit panel's attack preview names it ("Your Archer would deal 5, taking 0 (Volley +0.5).").
- **Shield wall:** a shield unit — on foot, *fortify*, defence 3 or more: Defender, Hoplite, Temple Guardian, Legionary (and any new unit like them) — defends **+0.5 for each** friendly shield unit beside it, **up to +1**. The unit panel shows it next to the defence.
- **Volley:** a ranged unit (range 2+, not a siege engine or a boat) attacks **+0.5** when another friendly ranged unit stands beside it.
- **Charge:** a mounted unit attacks **+0.5** when another friendly mounted unit stands beside **its target**.
- On the map, a thin cord in the empire's colour joins each pair in formation, with a glyph at its middle: a pale shield (shield wall), a gold arrowhead (volley) or an orange chevron (charge).

**Unit upgrades.** A land unit standing on one of your own cities may **Upgrade** (unit menu) to the next unit of its line: **Warrior → Swordsman** (Smithing) and **Rider → Knight** (Chivalry). An empire's unique unit stands in for the unit it replaces at both ends (a Legionary or Impi upgrades like a Warrior, a Chariot like a Rider; a Viking Warrior becomes a Berserker, a Japanese one a Samurai, an Indian Rider a War Elephant). There is no stronger bow than the archer's line yet (the Catapult is a siege engine), so archers do not upgrade; the line table (`UPGRADE_LINE`) takes new units as they come.
- **Cost:** the difference between what the two cost you to train (with your discounts), **+1★**.
- The unit keeps its **veteran** rank and its **share of health**, and the upgrade **uses its turn** (it must not have moved or attacked yet). Boats keep their own path (Canoe → Galley → Trireme, §4).
- Computer players upgrade a unit waiting in one of their cities when they would still have **10★** left over.

**Supply.** At the start of its turn a land unit is **out of supply** when it stands **more than 3 tiles from your borders** and is not on or beside a **road** (or bridge), **your fort** (a Sappers' fort or a Roman castra) or an **ally's** land.
- Out of supply it **loses 1 HP** each turn (never below 1) and **cannot heal** (no Recover, no healing perks or hero heals, no Victory Feast). Walking back into supply lifts it at once.
- An amber **!** roundel at the unit's feet marks it on the map; the unit panel says so, and warns when one of your units stands beyond the supply lines now. A toast counts your units out of supply at the start of your turn.
- **Exempt:** heroes, boats and ships, the Pirates on the water and on their platforms, and the **Mongols**, **Lakota** and **Aboriginal** peoples, who lived off the land (noted on their empire screens).
- Computer players count a tile out of supply as a little further from their goals (so their armies keep to roads and borders), and a unit out of supply turns home to heal sooner (below 60% health rather than 40%).

## 5. Terrain, resources, improvements

**Terrain:** field, forest, mountain, shallow water, deep ocean — plus **climate terrain**: **desert** (no farms; irrigate for +1 pop with Farming), **swamp** (units stop; cover 1.5×; drain with Forestry), **tundra** (units outside your borders lose 1 HP/turn). Special terrain from empire mechanics: **ice** (Inuit, walkable land made from water) and **platform** (Pirate floating decks); and the **bridge** Sappers lay over a shallow (§15).

**Resources** on tiles (spawn rates): fruit 22% / crop 17% of fields, animals 27% of forests, ore on mountains (30%) and a little on fields/forests, fish on shallows (30%), whales on ocean (9%). Every capital and village start is guaranteed enough resources to level up.

**Improvements** (built on your own territory, cost ★ → effect): Farm 5 (+2 pop, Farming) · Mine 5 (+2 pop, Mining) · Lumber hut 3 (+1 pop, Forestry) · Port 7 (shallows; +1 pop, lets land units board boats, Fishing) · Temple 10 (+1 pop, +100 score, Masonry) · Market 8 (+1★/turn, Carpentry) · Grove/Mountain shrine 8 (+1 pop, +100 score) · Road 3 (Roads; Romans 2). Harvest actions cost 2★ (fruit, hunt, fish, whale). Instead of the one-off hunt or fruit harvest you may tame a **Pasture** or plant an **Orchard** (§5a). Improvements can be raised to levels 2 and 3 (§5a).

**Borders:** a city claims the 3×3 (radius 1) tiles around it; Border Growth makes it 5×5.

**Ruins** scattered on the map give one of: Ancient Scrolls (a free tech), Lost Tribe (+3 pop), Old Maps (reveal map), Forgotten Champion (a veteran), Buried Treasure (+10★).

### Eurekas
Every tech of the shared tree has a goal in the world (e.g. *Build a port* → Sailing, *Have a unit on a mountain* → Meditation, *Stockpile 3 Iron* → Smithing). Meet it before researching the tech and that tech costs **40% less** for good. The goal shows on the tech card; a 💡 marks sparked techs in the tree. Checked after each of your actions and at the start and end of every turn.

### Strategic resources: Iron and Horses
Every **Mine** digs **1 Iron a turn** per level (Deep Mine 2, level 3: 3); every **Pasture** breeds **1 Horse** (Stables 2). Each stockpile holds up to **12**. **More sources:** from the **Classical era** the capital's Royal Stables and Forges add **+1 Iron and +1 Horse every 2 turns** (every turn from the **Medieval era**); a **level-3 city or a city with a Market** can **Buy 1 Iron or 1 Horse** for 5★, +2★ for each recent purchase (the price eases 1 step a turn); defeating an enemy unit that used Iron or Horses **captures 1** of it; from the **Medieval era** Cultivate can make a Mine or Pasture without having seen one. Peoples whose speciality is the pasture (Mongols, Zulu, Celts, Lakota, Tibet) breed **+1 Horse** at each pasture; the **Pirates** smuggle **1 Iron a turn through each Port**. **Swordsmen use 2 Iron, Catapults 1 Iron, Knights 2 Horses** when trained or upgraded into (an empire's unique unit needs what the unit it replaces needs). The 🏺 chip under the score bar shows the stockpiles.

### Luxuries
Six rare deposits: **Silk** (forest, Forestry), **Spices** (forest/swamp, Forestry), **Wine** (field, Farming), **Ivory** (field/desert, Hunting), **Pearls** (shallows, Fishing), **Incense** (desert, Farming). Every capital starts with one within 2 tiles; more lie in clusters across the map. Developing one (5★: Silk Farm, Spice Garden, Vineyard, Ivory Camp, Pearl Beds, Incense Grove) grows its city +1 and pays **+2★ a turn for each different luxury** you hold, **+1★ for each extra copy**.

### Buying Iron and Horses
With **Diplomacy** on, the Diplomacy screen lets you buy **2 Iron or 2 Horses for 6★** from any empire you are not at war with. The computer sells only a surplus (it keeps 4 of a resource its own units need), and it buys from others when it is short.

### Monopolies
Hold **3 or more developed copies of one luxury** and you have a Monopoly on it: every copy pays **2★** (not just the first), and each live trade route you run pays **+1★** more (up to +5).

### Tech from contact
A tech that an empire you have **met** already knows costs **20% less** (it stacks with a Eureka).

### Eras and Ages
Empires move through four eras as they learn techs: **Ancient → Classical (6 techs) → Medieval (12) → Renaissance (20)**. Entering an era grows every city (+1, +1, +2), pays 5 / 10 / 15★ and 150 score, and is announced to every empire that has met you. Your **Era Score** during the era just ended (Eurekas, battles won up to 4, city levels gained, wonders ×3) sets the next 5 turns: **7+ → Golden Age** (+1★ in every city), **2 or less → Dark Age** (techs 25% cheaper while you rebuild). The 🏛 chip shows the era, the Age and the score.

### Barracks, Homesteads and Cultivation
Prices depend on the **empire type** (Military / Economy / Naval):

| | Barracks | Homestead | Train up | Drill |
|---|---|---|---|---|
| ⚔️ Military | 4★ | 9★ | 2 turns | 1 turn |
| 💰 Economy | 12★ | 3★ | 4 turns | 3 turns |
| ⚓ Naval | 8★ | 6★ | 3 turns | 2 turns |

- **Barracks** (Tactics): one per city, on a free field in its land. Its city **supports 1 more unit**, and new units can be **trained right on the yard** (tap it while it is empty), so a unit on the city tile no longer blocks training. A unit standing on it can **Train** for free: it becomes the next unit of its line (Warrior → Swordsman, Rider → Knight, using Iron or Horses as usual) or, with no next unit, **Drills** into a Veteran. While training it can't move or attack and defends at half strength. Expand to a **Drill Yard** (6★: every training 1 turn shorter) and a **War College** (10★: trained units also come out Veterans). **Naval empires** refit ships the same way at any of their Ports (Boat → Galley → Trireme).
- **The Armoury** (at a Barracks): upgrade a whole unit type **for the rest of the game**, every unit of it now and later. Five tiers per type, paid in Stars and **luxury goods 💎** (every developed luxury makes 1 a turn, stockpiled up to 12):

  | Tier | Name | Cost | Gives | Needs |
  |---|---|---|---|---|
  | I | Tempered Blades | 5★ + 1💎 | +0.5 attack | Barracks |
  | II | Forced Marches | 8★ + 2💎 | +1 movement | Barracks |
  | III | Battle Drill | 12★ + 3💎 | +0.5 attack | Barracks |
  | IV | Long Reach | 16★ + 4💎 | +1 range (archers, siege); +0.5 attack (others) | Drill Yard |
  | V | Masterwork Arms | 20★ + 5💎 | +0.5 attack | War College |
- **Homestead** (no tech needed): an empty field, desert or tundra in your land becomes a Farm from nothing, +2 population. Each one in the same city costs 1★ more.
- **Frontier Camp:** a soldier (not a ship, merchant, role unit, scout or healer) standing on unclaimed land within 2 tiles of your borders may **Pitch a Camp**: that tile and the free land around it join your nearest city. **5★, +2★ for each camp you hold; at most 2 per city.** A camp is not a city, so it works in the One City Challenge.
- **Cultivate:** once an empire you have met has developed a resource, raise your own on suitable empty land with the usual tech: a luxury (built straight as its works), Iron (a Mine) or Horses (a Pasture). **8★, +2★ for each you have cultivated.**

### City Festivals
Any city may hold **one festival a turn** from its tile menu: **+1 population and +30 score**. It costs **12★, +8★ for each festival that city has held**, so it is a place for spare Stars, not a shortcut. The computer holds festivals when it has nothing better to buy.

### Governors
Tap your city to **appoint a governor** (5★). You have **1 governor slot, plus 1 for each era reached**, and each kind at most once. Appointing a kind already serving elsewhere moves them (their clock restarts). After **8 turns in office** a governor is promoted to rank 2.
- **Steward:** the city grows +1 every 3 turns (every 2 at rank 2).
- **Treasurer:** +2★ a turn (+3 at rank 2), +1★ per Market in the city's land.
- **Marshal:** your units in the city's land defend +0.5 (+1 at rank 2); units trained there cost 1★ less; the city never grows restless.
- **Scholar:** every tech costs 1★ less (2 at rank 2).

## 5a. Tile levels, Districts and specialities

*(game/levels.ts; drawn by render/levels.ts into the map picture, so levels, pips and Districts show on the resting, photographed map.)*

**Levels.** Tap an improved tile in your land and choose **Upgrade**. Every improvement has three levels; each pays more and is drawn visibly bigger and richer (larger buildings, a new building for the level, and two or three gold pips at the tile's front corner).
- **Level 2** needs the kind's tier-2 tech and **6★**; **level 3** needs its tier-3 tech, **10★** and a **city of level 4 or more**.
- **Every tile you have raised makes your next upgrade 1★ dearer**, so the extra income levels off instead of snowballing.
- A raised tile **keeps its improvement**: every rule that counts farms, mines, markets or temples (Khmer, Mali, Maya, China, Egypt, wonders, perks) still counts it. A level lapses if the improvement is destroyed (lava, a Viking raid).
- The Upgrade button shows the next level's gain, price and tech; when the tech is missing it is locked with the tech's name, and a tap opens that tech. The tile panel shows the current level and what the next one gives.

| Resource | Level 1 | Level 2 (tech) | Level 3 (tech) |
|---|---|---|---|
| Crops | Farm | **Estate**: +1★/turn, +1 pop (Farming) | **Granary Fields**: +2★/turn, +2 pop, and +1 pop for each farm beside it (up to 2), once (Masonry) |
| Ore | Mine | **Deep Mine**: +1★/turn (Mining) | **Foundry**: +2★/turn; units trained in its city cost 1★ less (Smithing) |
| Forest | Lumber Hut | **Sawmill**: +1★/turn (Forestry) | **Timberworks**: +2★/turn; boats, ships, boat upgrades and siege engines from its city cost 2★ less (Carpentry) |
| Shallows | Port | **Harbour**: +1★/turn, +1 pop (Sailing) | **Great Harbour**: +2★/turn; ships and boats of its city move +1 (Navigation) |
| Market | Market (+1★) | **Bazaar**: +2★ in all (Roads) | **Exchange**: +3★ in all; each trade route of its city pays +1★ (Trade) |
| Temple/Shrine | Temple | **Great Temple**: +1 pop, +100 score (Meditation) | **Sanctuary**: +2 pop, +150 score; your units in its city's land heal 2 HP a turn (Philosophy) |
| Animals | (hunt, one-off) | **Pasture**: tame instead of hunting, +1★/turn (Horsemanship) | **Stables**: +2★/turn; mounted units of its city defend +1 (Chivalry) |
| Fruit | (harvest, one-off) | **Orchard**: plant instead of harvesting, +1★/turn (Farming) | **Vineyard**: +2★/turn; its city grows +1 more each time it levels up (Masonry; at most 2 vineyards count) |

"Its city" is the city whose land the tile is in; for Great Harbour and Stables it is the unit's home city.

**Districts.** Three or more **level-3 tiles of one kind** that touch (all eight ways) and belong to one empire form a named District. It pays **+2★ a turn** to the city holding most of it and adds a themed extra. A toast announces it; the map links its tiles with an outline in its colour and flies a banner; the city panel and the ⚒ Economy chip list it.

| District | Extra |
|---|---|
| Agricultural Heartland (Granary Fields) | its city grows +1 every 3rd turn |
| Industrial District (Foundries) | units trained in its city cost 1★ more less |
| Timber Yards (Timberworks) | your units on its tiles defend +1 |
| Great Docks (Great Harbours) | ships and boats in its city's waters heal 3 HP a turn |
| Merchant Quarter (Exchanges) | its city's trade routes pay +1★ more each |
| Holy District (Sanctuaries) | +300 score while it stands |
| Horse Country (Stables) | mounted units trained in its city cost 1★ less |
| Garden Country (Vineyards) | its city grows +1 every 3rd turn |

**Economy chip.** Once you have a raised tile, a ⚒ chip under the score bar shows what raised tiles and Districts pay a turn (gold once a District stands); tap it for the full list.

**Master Builder** (Economy empires, §15): upgrades a tile on or beside it at **half price**, and **once per city** it may skip the level's tech.

**Empire specialities.** Each empire has one kind it is famous for. Either new ones are **built straight at level 2** (they pay the level-2 income at once and count as two raised tiles toward the rising price; the build's own growth stands in for the level's one-off growth), or upgrading them **costs a third less** and **level 2 needs no tech** (for Pastures and Orchards: planting them needs no tech and costs a third less). The empire screens list it under Strengths.

| Empire | Speciality | Effect |
|---|---|---|
| Egyptian | **Nile Estates** | The flood plains fed an empire: farms are built straight as Estates. |
| Aztec | **Chinampas** | Floating gardens on the lake: farm upgrades cost a third less and Estates need no tech. |
| Māori | **Māra Kai** | Breadfruit and kūmara gardens: orchards cost a third less and need no tech. |
| Roman | **Imperial Quarries** | Stone and iron for the legions: mine upgrades cost a third less and Deep Mines need no tech. |
| Pirate | **Pirate Havens** | Every cove a haven: port upgrades cost a third less and Harbours need no tech. |
| Viking | **Longship Yards** | Timber for the fleets: lumber huts are built straight as Sawmills. |
| Japanese | **Satoyama Woods** | Tended forests of cedar: lumber upgrades cost a third less and Sawmills need no tech. |
| Mongol | **Steppe Herds** | A people of horses: pastures cost a third less and need no tech. |
| Greek | **Olive Groves** | Oil and wine of the Aegean: orchards cost a third less and need no tech. |
| Zulu | **Cattle Kraals** | Wealth was counted in cattle: pastures cost a third less and need no tech. |
| Persian | **Royal Bazaars** | The bazaars of the Royal Road: market upgrades cost a third less and Bazaars need no tech. |
| Celtic | **Cattle Lords** | Herds were the chieftains’ wealth: pastures cost a third less and need no tech. |
| Inuit | **Kayak Landings** | Life came from the sea: port upgrades cost a third less and Harbours need no tech. |
| Inca | **Andén Terraces** | Terraced slopes feed the Andes: farm upgrades cost a third less and Estates need no tech. |
| Aksumite | **Rock-hewn Churches** | Churches carved from the living rock: temple upgrades cost a third less and Great Temples need no tech. |
| Aboriginal | **Stone Fish Traps** | Budj Bim’s weirs and traps: port upgrades cost a third less and Harbours need no tech. |
| Chinese | **Silk Markets** | The Silk Road ends here: markets are built straight as Bazaars (and Silk Road doubles what their levels pay). |
| Indian | **Temple Towns** | Great temple towns of the south: temple upgrades cost a third less and Great Temples need no tech. |
| Malian | **Gold of Bambuk** | The richest gold fields known: mine upgrades cost a third less and Deep Mines need no tech. |
| Lakota | **Horse Herds** | The horse nation: pastures cost a third less and need no tech. |
| Ottoman | **Imperial Foundries** | The cannon foundries of Tophane: mine upgrades cost a third less and Deep Mines need no tech. |
| Maya | **Pyramid Temples** | Every city a temple city: temple upgrades cost a third less and Great Temples need no tech. |
| Korean | **Rice Paddies** | Terraced paddies of the peninsula: farm upgrades cost a third less and Estates need no tech. |
| Khmer | **Temple Mountains** | Angkor’s temple mountains: temple upgrades cost a third less and Great Temples need no tech. |
| Swahili | **Coral Harbours** | Stone ports of the monsoon trade: port upgrades cost a third less and Harbours need no tech. |
| Tibetan | **Yak Herds** | Yak herds of the high plateau: pastures cost a third less and need no tech. |
| Carthaginian | **Cothon Harbours** | The round harbours of Carthage: port upgrades cost a third less and Harbours need no tech. |
| Byzantine | **Silk Workshops** | Smuggled silkworms and imperial looms: market upgrades cost a third less and Bazaars need no tech. |
| Arab | **Date Palm Oases** | Gardens in the desert: orchard upgrades cost a third less and need no tech. |
| Rus | **Forest Lodges** | Timber, fur and honey of the great forest: lumber upgrades cost a third less and need no tech. |
| Vietnamese | **Wet-rice Paddies** | Two harvests a year from the delta: farm upgrades cost a third less and Estates need no tech. |
| Babylonian | **Canal Farms** | Fields watered by the two rivers: farm upgrades cost a third less and Estates need no tech. |
| Nubian | **Iron Furnaces** | The furnaces of Meroë: mine upgrades cost a third less and Deep Mines need no tech. |
| Javanese | **Spice Groves** | Cloves, nutmeg and pepper: orchard upgrades cost a third less and need no tech. |
| Spanish | **Galleon Yards** | The shipyards of Seville: port upgrades cost a third less and Harbours need no tech. |
| Haudenosaunee | **Three Sisters Fields** | Maize, beans and squash on one mound: farm upgrades cost a third less and Estates need no tech. |
| Assyrian | **Iron Arsenals** | The arsenals of Nineveh: mine upgrades cost a third less and Deep Mines need no tech. |
| Polish | **Stud Farms** | Horses for the hussar banners: pastures cost a third less and need no tech. |
| Scottish | **Highland Cattle** | Shaggy cattle on the moors: pastures cost a third less and need no tech. |
| English | **Sheep Walks** | Wool made England rich: pastures cost a third less and need no tech. |
| French | **Vineyards** | Wine country: farm upgrades cost a third less and Estates need no tech. |
| German | **Silver Mines** | The silver of the Harz and Bohemia: mine upgrades cost a third less and Deep Mines need no tech. |
| Swedish | **Copper Mines** | The copper mountain of Falun: mine upgrades cost a third less and Deep Mines need no tech. |
| Portuguese | **Feitorias** | Trading posts on every shore: port upgrades cost a third less and Harbours need no tech. |
| Venetian | **Rialto Markets** | The markets of the Rialto: market upgrades cost a third less and Bazaars need no tech. |
| Kongolese | **Palm Groves** | Oil palms and raffia: orchard upgrades cost a third less and need no tech. |
| Asante | **Gold Fields** | The gold of the forest: mine upgrades cost a third less and Deep Mines need no tech. |
| Mapuche | **Horse Herds** | Horses taken from the invaders: pastures cost a third less and need no tech. |
| Georgian | **Vineyards** | Eight thousand years of wine: orchard upgrades cost a third less and need no tech. |
| Nepali | **Hill Terraces** | Rice on the mountain terraces: farm upgrades cost a third less and Estates need no tech. |
| Cree | **Trapline Camps** | Camps on the traplines: lumber upgrades cost a third less and need no tech. |

**Computer players** upgrade when they have Stars to spare (keeping 8★ + 2★ a city back), preferring their speciality, the best Stars for the price, and a level 3 beside other level-3 tiles of the kind (a District in the making). Their Master Builders raise tiles too.

## 6. The map

- **Size** depends on the number of empires and the setting (Normal / Large / Huge / Giant / Epic; Giant is Huge + 12 tiles a side, Epic Huge + 26, up to 72×72): e.g. 2 empires = 11×11 (normal), 5 = 16×16, 10 = 22×22, 26 = 46×46+.
- **12 terrain styles:** Balanced (each empire's homeland shapes its surroundings), Continents, Islands, Archipelago, Pangaea, Lakes, Highlands, Forests, Plains, Deserts, Wetlands, Frozen. Each fixes the land share, blob size and the mix of fields/forests/mountains/climates.
- Capitals are placed far apart; villages and ruins are scattered; each empire's homeland biome (palette and terrain mix) comes from its climate.

### Natural Wonders

Eight rare landmarks laid down with the map (`game/naturals.ts`, art in `render/naturals.ts`): about **one per 150 tiles, at least 2** per map, each kind at most once. Never within 3 tiles of a capital, never on a village, ruin, resource or camp; they use their own random stream, so the rest of the map is unchanged (older saves simply have none).
- **Discovery:** the first empire whose units or cities have one **in sight** gets **+5★ and +100 score** and a toast; later finders get **+50 score**. A map shared by an ally or a glimpse is not a sighting.
- **Glimpse:** an unfound wonder within 2 tiles of your known map shows as a **pillar of light over the clouds**. Computer units and scouts head for glimpsed wonders; they also value villages next to one and enemy cities that hold one.
- **Holding:** while it lies **inside your borders** its bonus is yours; it changes hands with the land (a toast tells you when you gain or lose one). Its tile can't be improved, harvested, roaded, settled or used for a World Wonder. Units may stand on a land wonder (its terrain still counts for movement); ships sail over the reef.
- **Where to see them:** tap the tile (name, lore, bonus, holder, first finder); the **Wonders** tab of the Empires screen lists the ones you have found and the lights you have glimpsed.

| Wonder | Terrain | Bonus while held |
|---|---|---|
| Thundermantle Falls | coastal mountain, field, forest | Your units on its city's land heal to full at the start of your turn |
| Glimmerdeep Grotto | mountain, field, desert, tundra | Research 10% cheaper (at least 1★) |
| Mount Halcyra | mountain | Your units on its city's land defend +1 |
| The Hollowcrown Elder | forest, field, swamp | Its city +1 population every 5 turns |
| The Opaline Reef | shallow water | Fish harvests grow +1 more; +1★ a turn per port you own |
| The Skymirror Flats | desert, field, tundra | Its city +2★ a turn |
| Emberbreath Springs | field, tundra, swamp, desert | Land units starting their move next to it move +1 |
| The Lanternveil Glacier | tundra, mountain, field | +1 vision for all units and cities; +2★ whenever a city levels up |

## 7. Score (Perfection mode and tie-breaks)

`explored tiles × 5 + territory tiles × 20 + city levels × 50 + cities × 100 + tech tiers × 100 + army cost × 5 + kills × 20 + bonus score` (temples, shrines and gardens add bonus score).

## 8. How empire mechanics plug in

Every empire has (a) **passive traits** — one signature bonus, extra strengths and weaknesses grounded in its history, (b) a **3-tech unique skill line** (the Master Culture ring, growing out of a base tech), (c) a **unique unit**, and (d) a **game-defining unique mechanic** (with its own actions, readout and AI behaviour). The mechanics are hook-based: they can change movement, combat, income, visibility, tile actions and the AI. Anything listed as "action" appears in the tile menu (tap your own tile, city, unit or a target tile); passive parts show in a one-line readout under the score bar.

## 9. Wild events

An option on the new-game screen (**Wild events**, on by default). Third-party forces that belong to no empire; they act once a round, after the last empire's turn.

- **Kraken** (30 HP, attack 4, defence 2): lives on deep ocean on maps with enough open sea (one per ~55 ocean tiles, at most 3, never within 4 tiles of a capital). Each round it heals 2 HP, swims toward the nearest ship within 4 tiles (or wanders), and attacks one ship or boat next to it — any empire's. Whoever kills it earns **15★**; another rises in open water 12 rounds later. It can't be captured or boarded.
- **Volcanoes:** 1–4 active mountains (about one per 170 tiles, at least 3 tiles from any capital). Each erupts every **6 rounds** (first eruptions staggered over rounds 4–9) and rumbles with heavy smoke the round before. Lava floods the 8 tiles around it (not cities, villages, ruins or camps): farms, mines, lumber huts, temples and markets are destroyed, roads melt, forests burn and marsh/sand/tundra become fields, fruit, game and crops burn (ore stays), and every unit on or around the crater takes **5 damage**. Lava can't be entered; after a round it cools into **volcanic ash**, where half the tiles sprout wild crops. The first harvest or building on ash grows the city **+1 more** and pays **+1★**.
- **Mercenary camps:** 1–4 camps on unclaimed open ground, each offering one veteran (+5 HP) for hire: Archer (from 5★), Swordsman (7★), Knight (10★), Catapult (10★) or, rarely, a Colossus (16★). Any empire that has seen the camp may place a **sealed bid** from the camp's tile menu during its turn (minimum, +3★ or +6★; you can raise it or withdraw it); the stars are held in escrow. At the end of the round the highest bid (earliest on a tie) hires the unit beside the camp, and every other bid is refunded. Mercenaries have no home city (they don't count against a city's unit limit). The camp restocks 3 rounds later. Computer players bid on camps within 5 tiles of their cities when they can spare the stars.

## 9a. Heroes

Every empire has one named champion (see `game/heroes`).

- **Joining:** the hero arrives at the capital (or, with no capital, the largest city) at the start of your turn once that city is **level 3**, ready to act. There is only ever one hero per empire. It has no home city, so it takes no unit slot.
- **Stats:** 20 HP, attack 3, defence 2.5, move 2, dash and fortify. It never becomes a veteran; instead it gains **XP**: +1 for each fight (attacking, or surviving an attack) and +2 for each kill (also kills by its ability). Levels need 4 / 10 / 18 / 28 total XP for levels 2–5; each level gives **+3 HP** (healed at once) and **+0.5 attack**, up to level 5.
- **Aura:** your units standing next to the hero get **+0.5 defence**. The map traces the aura in dashed gold around the hero.
- **Falling:** a slain hero (or one taken captive or aboard a captured ship) returns to the capital **4 turns** later with its level and XP. Toasts announce its arrival, each level-up and its fall (and tell the killer).
- **Ability:** one active ability, the **hero action** on the hero's tile (tap the hero). Using it costs no stars and does not use up the hero's move or attack; then it waits out its cooldown. "Until your next turn" effects fade when your next turn starts; the map marks blessed units with a gold ring, cursed foes with a red dashed ring and trapped foes with a rope.
- **Computer players** use the ability when it would do some good (foes in reach, wounded troops, water to freeze...) and rest a badly hurt hero.

| Empire | Hero | Ability |
|---|---|---|
| Egyptian | **Ramesses II**, Pharaoh of the Two Lands | **Charge at Kadesh** (every 4 turns): Every mounted unit gets +1 attack and +1 move until your next turn. |
| Aztec | **Cuauhtémoc**, The Descending Eagle | **Eagle’s Descent** (every 4 turns): Swoop on the foe: every enemy next to the hero takes 4 damage. |
| Māori | **Te Rauparaha**, Chief of Ngāti Toa | **Ka Mate** (every 4 turns): The haka: enemies within 2 lose 1 defence and your units within 2 gain +1 attack until your next turn. |
| Roman | **Julius Caesar**, Dictator of Rome | **Veni, Vidi, Vici** (every 4 turns): The hero may move and attack again this turn, with +1 attack. |
| Pirate | **Anne Bonny**, Terror of the Caribbean | **Broadside** (every 4 turns): Every enemy within 2 takes 2 damage. Anne walks the waves as if on land. |
| Viking | **Ragnar Lothbrok**, Sea-King of the Sagas | **Berserkergang** (every 4 turns): The hero and your units beside him get +1.5 attack until your next turn. |
| Japanese | **Tomoe Gozen**, Onna-musha of Kiso | **Iaijutsu** (every 4 turns): A lightning draw: +1 attack, and the hero’s strikes take no counter-blow until your next turn. |
| Mongol | **Genghis Khan**, Great Khan of the Steppe | **Ride of the Horde** (every 3 turns): Every mounted unit and the Khan himself get +1 move until your next turn. |
| Greek | **Leonidas**, King of Sparta | **Hold the Pass** (every 3 turns): The hero and your units beside him get +3 defence until your next turn. |
| Zulu | **Shaka**, Founder of the Zulu Kingdom | **Horns of the Buffalo** (every 4 turns): Enemies next to Shaka are trapped: they cannot move on their next turn and cannot strike back at Zulu attacks. Shaka gets +1 attack. |
| Persian | **Cyrus the Great**, King of the Four Corners | **Satrap Tribute** (every 5 turns): Every satrapy pays: +2★ for each of your cities (up to 12★). |
| Celtic | **Boudica**, Queen of the Iceni | **Rally the Tribes** (every 4 turns): Your units within 2 heal 4 HP and get +1 attack until your next turn. |
| Inuit | **Kiviuq**, The Eternal Wanderer (legend) | **Walk the Sea-Ice** (every 3 turns): Open water next to the hero freezes into ice bridges, and the hero heals 4 HP. |
| Inca | **Pachacuti**, The Earth-Shaker | **Rope Bridges** (every 4 turns): All your units get +1 move until your next turn. |
| Aksumite | **Ezana**, King of Aksum | **Stele Blaze** (every 3 turns): Every enemy within 2 takes 2 damage. |
| Aboriginal | **Pemulwuy**, Bidjigal Resistance Leader | **Songline Run** (every 3 turns): Your units within 2 heal 2 HP and get +1 move until your next turn. |
| Chinese | **Qin Shi Huang**, The First Emperor | **Terracotta Guard** (every 6 turns): A free soldier joins the army beside the hero. |
| Indian | **Ashoka**, The Dharma King | **Rock Edicts** (every 5 turns): All your units heal 3 HP and the capital grows +1 population. |
| Malian | **Mansa Musa**, Lord of the Gold Road | **Gift of Gold** (every 7 turns): A pilgrimage of gold: +15★ and +1 population in the capital. |
| Lakota | **Sitting Bull**, Leader of the Hunkpapa | **Stand Together** (every 4 turns): Your units within 2 get +1 attack and +1 defence until your next turn. |
| Ottoman | **Suleiman**, the Magnificent | **Imperial Largesse** (every 4 turns): The next thing you build or train costs half (rounded up). |
| Maya | **Pakal**, Lord of Palenque | **Reading the Stars** (every 4 turns): Reveal the land within 5 tiles of the hero and gain 4★. |
| Korean | **Yi Sun-sin**, Admiral of the Turtle Ships | **Turtle Ship** (every 5 turns): For 3 turns the Admiral sails the water like land with +3 defence (the ship stays until he lands). |
| Khmer | **Jayavarman VII**, Builder King of Angkor | **Houses of Healing** (every 4 turns): Every one of your units inside your borders heals 5 HP. |
| Swahili | **al-Hasan ibn Sulaiman**, Sultan of Kilwa | **Monsoon Fortune** (every 5 turns): Trade comes in on the wind: +2★ for each of your ports and ships (4★ to 14★). |
| Tibetan | **Songtsen Gampo**, Emperor of the Plateau | **Mountain Mist** (every 4 turns): Your units within 2 vanish into the mist (unseen by enemies) and get +1 defence until your next turn. |
| Carthaginian | **Hannibal Barca**, Strategos of Carthage | **Cannae** (every 5 turns): Enemies within 2 lose 1 defence, and your units within 2 attack +1, until your next turn. |
| Byzantine | **Belisarius**, Magister Militum of the East | **Reconquest** (every 4 turns): Your units within 2 get +1 attack and +1 defence until your next turn. |
| Arab | **Saladin**, Sultan of Egypt and Syria | **Chivalrous Truce** (every 4 turns): Every one of your units inside your borders heals 4 HP, and you gain 3★. |
| Rus | **Alexander Nevsky**, Prince of Novgorod | **Battle on the Ice** (every 5 turns): Enemies within 2 cannot move on their next turn. |
| Vietnamese | **Trần Hưng Đạo**, Grand Prince, victor of Bạch Đằng | **Stakes of Bạch Đằng** (every 5 turns): Every enemy within 2 takes 3 damage, and your units within 2 get +1 defence until your next turn. |
| Babylonian | **Hammurabi**, King of Babylon, Giver of Laws | **Code of Laws** (every 5 turns): Order in every city: +5★ and +1 population in the capital. |
| Nubian | **Amanirenas**, Kandake of Kush | **Eye of the Kandake** (every 4 turns): Every enemy within 2 takes 2 damage, and your units within 2 attack +1 until your next turn. |
| Javanese | **Gajah Mada**, Mahapatih of Majapahit | **Palapa Oath** (every 5 turns): Your units within 2 get +1 attack and +1 movement until your next turn. |
| Spanish | **El Cid**, Campeador of Castile | **Legend of the Cid** (every 5 turns): All your units attack +0.5 until your next turn. |
| Haudenosaunee | **Hiawatha**, Co-founder of the Great Law | **Condolence** (every 4 turns): Every one of your units inside your borders heals 4 HP, and the capital grows by 1. |
| Assyrian | **Ashurbanipal**, King of the World, King of Assyria | **Lion Hunt** (every 4 turns): Every enemy within 2 takes 2 damage, and your units within 2 attack +1 until your next turn. |
| Polish | **Jan III Sobieski**, King of Poland, victor at Vienna | **Relief of Vienna** (every 5 turns): Your units within 2 get +1 attack and +1 movement until your next turn. |
| Scottish | **Robert the Bruce**, King of Scots | **Bannockburn** (every 5 turns): Enemies within 2 lose 1 defence, and your units within 2 get +1 defence, until your next turn. |
| English | **Elizabeth I**, Queen of England | **Gloriana** (every 5 turns): Your units within 2 get +1 attack and +1 defence until your next turn. |
| French | **Joan of Arc**, The Maid of Orléans | **Relief of Orléans** (every 4 turns): Every one of your units inside your borders heals 4 HP, and your units within 2 attack +1 until your next turn. |
| German | **Frederick Barbarossa**, Holy Roman Emperor | **Imperial Ban** (every 5 turns): Enemies within 2 lose 1 defence, and your units within 2 attack +1, until your next turn. |
| Swedish | **Gustavus Adolphus**, Lion of the North | **Lion of the North** (every 4 turns): Your units within 2 get +1 attack and +1 defence until your next turn. |
| Portuguese | **Henry the Navigator**, Infante of Portugal | **School of Sagres** (every 4 turns): Reveal the land and sea within 5 tiles of the hero and gain 4★. |
| Venetian | **Enrico Dandolo**, Doge of Venice | **Sack of Constantinople** (every 5 turns): Trade comes home: +2★ for each of your ports and ships (4★ to 14★). |
| Kongolese | **Nzinga a Mbande**, Queen of Ndongo and Matamba | **Queen’s Gambit** (every 5 turns): Enemies within 2 lose 1 defence, and your units within 2 attack +1, until your next turn. |
| Asante | **Osei Tutu**, First Asantehene | **Golden Stool** (every 5 turns): Every one of your units inside your borders heals 4 HP, and you gain 4★. |
| Mapuche | **Lautaro**, Toqui of the Mapuche | **Battle of Tucapel** (every 4 turns): Your units within 2 get +1 attack and +1 movement until your next turn. |
| Georgian | **Queen Tamar**, King of Kings of Georgia | **Golden Age** (every 5 turns): Every one of your units inside your borders heals 4 HP, and you gain 4★. |
| Nepali | **Prithvi Narayan Shah**, Unifier of Nepal | **Unification** (every 5 turns): Your units within 2 get +1 attack and +1 defence until your next turn. |
| Cree | **Mistahi-maskwa**, Chief of the Plains Cree | **Big Bear** (every 4 turns): Your units within 2 get +1 defence and heal 4 HP. |

## 10. The 51 empires

Each empire's type (§15) is shown on the empire screens: ⚔️ Military — Roman, Mongol, Zulu, Aztec, Japanese, Persian, Ottoman, Lakota, Rus, Vietnamese, Kushite, Assyrian, Polish, German, Swedish, Kongolese, Mapuche, Nepali; 💰 Economy — Egyptian, Malian, Chinese, Indian, Maya, Inca, Tibetan, Celtic, Aboriginal, Khmer, Aksumite, Byzantine, Arab, Babylonian, Haudenosaunee, Scottish, French, Asante, Georgian, Cree; ⚓ Naval — Māori, Pirate, Viking, Swahili, Inuit, Greek, Korean, Carthaginian, Javanese, Spanish, English, Portuguese, Venetian.

### Egyptian (egypt)
- **Signature bonus:** Nile Floods — farms grant +1 extra population.
- **Unique unit — Chariot** (replaces the Rider): **Archer chariot** — Shoots from 2 tiles and can drive on after shooting.
- **Unique mechanic — Dynastic Wonders & Afterlife:** Megaliths rise over fallen heroes and great souls return to the pyramids as Golden Guardians; fields beside water become free farms that flood every 4th turn with stars and +1 population.
- **Strengths:** Pyramid Builders (Temples and shrines cost 2★ less.)
- **Weaknesses:** Late to Iron (Smithing costs 2★ more to research. Foot soldiers defend 0.5 worse.); Children of the River (Boats and ships move 1 less.)
- **Skill line** (branches off Gathering): T1 Nilometer: +1★ a turn for every 2 farms. → T2 Chariot Corps: Mounted units hit 0.5 harder. Mounted units cost 1★ less. → T3 Temples of Ra: +1★ a turn for every temple. +1★ a turn from your capital.

### Aztec (aztec)
- **Signature bonus:** Sacred Hunt — hunting refunds 1★.
- **Unique unit — Jaguar Warrior** (replaces the Rider): **Jungle pounce** — Moves freely through forest; a strike from forest takes no counter-blow.
- **Unique mechanic — Blood Altar Ascension:** Warriors take beaten foes captive and drag them to city altars for a Sun Age (instant growth, full map vision, frenzy); they earn no XP, only Star bounties, and a captive offered in any city gives +1 Population.
- **Strengths:** Warriors Take Captives (+1★ for every enemy you defeat.)
- **Weaknesses:** No Horses (Mounted units cost 2★ more.); Stone-Age Weapons (Smithing costs 2★ more to research.)
- **Skill line** (branches off Hunting): T1 Sacrificial Rites: Every enemy you defeat (killed or taken captive) refunds 20% of its ★ cost. → T2 Sun Altars: +2★ a turn for every altar. +1★ whenever a city levels up. → T3 Solar Ascension: A Sun Age needs 2 captives instead of 3, and while it burns every city pays +1★ a turn.

### Māori (polynesia)
- **Signature bonus:** Wayfinding — board boats from any coast, no port needed.
- **Unique unit — Waka Taua** (replaces the Canoe): **Ramming prow** — The fastest boat (carries a unit); rams adjacent ships for +50% damage.
- **Unique mechanic — Tā Moko & Waka Surge:** The capital is a Great Waka afloat on the sea that sails each turn, drinks the fish and whales around it into its people, and can anchor on a coast; Tāne's Tapu bars farms, mines, huts and ports, paying stars for untouched wilds instead.
- **Strengths:** Master Navigators (Boats and ships move 1 further.)
- **Weaknesses:** No Metal (Mining costs 1★ more to research. Smithing costs 1★ more to research.); No Beasts of Burden (Mounted units cost 2★ more.)
- **Skill line** (branches off Fishing): T1 Double-Hulled Waka: Boats and ships move 1 further. → T2 Wayfinding Chants: See 1 tile further around every unit and city. → T3 Kūmara Gardens: Every fish harvest grows the city by 1 more. +1★ a turn for every port.

### Roman (rome)
- **Signature bonus:** All Roads — roads cost 1★ less.
- **Unique unit — Legionary** (replaces the Warrior): **Testudo** — Locks shields against missiles, +1 defence against ranged attacks.
- **Unique mechanic — Castra & Via Appia:** Soldiers pave roads as they march, and units on paved roads can dig in as mini-forts.
- **Strengths:** Legion Discipline (Foot soldiers defend 0.5 better.)
- **Weaknesses:** Senatorial Politics (Research cost 1★ more.); Reluctant Sailors (Boats and ships move 1 less.)
- **Skill line** (branches off Roads): T1 Paved Highways: Roads ignore terrain: stepping onto any road costs half a move and never stops for forest or swamp. → T2 Castra Outposts: Foot soldiers cost 1★ less. Building a Castra is free, it gives +1 more defence, and every standing fort pays +1★ a turn. → T3 Pax Romana: +1★ a turn for every road-linked city while you have not lost a city in the last 5 turns.

### Pirate (pirates)
- **Signature bonus:** Sea Raiders — boats and ships move 1 extra tile and attack +1; ports cost 4★ and earn +1★ a turn.
- **Needs no supply lines at sea** (§4a): their fleets carry their own stores, so Pirate units on the water or their platforms are never out of supply.
- **Unique unit — Buccaneer** (replaces the Archer): **Plunder** — Wades through shallows and loots +2★ from every kill.
- **Unique mechanic — Flotilla Republic & Black Market Havens:** No land at all: platforms stitch into sea-cities that tow across the waves, and boarded ships join the fleet. Stars come only from tolls and coastal raids, and are spent to recruit people into the platforms.
- **Strengths:** Loot and Ransom (+1★ for every enemy you defeat.)
- **Weaknesses:** No Farmland (Every farm grows the city by 1 less.); Sailors, not Soldiers (Foot soldiers defend 0.5 worse.)
- **Skill line** (branches off Fishing): T1 Cutlass Drill: Boats and ships hit 1 harder. → T2 Ransom Trade: +1★ for every enemy you defeat. → T3 Pieces of Eight: +1★ a turn for every port. +1★ a turn from your capital.

### Viking (vikings)
- **Signature bonus:** Victory Feast — a unit heals 3 HP whenever it wins a fight.
- **Unique unit — Berserker** (replaces the Swordsman): **Battle fury** — Fights at full strength however wounded; its wounds never weaken its blows.
- **Unique mechanic — Great Heathen Fleet & Raid Havens:** Longships beach on any shore and found Danelaw havens that siphon 20% of a city's gold; Vikings build no markets or temples, but raze enemy improvements for 3x their cost and carry off a citizen.
- **Strengths:** Raiders of the Coast (Boats and ships move 1 further. Units in your cities defend 0.5 better. +1★ a turn from your capital.)
- **Weaknesses:** Short Growing Season (Every farm grows the city by 1 less.); Oral Tradition (Research cost 1★ more.)
- **Skill line** (branches off Fishing): T1 Longship Raiders: Boats and ships move 1 further. → T2 Shield Wall: Foot soldiers defend 0.5 better. Units in forests defend 0.5 better. → T3 Valhalla’s Call: +1★ for every enemy you defeat. Units on your land heal 2 HP every turn.

### Japanese (japan)
- **Signature bonus:** Home Ground — units get +1 defence inside your borders.
- **Unique unit — Samurai** (replaces the Swordsman): **Bushidō** — Strikes again after every kill.
- **Unique mechanic — Way of the Blade (Kiai):** A critical strike takes no counter-blow and earns Stars in honour, and a dying warrior strikes with fourfold force.
- **Strengths:** Way of the Warrior (Foot soldiers hit 0.5 harder.)
- **Weaknesses:** Seclusion (Boats and ships move 1 less.); Rigid Feudal Order (Units outside your borders defend 0.5 worse.)
- **Skill line** (branches off Tactics): T1 Bushidō: Your unique unit hit 0.5 harder. Units on your own land defend 0.5 better. → T2 Tea Ceremony: +1★ a turn for every temple. Every temple grows the city by 1 more. → T3 Castle Towns: Units in your cities defend 1 better. +1★ a turn from your capital.

### Mongol (mongols)
- **Signature bonus:** Steppe Riders — mounted units cost 1★ less.
- **Needs no supply lines** (§4a): their riders live off the steppe and their herds, so Mongol units are never out of supply.
- **Unique unit — Horse Archer** (replaces the Archer): **Mounted archer** — Shoots from 2 tiles and can ride on after shooting.
- **Unique mechanic — Feigned Retreat & Horde Steppe:** Riders strike, pull back and lure the enemy into an ambush set by waiting archers.
- **Strengths:** Horse Archers (Mounted units hit 0.5 harder.)
- **Weaknesses:** Nomads, not Builders (Buildings cost 2★ more.); Herders, not Farmers (Every farm grows the city by 2 less.)
- **Skill line** (branches off Riding): T1 Composite Bows: Ranged units hit 0.5 harder. → T2 Yam Relay: Mounted units move 1 further. → T3 Khan’s Tribute: +1★ for every enemy you defeat. Mounted units cost 1★ less.

### Greek (greeks)
- **Signature bonus:** Academy — every tech costs 1★ less.
- **Unique unit — Hoplite** (replaces the Defender): **Phalanx** — Its spear wall hits back 50% harder when attacked.
- **Unique mechanic — Oracle & Polis Democracy:** No permanent capital: the largest city is the seat and all cities vote a global Edict every few turns; equal-sized cities form an Amphictyony that pays +50% Stars on resource improvements.
- **Strengths:** Phalanx Discipline (Foot soldiers defend 0.5 better.)
- **Weaknesses:** Quarrelling City-States (Foot soldiers cost 1★ more.); Rocky, Thin Soil (Buildings cost 1★ more.)
- **Skill line** (branches off Tactics): T1 Phalanx: Foot soldiers defend 0.5 better. → T2 Agora: +1★ a turn for every market. → T3 Lyceum: Research cost 1★ less. +2★ whenever a city levels up.

### Zulu (zulu)
- **Signature bonus:** Great Hunt — hunting grows a city by 2 instead of 1.
- **Unique unit — Impi** (replaces the Warrior): **Bull horns** — After attacking it may still run 1 tile to close the horns around the foe.
- **Unique mechanic — Chest & Horns Formation:** Melee units in a V around an enemy trap it, stopping its counter-attack and dealing triple damage.
- **Strengths:** Age-Regiments (Your unique unit move 1 further.)
- **Weaknesses:** No Sea Tradition (Boats and ships move 1 less.); Oral Learning (Research cost 1★ more.); Cattle Economy (Every farm grows the city by 1 less.)
- **Skill line** (branches off Hunting): T1 Iklwa Drill: Your unique unit hit 0.5 harder. → T2 Cow-Horn Formation: Your unique unit move 1 further. → T3 Shaka’s Regiments: Foot soldiers hit 0.5 harder. Foot soldiers cost 1★ less.

### Persian (persia)
- **Signature bonus:** Royal Tribute — capturing a city pays 3★.
- **Unique unit — Immortal** (replaces the Swordsman): **Undying** — Heals 3 HP at the start of every turn, wherever it stands.
- **Unique mechanic — Royal Road Network & Satrap Extraction:** A fallen Immortal returns at the capital next turn while Stars flow; conquered cities pay double from their tiles but bleed Population unless garrisoned.
- **Strengths:** The King’s Eyes and Ears (See 1 tile further around every unit and city.)
- **Weaknesses:** Multi-Ethnic Levies (Foot soldiers hit 0.5 weaker.); Alexander’s Lesson (Units in your cities defend 0.5 worse.)
- **Skill line** (branches off Riding): T1 Royal Post: See 1 tile further around every unit and city. → T2 Immortal Guard: Your unique unit hit 0.5 harder. Your unique unit defend 0.5 better. → T3 Satrapies: +2★ a turn from your capital. +2★ whenever a city levels up.

### Celtic (celts)
- **Signature bonus:** Sacred Groves — your units in a forest defend at ×1.75.
- **Unique unit — Clansman** (replaces the Warrior): **Oak-grove warband** — Moves freely through forest and attacks +1 from forest.
- **Unique mechanic — Druidic Ley Lines:** Plant Sacred Groves that spread forest and root enemies who enter it; the Celts never cut trees, and uncut forest beside groves pays stars and slowly grows cities.
- **Strengths:** Fierce in Battle (Foot soldiers hit 0.5 harder.)
- **Weaknesses:** Tribal Fragmentation (Research cost 1★ more.); Timber Hillforts (Units in your cities defend 0.5 worse.)
- **Skill line** (branches off Hunting): T1 Oak Groves: Units in forests defend 0.5 better. → T2 Druidic Lore: Every lumber hut grows the city by 1 more. Units on your land heal 1 HP every turn. → T3 High Kings: Foot soldiers hit 0.5 harder. +1★ for every enemy you defeat.

### Inuit (inuit)
- **Signature bonus:** Sea Hunters — every fish harvest gives +1 extra pop.
- **Unique unit — Harpooner** (replaces the Archer): **Harpoon** — Double damage to ships, boats and Great Beasts.
- **Unique mechanic — Glacial Freeze:** Land units and cities freeze water into permanent ice bridges that chill enemies without fire techs; whale and fish nodes pay a huge lump of stars and population, then must re-freeze before reuse.
- **Strengths:** Masters of the Hunt (+1★ whenever you harvest a resource.)
- **Weaknesses:** No Agriculture (Every farm grows the city by 2 less.); No Metal (Smithing costs 2★ more to research. Mining costs 2★ more to research.)
- **Skill line** (branches off Sailing): T1 Glacial Footing: Units on ice defend 0.5 better. Every tile of water you freeze pays +1★. → T2 Deep Whaling: Renewable whale and fish harvests pay 50% more Stars and re-freeze 2 turns sooner. → T3 Sub-Zero Aura: Ice chills enemies for 1 more damage, every chilled enemy pays +1★, and cities freeze a shallow every 2 turns.

### Inca (inca)
- **Signature bonus:** Terraces — every mine adds +1 pop.
- **Unique unit — Slinger** (replaces the Archer): **Plunging stones** — Shoots from 2 tiles; +1 attack when it slings from a mountain.
- **Unique mechanic — Highland Terracing & Rope Bridges:** Chaski outposts on peaks sling land units by zipline to other outposts or across 4+ mountains, and mountains never block the Inca. Terrace farms on peaks and forest raise Star income x1.5 or x2 for each extra elevation (lowland, hill, peak) a city works.
- **Strengths:** Qhapaq Ñan (Roads cost 1★ less.)
- **Weaknesses:** No Wheel or Horse (Mounted units cost 2★ more.); Landlocked Highlands (Boats and ships move 1 less.)
- **Skill line** (branches off Climbing): T1 Mit’a Labour: Every mine grows the city by 1 more. → T2 Andean Roads: +1★ a turn for every 4 road tiles in your borders. → T3 Sapa Inca’s Terraces: Units in the mountains defend 0.5 better. +1★ a turn for every 2 mines.

### Aksumite (ethiopia)
- **Signature bonus:** Highland Fortress — your units on mountains defend at ×2.5.
- **Unique unit — Shotelai** (replaces the Swordsman): **Hooked blade** — Cuts around shields, so the defender gets no terrain, fortify or wall bonus.
- **Unique mechanic — Monolithic Spire Network:** Stone Stelae ray enemies within three tiles and link into a laser grid, while crossroad tariffs pay Stars for foreign traffic past your borders.
- **Strengths:** Christian Kingdom (+1★ a turn for every temple. Units in the mountains defend 0.5 better.)
- **Weaknesses:** Cut Off from the Sea (Boats and ships move 1 less.); Isolated Highlands (See 1 tile less around every unit and city.)
- **Skill line** (branches off Climbing): T1 Rock-Hewn Churches: +1★ a turn for every temple. → T2 Shotel Guard: Your unique unit hit 0.5 harder. Your unique unit defend 0.5 better. → T3 Highland Bastion: Units in the mountains defend 0.5 better. Units on your land heal 2 HP every turn.

### Aboriginal (aboriginal)
- **Signature bonus:** Firestick Farming — clearing a forest also grows the city by 1.
- **Needs no supply lines** (§4a): they know the Country and live off it, so Aboriginal units are never out of supply.
- **Unique unit — Woomera Hunter** (replaces the Archer): **Spear-thrower** — Throws 3 tiles, further than any archer; moves freely through forest.
- **Unique mechanic — Dreamtime Paths:** Paint invisible Songlines that let your units travel free and unseen; pilgrimages between distant landmarks pay Stars and grow your cities.
- **Strengths:** Knowledge of Country (See 1 tile further around every unit and city.)
- **Weaknesses:** No Farming Tradition (Farming costs 2★ more to research. Every farm grows the city by 1 less. Research cost 1★ more.); No Beasts of Burden (Mounted units cost 2★ more. Smithing costs 2★ more to research.)
- **Skill line** (branches off Gathering): T1 Bush Tucker: Every fruit harvest grows the city by 1 more. Every animal harvest grows the city by 1 more. → T2 Songlines: See 1 tile further around every unit and city. → T3 Boomerang Masters: Ranged units hit 0.5 harder. Your unique unit hit 0.5 harder.

### Chinese (china)
- **Signature bonus:** Silk Road — every market earns +1★ more.
- **Unique unit — Crossbowman** (replaces the Archer): **Siege bolts** — Shoots from 2 tiles; +1 attack against units in a city or fort.
- **Unique mechanic — Dynastic Mandate & Great Wall:** Border walls stop every enemy but siege engines and improved tiles pay +1★ while the Mandate holds (no city lost, no invader). Losing a city brings a Dynastic Shift (a tech refund, then mourning), and invaders halve your income.
- **Strengths:** Teeming Population (+1★ whenever a city levels up.)
- **Weaknesses:** Closed Empire (Boats and ships move 1 less.); Slow Bureaucracy (Siege engines cost 1★ more.)
- **Skill line** (branches off Gathering): T1 Paper and Printing: Research cost 1★ less. → T2 Silk Guilds: +1★ a turn for every market. → T3 Great Wall: Units on your own land defend 0.5 better. Units in your cities defend 1 better.

### Indian (india)
- **Signature bonus:** Ahimsa — units heal 2 more HP when they rest.
- **Unique unit — War Elephant** (replaces the Knight): **Trample** — A melee blow carries through, and the enemy behind the target takes half the damage.
- **Unique mechanic — Karma & Sacred Beasts:** Defensive kills carry no penalty and turn neutral wildlife into fighting beasts.
- **Strengths:** Fertile Ganges (Every farm grows the city by 1 more.)
- **Weaknesses:** Imported Horses (Mounted units cost 2★ more.); Warring Rajas (Units in your cities defend 0.5 worse.)
- **Skill line** (branches off Gathering): T1 Ayurveda: Units on your land heal 2 HP every turn. → T2 Spice Trade: +1★ a turn for every port. +1★ a turn for every 2 markets. → T3 Elephant Corps: Your unique unit hit 1 harder.

### Malian (mali)
- **Signature bonus:** Gold of the Sahel — every mine earns +1★ a turn.
- **Unique unit — Sofa** (replaces the Warrior): **Mansa's guard** — +2 defence in its own cities.
- **Unique mechanic — Salt & Gold Inflation:** Flood a foreign city's markets with gold: its costs double and its production halts for 2 turns. Caravans earn Stars from every tile crossed through foreign or neutral lands, more when it is dangerous.
- **Strengths:** Hajj Wealth (Trade routes pay 25% more.)
- **Weaknesses:** Landlocked Sahel (Boats and ships move 1 less.); Fragile Union (See 1 tile less around every unit and city.)
- **Skill line** (branches off Riding): T1 Gold-Salt Caravans: +1★ a turn for every market. → T2 Timbuktu Scholars: Research cost 1★ less. +1★ whenever a city levels up. → T3 Mansa’s Cavalry: Mounted units hit 0.5 harder. Mounted units move 1 further.

### Lakota (lakota)
- **Signature bonus:** Horse Nation — your mounted units move 1 further.
- **Needs no supply lines** (§4a): the people follow the buffalo, so Lakota units are never out of supply.
- **Unique unit — Horse Warrior** (replaces the Rider): **Plains charge** — +1 attack when it charges from open ground (field, desert or tundra).
- **Unique mechanic — Great Plains Migration:** Camps pack up, roll up to 3 tiles a turn and re-settle, leaving enriched soil behind; assign herders to Follow Herds that wander the plains for double Stars.
- **Strengths:** The Buffalo Nation (Every animal harvest grows the city by 1 more.)
- **Weaknesses:** Nomads of the Plains (Buildings cost 1★ more.); No Metalworking (Smithing costs 2★ more to research. Farming costs 2★ more to research.)
- **Skill line** (branches off Hunting): T1 Buffalo Hunt: Every animal harvest grows the city by 1 more. → T2 Pony Herds: Mounted units cost 1★ less. Mounted units hit 0.5 harder. → T3 Warrior Societies: Foot soldiers hit 0.5 harder. +1★ for every enemy you defeat.

### Ottoman (ottoman)
- **Signature bonus:** Imperial Foundry — catapults cost 3★ less.
- **Unique unit — Janissary** (replaces the Archer): **Musket volley** — Fires from 2 tiles; +1 attack against melee units.
- **Unique mechanic — Sublime Porte & Great Bombards:** Conquered cities train their old peoples’ elite and Great Bombards ignore walls; each conquest pays Devshirme stars (capped) and levies +1 population.
- **Strengths:** Janissary Corps (Ranged units hit 0.5 harder.)
- **Weaknesses:** Conservative Ulema (Philosophy costs 2★ more to research.); Tax-Farming (−1★ a turn for every 2 markets.)
- **Skill line** (branches off Gathering): T1 Timar Fiefs: +1★ a turn for every 2 farms. → T2 Great Bombards: Siege engines hit 1 harder. Siege engines cost 1★ less. → T3 Devşirme: Your unique unit hit 0.5 harder. Ranged units cost 1★ less.

### Maya (maya)
- **Signature bonus:** Sky Watchers — every temple earns +1★ a turn.
- **Unique unit — Holcan** (replaces the Warrior): **Jungle ambush** — Moves freely through forest and is hidden there from enemies not right beside it.
- **Unique mechanic — Long Count Prophecies & Katun Cycles:** Every 13 turns an Era rewrites the map (dry seas, storms, a golden age...) and you may pay to choose it; every 5 turns your improvements pay double, and every 20 your cities grow free.
- **Strengths:** Sky Watchers (See 1 tile further around every unit and city.)
- **Weaknesses:** No Horses or Iron (Mounted units cost 2★ more. Smithing costs 1★ more to research.); Warring City-States (Units in your cities defend 0.5 worse. Temples and shrines cost 1★ more.)
- **Skill line** (branches off Gathering): T1 Long Count Calendar: +1★ a turn for every temple. → T2 Observatory: See 1 tile further around every unit and city. Every temple grows the city by 1 more. → T3 Stelae of the Kings: +3★ whenever a city levels up. +1★ a turn from your capital.

### Korean (korea)
- **Signature bonus:** Scholars — every tech you research grows your capital by 1.
- **Unique unit — Hwacha** (replaces the Catapult): **Rocket volley** — Fires 3 tiles; every enemy next to the target takes half the damage too.
- **Unique mechanic — Singijeon Rocket Fleets:** Rocket salvos arc over fog and cover, setting targets ablaze for turns.
- **Strengths:** Turtle Ships (Boats and ships hit 1 harder.)
- **Weaknesses:** Hermit Kingdom (See 1 tile less around every unit and city.); Invaded from All Sides (Units in your cities defend 0.5 worse.)
- **Skill line** (branches off Fishing): T1 Hangul: Research cost 1★ less. → T2 Geobukseon Yards: Boats and ships hit 1 harder. Boats and ships defend 1 better. → T3 Hwacha Arsenals: Siege engines hit 1 harder. Siege engines cost 2★ less.

### Khmer (khmer)
- **Signature bonus:** Baray Reservoirs — every farm earns +1★ a turn.
- **Unique unit — Temple Guardian** (replaces the Defender): **Temple ward** — Friendly units next to it take a third less damage, and the guardian takes that share instead.
- **Unique mechanic — Great Reservoir Flooding:** Build barays and dams, then blow a dam to flood enemy armies for 2 turns; water and barays pay +1★ per resource they touch, compounding across linked canals.
- **Strengths:** Jungle Fighters (Units in forests defend 0.5 better.)
- **Weaknesses:** Landbound Empire (Boats and ships move 1 less.); Forced Labour (Temples and shrines cost 2★ more.)
- **Skill line** (branches off Gathering): T1 Barays: +1★ a turn for every 2 farms. → T2 Temple-Mountains: +1★ a turn for every temple. Every temple grows the city by 1 more. → T3 Naga Guard: Your unique unit defend 1 better.

### Swahili (swahili)
- **Signature bonus:** Monsoon Traders — your boats and ships move 1 further.
- **Unique unit — Askari** (replaces the Warrior): **Coast guard** — +1 defence on land beside water.
- **Unique mechanic — Monsoon Trade Currents:** The sea wind turns each season: ships sail fast with it and slow against it, and Lighthouses call it. Ships that sail with the wind past fish, whale and port tiles earn double Stars (half against).
- **Strengths:** Coastal Fortresses (Units in your cities defend 0.5 better.)
- **Weaknesses:** Traders, not Soldiers (Foot soldiers hit 0.5 weaker.); Rival Sultanates (See 1 tile less around every unit and city.)
- **Skill line** (branches off Fishing): T1 Dhow Trade: +1★ a turn for every port. → T2 Coral-Stone Cities: Units in your cities defend 0.5 better. +2★ whenever a city levels up. → T3 Monsoon Winds: Boats and ships move 1 further. +1★ a turn for every port.

### Tibetan (tibet)
- **Signature bonus:** Roof of the World — your units cross mountains without Climbing.
- **Unique unit — Khampa Rider** (replaces the Rider): **Highlander** — Mountains never stop its move; it rides over them like open ground.
- **Unique mechanic — Highland Stupa & Mist:** Sky Mist hides your cities until an enemy stands on an adjacent peak, and stupas extend it. Remote mountain and forest resources pay more Stars the farther they lie from any enemy.
- **Strengths:** High-Altitude Endurance (Units on your land heal 1 HP every turn.)
- **Weaknesses:** Thin Soil (Every farm grows the city by 1 less.); Landlocked Plateau (Boats and ships move 1 less.)
- **Skill line** (branches off Climbing): T1 Mani Walls: Units in the mountains defend 0.5 better. → T2 Yak Herds: Every animal harvest grows the city by 1 more. Mounted units cost 1★ less. → T3 Monasteries: +1★ a turn for every temple. Units on your land heal 2 HP every turn.

### Carthaginian (carthage)
- **Signature bonus:** Purple Dye — every port and every market earns +1★ a turn.
- **Unique unit — Sacred Band** (replaces the Defender): **Sacred oath** — Defends at full strength however wounded.
- **Unique mechanic — Mercenary Contracts:** any city may hire one veteran mercenary a turn (a warrior, archer, rider, swordsman, knight or Sacred Band Carthage could train) for 1.5× the training price (rounded up). It takes no unit slot, but costs 1★ a turn; when the treasury can't pay, the newest mercenary deserts. At most as many mercenaries as cities. Mercenaries fly a purple pennant, and Carthaginian ports show their round cothon.
- **Strengths:** Merchant Princes (Trade routes pay 25% more.)
- **Weaknesses:** Hired Armies (Foot soldiers defend 0.5 worse.); Borrowed Horsemen (Riding costs 2★ more to research.)
- **Skill line** (branches off Fishing): T1 Cothon: +1★ a turn for every port. → T2 Tyrian Purple: Trade routes pay 25% more. +1★ a turn for every market. → T3 Elephants over the Alps: Mounted units hit 0.5 harder and cost 1★ less.

### Byzantine (byzantium)
- **Signature bonus:** Theodosian Walls — your units in your cities defend +1.
- **Unique unit — Varangian Guard** (replaces the Swordsman): **Emperor's guard** — In or beside one of your cities: +1 defence, and it heals 2 HP at the start of every turn.
- **Unique mechanic — Greek Fire:** a Byzantine boat or ship that attacks sets its target ablaze, and so do the siphons of a coastal Byzantine city on any enemy that attacks a unit inside it: a burning unit takes 2 damage at the start of each Byzantine turn, twice (it can die of it). **Imperial tribute** (at a city, once every 5 turns): pay 5★ + 2★ for each enemy unit within 3 tiles, and their blows land empty (0 damage) on their next turn.
- **Strengths:** Imperial Bureaucracy (+2★ whenever a city levels up.)
- **Weaknesses:** Endless Frontiers (Units outside your borders defend 0.5 worse.); Iconoclasm (Temples and shrines cost 2★ more.)
- **Skill line** (branches off Gathering): T1 Hagia Sophia: +1★ a turn for every temple. → T2 Theme Armies: Units on your land defend 0.5 better. → T3 Golden Solidus: +1★ a turn for every market, +1★ a turn from your capital.

### Arab (arabia)
- **Signature bonus:** House of Wisdom — a tech that an empire you have met already knows costs 40% less (not 20%).
- **Unique unit — Camel Rider** (replaces the Rider): **Ship of the desert** — Horses shy from camels: +1.5 defence against mounted attackers; +1 attack from the desert.
- **Unique mechanic — Caravanserais & Desert Roads:** build a Caravanserai on an empty desert or field tile in your land, not beside another (6★, +2★ for each one you have): +1★ a turn, +1★ more with a road or a trade route on or beside it. Your camel riders, traders and camel scouts cross desert at half a move a tile, like a road.
- **Strengths:** Desert Caravans (Trade routes pay 25% more. Units in your cities defend 0.5 better. +1★ a turn from your capital.)
- **Weaknesses:** Few Forests (Ships cost 1★ more.); Tribal Rivalries (Philosophy costs 2★ more to research.)
- **Skill line** (branches off Riding): T1 House of Wisdom: Every tech costs 1★ less. → T2 Caravanserai: Trade routes pay 25% more. +1★ a turn for every 4 road tiles. → T3 Algebra and Astrolabes: See 1 tile further. +2★ whenever a city levels up.

### Rus (rus)
- **Signature bonus:** Fur Trade — every hunt pays +1★.
- **Unique unit — Druzhina** (replaces the Knight): **Winter host** — Forest never stops it; +1 attack and defence on tundra and ice.
- **Unique mechanic — General Winter:** from turn 10, every 10 turns winter falls for 3 turns (turns 10–12, 20–22...). Then enemy units inside Rus borders lose 2 HP at the start of each Rus turn (never below 1) and move 1 less, and Rus units defend +0.5 anywhere in their land. Once an era the capital can call an **early winter** (8★, 2 turns). Snow falls over Rus land while it lasts.
- **Strengths:** Stubborn Defenders (Foot soldiers defend 0.5 better.)
- **Weaknesses:** Frozen Ports (Boats and ships move 1 less.); Rasputitsa (Roads costs 2★ more to research.)
- **Skill line** (branches off Hunting): T1 Veche Bell: A city that levels up gains 1 extra population. → T2 Kremlin Walls: Units in your cities defend 0.5 better. → T3 Cossack Hosts: Mounted units hit 0.5 harder and cost 1★ less.

### Vietnamese (vietnam)
- **Signature bonus:** Guerrilla War — your units in forest or swamp defend +1.
- **Unique unit — Rattan Guard** (replaces the Warrior): **Jungle guerrilla** — Moves freely through forest and swamp, and attacks +1 from them.
- **Unique mechanic — Stakes of Bạch Đằng:** plant hidden stakes in a shallow water tile in or beside your land (4★; 2 per city). An enemy ship that sails onto them must stop and takes 4 damage (it can sink); the stakes are then spent. Only you see them.
- **Strengths:** Rice Bowl (+1★ a turn for every 2 farms.)
- **Weaknesses:** Few Horses (Mounted units cost 1★ more.); Northern Shadow (See 1 tile less around every unit and city.)
- **Skill line** (branches off Gathering): T1 Dyke Builders: +1★ a turn for every 2 farms. → T2 Bronze Drums: Foot soldiers hit 0.5 harder. → T3 Fire Arrows: Ranged units and siege engines hit 0.5 harder.

### Babylonian (babylon)
- **Signature bonus:** Clay Tablets — a Eureka makes its tech 50% cheaper (not 40%).
- **Unique unit — Sabum Kibittum** (replaces the Warrior): **Royal levy** — +1 attack against mounted units.
- **Unique mechanic — Ziggurats & Star-Gazers:** Raise a ziggurat beside each city (7★): it pays +1★ a turn, its astronomers reveal every tile within 3, and each one makes every tech 1★ cheaper (up to 2★). Clay Tablets: a Eureka makes its tech 50% cheaper, not 40%.
- **Strengths:** Irrigation Canals (+1★ a turn for every 2 farms.)
- **Weaknesses:** Open Floodplain (Foot soldiers defend 0.5 worse.); Clay, not Stone (Buildings cost 1★ more.)
- **Skill line** (branches off Gathering): T1 Cuneiform: Research cost 1★ less. → T2 Ziggurat of Marduk: +1★ a turn for every temple. +2★ whenever a city levels up. → T3 Star Charts: See 1 tile further around every unit and city. +1★ a turn from your capital.

### Nubian (nubia)
- **Signature bonus:** Land of the Bow — archers and other ranged units cost 1★ less.
- **Unique unit — Pitati Archer** (replaces the Archer): **Eye-shooter** — +1 attack against wounded units.
- **Unique mechanic — Pyramids of Meroë:** Raise steep pyramids on desert or field: each pays +1★ a turn, and your archers on or beside one shoot 1 tile further. Land of the Bow: archers and other ranged units cost 1★ less.
- **Strengths:** Furnaces of Meroë (+1 Iron a turn. Units in your cities defend 0.5 better. +1★ a turn from your capital.)
- **Weaknesses:** The Cataracts (Boats and ships move 1 less.); Desert Frontier (Farming costs 2★ more to research.)
- **Skill line** (branches off Archery): T1 Ta-Seti: Ranged units hit 0.5 harder. → T2 Iron of Meroë: +1 Iron a turn. +1★ a turn for every mine. → T3 Pyramids of Meroë: +1★ a turn for every temple. +2★ whenever a city levels up.

### Javanese (majapahit)
- **Signature bonus:** Spice Islands — every fish and fruit harvest pays +1★.
- **Unique unit — Kris Warrior** (replaces the Swordsman): **Island raider** — Wades through shallows; +1 attack from a tile beside water.
- **Unique mechanic — Spice Trade Jongs:** Your jongs (galleys and warships) that start your turn beside another empire's coastal city trade there for 2★, one ship per port; at war it is a raid and the owner also loses 1★. Mandala tribute at the capital (5★): +1★ a turn per visited port for 5 turns. Spice Islands: fish and fruit harvests pay +1★.
- **Strengths:** Monsoon Sailors (+1★ a turn for every port.)
- **Weaknesses:** Island Kingdoms (Mounted units cost 1★ more.); Court Intrigue (Foot soldiers defend 0.5 worse.)
- **Skill line** (branches off Fishing): T1 Jong Shipyards: Boats and ships defend 1 better. → T2 Subak Terraces: +1★ a turn for every 2 farms. → T3 Palapa Oath: Boats and ships hit 0.5 harder. Boats and ships move 1 further.

### Spanish (spain)
- **Signature bonus:** Treasure Fleets — every ship and warship you have pays +1★ a turn.
- **Unique unit — Conquistador** (replaces the Knight): **Conquest** — +1 attack against units in a city or fort.
- **Unique mechanic — Conquest & Missions:** Each ship and warship pays +1★ a turn. Taking a city plunders 3★ per level. Found a Mission beside each city (6★): +1★ a turn, +2★ beside a conquered city, and your wounded on or beside it heal 2 HP more.
- **Strengths:** Reconquista Veterans (+1★ for every enemy you defeat. Units in your cities defend 0.5 better. +1★ a turn from your capital.)
- **Weaknesses:** Silver Inflation (Trade costs 2★ more to research.); Overstretched Empire (Units outside your borders defend 0.5 worse.)
- **Skill line** (branches off Sailing): T1 Tercio: Foot soldiers defend 0.5 better. → T2 Treasure Galleons: +1★ a turn for every port. → T3 Armada: Boats and ships hit 0.5 harder. Boats and ships defend 0.5 better.

### Haudenosaunee (haudenosaunee)
- **Signature bonus:** Three Sisters — every crop harvest grows the city by 1 more.
- **Unique unit — Mohawk Warrior** (replaces the Warrior): **Great Law** — Forest never stops it, and it heals 2 HP at the start of every turn inside your borders.
- **Unique mechanic — Great League of Peace:** Cities within 4 tiles of the League join it, growing out from your capital (at most 5): +1★ a turn for each member beyond the first, and your units defend +0.5 inside League borders. Condolence Council (4★, every 5 turns): every unit heals to full. Three Sisters: every crop harvest grows the city by 1 more.
- **Strengths:** Forest Warfare (Units in forests defend 0.5 better.)
- **Weaknesses:** No Iron (Smithing costs 2★ more to research.); No Horses (Mounted units cost 1★ more.)
- **Skill line** (branches off Farming): T1 Three Sisters: +1★ a turn for every 2 farms. → T2 Longhouse: A city that levels up gains 1 extra population. → T3 Great Law of Peace: +1★ a turn from every city.

### Assyrian (assyria)
- **Signature bonus:** Siege Masters — siege engines cost 2★ less.
- **Unique unit — Siege Tower** (replaces the Catapult): **Archers aloft** — +1 attack against units in a city or fort.
- **Unique mechanic — Deportations & the Library:** Each city you capture loses 1 population to your capital, and its tablets teach you one tech its owner knew. Terror Tribute at the capital (free, every 6 turns): every enemy city within 4 tiles of your army pays 1★, up to 6★. Siege Masters: siege engines cost 2★ less.
- **Strengths:** Royal Road Couriers (Scouts and voyagers move 1 further. Units in your cities defend 0.5 better. +1★ a turn from your capital.)
- **Weaknesses:** Hated Overlords (See 1 tile less around every unit and city.); Few Ships (Boats and ships move 1 less.)
- **Skill line** (branches off Engineering): T1 Iron Weapons: Foot soldiers hit 0.5 harder. → T2 Siege Engineers: Siege engines hit 1 harder. → T3 Library of Ashurbanipal: Research cost 1★ less. +2★ whenever a city levels up.

### Polish (poland)
- **Signature bonus:** Golden Liberty — every city of level 3 or more pays +1★ a turn.
- **Unique unit — Winged Hussar** (replaces the Knight): **Wings of terror** — +1 attack against foot soldiers.
- **Unique mechanic — Royal Election:** Golden Liberty: every city of level 3+ pays +1★ a turn. At the capital the Sejm elects a king for 8 turns (first election free, then 3★): the Hussar King (mounted units +1 attack), the Merchant King (+1★ a turn per city) or the Scholar King (techs 2★ cheaper). Each reign ends in a 2-turn interregnum.
- **Strengths:** Szlachta Cavalry (Mounted units hit 0.5 harder.)
- **Weaknesses:** Liberum Veto (Philosophy costs 2★ more to research.); Open Plains (Units on your own land defend 0.5 worse.)
- **Skill line** (branches off Riding): T1 Sejm: +1★ a turn from every city of level 3 or more. → T2 Hussar Banners: Mounted units hit 0.5 harder. Mounted units cost 1★ less. → T3 Constitution of May: A city that levels up gains 1 extra population.

### Scottish (scotland)
- **Signature bonus:** Scottish Enlightenment — every city of level 3 or more makes techs 1★ cheaper (at most 3★).
- **Unique unit — Highlander** (replaces the Swordsman): **Highland charge** — +1 attack while at full health.
- **Unique mechanic — Highland Games & Clan Gatherings:** Highland Games (4★ in a city, once every 6 turns): every unit within 2 tiles gains a kill toward veteran and the city grows by 1. Clan Gathering: your units on or beside a mountain defend +0.5, and each one that falls in battle sends +1★ from the nearest city. Scottish Enlightenment: each city of level 3+ makes techs 1★ cheaper (at most 3★).
- **Strengths:** Clan Loyalty (Units on your land heal 1 HP every turn.)
- **Weaknesses:** Thin Soil (Farming costs 2★ more to research.); Feuding Clans (See 1 tile less around every unit and city.)
- **Skill line** (branches off Hunting): T1 Clan Tartans: Foot soldiers defend 0.5 better. → T2 Distilleries: +1★ a turn for every 2 farms. +1★ a turn for every market. → T3 Universities: Research cost 1★ less.

### English (england)
- **Signature bonus:** Royal Navy — your ships and warships attack +0.5.
- **Unique unit — Longbowman** (replaces the Archer): **Longbow** — Shoots 3 tiles; +1 attack against mounted units.
- **Unique mechanic — Letters of Marque & Royal Dockyards:** Royal Navy: ships and warships attack +0.5. Sinking an enemy vessel pays 3★ prize money, and ships that start your turn in or beside your port are repaired to full. From the capital, sign Letters of Marque (5★, every 8 turns): for 4 turns each enemy ship your ships damage loses 1★ of cargo to you.
- **Strengths:** Island Fortress (Units in your cities defend 0.5 better. Units in your cities defend 0.5 better. +1★ a turn from your capital.)
- **Weaknesses:** Wars of the Roses (Riding costs 2★ more to research.); Rainy Isles (Roads costs 2★ more to research.)
- **Skill line** (branches off Sailing): T1 Magna Carta: +2★ whenever a city levels up. → T2 Wool Trade: +1★ a turn for every port. → T3 Ships of the Line: Boats and ships defend 1 better. Ships cost 1★ less.

### French (france)
- **Signature bonus:** Haute Couture — every developed luxury pays +1★ a turn.
- **Unique unit — Royal Guard** (replaces the Defender): **Esprit de corps** — +1 defence while next to another of your units.
- **Unique mechanic — Salons & the Grand Tour:** Haute Couture: every developed luxury pays +1★ a turn. A city of level 3+ may open a Salon (6★, once): each makes every tech 1★ cheaper (up to 2★). Grand Tour: every unit of an empire at peace with France inside its borders pays it 1★ a turn (up to 2★).
- **Strengths:** Grande Armée (Every unit costs 1★ less.)
- **Weaknesses:** Court of Versailles (Buildings cost 1★ more.); Hundred Years’ War (Units on your land heal -1 HP every turn.)
- **Skill line** (branches off Gathering): T1 Vineyards: +1★ a turn for every 2 farms. → T2 Gothic Cathedrals: +1★ a turn for every temple. +1★ whenever a city levels up. → T3 Salons: Research cost 1★ less.

### German (germany)
- **Signature bonus:** Hanseatic League — every market pays +1★ a turn, +1★ more if it is next to a port.
- **Unique unit — Landsknecht** (replaces the Swordsman): **Doppelsöldner** — +1.5 attack against shield units.
- **Unique mechanic — Imperial Diet & Free Cities:** Hanseatic League: every market pays +1★ a turn, +1★ more beside a port. Free Imperial Cities: every city but the capital with a market pays +1★ more. Cities of level 4+ are Electors; with 3 of them the capital may call a free Imperial Diet every 10 turns: the Imperial Levy (a free veteran of your best melee unit), the Reichstag Tax (+2★ per Elector) or the Landfrieden (your units heal +2 HP at home for 5 turns).
- **Strengths:** Guild Masters (Buildings cost 1★ less. Units in your cities defend 0.5 better. +1★ a turn from your capital.)
- **Weaknesses:** Three Hundred States (See 1 tile less around every unit and city.); Landlocked Heartland (Boats and ships move 1 less.)
- **Skill line** (branches off Mining): T1 Printing Press: Research cost 1★ less. → T2 Hanse Kontors: +1★ a turn for every market. Trade routes pay 25% more. → T3 Imperial Diet: +1★ a turn from every city of level 3 or more. Foot soldiers defend 0.5 better.

### Swedish (sweden)
- **Signature bonus:** Carolean Drill — your units become veterans after 2 kills (not 3).
- **Unique unit — Carolean** (replaces the Defender): **Gå-på** — Charges home: +1.5 attack in melee.
- **Unique mechanic — Winter March & Falun Copper:** Carolean Drill: your units become veterans after 2 kills (not 3). Winter March: land units that start on tundra or ice move +1, and ice is open road to them. Falun Copper (3★ in a city with a Mine, once every 5 turns): +1 Iron to the stockpile and +3★ for the red copper roofs sold abroad.
- **Strengths:** Copper Mountain (+1★ a turn for every 2 mines. Units in your cities defend 0.5 better. +1★ a turn from your capital.)
- **Weaknesses:** Long Winters (Farming costs 2★ more to research.); Thin Population (Buildings cost 1★ more.)
- **Skill line** (branches off Mining): T1 Falun Copper: +1★ a turn for every mine. → T2 Leather Cannon: Siege engines hit 0.5 harder. Siege engines move 1 further. → T3 Indelningsverket: Every unit costs 1★ less.

### Portuguese (portugal)
- **Signature bonus:** Feitorias — every port pays +1★ a turn.
- **Unique unit — Caçador** (replaces the Archer): **Skirmisher** — +1 attack from forest or a mountain.
- **Unique mechanic — Padrões of Discovery:** Feitorias: every port pays +1★ a turn. A boat or ship beside unclaimed land at least 5 tiles from your cities may raise a stone padrão there (3★, one per city): +1★ a turn, +1★ more on the coast, and you see 2 tiles around it for good.
- **Strengths:** Navigators (See 1 tile further around every unit and city.)
- **Weaknesses:** Small Kingdom (Riding costs 2★ more to research.); Spanish Shadow (Units on your own land defend 0.5 worse.)
- **Skill line** (branches off Sailing): T1 Caravels: Boats and ships move 1 further. → T2 Spice Route: Trade routes pay 50% more. → T3 Azulejos: +2★ whenever a city levels up. +1★ a turn for every temple.

### Venetian (venice)
- **Signature bonus:** Merchant Republic — +1★ a turn for every 10★ in your treasury (at most +4★).
- **Unique unit — Condottiere** (replaces the Knight): **Paid in gold** — +1 attack and defence while you hold 20★ or more.
- **Unique mechanic — Merchant Republic & The Arsenal:** Every 10★ in the treasury earns +1★ a turn (at most +4★). A city with a Port launches a warship from the Arsenal at half price, once every 4 turns. Ships beside your cities unload +1★ each (at most +3★).
- **Strengths:** The Arsenal (Ships cost 1★ less. Units in your cities defend 0.5 better. +1★ a turn from your capital.)
- **Weaknesses:** Few Fields (Every farm grows the city by 1 less.); Hired Swords (Riding costs 2★ more to research.)
- **Skill line** (branches off Fishing): T1 Glassworks of Murano: +1★ a turn for every market. → T2 The Doge: +2★ a turn from your capital. → T3 Galleys of the Arsenal: Boats and ships hit 0.5 harder. Trade routes pay 25% more.

### Kongolese (kongo)
- **Signature bonus:** Kingdom of Cloth — every orchard pays +1★ a turn.
- **Unique unit — Ngao Shieldbearer** (replaces the Warrior): **Mbeba shield** — +1 defence against ranged attacks and in forest.
- **Unique mechanic — Nkisi Guardians & the Raffia Treasury:** Raise an nkisi nkondi in a city (5★, once per city): enemies on or beside it attack −1. At the capital, weave 5★ into a bolt of raffia cloth (up to 5): each bolt pays +1★ a turn and can't be stolen, but all are lost if the capital falls. Kingdom of Cloth: every orchard pays +1★ a turn.
- **Strengths:** Copper and Raffia (+1★ a turn for every market.)
- **Weaknesses:** Coastal Raiders (Sailing costs 2★ more to research.); River Rapids (Boats and ships move 1 less.)
- **Skill line** (branches off Forestry): T1 Raffia Looms: +1★ a turn for every lumber hut. → T2 Nkisi: Foot soldiers defend 0.5 better. → T3 Mani Kongo: +2★ a turn from your capital. +1★ whenever a city levels up.

### Asante (ashanti)
- **Signature bonus:** Golden Stool — units in your capital defend +2.
- **Unique unit — Asafo Company** (replaces the Defender): **Asafo company** — +1 attack and defence inside your borders.
- **Unique mechanic — Gold Dust & the Great Roads:** Every mine also yields 1 gold dust a turn (up to 20). At the capital, weigh it out: 5 dust for +8★, 8 to heal every unit 5 HP, or 10 for +1 population in every city. Great Roads: each city joined to the capital by an unbroken road pays +1★ a turn. Golden Stool: units in your capital defend +2.
- **Strengths:** Gold Weights (+1★ a turn for every 2 mines.)
- **Weaknesses:** Forest Paths (Roads costs 2★ more to research.); Few Horses (Mounted units cost 1★ more.)
- **Skill line** (branches off Gathering): T1 Kente Looms: +1★ a turn for every market. → T2 Golden Stool: Units in your capital defend 1 better. → T3 Great Roads: +1★ a turn for every 4 road tiles in your borders. Trade routes pay 25% more.

### Mapuche (mapuche)
- **Signature bonus:** Unconquered — your units inside your borders defend +0.5.
- **Unique unit — Malón Rider** (replaces the Rider): **Malón raid** — +2★ for every enemy it defeats.
- **Unique mechanic — The Toqui & the Parlamento:** In war, elect a Toqui at the capital (6★, every 10 turns): for 3 turns every unit moves +1 and attacks +0.5. Hold a Parlamento (4★, every 8 turns): with diplomacy, every enemy warms to you (+15) and is offered peace; otherwise your units heal 4 HP and the next Toqui is free. Unconquered: your units inside your borders defend +0.5.
- **Strengths:** Guerrilla Toquis (Units in forests defend 0.5 better. Units in your cities defend 0.5 better. +1★ a turn from your capital.)
- **Weaknesses:** No Cities (Masonry costs 2★ more to research.); Scattered Lof (See 1 tile less around every unit and city.)
- **Skill line** (branches off Riding): T1 Lautaro’s Lesson: Mounted units hit 0.5 harder. → T2 Koyang Councils: Units on your land heal 1 HP every turn. → T3 Araucaria Groves: +1★ a turn for every lumber hut.

### Georgian (georgia)
- **Signature bonus:** Golden Age of Tamar — while no enemy unit stands in your borders, every city pays +1★ a turn.
- **Unique unit — Khevsur Knight** (replaces the Swordsman): **Mountain knight** — +1 attack and defence on or next to a mountain.
- **Unique mechanic — Qvevri Cellars:** Bury a qvevri of wine in an empty field in your borders (4★, +1★ for each you hold; not next to another): +1★ a turn, +2★ after 5 turns, +3★ after 10. Hold a supra at the capital (3★, every 6 turns): every unit heals 3 HP and each city with a qvevri grows +1. Golden Age of Tamar: while no enemy stands in your borders, every city pays +1★.
- **Strengths:** Mountain Watchtowers (Units in the mountains defend 0.5 better.)
- **Weaknesses:** Between Empires (Units outside your borders defend 0.5 worse.); Narrow Valleys (Every farm grows the city by 1 less.)
- **Skill line** (branches off Climbing): T1 Qvevri Wine: +1★ a turn for every 2 farms. → T2 Svan Towers: Units in your cities defend 0.5 better. → T3 Knight in the Panther’s Skin: +2★ whenever a city levels up. +1★ a turn for every temple.

### Nepali (nepal)
- **Signature bonus:** Himalayan Kingdom — your units on or next to a mountain attack +0.5.
- **Unique unit — Gurkha** (replaces the Warrior): **Kukri** — Mountains never stop it; +1 attack from a mountain or forest.
- **Unique mechanic — Rope Bridges & Gurkha Recruits:** Sling a rope bridge across a mountain in your borders (3★): your units cross it at road speed without stopping, and you climb mountains without Climbing. A city on or beside a mountain may raise a veteran Gurkha for the normal price once every 4 turns. Himalayan Kingdom: your units on or next to a mountain attack +0.5.
- **Strengths:** Born Climbers (Units in the mountains defend 0.5 better.)
- **Weaknesses:** Landlocked (Boats and ships move 1 less.); Steep Fields (Every farm grows the city by 1 less.)
- **Skill line** (branches off Climbing): T1 Terraced Fields: +1★ a turn for every 2 farms. → T2 Pagoda Temples: +1★ a turn for every temple. → T3 Gurkha Regiments: Foot soldiers hit 0.5 harder. Foot soldiers defend 0.5 better.

### Cree (cree)
- **Signature bonus:** Pemmican — your units outside your borders heal 2 HP a turn.
- **Unique unit — Okihtcitaw** (replaces the Warrior): **Forest runner** — Moves 2 tiles, and forest never stops it.
- **Unique mechanic — Trading Posts & the Winter Count:** Pemmican: your units outside your borders heal 2 HP a turn. Build Trading Posts on forest or shore (5★, +1★ each): +1★ a turn, +1★ per animal beside it (at most 3★), and foreign units or traders beside a post pay +1★ each (at most 3★). Every 10 turns the Winter Count: if no city was lost, every city grows by 1.
- **Strengths:** Fur Trappers (+1★ whenever you harvest a resource.)
- **Weaknesses:** Short Summers (Every farm grows the city by 1 less.); Scattered Bands (Temples and shrines cost 1★ more.)
- **Skill line** (branches off Hunting): T1 Birch-bark Canoes: Boats and ships move 1 further. → T2 Trading Posts: Trade routes pay 25% more. +1★ a turn for every port. → T3 Pemmican Stores: Units on your land heal 1 HP every turn. Every animal harvest grows the city by 1 more.

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
- Having adopted a people's ways calms that people's cities (see §11).

## 11. Rebellion and Rogue States

An option on the new-game screen (**Rebellions**, on by default; independent of Wild events). Older saves and games created without it never rebel.
- **Who can rebel:** a conquered city (its origin people is not yours) that is not your capital. Your last city and the Māori Great Waka never rebel.
- **Unrest** (0–**6**) moves at the start of your turn: **+1** with no unit of yours on or next to it, **+1 more** if it is also **6+ tiles** from your capital (or you have none). A unit **on** the city **−2**, one **next to** it **−1**; a **road link to your capital**, a **temple** in its land and having **adopted its people's ways** are **−1 each**. A city that changes hands starts again at 0.
- A toast at **3** ("Unrest is rising"). At **6** the city is **on the brink**: you get a warning toast, and if it is still at 6 at the start of your **next** turn it **revolts** (one unit on or next to it is enough to stop it).
- **Revolt:** the city passes to the hidden neutral owner as a **Rogue State** (added to the game if needed), keeping its land. It raises defenders by level: **1–2** a Warrior, **3–4** a Defender and an Archer, **5+** a Defender and a Swordsman. You get a toast; everyone who has seen it is told; the log records it.
- **Rogue States** earn nothing, take no turns, meet no one and cannot win. Once a round, after the last empire, each rebel heals **2 HP** and strikes one unit of any empire **next to it** when the blow is worth the reply, then returns to its post. A Rogue State with no defenders left musters a new Warrior after **5 rounds**. Any empire captures it the ordinary way (its origin people is kept, so it may offer a tradition).
- **Where you see it:** the city panel ("Unrest 3/6 (+2/turn) — garrison it" with the reasons), a tappable line under the HUD for your most restless city, a flame badge beside the city's label, and toasts. Rogue States have crimson borders, crimson labels and a waving war banner with a broken ring; their units wear their people's figures under a crimson badge.
- **Computer players** send the nearest free unit into (or next to) a city at unrest 3+, or train a guard there, and keep that guard in place while the city is restless.

## 11a. Raider Clans

An option on the new-game screen (**Raider Clans**, on by default; independent of Wild events, like Rebellions). Older saves and games created without it have none. Clans belong to the same hidden neutral owner as the Kraken and the Rogue States.
- **Camps:** from round **4**, an outlaw camp appears every **5** rounds while the map has fewer than its share (about one per 150 tiles, **1–4**). A camp is pitched on open, unclaimed land that no empire can see: no city within **3** tiles and no empire unit within 2. It is drawn as hide tents, a bonfire, a rack of drying hides and a rust-red banner with the clan's sign under a horned skull.
- **Tempers** (picked at random, shown when you tap the camp): **Horse clan** (riders from the start, raids every 3 rounds), **Hill clan** (its camp is held by Defenders; raids every 5), **Wolf clan** (archers; every 4) and, only on a coast, **Sea clan** (raiders set out in canoes and land on your shores; every 4).
- **Raiders:** each camp keeps a guard on it and sends out up to **1** raider at a time (2 from round 12, 3 from round 20). Warriors and archers first, riders from round 12, swordsmen and knights from round 20. Once a round, after the last empire, each raider heals 1 HP (2 at its camp) and then: **pillages** the empire tile it stands on or has just reached (a raised tile loses a level; a farm, mine, lumber hut, port, market, pasture, orchard or luxury works is torn down; else the road is torn up; temples only lose levels), or **strikes** a unit in reach when it would kill it or come off better, or walks toward the nearest empire land within **8** tiles of its camp. Raiders **never capture**: from round 12 one may stand on a city that is not a capital (blocking training there and taking 1★ a round from its owner). A raider below 40% health goes home. Raiders are drawn in drab hides over a broken rust ring with their clan's sign; their health badges are rust-red.
- **Burn a camp:** defeat the guard, then move any unit onto the camp (or use **Clear Camp** on the camp's tile menu with a unit beside it; a melee kill that advances onto it counts too). Reward: **8★ + 2★ per era you have reached + 2★ per clan tier**, **+100 score** and a kill. The clan's other raiders scatter. Each raider slain pays **1★**.
- **Pay Off** (camp tile menu, **5★**, +3★ per clan tier): the clan leaves your land and units alone for **8** rounds and raids someone else.
- **Hire a Raider** (camp tile menu, 6★ + 2★ per tier + the unit's cost): the raider roaming nearest your cities defects to you (or a fresh one steps out beside the camp). It has no home city.
- **Computer players** hunt raiders in or near their land, march on camps within 7 tiles of their cities once they have an army (3+ units, more than their cities), and pay off a clan whose raiders are in their land when they have fewer fighters nearby than raiders.

## 11b. Free Cities

An option on the new-game screen (**Free Cities**, on by default). Older saves and games created without it have none. Free Cities are small independent city-states held by the same hidden neutral owner as the Kraken, the Rogue States and the Raider Clans.
- **Placement:** about one per two empires (**2–6**), on good unclaimed land at least **4** tiles from any capital. Each is a **level-3** city behind walls with a Defender on it; it never grows, trains or expands. It has a type: **Trade**, **Military**, **Science**, **Culture** or **Maritime** (only on a coast), and a name of its own. It is drawn in verdigris and gold with a square banner bearing its type sign; its name label carries the same sign and, once it has one, a dot in its suzerain's colour.
- **Envoys:** once you have seen a Free City, **Send Envoy** is on its tile menu (tap its name), and on the menu of any unit of yours standing next to it. An envoy costs **5★, +1★ for every envoy you have sent before**, one per city a round. Envoys stay for good. Tapping the city shows its type, every empire's envoys, the suzerain and the bonus table; the **Free Cities chip** under the score bar lists every one you have found.
- **Favour** (the best one you qualify for): **1 envoy** the small bonus, **3 envoys** the bigger one; the empire with the **most envoys, at least 3 and strictly more than anyone else,** is **suzerain** and gets the best. Trade: +1★ / +2★ a turn; suzerain +2★ and +1★ per trade route (up to 3). Military: +1 Iron every 3 turns / +1 Iron and +1 Horses; suzerain also a free unit (the best of its soldiers you know) every 6 turns. Science: techs 1★ / 2★ / 3★ cheaper (3★ at most in all). Culture: +50 / +100 / +150 score a turn; suzerain also +1 population in the capital every 5 turns. Maritime: +1 population in the capital every 5 turns / every 3 turns; suzerain also in each coastal city (up to 3) every 3 turns.
- **At the suzerain's side:** a suzerain's Free City raises a levy (an Archer beside it). Once a round, after the last empire, its guards heal 2 HP and strike units near it (within 2 tiles) of empires that fought the suzerain in the last **5** rounds. They never strike the suzerain. A lost guard is replaced after **4** rounds.
- **War:** attacking a Free City's unit sends your envoys there home; the city fights you and takes no envoys from you for **5** rounds.
- **Conquest:** take it like any city (kill the guard, stand on it, capture next turn). It becomes an ordinary city of yours, and every other empire that kept envoys there is angered (opinion **−20**, when Diplomacy is on). In the One City Challenge it is razed instead (**+200** score).
- **Quests:** from round 6, every 7 rounds one Free City asks a favour for 10 rounds: burn the outlaw camp nearest it (the burner gets **+1 envoy**) or grow a city to a given level (**+1 envoy** for each empire that does).
- **Computer players** send envoys when they have the envoy's cost + 8★ to spare, prefer the types that suit them (Military at war, Maritime with coastal cities, Culture in score games), and above all go for a suzerainty they can win or must defend. They leave Free Cities' guards alone unless the city is at odds with them and they keep no envoys there, and do not march on Free Cities.

## 12. World Wonders

Sixteen one-of-a-kind great works from world history (`data/wonders.ts`). Only the first empire to finish each one gets it.
- **Begin:** once you know its tech, tap an **empty tile of your own land** (no city, village, ruin, resource or improvement) with the right terrain and choose **Begin <Wonder>**. You raise **one wonder at a time**.
- **Invest:** a wonder is paid for over several turns: **up to 10★ a turn** from the site's tile menu (the first 10★ are paid on beginning) until its cost (30–40★) is reached. Your own people's wonder costs **25% less**; every wonder you already hold makes the next **25% dearer**.
- **Race and refunds:** everyone's sites and progress are listed on the **Wonders** tab of the Empires screen. When a rival finishes first, your site closes and **half** of what you put in comes back; the same when you **Abandon** a site or lose its land.
- **Holding:** a finished wonder stands on its tile as a large landmark, flies its holder's banner and gives **+600 score** plus its bonus. It changes hands with the land it stands on (capture the city, take the wonder). Nothing else can be built on its tile.
- **Completion** shows a celebration card to everyone who has met the builder (others hear a rumour); rivals are told when someone begins one.
- **Computer players** begin one when they have 2+ cities and 16★ (their own wonder first, then what suits their land), invest their spare stars each turn and give up a site a rival is about to finish.

| Wonder | Tech | Site | Home | Cost | Bonus |
|---|---|---|---|---|---|
| Great Pyramids | Masonry | desert, field | Egyptian | 36 | Buildings 2★ cheaper; +2★ from your capital |
| Great Wall | Engineering | field, forest, desert, tundra, mountain | Chinese | 40 | Units on your own land defend 0.5 better |
| Colosseum | Tactics | field | Roman | 32 | Foot soldiers hit 0.5 harder; +1★ per kill |
| Machu Picchu | Meditation | mountain | Inca | 40 | +1★ from every city |
| Hanging Gardens | Farming | field, desert | Persian | 34 | Farms grow +1 more; every city +2 pop on completion |
| Great Library | Philosophy | field, desert | Greek | 40 | Research 2★ cheaper; a free tech on completion |
| Stonehenge | Spiritualism | field, tundra | Celtic | 30 | +1 vision; +1★ from your capital |
| Angkor Wat | Forestry | forest, field, swamp | Khmer | 34 | +2★ per city level-up; temples grow +1 more |
| Hagia Sophia | Masonry | field | Ottoman | 34 | Temples and shrines 3★ cheaper; +1★ per temple |
| Great Mosque of Djenné | Carpentry | desert, field, swamp | Malian | 34 | +1★ per market; markets grow +1 |
| Moai Row | Fishing | coastal field, forest | Māori | 32 | +2★ per port; fish harvests grow +1 more |
| Potala Palace | Meditation | mountain | Tibetan | 36 | Units in the mountains defend 0.5 better; units on your land heal 2 HP a turn |
| Chichen Itza | Roads | forest, field | Maya | 34 | +1★ per 4 road tiles in a city's land; +1★ from your capital |
| Terracotta Army | Smithing | field, desert | Chinese | 36 | Foot soldiers 1★ cheaper and defend 0.5 better |
| Lighthouse of Alexandria | Sailing | coastal field, desert (or a Pirate platform) | Egyptian | 32 | Boats and ships move 1 further; +1 vision |
| Great Zimbabwe | Mining | field, forest | Swahili | 34 | +1★ per mine; mines grow +1 more |

## 13. Diplomacy

An option on the new-game screen (**Diplomacy**, on by default). Older saves and games created without it keep the old rule: every empire is at war with every other.
- **Who:** any two empires that have **met**. Rogue States and Great Beasts (the neutral owner) are always hostile and are never offered diplomacy.
- **War** is the default. **Peace treaty:** neither side may attack the other (nor hit it with an empire mechanic's strikes: Mongol ambushes, Korean barrages, Khmer floods, Inuit ice, Aksumite rays), enter the other's **borders** or take its cities. A unit caught inside when peace is signed may still walk out. Enemy units of a partner no longer stop your moves.
- **Alliance** (from peace): everything above, plus **shared maps** (each turn start), and allied units may **walk through each other's land** (never into each other's cities). When an ally is attacked by an empire you are at peace with, you are **called to arms**: joining costs no trust, declining angers your ally. Computer allies also send their units after whoever attacked their ally.
- **Trade deal** (on top of peace or alliance): both sides earn **1–3★ a turn** (+1 per 8 tiles between capitals, +1 per 6 cities between them); all your deals together pay at most **4★ a turn**. It ends if war is declared.
- **Tribute:** a **gift of 5★** (always accepted; warms them to you), a **demand of 10★** now, or **2★ a turn for 5 turns** (paid at the payer's turn start). A paid demand angers the payer; a refused one angers the demander. The computer pays when the demander is more than twice as strong and close (a raider, the aggressive empires, only 1.6 times as strong).
- **Breaking a treaty** needs a **declaration**: not in the first **3 rounds** of a treaty, and the war only begins at the declarer's **next turn** (a round's warning). It costs **25 trust** with every empire (15 for the aggressive, from whom no one expected better) (healing a point a round) and the victim remembers. After a war begins, peace can't be proposed for 3 rounds.
- **Opinion** (how they feel about you, −100..100): personality (Mongols, Vikings, Zulu, Aztecs, Pirates aggressive; Romans, Ottomans, Japanese, Persians, Lakota, Celts, Rus, Vietnamese proud; Swahili, Malians, Chinese, Māori, Greeks, Carthaginians, Arabs traders; Tibetans, Indians, Inuit, Aboriginal peoples peaceful; the rest steady), broken treaties, remembered deeds (gifts, demands, betrayals, refusals; fading a point a round), **shared enemies** (both fought someone in the last 6 rounds, +8 each), **touching borders** (−8, not between allies), a recent attack by you (−20), being **too powerful** (the top scorer, 30% above the average of 3+ living empires, from turn 8: −15), and treaties in force (peace +10, alliance +20, trade +6–12). Words: Hostile / Cold / Wary / Warm / Friendly.
- **Computer players** answer offers by opinion, strength and personality (afraid of the stronger, the warlike keep wars they are winning), and take one initiative a turn: peace with those they like, fear or are far from; trade with those they don't dislike; an alliance at opinion 35+; a gift when weak and threatened; tribute demands and **treaty-breaking** when much stronger than a close neighbour (the warlike need less of an edge), or against a too-powerful leader they are at least as strong as. The aggressive pick their fights: peace with everyone who is not easy prey, never peace for a weaker close neighbour, tribute from it while at peace, and war on it once 15% stronger. The same offer to the same empire waits 4 rounds. They never attack or march on treaty partners.
- **Human flow:** Empires screen → **Diplomacy**: every empire met, the relation, how they feel about you and why, trade and tribute, news, and buttons (propose peace / alliance / trade, gift, demand, declare war). Computer answers arrive at once as toasts. Offers to a human (from the computer, or from another human in pass & play) wait and are shown at the start of that human's turn as an envoy card with Accept / Decline; unanswered offers lapse after 2 rounds.
- **Where you see it:** allies' border fences are capped in **gold**, peace partners' in **white**; the tile panel says "Peace treaty: closed to your units" / "Allied: open to your units"; the Stars readout includes trade and tribute; toasts and log entries announce treaties, deals, tribute and wars (the latest are listed on the Diplomacy screen).
- **Victory:** Perfection is unchanged (best score). In **Domination**, when every surviving empire is allied with every other the game ends and they **win together** (the best scorer among them is named winner; every ally's game-over card counts as a victory).

**Breaking an alliance** takes **2 turns** (a peace treaty 1): the war only begins on the declarer's second turn after declaring, and meanwhile the alliance opens no borders, so the declarer's units can only walk out of the other's land.

## 14. Trade routes

Every empire has merchants (see `game/trade`): one Trader kind and one Trade Ship kind, drawn in each empire's own style and named by it: an Egyptian Camel Caravan, a Malian Salt Camel, an Inca Llama Train, an Inuit Dog Sled, a Lakota Travois Pony, a Mongol Bactrian Camel, an Aztec Pochteca Merchant, a Roman Ox Cart, a Chinese Silk Porter, a Viking Knarr, a Swahili Mtepe Dhow, a Pirate Smuggler Sloop, a Māori Trading Waka, a Chinese Junk...

- **Merchants.** Trader 5★ (Roads): 8 HP, attack 0, defence 1, move 2. Trade Ship 6★ (Sailing): 10 HP, attack 0, defence 1, move 3, launched onto a free water tile beside a coastal city; it sails the open ocean but never goes ashore. They take a unit slot, never attack and cannot capture cities or villages. A Trader may cross a peace partner's closed borders (but never enter its cities).
- **Opening a route.** Take the merchant into or beside another city (one of yours, or a foreign one you are not at war with; with Diplomacy off every foreign city trades) and choose **Establish Trade Route**. The merchant settles on the route (it leaves the map and frees its slot) and the route runs from its home city (or, if that is lost, your nearest city) to the target. The unit panel previews what the route would pay.
- **Yield.** Every turn each end earns 1★, +1 on a foreign route, +1 for a trail of 6+ steps and +1 for 12+ (at most 4), plus the empire bonus below. It is part of the city's income, so the HUD's Stars (+N) and the city panel count it.
- **Caps.** A city takes part in `1 + level/3` routes (1, 2 from level 3, 3 from level 6); an empire opens at most one more route than it has cities, and never more than 6.
- **Risk.** A route is cut when either city changes hands, when war is declared between the owners, or when a unit of an enemy of either owner stands on the trail and chooses **Raid Trade Route** (3★ plus a turn of what the route paid both ends; this uses its turn). Toasts tell both ends when a route opens or is cut.
- **Empire bonuses.** Mali: +1★ at a Malian end of a land route (salt tolls). Swahili: +1★ at a Swahili end of a sea route, Trade Ships 2★ cheaper (the monsoon). Persia: +1★ at a Persian end of a land route running at least half on roads (the Royal Road). Rome: Traders 1★ cheaper. Pirates: raids loot double.
- **Where you see it:** routes are drawn on the map as dotted caravan trails (dashed white sea lanes) in the colour of the empire that opened them, with a bale of goods at each end; the tile panel names the route on a trail tile. The **Trade** tab of the Empires screen lists your routes and their income, and the routes of others you have seen.
- **Computer players** train a merchant when they have stars to spare and a route to open, walk it to the best-paying city they can reach, and send soldiers to pillage enemy trails nearby.

## 15. Empire types and role units

Every empire belongs to one of three types (`category` in `data/tribes`). Each type trains **two role units** that no other type can have (see `game/roles`). A role unit is one unit kind, named and drawn in each empire's own style (an Ottoman *Sipahi Bey* under a red horse-tail standard, Roman *Fabri* with a pick-axe and turves, an Inca *Quipucamayoc* with his knotted cords, a Māori *Wayfinder Waka* under a crab-claw sail...). They hardly fight (attack 0, Sappers 1), have *dash* (they may act after moving), never capture cities or villages, and take a unit slot in the city that trained them. Their actions appear in the tile menu of the unit's own tile (tap the unit) and of the tile they act on (tap that tile).

| Type | Playstyle | Role units |
|---|---|---|
| ⚔️ Military | Conquerors: raise troops cheaply, dig forts and bridges, bring down walls | Recruiter · Sappers |
| 💰 Economy | Builders and traders: grand works at half price, cities that pay half again | Master Builder · Tax Collector |
| ⚓ Naval | Seafarers: fleets that feed the cities, voyagers that settle distant coasts | Fishing Fleet · Voyager |

**Stats:** Recruiter 3★ (Tactics): 10 HP, attack 0, defence 2, move 1, *fortify* · Sappers 5★ (Roads): 10/1/2, move 1 · Master Builder 5★ (Farming): 10/0/1 · Tax Collector 5★ (Trade): 6/0/0.5 · Fishing Fleet 5★ (Fishing): ship, 10/0/1, move 3, sees 2 · Voyager 8★ (Sailing): ship, 10/0/1, move 4, sees 3. The two ships are launched onto a free water tile beside a coastal city (like the Trade Ship), cross the open ocean and never go ashore.

### ⚔️ Recruiter (a warlord)
- **Station Here** (in one of your cities, uses its turn): while it stays on the city tile, units trained there cost **1★ less** (never below 1), and the city supports **one more unit**. A unit stationed on a city does not stop it training: new units step out onto a free tile beside the city.
- **Rally Militia** (stationed; only when an enemy unit is within **3** tiles of the city): a free warrior of your people (Legionary, Impi...) musters beside the city, ready to fight at once; it takes no unit slot. Then **4 turns** of cooldown. It does not use the recruiter's turn.
- Only one unit can stand on a city tile, so one recruiter counts per city. Killing a recruiter pays the killer **3★**.
- **Where you see it:** a ring in your colour with a banner badge under a stationed recruiter; the city panel says "Recruiter stationed: units 1★ cheaper, +1 unit slot, Rally Militia in N turns"; the train buttons say "(Recruiter: 1★ off)".

### ⚔️ Sappers (engineers)
- **Roads:** they lay a road, free, on the tile they march from and the tile they reach (their own or unclaimed land, not mountains).
- **Build Fort** (2★, uses its turn): a permanent earthwork on the tile they stand on (own or unclaimed land): **+1 defence** to their empire's units standing on it. It is the `fort` improvement marked as the sappers' own; a Roman castra is a separate kind of fort and still comes down when its legionary leaves.
- **Build Bridge** (2★, uses its turn): a shallow beside them (no port or resource, own or unclaimed) becomes a **bridge**: land with a road on it, so land units walk across; ships can no longer pass. Drawn as a wooden plank bridge on piles.
- **Undermine** (beside an enemy city, uses its turn): for **3 turns** the city's walls and garrison bonus count for nothing (its fortify units defend ×1). The owner is told; the city shows a caved-in breach and the panel says how long.

### 💰 Master Builder
- **Half-price building:** on its own tile or any tile of yours beside it, it builds a Farm, Mine, Port or Market for **half the price, rounded up** (the tile menu shows "Build Farm (½)"), with the same effect as the ordinary build. Uses its turn.
- **Upgrade (½)** (uses its turn): raises an improved tile of yours on or beside it to its **next level** (§5a: Farm → Estate → Granary Fields, Mine → Deep Mine → Foundry...) for **half the usual price** (rounded up). **Once per city** it may skip the level's tech (the action says so; the city remembers). The city-level rule for level 3 still applies. Its level-2 works are drawn as before (a manor, a headframe, a crane and harbour light, a domed hall). Grand works from older saves (Estate, Deep Mine, Harbour, Bazaar) load as level 2.

### 💰 Tax Collector
- **Station Here** (in one of your cities, uses its turn): while it stays on the city tile the city pays **+50% Stars** (rounded up, on everything the city earns). One unit stands on a city tile, so one collector counts per city and you can never have more stationed collectors than cities.
- Fragile (6 HP, defence 0.5); killing one pays the killer **4★**.
- **Where you see it:** the HUD's Stars (+N) and the city panel's income include it, and the panel says "Tax Collector stationed: +N★ a turn in taxes"; a ring with a gold coin badge lies under it.

### ⚓ Fishing Fleet
- **Bring in the Catch** (on a fish or whale tile anywhere at sea, even outside your borders; uses its turn): fish **+2★**, whale **+5★**, and **+1 population** to your nearest city. The resource is used up (Inuit waters that are resting cannot be fished).
- Every fleet earns **+1★ a turn** (in the HUD's Stars (+N)) and sees **2** tiles around it.

### ⚓ Voyager
- Moves **4**, crosses the ocean, sees **3** tiles around it.
- **Found Outpost** (on an empty, unclaimed land tile beside it — no city, village, ruin, camp or unit, not a mountain — at least **3** tiles from every city): the tile becomes a new **level-1 city** of yours, and the ship is used up (its slot is freed). You may hold **one outpost for every 2 cities** you own. The Pirates hold no land (their cities are platforms, §10), so their Voyager only explores.

**Computer players** research the tech of their role units, station recruiters in their largest (or threatened) cities and rally militia when a city is threatened, send sappers toward enemy cities (building roads on the way, forts when enemies are near, bridges to land worth reaching, and undermining a city their soldiers are besieging), keep a builder building and upgrading, station tax collectors in their richest cities, send fleets to the nearest fish and whales, and send voyagers to explore and settle empty coasts.

## 16. Auxiliaries: Spearman, Scout and Healer

Every empire trains three **auxiliaries** (see `game/auxiliaries`), named and drawn in its own style: a Roman *Triarius* behind a red oval shield, a Japanese *Yari Ashigaru* with a long tasselled pike, a Zulu *Umkhonto Spearman* with a cowhide shield; a Pirate *Lookout* with a spyglass, an Inca *Chaski Scout* with a knotted cord, a Lakota *Wolf Scout* under a wolf skin; a Greek *Asklepian Healer* with a serpent staff, a Tibetan *Amchi Healer* with a prayer wheel, a Khmer *Kru Khmer Healer* with a smoking censer... They are trained in a city like any unit and take a unit slot.

| Unit | Cost | HP | Attack | Defence | Move | Tech | Skills |
|---|---|---|---|---|---|---|---|
| Spearman | 3★ | 10 | 1.5 | 2 | 1 | Hunting | dash, fortify |
| Scout | 2★ | 8 | 0 | 1 | 3 (sees 3) | — | dash, forestwalk |
| Healer | 4★ | 8 | 0 | 1 | 1 | Meditation | dash |

### Spearman
- **Braced spears:** defends at **double strength** against a mounted attacker (its defence ×2, so it also strikes back much harder), and deals **+50% damage** when it attacks a mounted unit (the blow is shown big as "Spears!").
- **Mounted** means the mounted list used by the skill tree: Riders, Knights, Chariots, Horse Archers, War Elephants and the mounted uniques (Jaguar Warriors, Lakota Horse Warriors, Khampa Riders), plus the heroes who ride: Genghis Khan, Ramesses II, Sitting Bull and Songtsen Gampo. A unit in a boat is never mounted.
- Otherwise an ordinary foot soldier: it captures, fortifies and counts as melee for perks.

### Scout
- Moves **3**, sees **3** tiles around it and walks through forest without stopping. No attack, never captures cities or villages.
- **Ruins:** a Scout that opens a ruin finds **+3★** on top of the ruin's own reward.

### Healer (Monk)
- No attack, never captures. At the **start of your turn** every unit of yours standing next to a Healer heals **2 HP** (per Healer; not the Healer itself).
- **Convert** (uses its turn, then **5 turns** of cooldown): an enemy unit next to it at **half health or less** changes sides. It arrives spent (it cannot act until your next turn) and unsupported (no city pays for it, like the garrison of a captured city); its old city gets the slot back. It counts as an attack for diplomacy. Heroes, Great Beasts, Rogue State units and siege engines (Catapults, Hwacha) cannot be converted, nor, with Diplomacy on, the units of an empire you hold a treaty with.
- **Where you see it:** tap the Healer: its panel says "Convert: ready" or "ready in N turns", and a Convert button (with an arrow to the target) appears for each enemy beside it, greyed out with the reason when it can't be used; tapping a wounded enemy beside your Healer shows the same button. On the map a green ring lies under every Healer (brighter while Convert is ready), and a small green cross marks each wounded unit of its empire beside it (healed next turn); healing floats up as green numbers. A convert is toasted to both sides and logged.

**Computer players** train a Scout in the first turns while much of the map is unknown (and send it to ruins and the edge of the fog), research Hunting and train Spearmen in the city nearest the horsemen when mounted units make up a third or more of an enemy host near their cities, research Meditation once their army is large and keep a Healer beside it (two for a very large army), moving it next to the wounded, and Convert the most valuable wounded enemy they can.

## 17. Governments and Policy Cards

*(data/governments.ts, game/government.ts; screen in ui/government.ts.)* A flexible layer on top of the permanent skill tree: a **government** gives a small bonus of its own and a row of **policy slots**; the **cards** slotted into them are ordinary perks, so every rule that reads perks sees them.

| Government | Opens | Slots | Bonus |
|---|---|---|---|
| Chiefdom | start | Military, Economic | +1★ for every enemy defeated |
| Autocracy | Classical | Military, Economic, Wild | capital +1★ a turn; units in the capital defend +0.5 |
| Oligarchy | Classical | Military ×2, Economic | foot soldiers +0.5 attack |
| Classical Republic | Classical | Economic ×2, Wild | +1★ a turn from every city of level 3+ |
| Monarchy | Medieval | Military ×2, Economic, Wild | capital +2★ a turn; units in your cities defend +0.5 |
| Merchant Republic | Medieval | Military, Economic ×2, Wild | +1★ a turn per market; trade routes pay +25% |
| Theocracy | Medieval | Military, Economic, Wild ×2 | +1★ a turn per temple; units on your land heal +1 HP a turn |

- **Changing government** costs **6★ + 2★ per city**, takes effect at once, and the next change must wait **5 turns**. Cards already slotted move into the new slots that still take them (a typed slot first, then a Wild one); the rest go back to the hand.
- **18 cards**, each unlocked by a tech or an era. Military: *Levée* (start; units in your cities defend +0.5), *Conscription* (Tactics; every unit 1★ cheaper, never below 1★), *Bounty Rolls* (Archery; +2★ per kill), *Scorched Earth* (Roads; pillaging a trade trail or a coastal improvement heals the raider 5 HP), *Shield Drill* (Smithing; foot soldiers defend +0.5), *Horse Lords* (Horsemanship; mounted units +0.5 attack), *Field Surgeons* (Meditation; units on your land heal 2 HP a turn). Economic: *Tribute Rolls* (start; capital +1★), *Urban Planning* (Classical; +1 population when a city levels up), *Caravan Guilds* (Roads; trade routes +50%), *Stockyards* (Horsemanship; +1 Horse a turn), *Bloomery* (Mining; +1 Iron a turn), *Pilgrims* (Masonry; +1★ per temple), *Patronage* (Classical; wonders 20% cheaper). Wild: *Survey Corps* (Hunting; Scouts and Voyagers move +1), *Night Watch* (Classical; +1 vision), *Harbour Masters* (Sailing; boats and ships move +1), *Road Tolls* (Roads; +1★ per 4 road tiles).
- A Military slot takes a Military card, an Economic slot an Economic card, a **Wild slot any card**; Wild cards need a Wild slot.
- **Putting a card into an empty slot is free and immediate.** Replacing or removing a slotted card is free but allowed **once a turn**, and the card swapped in only counts **from your next turn** (a slot emptied this turn stays idle till then, so removing first doesn't dodge the wait).
- **Where you see it:** the **Govern** dock button (and the ⚖ chip, orange while a free slot could take a card) opens the Government screen: the government and its bonus, the slots with their cards ("From next turn" on a swapped-in card), the cards in hand (tap one, then a glowing slot; a card with exactly one free slot goes straight in), locked cards with what unlocks them, and every government with its slots, bonus and an Adopt button (or why not: the era needed, turns to wait, or the price). Changes are toasted, and a new government is logged and announced to every empire that has met you.
- **Computer players** adopt a government that suits them when they can afford it (Oligarchy or Monarchy at war, the Classical or Merchant Republic at peace, Autocracy for a small realm, Theocracy with many temples), fill every free slot with the best card for the moment and swap one card a turn when war or peace has made another clearly better (Conscription, Field Surgeons, Shield Drill at war; Tribute Rolls, Urban Planning, Caravan Guilds, Patronage at peace).

