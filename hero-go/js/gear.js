/* Hero Go! — equipment rules: slots, rarities, stats, perks, drops, upgrades and merging.
   Pure logic only (no DOM). The game passes its `save` object in. */
(function () {
  'use strict';

  const SLOTS = ['weapon', 'helmet', 'armor', 'boots', 'ring', 'amulet'];
  const SLOT_NAME = { weapon: 'Weapon', helmet: 'Helmet', armor: 'Armor', boots: 'Boots', ring: 'Ring', amulet: 'Amulet' };

  const RARITY = [
    { key: 'common', name: 'Common', color: '#c9c2b4', dark: '#6f685c', mult: 1, max: 10 },
    { key: 'rare', name: 'Rare', color: '#4aa3ff', dark: '#1f5fc4', mult: 1.7, max: 15 },
    { key: 'epic', name: 'Epic', color: '#b06bff', dark: '#6a2fc0', mult: 2.7, max: 20 },
    { key: 'legendary', name: 'Legendary', color: '#ffb02e', dark: '#b56a00', mult: 4.2, max: 25 },
    { key: 'mythic', name: 'Mythic', color: '#ff4d5e', dark: '#a01528', mult: 6.5, max: 30 },
  ];

  const NAMES = {
    weapon: ['Iron Sword', 'Steel Longsword', 'Arcane Saber', 'Sunforged Claymore', 'Dragonfang Reaver'],
    helmet: ['Leather Cap', 'Iron Helm', 'Mystic Circlet', 'Golden Crown Helm', 'Phoenix Crest'],
    armor: ['Padded Vest', 'Chainmail', 'Enchanted Plate', 'Royal Cuirass', 'Dragonscale Aegis'],
    boots: ['Worn Boots', 'Traveler Greaves', 'Wind Striders', 'Golden Sabatons', 'Stormwalkers'],
    ring: ['Copper Ring', 'Silver Band', 'Sapphire Ring', 'Sun Signet', 'Ember Loop of Ruin'],
    amulet: ['Bone Charm', 'Jade Pendant', 'Star Amulet', 'Sun Locket', 'Heart of the Dragon'],
  };

  // Base stats of a common, level 1 piece. Every slot has a job.
  const BASE = {
    weapon: { atk: 22 },
    ring: { atk: 11, def: 2 },
    helmet: { hp: 110, def: 3 },
    armor: { def: 9, hp: 60 },
    boots: { def: 6, hp: 70 },
    amulet: { hp: 95, atk: 6 },
  };

  // Legendary and Mythic pieces roll one perk. `key` is the run-bonus field it feeds; `f` converts the shown % to that field's unit.
  const PERKS = [
    { id: 'crit', name: 'Precision', key: 'critChance', f: 0.01, vals: [8, 14], text: v => `+${v}% Crit chance` },
    { id: 'vamp', name: 'Vampiric', key: 'lifesteal', f: 0.01, vals: [6, 10], text: v => `+${v}% Lifesteal` },
    { id: 'guard', name: 'Bulwark', key: 'dmgRed', f: 0.01, vals: [6, 10], text: v => `-${v}% damage taken` },
    { id: 'greed', name: 'Prospector', key: 'coinPct', f: 1, vals: [12, 20], text: v => `+${v}% coins` },
    { id: 'wisdom', name: 'Scholar', key: 'xpPct', f: 1, vals: [12, 20], text: v => `+${v}% EXP` },
  ];

  const BAG_MAX = 60;

  // Drop weights per source: [common, rare, epic, legendary, mythic]
  const SOURCES = {
    mob: [82, 15, 3, 0, 0],
    chest: [46, 34, 15, 4.5, 0.5],
    elite: [30, 40, 24, 5.5, 0.5],
    boss: [0, 30, 45, 22, 3],
    shop: [52, 31, 13.5, 3.2, 0.3],
    premium: [0, 46, 38, 14.2, 1.8],
  };
  const DROP_CHANCE = { mob: 0.05, elite: 0.4, boss: 1, chest: 1 };

  const pickW = (w, rng) => { const t = w.reduce((a, b) => a + b, 0); let r = rng() * t; for (let i = 0; i < w.length; i++) { r -= w[i]; if (r < 0) return i; } return w.length - 1; };

  function rollRarity(source, chapter, rng = Math.random) {
    // later chapters shift weight toward higher rarities
    const w = (SOURCES[source] || SOURCES.mob).map((x, i) => x * (1 + 0.22 * ((chapter || 1) - 1) * i));
    return pickW(w, rng);
  }

  function makeItem(save, slot, rarity, rng = Math.random) {
    slot = slot || SLOTS[Math.floor(rng() * SLOTS.length)];
    const it = { id: save.gearId = (save.gearId || 0) + 1, slot, rarity, lv: 1, spent: 0, name: NAMES[slot][rarity] };
    if (rarity >= 3) {
      const p = PERKS[Math.floor(rng() * PERKS.length)];
      it.perk = { id: p.id, v: p.vals[rarity - 3] };
    }
    return it;
  }

  const perkDef = id => PERKS.find(p => p.id === id);

  function stats(it) {
    const m = RARITY[it.rarity].mult * (1 + 0.1 * (it.lv - 1)), out = {};
    for (const k in BASE[it.slot]) out[k] = Math.round(BASE[it.slot][k] * m);
    return out;
  }

  const maxLv = it => RARITY[it.rarity].max;
  const upgradeCost = it => Math.round(40 * Math.pow(it.lv, 1.6) * (1 + it.rarity * 0.9));
  const salvageValue = it => Math.round(25 * Math.pow(2.6, it.rarity) + 0.5 * (it.spent || 0));

  function totals(save) {
    const t = { hp: 0, atk: 0, def: 0 };
    for (const slot of SLOTS) {
      const it = byId(save, (save.equipped || {})[slot]);
      if (!it) continue;
      const s = stats(it);
      for (const k in s) t[k] += s[k];
    }
    return t;
  }

  // Perk totals in the run-bonus field units (fractions for crit/lifesteal/damage reduction, percent points for coins/EXP)
  function perks(save) {
    const out = {};
    for (const slot of SLOTS) {
      const it = byId(save, (save.equipped || {})[slot]);
      if (!it || !it.perk) continue;
      const d = perkDef(it.perk.id);
      out[d.key] = (out[d.key] || 0) + it.perk.v * d.f;
    }
    return out;
  }

  function byId(save, id) { return id == null ? null : (save.gear || []).find(g => g.id === id) || null; }
  const isEquipped = (save, it) => (save.equipped || {})[it.slot] === it.id;

  // Adds to the bag. A full bag turns the new piece straight into coins.
  function addItem(save, it) {
    if (save.gear.length >= BAG_MAX) { const c = salvageValue(it); save.gold += c; return { kept: false, coins: c }; }
    save.gear.push(it);
    return { kept: true };
  }

  function equip(save, it) { save.equipped[it.slot] = it.id; }
  function unequip(save, it) { if (isEquipped(save, it)) delete save.equipped[it.slot]; }

  function upgrade(save, it) {
    if (it.lv >= maxLv(it)) return false;
    const c = upgradeCost(it);
    if (save.gold < c) return false;
    save.gold -= c; it.spent = (it.spent || 0) + c; it.lv++;
    return true;
  }

  function salvage(save, it) {
    if (isEquipped(save, it)) return 0;
    const c = salvageValue(it);
    save.gear = save.gear.filter(g => g.id !== it.id);
    save.gold += c;
    return c;
  }

  // Three unequipped pieces of the same slot and rarity merge into one piece of the next rarity.
  // Lowest levels go first, and half of the coins spent on them come back.
  function autoMerge(save, rng = Math.random) {
    let merged = 0, refund = 0;
    const made = [];
    for (let again = true; again;) {
      again = false;
      for (const slot of SLOTS) {
        for (let r = 0; r < RARITY.length - 1; r++) {
          const pool = save.gear.filter(g => g.slot === slot && g.rarity === r && !isEquipped(save, g)).sort((a, b) => a.lv - b.lv);
          while (pool.length >= 3) {
            const used = pool.splice(0, 3);
            used.forEach(u => { refund += Math.round((u.spent || 0) * 0.5); });
            const ids = new Set(used.map(u => u.id));
            save.gear = save.gear.filter(g => !ids.has(g.id));
            const it = makeItem(save, slot, r + 1, rng);
            save.gear.push(it); made.push(it); merged++; again = true;
          }
        }
      }
    }
    save.gold += refund;
    return { merged, refund, made };
  }

  // Starter kit so the Gear screen is never empty.
  function giveStarter(save) {
    save.gear = save.gear || []; save.equipped = save.equipped || {};
    for (const slot of ['weapon', 'helmet', 'armor']) {
      const it = makeItem(save, slot, 0);
      save.gear.push(it); save.equipped[slot] = it.id;
    }
  }

  window.GEAR = {
    SLOTS, SLOT_NAME, RARITY, NAMES, BASE, PERKS, BAG_MAX, SOURCES, DROP_CHANCE,
    rollRarity, makeItem, perkDef, stats, maxLv, upgradeCost, salvageValue, totals, perks,
    byId, isEquipped, addItem, equip, unequip, upgrade, salvage, autoMerge, giveStarter,
  };
})();
