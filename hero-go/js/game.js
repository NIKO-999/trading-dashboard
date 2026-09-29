/* Hero Go! — game engine: meta screens, day-by-day adventure, auto battles. */
(function () {
  'use strict';
  const { ICONS, SKILLS, CHAPTERS, ENEMY_STATS, ABILITY_INFO, ENEMY_ABILITIES, TEXT, HERO_BONUS } = window.GAME_DATA;
  const HEROES = window.HEROES || {};
  const ENEMIES = window.ENEMIES || {};
  const PETS = window.PETS || {};
  const SCENES = window.SCENES || {};
  const EGGS = window.EGGS || {};
  const G = window.GEAR;
  const HERO_KEYS = ['samurai', 'knight', 'aztec', 'polynesian', 'viking', 'zulu', 'spartan', 'mongol', 'egyptian', 'celtic'].filter(k => HEROES[k]);
  const HERO_SCENE = { samurai: 'forest', knight: 'desert', aztec: 'swamp', polynesian: 'storm', viking: 'snow', zulu: 'desert', spartan: 'desert', mongol: 'snow', egyptian: 'desert', celtic: 'forest' };
  const bonusOf = k => (HERO_BONUS[k] || { name: '', desc: '', fx: {} });

  // ---------------------------------------------------------------- utils
  const app = document.getElementById('app');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const el = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const rand = (a, b) => a + Math.random() * (b - a);
  const randi = (a, b) => Math.floor(rand(a, b + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const chance = p => Math.random() < p;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function fmt(n) {
    n = Math.round(n);
    const a = Math.abs(n);
    if (a < 10000) return String(n);
    if (a < 1e6) return (n / 1e3).toFixed(a < 1e5 ? 1 : 0).replace(/\.0$/, '') + 'K';
    if (a < 1e9) return (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
    return (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B';
  }
  let uidN = 0;
  const uid = () => 'u' + (++uidN);
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

  // ---------------------------------------------------------------- art (with graceful fallbacks)
  const blob = (c, label) => `<svg viewBox="0 0 200 200"><ellipse cx="100" cy="190" rx="50" ry="8" fill="#0003"/><g class="part-body"><path d="M40 180 C30 110 70 70 100 70 C130 70 170 110 160 180 Z" fill="${c}" stroke="#2b1d14" stroke-width="5"/><g class="part-eyes"><circle cx="80" cy="130" r="7" fill="#2b1d14"/><circle cx="120" cy="130" r="7" fill="#2b1d14"/></g></g><text x="100" y="60" font-size="18" text-anchor="middle" fill="#fff">${label || ''}</text></svg>`;
  const art = {
    hero: (k, u) => HEROES[k] ? HEROES[k].svg(u || uid()) : blob('#c0a080', k),
    portrait: (k, u) => HEROES[k] && HEROES[k].portrait ? HEROES[k].portrait(u || uid()) : blob('#c0a080'),
    enemy: (k, u) => ENEMIES[k] ? ENEMIES[k].svg(u || uid()) : blob('#7bd35a', k),
    pet: (k, u) => PETS[k] ? PETS[k].svg(u || uid()) : blob('#ffb0d0'),
    scene: k => SCENES[k] ? SCENES[k].svg() : `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice"><rect width="400" height="300" fill="#7cc4f0"/><rect y="190" width="400" height="110" fill="#d9b77a"/></svg>`,
    egg: (k, u) => EGGS[k] ? EGGS[k](u || uid()) : ICONS.egg,
    gear: (slot, rarity, u) => window.GEAR_ART ? window.GEAR_ART.icon(slot, rarity, u || uid()) : ICONS[({ weapon: 'sword', helmet: 'helm', armor: 'shield', boots: 'wind', ring: 'coin', amulet: 'gem' })[slot]],
  };
  const enemyName = k => (ENEMIES[k] && ENEMIES[k].name) || k;

  // ---------------------------------------------------------------- save
  const SAVE_KEY = 'herogo-save-v1';
  const DEFAULT_SAVE = () => {
    const s = {
    gold: 800, gems: 600, energy: 30, energyTs: Date.now(), speed: 1,
    hero: HERO_KEYS[0] || 'samurai', heroLv: {}, talents: {}, unlocked: 1, best: {},
    pets: {}, team: [], freeEggs: 3, bonusEggs: 0, eggDay: today(), hatches: 0, giftDay: '', runs: 0, music: true, sfx: true,
    gear: [], equipped: {}, gearId: 0, unlimited: false, pre: null,
    };
    G.giveStarter(s);
    return s;
  };
  let save = DEFAULT_SAVE();
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s) save = Object.assign(DEFAULT_SAVE(), s); } catch (e) { /* storage unavailable */ }
  if (!HEROES[save.hero]) save.hero = HERO_KEYS[0];
  if (save.freeEggs > 3) { save.bonusEggs += save.freeEggs - 3; save.freeEggs = 3; }
  const SND = window.SFX || { init() {}, play() {}, music() {}, setMusic() {}, setSfx() {} };
  SND.setMusic(save.music); SND.setSfx(save.sfx);
  const snd = n => { if (!(R && R.skip)) SND.play(n); };
  const UNL = 999999999;
  const money = v => (save.unlimited ? '∞' : fmt(v));
  const energyText = () => (save.unlimited ? '∞' : `${save.energy}/${ENERGY_MAX}`);
  // Unlimited mode: every spend is topped back up the moment it is saved.
  function topUp() { save.gold = Math.max(save.gold, UNL); save.gems = Math.max(save.gems, UNL); save.energy = ENERGY_MAX; save.freeEggs = 3; }
  function persist() { if (save.unlimited) topUp(); try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } }
  const ENERGY_MAX = 30, ENERGY_MS = 5 * 60 * 1000, RUN_COST = 5;
  function tickEnergy() {
    if (save.unlimited) { save.energy = ENERGY_MAX; save.energyTs = Date.now(); return; }
    if (save.energy >= ENERGY_MAX) { save.energyTs = Date.now(); return; }
    const gained = Math.floor((Date.now() - save.energyTs) / ENERGY_MS);
    if (gained > 0) { save.energy = Math.min(ENERGY_MAX, save.energy + gained); save.energyTs += gained * ENERGY_MS; }
  }
  function tickDaily() {
    if (save.eggDay !== today()) { save.eggDay = today(); save.freeEggs = 3; }
  }

  // ---------------------------------------------------------------- meta stat helpers
  const TALENTS = [
    { id: 'atk', name: 'Might', icon: 'sword', desc: n => `ATK +${n * 8}`, color: '#ff8a5c' },
    { id: 'hp', name: 'Vigor', icon: 'heart', desc: n => `Max HP +${n * 60}`, color: '#ff6b8a' },
    { id: 'def', name: 'Guard', icon: 'shield', desc: n => `DEF +${n * 4}`, color: '#5aa8ff' },
    { id: 'gold', name: 'Fortune', icon: 'coin', desc: n => `Coins +${n * 6}%`, color: '#ffd24a' },
    { id: 'xp', name: 'Wisdom', icon: 'talent', desc: n => `EXP +${n * 6}%`, color: '#8ef060' },
  ];
  const talentLv = id => save.talents[id] || 0;
  const talentCost = id => Math.round(120 * Math.pow(1.32, talentLv(id)));
  const heroLv = k => save.heroLv[k] || 1;
  const heroUpCost = k => Math.round(250 * Math.pow(heroLv(k), 1.55));
  const petLvBonus = (k) => { const p = PETS[k], o = save.pets[k]; if (!p || !o) return 0; return p.bonus.pct * (1 + 0.25 * (o.lv - 1)); };
  function teamBonus() {
    const b = { hp: 0, atk: 0, def: 0 };
    save.team.forEach(k => { if (PETS[k]) b[PETS[k].bonus.stat] += petLvBonus(k); });
    return b;
  }
  function heroStats(k) {
    k = k || save.hero;
    const H = HEROES[k] || { base: { hp: 500, atk: 100, def: 25 } };
    const m = 1 + (heroLv(k) - 1) * 0.1, tb = teamBonus(), g = G.totals(save);
    return {
      hp: Math.round((H.base.hp * m + talentLv('hp') * 60 + g.hp) * (1 + tb.hp / 100)),
      atk: Math.round((H.base.atk * m + talentLv('atk') * 8 + g.atk) * (1 + tb.atk / 100)),
      def: Math.round((H.base.def * m + talentLv('def') * 4 + g.def) * (1 + tb.def / 100)),
    };
  }

  // ---------------------------------------------------------------- generic UI
  function toast(msg) { const t = el(`<div class="toast">${msg}</div>`); app.append(t); setTimeout(() => t.remove(), 1800); }
  function modal(html, cls = '') { const m = el(`<div class="modal ${cls}">${html}</div>`); app.append(m); return m; }
  function chip(icon, val, id) { return `<div class="chip" ${id ? `id="${id}"` : ''}>${ICONS[icon]}<span>${val}</span></div>`; }
  function resChips() { tickEnergy(); return chip('energy', energyText(), 'energy') + chip('gem', money(save.gems)) + chip('coin', money(save.gold)); }

  // ---------------------------------------------------------------- navigation
  let tab = 'battle';
  function show(name) {
    tab = name;
    app.innerHTML = '';
    SND.music('home');
    ({ battle: renderHome, heroes: renderHeroes, gear: renderGear, pets: renderPets, talents: renderTalents, shop: renderShop })[name]();
  }
  function tabbar() {
    const tabs = [['shop', 'shop', 'Shop'], ['heroes', 'helm', 'Heroes'], ['gear', 'armor', 'Gear'], ['battle', 'battle', 'Battle'], ['pets', 'paw', 'Pets'], ['talents', 'talent', 'Talents']];
    const bar = el(`<nav class="tabbar">${tabs.map(([k, i, n]) => `<button class="tab ${tab === k ? 'on' : ''}" data-t="${k}">${ICONS[i]}${n}${k === 'pets' && save.freeEggs + save.bonusEggs > 0 ? '<i class="dot"></i>' : ''}${k === 'shop' && save.giftDay !== today() ? '<i class="dot"></i>' : ''}</button>`).join('')}</nav>`);
    bar.addEventListener('click', e => { const b = e.target.closest('.tab'); if (b) show(b.dataset.t); });
    return bar;
  }

  // ---------------------------------------------------------------- splash
  function splash() {
    const s = el(`<div class="splash">
      <div class="scene">${art.scene('forest')}</div><div class="dim"></div>
      <div class="lineup">${shuffle(HERO_KEYS).slice(0, 6).map(k => `<div>${art.hero(k)}</div>`).join('')}</div>
      <div class="logo title-gold">HERO<br>GO!</div>
      <div class="sub stroke-sm">${HERO_KEYS.length} legends. One endless road.</div>
      <button class="btn big tap">Play</button></div>`);
    app.append(s);
    $('.tap', s).onclick = () => { SND.init(); SND.music('home'); SND.play('select'); s.style.transition = 'opacity .35s'; s.style.opacity = 0; setTimeout(() => s.remove(), 350); };
  }

  // ---------------------------------------------------------------- sound settings
  const SPEAKER = on => `<svg viewBox="0 0 64 64"><path d="M8 24 H20 L34 10 V54 L20 40 H8 Z" fill="#fff" stroke="#2b1d14" stroke-width="4" stroke-linejoin="round"/>${on ? '<path d="M42 22 Q50 32 42 42 M48 14 Q62 32 48 50" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>' : '<path d="M42 24 L58 40 M58 24 L42 40" stroke="#ff4d4d" stroke-width="6" stroke-linecap="round"/>'}</svg>`;
  function soundToggles() {
    return `<div class="toggles"><button class="btn small ${save.music ? '' : 'grey'}" data-snd="music">Music: ${save.music ? 'On' : 'Off'}</button><button class="btn small ${save.sfx ? '' : 'grey'}" data-snd="sfx">Sound: ${save.sfx ? 'On' : 'Off'}</button></div>`;
  }
  function bindToggles(root, after) {
    $$('[data-snd]', root).forEach(b => b.onclick = () => {
      const k = b.dataset.snd; save[k] = !save[k]; persist();
      SND.init(); k === 'music' ? SND.setMusic(save.music) : SND.setSfx(save.sfx);
      const wrap = b.parentElement; wrap.outerHTML = soundToggles();
      bindToggles(root, after); if (after) after();
    });
  }
  function settingsModal() {
    const m = modal(`<div class="ribbon stroke">Settings</div><div class="panel">${soundToggles()}<div class="actions"><button class="btn" id="cl">Close</button></div></div>`);
    bindToggles(m, () => { const sb = $('.snd-btn'); if (sb) sb.innerHTML = SPEAKER(save.music || save.sfx); });
    $('#cl', m).onclick = () => m.remove();
  }
  // first tap anywhere unlocks audio; buttons click
  ['click', 'touchend'].forEach(t => app.addEventListener(t, () => SND.init(), { passive: true }));
  app.addEventListener('pointerdown', e => {
    if (e.target.closest('.btn:not([disabled]),.tab,.hcard,.egg-slot,.pcard,.ch-nav,.gear,.show-pets,.platform')) snd('click');
  });

  // ---------------------------------------------------------------- home
  let viewCh = null;
  // The first chapter you have not cleared yet (never past what is unlocked).
  function frontierChapter() {
    const c = CHAPTERS.find(ch => (save.best[ch.id] || 0) < ch.days);
    return Math.min(save.unlocked, c ? c.id : CHAPTERS.length);
  }
  function renderHome() {
    tickEnergy(); tickDaily();
    if (viewCh === null) viewCh = save.lastCh && save.lastCh <= save.unlocked ? save.lastCh : frontierChapter();
    const ch = CHAPTERS[viewCh - 1], locked = viewCh > save.unlocked, best = save.best[ch.id] || 0;
    const scr = el(`<div class="screen home">
      <div class="home-top"><div class="player"><div class="avatar">${art.portrait(save.hero)}</div><button class="gear snd-btn">${SPEAKER(save.music || save.sfx)}</button></div>${resChips()}</div>
      <div class="home-body">
        <div class="chapter-card">
          <div class="scene">${art.scene(ch.scene)}</div>
          <div class="hero-stand">${art.hero(save.hero)}</div>
          <div class="ch-label"><div class="n stroke-sm">Chapter ${ch.id}</div><div class="t stroke">${ch.name}</div></div>
          <div class="best">${best >= ch.days ? '★ Cleared!' : `Best: Day ${best} / ${ch.days}`}</div>
          ${locked ? `<div class="lock stroke">🔒 Clear Chapter ${ch.id - 1}</div>` : ''}
          <button class="ch-nav l" ${viewCh <= 1 ? 'disabled' : ''}>‹</button>
          <button class="ch-nav r" ${viewCh >= CHAPTERS.length ? 'disabled' : ''}>›</button>
        </div>
        <div class="home-start">
          <button class="btn big" id="start" ${locked ? 'disabled' : ''}>Start</button>
          <div class="cost stroke-sm">${ICONS.energy} ${RUN_COST}</div>
        </div>
      </div></div>`);
    scr.append(tabbar());
    app.append(scr);
    $('.snd-btn', scr).onclick = settingsModal;
    // energy refills over time; keep the counter honest while the player sits on this screen
    const eTimer = setInterval(() => {
      const c = $('#energy span');
      if (!c || !document.body.contains(scr)) return clearInterval(eTimer);
      tickEnergy(); c.textContent = energyText();
    }, 10000);
    $('.ch-nav.l', scr).onclick = () => { viewCh--; show('battle'); };
    $('.ch-nav.r', scr).onclick = () => { viewCh++; show('battle'); };
    $('#start', scr).onclick = () => {
      tickEnergy();
      if (save.energy < RUN_COST) { SND.play('error'); return toast('Not enough energy! Visit the Shop.'); }
      save.energy -= RUN_COST; if (save.energy < ENERGY_MAX && save.energy + RUN_COST >= ENERGY_MAX) save.energyTs = Date.now();
      save.lastCh = ch.id; persist(); startRun(ch);
    };
  }

  // ---------------------------------------------------------------- heroes screen
  let heroView = null;
  function renderHeroes() {
    if (!heroView) heroView = save.hero;
    const k = heroView, H = HEROES[k] || { name: k, title: '', lore: '', signature: { name: '', desc: '' }, color: '#888' };
    const st = heroStats(k), lv = heroLv(k), cost = heroUpCost(k);
    const scr = el(`<div class="screen">
      <div class="page-h"><div class="t stroke">Heroes</div>${chip('coin', money(save.gold))}</div>
      <div class="hero-scroll">
      <div class="hero-show"><div class="scene">${art.scene(HERO_SCENE[k] || 'forest')}</div><div class="ped"></div><div class="big">${art.hero(k)}</div></div>
      <div class="hero-row">${HERO_KEYS.map(h => `<button class="hcard ${h === k ? 'on' : ''}" data-h="${h}"><span class="lv">Lv.${heroLv(h)}</span>${art.portrait(h)}<div class="n">${HEROES[h].name}</div></button>`).join('')}</div>
      <div class="hero-info">
        <div class="nm stroke" style="color:${H.color}">${H.name}</div>
        <div class="tt">${H.title} · Lv.${lv}</div>
        <div class="lore">${H.lore || ''}</div>
        <div class="hstats">
          <div class="hstat">${ICONS.heart}${fmt(st.hp)}</div><div class="hstat">${ICONS.sword}${fmt(st.atk)}</div><div class="hstat">${ICONS.shield}${fmt(st.def)}</div>
        </div>
        <div class="sig"><div class="badge" style="background:${H.color}">★</div><div><div class="st">${H.signature.name} <span class="kind">Signature</span></div><div class="sd">${H.signature.desc}</div></div></div>
        <div class="sig"><div class="badge" style="background:${H.color}">✦</div><div><div class="st">${bonusOf(k).name} <span class="kind">Hero Bonus</span></div><div class="sd">${bonusOf(k).desc}</div></div></div>
      </div>
      </div>
      <div class="hero-actions">
        <button class="btn blue small" id="up" ${save.gold < cost || lv >= 30 ? 'disabled' : ''}>Upgrade ${ICONS.coin.replace('<svg', '<svg class="ico"')} ${fmt(cost)}</button>
        <button class="btn small ${save.hero === k ? 'grey' : ''}" id="use" ${save.hero === k ? 'disabled' : ''}>${save.hero === k ? 'In Use' : 'Select'}</button>
      </div></div>`);
    scr.append(tabbar());
    app.append(scr);
    const on = $('.hcard.on', scr); if (on) on.scrollIntoView({ block: 'nearest', inline: 'center' });
    $$('.hcard', scr).forEach(b => b.onclick = () => { heroView = b.dataset.h; show('heroes'); });
    $('#use', scr).onclick = () => { save.hero = k; persist(); toast(`${H.name} will lead the journey!`); show('heroes'); };
    $('#up', scr).onclick = () => { if (save.gold < cost) return; save.gold -= cost; save.heroLv[k] = lv + 1; persist(); SND.play('levelup'); toast(`${H.name} reached Lv.${lv + 1}!`); show('heroes'); };
  }

  // ---------------------------------------------------------------- pets screen
  const RARE_EGG_COST = 150, RARE_EGG10_COST = 1350;
  function renderPets() {
    tickDaily();
    const owned = Object.keys(save.pets).filter(k => PETS[k]);
    const campLv = 1 + Math.floor(save.hatches / 10), campXp = save.hatches % 10;
    const scr = el(`<div class="screen">
      <div class="pets-top"><div class="t stroke-sm">Pets</div>${chip('gem', money(save.gems))}${chip('coin', money(save.gold))}</div>
      <div class="camp"><div class="scene">${SCENES.camp ? SCENES.camp.svg() : art.scene('forest')}</div>
        <div class="platforms">${[0, 1, 2].map(i => `<button class="platform" data-i="${i}">${save.team[i] ? `<div class="pet-art">${art.pet(save.team[i])}</div>` : '<div class="empty">+</div>'}</button>`).join('')}</div>
        <div class="battle-sign">Battle</div>
        <button class="show-pets stroke-sm"><div class="sign">${ICONS.paw}</div>Show pets</button>
        <div class="roamers"></div>
      </div>
      <div class="eggs">
        <button class="egg-slot" data-e="free"><div class="eg">${art.egg('common')}</div><span class="cnt stroke">${save.unlimited ? '∞' : 'x' + (save.freeEggs + save.bonusEggs)}</span><span class="cost">${save.unlimited ? 'Free ∞' : save.freeEggs ? `Free ${save.freeEggs}/3` : save.bonusEggs ? 'Reward' : 'Tomorrow'}</span></button>
        <button class="egg-slot rare" data-e="r1"><div class="eg">${art.egg('rare')}</div><span class="cnt stroke">x1</span><span class="cost">${ICONS.gem}${RARE_EGG_COST}</span></button>
        <button class="egg-slot rare" data-e="r10"><div class="eg">${art.egg('rare')}</div><span class="cnt stroke">x10</span><span class="cost">${ICONS.gem}${RARE_EGG10_COST}</span></button>
      </div>
      <div class="pet-lv">LV.${campLv}<div class="bar"><i style="width:${campXp * 10}%"></i><span>${campXp}/10</span></div></div>
      </div>`);
    scr.append(tabbar());
    app.append(scr);
    // roaming pets (owned, not in team)
    const roam = $('.roamers', scr);
    owned.filter(k => !save.team.includes(k)).slice(0, 6).forEach(k => {
      const r = el(`<div class="roam">${art.pet(k)}</div>`);
      const move = () => { const x = rand(5, 75), y = rand(42, 72); r.classList.toggle('flip', x < parseFloat(r.style.left || 0)); r.style.left = x + '%'; r.style.top = y + '%'; };
      r.style.left = rand(5, 75) + '%'; r.style.top = rand(42, 72) + '%';
      roam.append(r);
      const iv = setInterval(() => { if (!document.body.contains(r)) return clearInterval(iv); move(); }, randi(3200, 5200));
    });
    $$('.platform', scr).forEach(p => p.onclick = () => petCollection());
    $('.show-pets', scr).onclick = () => petCollection();
    $$('.egg-slot', scr).forEach(b => b.onclick = () => {
      const e = b.dataset.e;
      if (e === 'free') {
        if (save.freeEggs > 0) save.freeEggs--; else if (save.bonusEggs > 0) save.bonusEggs--;
        else { SND.play('error'); return toast('Come back tomorrow for more free eggs!'); }
        hatch(['common']);
      }
      else if (e === 'r1') { if (save.gems < RARE_EGG_COST) return toast('Not enough gems'); save.gems -= RARE_EGG_COST; hatch(['rare']); }
      else { if (save.gems < RARE_EGG10_COST) return toast('Not enough gems'); save.gems -= RARE_EGG10_COST; hatch(Array(10).fill('rare')); }
    });
  }
  function rollPet(egg) {
    const r = Math.random(), odds = egg === 'common' ? [0.68, 0.94, 0.995] : [0.3, 0.72, 0.93];
    const rarity = r < odds[0] ? 'common' : r < odds[1] ? 'rare' : r < odds[2] ? 'epic' : 'legendary';
    const pool = Object.keys(PETS).filter(k => PETS[k].rarity === rarity);
    return pick(pool.length ? pool : Object.keys(PETS));
  }
  function hatch(eggs) {
    const results = eggs.map(e => { const k = rollPet(e); const o = save.pets[k]; const isNew = !o; if (o) o.lv = Math.min(10, o.lv + 1); else save.pets[k] = { lv: 1 }; save.hatches++; return { k, isNew, egg: e }; });
    if (save.team.length < 3) results.forEach(r => { if (save.team.length < 3 && !save.team.includes(r.k)) save.team.push(r.k); });
    persist();
    let i = 0;
    const m = modal('<div class="rays"></div><div class="hatch-box" style="position:relative;text-align:center"></div>');
    const box = $('.hatch-box', m);
    const step = () => {
      if (i >= results.length) { m.remove(); show('pets'); return; }
      const r = results[i++], P = PETS[r.k];
      box.innerHTML = `<div class="hatch-egg">${art.egg(r.egg)}</div><div class="stroke" style="font-size:22px;margin-top:10px">Hatching…</div>`;
      [0, 250, 500, 750].forEach(d => setTimeout(() => SND.play('wobble'), d));
      setTimeout(() => SND.play('crack'), 950);
      setTimeout(() => {
        SND.play('reveal');
        box.innerHTML = `<div class="hatch-pet">${art.pet(r.k)}</div>
          <div class="stroke" style="font-size:30px">${P ? P.name : r.k}</div>
          <div class="stroke-sm" style="font-size:16px;margin:4px 0;color:${{ common: '#cfd8e3', rare: '#6bb0ff', epic: '#c38bff', legendary: '#ffc14a' }[P && P.rarity]}">${(P && P.rarity || '').toUpperCase()} ${r.isNew ? '· NEW!' : `· Lv.${save.pets[r.k].lv}`}</div>
          <div class="stroke-sm" style="font-size:14px">${P ? P.bonus.stat.toUpperCase() + ' +' + P.bonus.pct + '%' : ''}</div>
          <div class="actions"><button class="btn">${i < results.length ? `Next (${results.length - i})` : 'OK'}</button></div>`;
        $('.btn', box).onclick = step;
      }, 1100);
    };
    step();
  }
  function petCollection() {
    const keys = Object.keys(PETS);
    const m = modal(`<div class="ribbon stroke">My Pets</div><div class="panel" style="background:#2e2540;color:#fff">
      <p style="font-size:13px;color:#d7cfe8">Tap to add/remove from your Battle team (max 3). Team bonuses apply to your hero.</p>
      <div class="petgrid">${keys.map(k => { const P = PETS[k], o = save.pets[k]; return `<button class="pcard rar-${P.rarity} ${o ? '' : 'locked'} ${save.team.includes(k) ? 'on' : ''}" data-k="${k}">${o ? `<span class="lv">Lv.${o.lv}</span>` : ''}${art.pet(k)}<div class="n">${P.name}</div><div class="b">${P.bonus.stat.toUpperCase()} +${Math.round(o ? petLvBonus(k) : P.bonus.pct)}%</div></button>`; }).join('')}</div>
      <div class="actions"><button class="btn" id="cl">Close</button></div></div>`);
    $$('.pcard', m).forEach(c => c.onclick = () => {
      const k = c.dataset.k;
      if (!save.pets[k]) return toast('Hatch eggs to discover this pet!');
      const i = save.team.indexOf(k);
      if (i >= 0) save.team.splice(i, 1); else if (save.team.length < 3) save.team.push(k); else return toast('Team is full (3 pets)');
      persist(); c.classList.toggle('on');
    });
    $('#cl', m).onclick = () => { m.remove(); show('pets'); };
  }

  // ---------------------------------------------------------------- talents
  function renderTalents() {
    const scr = el(`<div class="screen"><div class="page-h"><div class="t stroke">Talents</div>${chip('coin', money(save.gold))}</div>
      <div class="list">${TALENTS.map(t => { const lv = talentLv(t.id), c = talentCost(t.id); return `<div class="row"><div class="ri" style="background:linear-gradient(#fff5,${t.color})">${ICONS[t.icon]}</div><div class="rb"><div class="rn">${t.name} <span style="font-size:14px;color:#8a6a4a">Lv.${lv}</span></div><div class="rd">${t.desc(lv)} → ${t.desc(lv + 1)}</div></div><button class="btn small yellow" data-t="${t.id}" ${save.gold < c ? 'disabled' : ''}>${fmt(c)}</button></div>`; }).join('')}</div></div>`);
    scr.append(tabbar()); app.append(scr);
    $$('[data-t]', $('.list', scr)).forEach(b => b.onclick = () => { const id = b.dataset.t, c = talentCost(id); if (save.gold < c) return; save.gold -= c; save.talents[id] = talentLv(id) + 1; persist(); SND.play('buy'); show('talents'); });
  }

  // ---------------------------------------------------------------- gear
  const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  const STAT_NAME = { hp: 'HP', atk: 'ATK', def: 'DEF' };
  const STAT_ICON = { hp: 'heart', atk: 'sword', def: 'shield' };
  const rarityStyle = r => `--rc:${G.RARITY[r].color};--rd:${G.RARITY[r].dark};--rg:${hexA(G.RARITY[r].color, 0.4)}`;

  // One framed item. `opts.tag` = 'span' for display-only cells.
  function itemCell(it, opts = {}) {
    const t = opts.tag || 'button';
    return `<${t} class="gitem r${it.rarity} ${opts.cls || ''}" data-id="${it.id}" style="${rarityStyle(it.rarity)}">${art.gear(it.slot, it.rarity)}<span class="glv">Lv${it.lv}</span>${G.isEquipped(save, it) ? '<i class="geq">E</i>' : ''}${it.perk ? '<i class="gperk">★</i>' : ''}</${t}>`;
  }
  const statLines = (s, cmp) => Object.keys(Object.assign({}, s, cmp || {})).map(k => {
    const v = s[k] || 0, d = cmp ? v - (cmp[k] || 0) : 0;
    return `<div class="gstat"><span class="gsi">${ICONS[STAT_ICON[k]]}</span><span class="gsn">${STAT_NAME[k]}</span><b>+${fmt(v)}</b>${cmp && d ? `<em class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'}${fmt(Math.abs(d))}</em>` : ''}</div>`;
  }).join('');
  const perkLine = it => { if (!it.perk) return ''; const d = G.perkDef(it.perk.id); return `<div class="gperkline"><b>${d.name}</b> ${d.text(it.perk.v)}</div>`; };

  // ---- drops during a run
  function dropGear(source) {
    if (!chance(G.DROP_CHANCE[source] || 0)) return null;
    const it = G.makeItem(save, null, G.rollRarity(source, R.ch.id));
    const res = G.addItem(save, it);
    persist();
    R.loot.push({ it, kept: res.kept });
    if (it.rarity >= 3) { popBanner(G.RARITY[it.rarity].name.toUpperCase() + '!'); snd('levelup'); } else snd('chest');
    return { it, res };
  }
  const lootTag = d => ({ svg: art.gear(d.it.slot, d.it.rarity), text: d.it.name + (d.res.kept ? '' : ` (bag full: +${fmt(d.res.coins)})`), color: G.RARITY[d.it.rarity].color });

  // ---- reveal a batch of new pieces one by one (shop chests)
  function revealGear(results, after) {
    let i = 0;
    const m = modal('<div class="rays"></div><div class="hatch-box" style="position:relative;text-align:center;width:100%"></div>');
    const box = $('.hatch-box', m);
    const step = () => {
      if (i >= results.length) { m.remove(); if (after) after(); return; }
      const r = results[i++], it = r.it, rar = G.RARITY[it.rarity];
      box.innerHTML = `<div class="hatch-egg" style="height:140px;width:140px">${ICONS.chest}</div><div class="stroke" style="font-size:22px;margin-top:10px">Opening…</div>`;
      SND.play('chest');
      setTimeout(() => {
        SND.play(it.rarity >= 3 ? 'levelup' : 'reveal');
        box.innerHTML = `<div class="reveal-item" style="${rarityStyle(it.rarity)}">${itemCell(it, { tag: 'div', cls: 'huge' })}</div>
          <div class="stroke" style="font-size:28px;margin-top:8px;color:${rar.color}">${it.name}</div>
          <div class="stroke-sm" style="font-size:15px;margin:2px 0 6px">${rar.name} ${G.SLOT_NAME[it.slot]}</div>
          <div class="revstats">${statLines(G.stats(it))}</div>${perkLine(it)}
          ${r.kept ? '' : `<div class="stroke-sm" style="font-size:13px;color:#ffd24a">Bag full: turned into ${fmt(r.coins)} coins</div>`}
          <div class="actions"><button class="btn">${i < results.length ? `Next (${results.length - i})` : 'OK'}</button></div>`;
        $('.btn', box).onclick = step;
      }, it.rarity >= 3 ? 1100 : 700);
    };
    step();
  }
  function rollShopItem(source) { return G.makeItem(save, null, G.rollRarity(source, save.unlocked)); }
  function openChests(source, count, guaranteeEpic) {
    const items = Array.from({ length: count }, () => rollShopItem(source));
    if (guaranteeEpic && !items.some(x => x.rarity >= 2)) items[items.length - 1] = G.makeItem(save, null, chance(0.8) ? 2 : 3);
    const results = items.map(it => { const res = G.addItem(save, it); return { it, kept: res.kept, coins: res.coins || 0 }; });
    persist();
    revealGear(results, () => show(tab));
  }

  // ---- item detail popup
  function itemModal(id) {
    const m = modal('');
    const paint = () => {
      const it = G.byId(save, id);
      if (!it) { m.remove(); return; }
      const rar = G.RARITY[it.rarity], eq = G.isEquipped(save, it), cur = eq ? null : G.byId(save, save.equipped[it.slot]);
      const cost = G.upgradeCost(it), maxed = it.lv >= G.maxLv(it);
      m.innerHTML = `<div class="ribbon stroke" style="font-size:22px">${it.name}</div>
        <div class="panel gpanel">
          <div class="gbig" style="${rarityStyle(it.rarity)}">${itemCell(it, { tag: 'div', cls: 'huge' })}</div>
          <div class="gmeta" style="color:${rar.dark}">${rar.name} ${G.SLOT_NAME[it.slot]} · Lv ${it.lv}/${G.maxLv(it)}</div>
          <div class="gstats">${statLines(G.stats(it), cur ? G.stats(cur) : (eq ? null : {}))}</div>
          ${perkLine(it)}
          ${cur ? `<div class="gnote">Compared with your equipped ${cur.name}</div>` : ''}
          <div class="actions gactions2">
            <button class="btn small ${eq ? 'grey' : ''}" id="ge">${eq ? 'Unequip' : 'Equip'}</button>
            <button class="btn small blue" id="gu" ${maxed || save.gold < cost ? 'disabled' : ''}>${maxed ? 'Max level' : `Upgrade ${ICONS.coin.replace('<svg', '<svg class="ico"')} ${fmt(cost)}`}</button>
            <button class="btn small red" id="gs" ${eq ? 'disabled' : ''}>Salvage +${fmt(G.salvageValue(it))}</button>
            <button class="btn small grey" id="gc">Close</button>
          </div></div>`;
      $('#gc', m).onclick = () => m.remove();
      $('#ge', m).onclick = () => { eq ? G.unequip(save, it) : G.equip(save, it); persist(); SND.play('equip'); m.remove(); fillGear(); };
      $('#gu', m).onclick = () => { if (G.upgrade(save, it)) { persist(); SND.play('upgrade'); fillGear(); paint(); } };
      let armed = false;
      $('#gs', m).onclick = e => {
        if (!armed) { armed = true; e.target.textContent = 'Sure?'; setTimeout(() => { armed = false; if (document.body.contains(m) && $('#gs', m)) $('#gs', m).textContent = `Salvage +${fmt(G.salvageValue(it))}`; }, 2500); return; }
        const c = G.salvage(save, it); persist(); SND.play('coin'); toast(`Salvaged for ${fmt(c)} coins`); m.remove(); fillGear();
      };
    };
    paint();
  }

  // ---- gear screen
  let gearFilter = 'all', gearScr = null;
  function renderGear() {
    const scr = el(`<div class="screen"><div class="page-h"><div class="t stroke">Gear</div>${chip('coin', money(save.gold), 'gcoin')}</div><div class="gear-scroll"></div></div>`);
    scr.append(tabbar()); app.append(scr);
    gearScr = scr; fillGear();
  }
  function mergeGroups() {
    let n = 0;
    for (const slot of G.SLOTS) for (let r = 0; r < G.RARITY.length - 1; r++) n += Math.floor(save.gear.filter(g => g.slot === slot && g.rarity === r && !G.isEquipped(save, g)).length / 3);
    return n;
  }
  function fillGear() {
    if (!gearScr || !document.body.contains(gearScr)) return;
    const box = $('.gear-scroll', gearScr);
    const keepScroll = box.scrollTop;
    const cc = $('#gcoin span', gearScr); if (cc) cc.textContent = money(save.gold);
    const g = G.totals(save), st = heroStats(), H = HEROES[save.hero] || {};
    const slotBtn = s => {
      const it = G.byId(save, save.equipped[s]);
      return it
        ? `<button class="gslot has r${it.rarity}" data-slot="${s}" data-id="${it.id}" style="${rarityStyle(it.rarity)}">${art.gear(s, it.rarity)}<span class="glv">Lv${it.lv}</span>${it.perk ? '<i class="gperk">★</i>' : ''}</button>`
        : `<button class="gslot" data-slot="${s}"><span class="gph">${art.gear(s, 0)}</span><span class="gname">${G.SLOT_NAME[s]}</span></button>`;
    };
    const eqItems = G.SLOTS.map(s => G.byId(save, save.equipped[s])).filter(Boolean);
    const perkChips = eqItems.filter(i => i.perk).map(i => { const d = G.perkDef(i.perk.id); return `<span class="tag" style="color:${G.RARITY[i.rarity].color}">★ ${d.name}: ${d.text(i.perk.v)}</span>`; }).join('');
    const list = save.gear.filter(i => gearFilter === 'all' || i.slot === gearFilter).sort((a, b) => b.rarity - a.rarity || b.lv - a.lv || a.id - b.id);
    const commons = save.gear.filter(i => i.rarity === 0 && !G.isEquipped(save, i));
    box.innerHTML = `
      <div class="doll"><div class="scene">${art.scene(HERO_SCENE[save.hero] || 'forest')}</div>
        <div class="dcol l">${['weapon', 'helmet', 'armor'].map(slotBtn).join('')}</div>
        <div class="dhero">${art.hero(save.hero)}</div>
        <div class="dcol r">${['boots', 'ring', 'amulet'].map(slotBtn).join('')}</div>
      </div>
      <div class="hstats gtot">
        <div class="hstat">${ICONS.heart}<span>${fmt(st.hp)}${g.hp ? `<em>+${fmt(g.hp)}</em>` : ''}</span></div>
        <div class="hstat">${ICONS.sword}<span>${fmt(st.atk)}${g.atk ? `<em>+${fmt(g.atk)}</em>` : ''}</span></div>
        <div class="hstat">${ICONS.shield}<span>${fmt(st.def)}${g.def ? `<em>+${fmt(g.def)}</em>` : ''}</span></div>
      </div>
      ${perkChips ? `<div class="tags" style="margin-top:8px">${perkChips}</div>` : ''}
      <div class="gtools">
        <button class="btn small blue" id="gmerge" ${mergeGroups() ? '' : 'disabled'}>Auto Merge${mergeGroups() ? ` (${mergeGroups()})` : ''}</button>
        <button class="btn small red" id="gsalv" ${commons.length ? '' : 'disabled'}>Salvage Commons${commons.length ? ` (${commons.length})` : ''}</button>
      </div>
      <div class="bag-head"><b>Bag</b> <span>${save.gear.length}/${save.unlimited ? '∞' : G.BAG_MAX}</span></div>
      <div class="gfilters">${['all', ...G.SLOTS].map(f => `<button class="gf ${gearFilter === f ? 'on' : ''}" data-f="${f}">${f === 'all' ? 'All' : `<span class="gfi">${art.gear(f, 0)}</span>`}</button>`).join('')}</div>
      <div class="bag">${list.length ? list.map(i => itemCell(i)).join('') : `<div class="bag-empty">No ${gearFilter === 'all' ? '' : G.SLOT_NAME[gearFilter].toLowerCase() + ' '}gear yet. Win battles, open chests and visit the Shop!</div>`}</div>`;
    box.scrollTop = keepScroll;
    $$('.gslot', box).forEach(b => b.onclick = () => { if (b.dataset.id) itemModal(+b.dataset.id); else { gearFilter = b.dataset.slot; fillGear(); } });
    $$('.gitem', box).forEach(b => b.onclick = () => itemModal(+b.dataset.id));
    $$('.gf', box).forEach(b => b.onclick = () => { gearFilter = b.dataset.f; fillGear(); });
    const doMerge = () => {
      const r = G.autoMerge(save); if (!r.merged) return;
      persist(); SND.play('upgrade');
      const best = r.made.reduce((a, b) => (b.rarity > a.rarity ? b : a), r.made[0]);
      toast(`Merged ${r.merged} time${r.merged > 1 ? 's' : ''}! Best: ${best.name}${r.refund ? ` · +${fmt(r.refund)} coins back` : ''}`);
      fillGear();
    };
    $('#gmerge', box).onclick = () => {
      // pieces that would be used up and are upgraded or carry a perk deserve a second look
      let precious = 0;
      for (const slot of G.SLOTS) for (let r = 0; r < G.RARITY.length - 1; r++) {
        const pool = save.gear.filter(g => g.slot === slot && g.rarity === r && !G.isEquipped(save, g)).sort((a, b) => a.lv - b.lv);
        pool.slice(0, Math.floor(pool.length / 3) * 3).forEach(g => { if (g.lv > 1 || g.perk) precious++; });
      }
      if (!precious) return doMerge();
      const m = modal(`<div class="ribbon stroke">Merge?</div><div class="panel"><p>This will use up ${precious} upgraded or perk item${precious > 1 ? 's' : ''}.</p><div class="actions"><button class="btn grey" id="no">Cancel</button><button class="btn" id="yes">Merge</button></div></div>`);
      $('#no', m).onclick = () => m.remove();
      $('#yes', m).onclick = () => { m.remove(); doMerge(); };
    };
    $('#gsalv', box).onclick = () => {
      const m = modal(`<div class="ribbon stroke">Salvage?</div><div class="panel"><p>Turn ${commons.length} unequipped common item${commons.length > 1 ? 's' : ''} into coins?</p><div class="actions"><button class="btn grey" id="no">Keep</button><button class="btn red" id="yes">Salvage</button></div></div>`);
      $('#no', m).onclick = () => m.remove();
      $('#yes', m).onclick = () => { let c = 0; commons.forEach(i => { c += G.salvage(save, i); }); persist(); SND.play('coin'); toast(`+${fmt(c)} coins`); m.remove(); fillGear(); };
    };
  }

  // ---------------------------------------------------------------- sandbox
  function setUnlimited(on) {
    if (on && !save.unlimited) { save.pre = { gold: save.gold, gems: save.gems, freeEggs: save.freeEggs }; save.unlimited = true; }
    else if (!on && save.unlimited) {
      save.unlimited = false;
      if (save.pre) { save.gold = save.pre.gold; save.gems = save.pre.gems; save.freeEggs = save.pre.freeEggs; }
      save.pre = null; save.energy = ENERGY_MAX; save.energyTs = Date.now();
    }
    persist();
  }
  // Every hero, chapter, pet and piece of gear, all maxed out. Gear: one of every item, and every perk variant of Legendary/Mythic pieces.
  function unlockEverything() {
    setUnlimited(true);
    save.unlocked = CHAPTERS.length;
    HERO_KEYS.forEach(k => { save.heroLv[k] = 30; });
    TALENTS.forEach(t => { save.talents[t.id] = Math.max(talentLv(t.id), 30); });
    Object.keys(PETS).forEach(k => { save.pets[k] = { lv: 10 }; });
    const bestPets = ['babydragon', 'iceprincess', 'kingling'].filter(k => PETS[k]);
    if (bestPets.length) save.team = bestPets;
    save.gear = []; save.equipped = {};
    for (const slot of G.SLOTS) {
      for (let r = 0; r < G.RARITY.length; r++) {
        const variants = r >= 3 ? G.PERKS : [null];
        for (const perk of variants) {
          const it = G.makeItem(save, slot, r);
          it.lv = G.maxLv(it);
          if (perk) it.perk = { id: perk.id, v: perk.vals[r - 3] };
          save.gear.push(it);
        }
      }
    }
    // Wear the best set: a Mythic in every slot, with perks that cover crit, lifesteal, damage reduction, EXP and coins.
    const wear = { weapon: 'crit', helmet: 'vamp', armor: 'guard', boots: 'wisdom', ring: 'greed', amulet: 'crit' };
    for (const slot of G.SLOTS) {
      const it = save.gear.find(g => g.slot === slot && g.rarity === 4 && g.perk && g.perk.id === wear[slot]);
      if (it) G.equip(save, it);
    }
    persist();
  }

  // ---------------------------------------------------------------- shop
  function renderShop() {
    tickEnergy();
    const gift = save.giftDay !== today();
    const items = [
      { id: 'gift', name: 'Daily Gift', icon: 'chest', desc: '120 Gems + 300 Coins, free once a day', btn: gift ? 'Claim' : 'Claimed', ok: gift },
      { id: 'energy', name: 'Energy Refill', icon: 'energy', desc: `Refill energy to ${ENERGY_MAX}`, btn: '💎 60', ok: save.gems >= 60 && save.energy < ENERGY_MAX },
      { id: 'gold', name: 'Bag of Coins', icon: 'coin', desc: '2,000 Coins', btn: '💎 100', ok: save.gems >= 100 },
      { id: 'gold2', name: 'Chest of Coins', icon: 'chest', desc: '12,000 Coins', btn: '💎 500', ok: save.gems >= 500 },
      { id: 'gchest', name: 'Gear Chest', icon: 'armor', desc: '1 piece of gear. Up to Legendary.', btn: '🪙 1,500', ok: save.gold >= 1500 },
      { id: 'gchestP', name: 'Royal Chest', icon: 'armor', desc: '1 piece of gear, Rare or better.', btn: '💎 150', ok: save.gems >= 150 },
      { id: 'gchestP10', name: 'Royal Chest x10', icon: 'armor', desc: '10 pieces, Rare or better, with an Epic or better guaranteed.', btn: '💎 1,350', ok: save.gems >= 1350 },
    ];
    const sandbox = `<div class="row cheat"><div class="ri" style="background:linear-gradient(#fff6,#8ef060)">${ICONS.talent}</div><div class="rb"><div class="rn">Unlimited Mode</div><div class="rd">Endless coins, gems, energy, eggs and revives.</div></div><button class="btn small ${save.unlimited ? '' : 'grey'}" data-i="unl">${save.unlimited ? 'ON' : 'OFF'}</button></div>
      <div class="row cheat"><div class="ri" style="background:linear-gradient(#fff6,#8ef060)">${ICONS.armor}</div><div class="rb"><div class="rn">Unlock Everything</div><div class="rd">Every chapter, hero, pet and talent maxed, plus every piece of gear at max level. Turns Unlimited Mode on.</div></div><button class="btn small yellow" data-i="unlockall">Unlock</button></div>`;
    const scr = el(`<div class="screen"><div class="page-h"><div class="t stroke">Shop</div>${resChips()}</div>
      <div class="list">${sandbox}${items.map(i => `<div class="row"><div class="ri" style="background:linear-gradient(#fff6,#ffb03a)">${ICONS[i.icon]}</div><div class="rb"><div class="rn">${i.name}</div><div class="rd">${i.desc}</div></div><button class="btn small ${i.id === 'gift' ? '' : 'blue'}" data-i="${i.id}" ${i.ok ? '' : 'disabled'}>${i.btn}</button></div>`).join('')}
      <div class="row"><div class="ri" style="background:linear-gradient(#fff6,#ff6b6b)">${ICONS.gear}</div><div class="rb"><div class="rn">Reset progress</div><div class="rd">Start over from scratch</div></div><button class="btn small red" data-i="reset">Reset</button></div>
      </div></div>`);
    scr.append(tabbar()); app.append(scr);
    $$('[data-i]', scr).forEach(b => b.onclick = () => {
      const id = b.dataset.i;
      if (id === 'gift') { save.gems += 120; save.gold += 300; save.giftDay = today(); toast('+120 Gems, +300 Coins!'); }
      if (id === 'energy') { save.gems -= 60; save.energy = ENERGY_MAX; toast('Energy refilled!'); }
      if (id === 'unl') { setUnlimited(!save.unlimited); toast(save.unlimited ? 'Unlimited Mode on' : 'Unlimited Mode off'); return show('shop'); }
      if (id === 'unlockall') { unlockEverything(); SND.play('levelup'); toast('Everything unlocked!'); return show('shop'); }
      if (id === 'gold') { save.gems -= 100; save.gold += 2000; toast('+2,000 Coins'); }
      if (id === 'gold2') { save.gems -= 500; save.gold += 12000; toast('+12,000 Coins'); }
      if (id === 'gchest') { save.gold -= 1500; persist(); return openChests('shop', 1, false); }
      if (id === 'gchestP') { save.gems -= 150; persist(); return openChests('premium', 1, false); }
      if (id === 'gchestP10') { save.gems -= 1350; persist(); return openChests('premium', 10, true); }
      if (id === 'reset') {
        const m = modal(`<div class="ribbon stroke">Reset?</div><div class="panel"><p>This erases all heroes, pets, coins and chapter progress.</p><div class="actions"><button class="btn grey" id="no">Keep</button><button class="btn red" id="yes">Reset</button></div></div>`);
        $('#no', m).onclick = () => m.remove();
        $('#yes', m).onclick = () => { m.remove(); save = DEFAULT_SAVE(); viewCh = null; persist(); toast('Progress reset'); show('shop'); };
        return;
      }
      persist(); show('shop');
    });
  }

  // ================================================================ THE ADVENTURE
  let R = null; // current run

  function startRun(ch) {
    const st = heroStats();
    const H = HEROES[save.hero];
    R = {
      ch, day: 0, lv: 1, xp: 0, coins: 0, kills: 0, over: false, skip: false, revived: false,
      base: st, hpPct: 0, atkPct: 0, defPct: 0, skills: {}, sig: H ? H.signature.type : 'crit', heroKey: save.hero,
      hp: st.hp, maxHp: st.hp, atk: st.atk, def: st.def, shield: 0, enemies: [], pet: save.team[0] || null,
      bonus: (() => { const b = Object.assign({}, bonusOf(save.hero).fx), p = G.perks(save); for (const k in p) b[k] = (b[k] || 0) + p[k]; return b; })(),
      loot: [],
    };
    R.atkPct += R.bonus.atkPct || 0; R.defPct += R.bonus.defPct || 0; R.hpPct += R.bonus.hpPct || 0;
    if (R.bonus.startSkill) { R.skills[R.bonus.startSkill] = 1; if (R.bonus.startSkill === 'atk') R.atkPct += 18; }
    recalc();
    R.hp = R.maxHp;
    save.runs++; persist();
    SND.music('adventure');
    buildRunScreen();
    log(`<b>${bonusOf(R.heroKey).name}</b>: ${bonusOf(R.heroKey).desc}`);
    runLoop();
  }
  const xpNeed = lv => Math.round(24 + lv * 16);
  const sk = id => R.skills[id] || 0;
  function recalc() {
    const lvm = 1 + (R.lv - 1) * 0.06, old = R.maxHp;
    R.maxHp = Math.round(R.base.hp * lvm * (1 + R.hpPct / 100));
    R.atk = Math.round(R.base.atk * lvm * (1 + R.atkPct / 100));
    R.def = Math.round(R.base.def * lvm * (1 + R.defPct / 100));
    if (R.maxHp > old) R.hp += R.maxHp - old;
    R.hp = clamp(R.hp, 0, R.maxHp);
  }
  function effAtk() {
    let a = R.atk;
    if (sk('rage') && R.hp < R.maxHp / 2) a *= 1 + 0.4 + 0.3 * (sk('rage') - 1);
    if (R.sig === 'rage') a *= 1 + 0.6 * (1 - R.hp / R.maxHp); // Berserkergang
    if (R.sig === 'stack') a *= 1 + 0.05 * (R.cry || 0); // Battle Cry
    return a;
  }

  // ---------------------------------------------------------------- run screen
  let S = {}; // cached run DOM
  function buildRunScreen() {
    app.innerHTML = '';
    const ch = R.ch;
    const scr = el(`<div class="screen run">
      <div class="stage">
        <div class="scene"><div class="track"><div class="tile">${art.scene(ch.scene)}</div><div class="tile m">${art.scene(ch.scene)}</div><div class="tile">${art.scene(ch.scene)}</div></div></div>
        <div class="run-top">
          <button class="gear">${ICONS.gear}</button>
          <div class="progress"><div class="ptrack"><div class="fill"></div></div></div>
          ${chip('coin', '0', 'coins')}
        </div>
        <div class="boss-bar"><div class="bar"><i></i><span></span></div><div class="round-pill">Round : 1/15</div></div>
        <div class="actors"></div>
        <div class="fx"></div>
        <div class="stage-btns"><button class="btn skip">⏩ Skip</button><button class="btn speed">x${save.speed}</button></div>
      </div>
      <div class="statbar">
        <div class="stat xp"><span class="lab">EXP</span><i class="fillbar"></i><svg class="ic" viewBox="0 0 64 64"><path d="M32 4 L56 18 V46 L32 60 L8 46 V18 Z" fill="#5fbf2a" stroke="#2b1d14" stroke-width="4"/><text x="32" y="40" font-size="18" text-anchor="middle" fill="#fff" stroke="#2b1d14" stroke-width="3" paint-order="stroke" font-family="Lilita One, sans-serif">EXP</text></svg><span class="v"></span></div>
        <div class="stat hp"><span class="lab">HP</span><i class="fillbar"></i><i class="shieldfill"></i>${ICONS.heart.replace('<svg', '<svg class="ic"')}<span class="pct"></span><span class="v"></span></div>
        <div class="stat atk"><span class="lab">ATK</span>${ICONS.sword.replace('<svg', '<svg class="ic"')}<span class="v"></span></div>
        <div class="stat def"><span class="lab">DEF</span>${ICONS.shield.replace('<svg', '<svg class="ic"')}<span class="v"></span></div>
      </div>
      <div class="journal"></div>
    </div>`);
    app.append(scr);
    S = {
      scr, stage: $('.stage', scr), actors: $('.actors', scr), fx: $('.fx', scr), journal: $('.journal', scr),
      coins: $('#coins span', scr), progress: $('.progress', scr), bossBar: $('.boss-bar', scr),
      skip: $('.skip', scr), speed: $('.speed', scr),
    };
    // progress milestones
    const track = $('.ptrack', S.progress);
    S.progress.classList.toggle('dense', milestones().length > 6);
    milestones().forEach(m => track.append(el(`<div class="ms ${m.boss ? 'boss' : ''}" data-d="${m.d}" style="left:${m.d / ch.days * 100}%">${m.boss ? ICONS.devil : ICONS.swords}<span class="d">${m.d}</span></div>`)));
    track.append(el(`<div class="cur" style="left:0%">0</div>`));
    // hero + pet actors
    S.hero = el(`<div class="actor hero" style="--asp:${(HEROES[R.heroKey] && HEROES[R.heroKey].aspect) || 1.2}"><div class="art">${art.hero(R.heroKey, 'run')}</div><div class="status"></div><div class="hpbar"><b></b><i></i><span></span></div></div>`);
    S.actors.append(S.hero);
    if (R.pet) { S.pet = el(`<div class="actor pet"><div class="art">${art.pet(R.pet, 'runpet')}</div></div>`); S.actors.append(S.pet); }
    S.speed.classList.toggle('x1', save.speed === 1);
    S.speed.onclick = () => { save.speed = save.speed === 1 ? 2 : 1; S.speed.textContent = 'x' + save.speed; S.speed.classList.toggle('x1', save.speed === 1); persist(); setWalkSpeed(); };
    setWalkSpeed();
    S.skip.onclick = () => { R.skip = true; };
    $('.gear', scr).onclick = pauseMenu;
    updateStats();
  }
  function milestones() {
    const out = [];
    for (let d = 10; d < R.ch.days; d += 10) out.push({ d, boss: false });
    out.push({ d: R.ch.days, boss: true });
    return out;
  }
  function updateProgress() {
    const pct = R.day / R.ch.days * 100;
    $('.fill', S.progress).style.width = pct + '%';
    const cur = $('.cur', S.progress); cur.style.left = pct + '%'; cur.textContent = R.day;
    $$('.ms', S.progress).forEach(m => m.classList.toggle('done', +m.dataset.d < R.day));
  }
  function updateStats() {
    if (!S.scr) return;
    const q = s => $(s, S.scr);
    const need = xpNeed(R.lv);
    q('.stat.xp .v').textContent = 'LVL.' + R.lv;
    q('.stat.xp .fillbar').style.width = clamp(R.xp / need * 100, 0, 100) + '%';
    q('.stat.hp .v').textContent = `${fmt(R.hp)}/${fmt(R.maxHp)}`;
    q('.stat.hp .fillbar').style.width = clamp(R.hp / R.maxHp * 100, 0, 100) + '%';
    q('.stat.hp .shieldfill').style.width = clamp(R.shield / R.maxHp * 100, 0, 100) + '%';
    q('.stat.hp .pct').textContent = Math.ceil(R.hp / R.maxHp * 100) + '%';
    q('.stat.atk .v').textContent = fmt(effAtk());
    q('.stat.def .v').textContent = fmt(effDef());
    S.coins.textContent = fmt(R.coins);
    setBar(S.hero, R.hp, R.maxHp, R.shield);
  }
  function setBar(actorEl, hp, max, shield) {
    const i = $('.hpbar i', actorEl), sp = $('.hpbar span', actorEl), b = $('.hpbar b', actorEl);
    if (!i) return;
    i.style.width = clamp(hp / max * 100, 0, 100) + '%';
    if (b) b.style.width = clamp(shield / max * 100, 0, 100) + '%';
    sp.textContent = fmt(Math.max(0, hp));
  }

  // ---------------------------------------------------------------- journal
  function logDay(d) { S.journal.append(el(`<div class="day-h">DAY ${d}</div>`)); }
  function log(html, tags) {
    const e = el(`<div class="entry">${html}${tags && tags.length ? `<div class="tags">${tags.map(t => `<span class="tag ${t.cls || ''}" ${t.color ? `style="color:${t.color}"` : ''}>${t.svg || (t.icon ? ICONS[t.icon] : '')}${t.text}</span>`).join('')}</div>` : ''}</div>`);
    S.journal.append(e);
    requestAnimationFrame(() => { S.journal.scrollTop = S.journal.scrollHeight; });
    return e;
  }

  // ---------------------------------------------------------------- timing
  // Every await in the adventure goes through these. When the run is over (retreat, results) the promise
  // never settles, so the abandoned day/battle loop simply stops; while paused, time stands still.
  const NEVER = new Promise(() => {});
  function gate(run, resolve) {
    if (!run || run.over || R !== run) return;
    if (run.paused) { setTimeout(() => gate(run, resolve), 100); return; }
    resolve();
  }
  const wait = ms => {
    const run = R;
    if (!run || run.over) return NEVER;
    if (run.skip && !run.paused) return Promise.resolve();
    return new Promise(r => setTimeout(() => gate(run, r), ms / (save.speed || 1)));
  };
  const realWait = ms => { const run = R; return new Promise(r => setTimeout(() => gate(run, r), ms)); };

  // ---------------------------------------------------------------- walking
  let stepTimer = null;
  function setWalkSpeed() {
    if (!S.stage) return;
    const sp = save.speed || 1;
    S.stage.style.setProperty('--scroll', (9 / sp) + 's');
    S.stage.style.setProperty('--stride', (0.52 / sp) + 's');
    if (stepTimer) { setWalking(false); setWalking(true); }
  }
  function setWalking(on) {
    if (!S.stage) return;
    S.stage.classList.toggle('walking', on);
    clearInterval(stepTimer); stepTimer = null;
    if (!on) return;
    let n = 0;
    stepTimer = setInterval(() => {
      if (!S.stage || !document.body.contains(S.stage)) { clearInterval(stepTimer); stepTimer = null; return; }
      n++;
      if (n % 2) SND.play('step');
      const f = pos(S.hero, 0.96);
      fxEl('<div class="dust"></div>', f.x - f.w * 0.12 + (n % 2 ? 10 : -4), f.y, 700);
    }, 260 / (save.speed || 1));
  }

  // ---------------------------------------------------------------- main loop
  async function runLoop() {
    while (!R.over) {
      R.day++;
      updateProgress();
      logDay(R.day);
      setWalking(true);
      await wait(1300);
      await dayEvent();
      if (R.over) return;
      await checkLevelUp();
      if (R.day >= R.ch.days) return finishRun(true);
      await wait(650);
    }
  }

  async function dayEvent() {
    const d = R.day, days = R.ch.days;
    if (d === 1) {
      log(pick(TEXT.start));
      return skillSelect('Choose a starting skill');
    }
    if (d === days) return battle('boss');
    if (d % 10 === 0) return battle('elite');
    const table = [['battle', 52], ['story', 15], ['chest', 7], ['campfire', 5]];
    if (d >= 3) table.push(['angel', 6]);
    if (d >= 5) table.push(['devil', 5]);
    if (d >= 4) table.push(['merchant', 5]);
    if (d >= 2) table.push(['wheel', 5]);
    const tot = table.reduce((a, b) => a + b[1], 0);
    let r = Math.random() * tot, ev = 'battle';
    for (const [k, w] of table) { if ((r -= w) < 0) { ev = k; break; } }
    return EVENTS[ev]();
  }

  const EVENTS = {
    battle: () => battle('mob'),
    story() {
      const s = pick(TEXT.story), fx = s.fx, tags = [];
      if (fx.hpPct || fx.maxHpPct) { const p = fx.hpPct || fx.maxHpPct; R.hpPct += p; tags.push({ icon: 'heart', text: `Max HP+${p}%` }); }
      if (fx.atkPct) { R.atkPct += fx.atkPct; tags.push({ icon: 'sword', text: `ATK+${fx.atkPct}%` }); }
      if (fx.defPct) { R.defPct += fx.defPct; tags.push({ icon: 'shield', text: `DEF+${fx.defPct}%` }); }
      recalc();
      if (fx.healPct) { const v = heal(R.maxHp * fx.healPct / 100); tags.push({ icon: 'heal', text: `HP+${fmt(v)}` }); }
      if (fx.hurtPct) { const v = Math.min(R.hp - 1, Math.round(R.maxHp * fx.hurtPct / 100)); R.hp -= v; tags.push({ icon: 'heart', text: `HP-${fmt(v)}`, cls: 'bad' }); flashHit(S.hero); }
      if (fx.gold) { const g = addCoins(fx.gold * (1 + R.day * 0.05)); tags.push({ icon: 'coin', text: `+${fmt(g)}`, cls: 'gold' }); }
      if (fx.xp) { const x = addXp(fx.xp * (1 + R.day * 0.05)); tags.push({ icon: 'talent', text: `EXP+${fmt(x)}` }); }
      log(s.t, tags);
      updateStats();
    },
    async chest() {
      const g = addCoins(rand(40, 80) * (1 + R.day * 0.08));
      const tags = [{ icon: 'coin', text: `+${fmt(g)}`, cls: 'gold' }];
      if (chance(0.5)) { const st = pick(['atk', 'hp', 'def']); const p = randi(5, 10); R[st + 'Pct'] += p; recalc(); tags.push({ icon: { atk: 'sword', hp: 'heart', def: 'shield' }[st], text: `${st === 'hp' ? 'Max HP' : st.toUpperCase()}+${p}%` }); }
      snd('chest');
      const loot = dropGear('chest'); if (loot) tags.push(lootTag(loot));
      log('You found a <em>treasure chest</em> half-buried in the dirt!', tags);
      updateStats();
      await wait(300);
    },
    async campfire() {
      const v = heal(R.maxHp * 0.4);
      snd('heal');
      log('You rest by a crackling campfire and roast some marshmallows.', [{ icon: 'heal', text: `HP+${fmt(v)}` }]);
      updateStats();
    },
    async angel() {
      log('A gentle light descends — an <b>Angel</b> smiles upon you.');
      snd('angel');
      const choice = await choiceModal('Angel\'s Blessing', ICONS.angel, [
        { icon: 'heal', rarity: 'common', name: 'Healing Light', desc: 'Restore <b>60%</b> of Max HP.', fn: () => heal(R.maxHp * 0.6) },
        { icon: 'heart', rarity: 'rare', name: 'Blessed Body', desc: '<b>Max HP +25%</b>.', fn: () => { R.hpPct += 25; recalc(); } },
        { icon: 'angel', rarity: 'epic', name: 'Divine Gift', desc: 'Learn a random <b>Epic</b> or <b>Legendary</b> skill.', fn: () => grantRandomSkill(['epic', 'legendary']) },
      ]);
      log(`The Angel granted you <b>${choice.name}</b>.`);
      updateStats();
    },
    async devil() {
      log('A grinning <em>Devil</em> steps out of the shadows. "Care to make a deal?"');
      snd('devil');
      const cost = Math.round(R.hp * 0.3);
      const choice = await choiceModal('Devil\'s Deal', ICONS.devil, [
        { icon: 'rage', rarity: 'epic', name: 'Blood Pact', desc: `Lose <em>${fmt(cost)} HP</em>. Gain <b>ATK +30%</b>.`, fn: () => { R.hp -= cost; R.atkPct += 30; recalc(); } },
        { icon: 'devil', rarity: 'legendary', name: 'Soul Bargain', desc: `Lose <em>${fmt(cost)} HP</em>. Learn a random <b>Epic</b> skill.`, fn: () => { R.hp -= cost; grantRandomSkill(['epic', 'legendary']); } },
        { icon: 'wind', rarity: 'common', name: 'Walk Away', desc: 'Refuse the deal. Nothing happens.', fn: () => { } },
      ]);
      log(choice.name === 'Walk Away' ? 'You walk away. The Devil shrugs.' : `The Devil cackles. <b>${choice.name}</b> sealed.`);
      updateStats();
    },
    async merchant() {
      log('A travelling <b>merchant</b> waves you over. "Finest skills, cheap cheap!"');
      const price = Math.round(60 + R.day * 8);
      const offers = skillPool(3).map(id => ({ id, price: SKILLS[id].rarity === 'legendary' ? price * 2 : SKILLS[id].rarity === 'epic' ? Math.round(price * 1.5) : price }));
      const opts = offers.map(o => ({ ...skillCard(o.id), desc: `<b>Price: ${fmt(o.price)} coins</b><br>` + skillCard(o.id).desc, disabled: !save.unlimited && R.coins < o.price, fn: () => { if (!save.unlimited) R.coins -= o.price; SND.play('buy'); learn(o.id); } }));
      opts.push({ icon: 'wind', rarity: 'common', name: 'No thanks', desc: 'Keep your coins.', fn: () => { } });
      const c = await choiceModal('Merchant', ICONS.chest, opts);
      log(c.name === 'No thanks' ? 'You politely decline.' : `You bought <b>${c.name}</b>.`);
      updateStats();
    },
    async wheel() {
      log('You find an ancient <b>Wheel of Fortune</b> covered in moss.');
      const segs = [
        { t: 'ATK+15%', c: '#ff6b6b', fn: () => { R.atkPct += 15; recalc(); }, tag: { icon: 'sword', text: 'ATK+15%' } },
        { t: 'Heal 50%', c: '#4be0a6', fn: () => heal(R.maxHp * 0.5), tag: { icon: 'heal', text: 'HP healed' } },
        { t: 'Coins', c: '#ffd24a', fn: () => addCoins(150 * (1 + R.day * 0.06)), tag: { icon: 'coin', text: 'Coins!', cls: 'gold' } },
        { t: 'HP+20%', c: '#ff8ac0', fn: () => { R.hpPct += 20; recalc(); }, tag: { icon: 'heart', text: 'Max HP+20%' } },
        { t: 'DEF+20%', c: '#5aa8ff', fn: () => { R.defPct += 20; recalc(); }, tag: { icon: 'shield', text: 'DEF+20%' } },
        { t: 'Skill', c: '#b36bff', fn: () => grantRandomSkill(['rare', 'epic']), tag: { icon: 'talent', text: 'New skill!' } },
      ];
      const n = segs.length, idx = randi(0, n - 1), a = 360 / n;
      const wsvg = `<svg class="wheel" viewBox="-110 -110 220 220">${segs.map((s, i) => { const a0 = (i * a - 90 - a / 2) * Math.PI / 180, a1 = ((i + 1) * a - 90 - a / 2) * Math.PI / 180, mid = (i * a - 90) * Math.PI / 180; return `<path d="M0 0 L${100 * Math.cos(a0)} ${100 * Math.sin(a0)} A100 100 0 0 1 ${100 * Math.cos(a1)} ${100 * Math.sin(a1)} Z" fill="${s.c}" stroke="#2b1d14" stroke-width="3"/><text x="${62 * Math.cos(mid)}" y="${62 * Math.sin(mid) + 5}" text-anchor="middle" font-size="14" font-family="Lilita One,sans-serif" fill="#fff" stroke="#2b1d14" stroke-width="3" paint-order="stroke" transform="rotate(${i * a} ${62 * Math.cos(mid)} ${62 * Math.sin(mid)})">${s.t}</text>`; }).join('')}<circle r="104" fill="none" stroke="#2b1d14" stroke-width="6"/><circle r="14" fill="#ffd24a" stroke="#2b1d14" stroke-width="4"/></svg>`;
      setWalking(false);
      const m = modal(`<div class="ribbon stroke">Wheel of Fortune</div><div class="panel"><div class="wheel-wrap">${wsvg}<div class="ptr"></div></div><div class="actions"><button class="btn yellow" id="spin">Spin!</button></div></div>`);
      await new Promise(res => $('#spin', m).onclick = res);
      $('#spin', m).disabled = true;
      const turn = 360 * 5 - idx * a;
      $('.wheel', m).style.transform = `rotate(${turn}deg)`;
      if (!R.skip) { let t = 0; for (let i = 0; i < 26; i++) { t += 30 + i * i * 0.35; setTimeout(() => SND.play('tick'), t); } }
      await realWait(R.skip ? 300 : 3200);
      segs[idx].fn(); m.remove(); SND.play('ding');
      log('The wheel clicks to a stop…', [segs[idx].tag]);
      updateStats();
    },
  };

  // ---------------------------------------------------------------- economy
  function addCoins(v) { v = Math.round(v * (1 + talentLv('gold') * 0.06) * (1 + (R.bonus.coinPct || 0) / 100)); R.coins += v; snd('coin'); updateStats(); return v; }
  function addXp(v) { v = Math.round(v * (1 + talentLv('xp') * 0.06) * (1 + (R.bonus.xpPct || 0) / 100)); R.xp += v; updateStats(); return v; }
  function heal(v) { v = Math.round(Math.min(v * (1 + (R.bonus.healBoost || 0)), R.maxHp - R.hp)); R.hp += v; updateStats(); return v; }
  async function checkLevelUp() {
    while (R.xp >= xpNeed(R.lv) && !R.over) {
      R.xp -= xpNeed(R.lv); R.lv++; recalc(); R.hp = Math.min(R.maxHp, R.hp + Math.round(R.maxHp * 0.1));
      updateStats();
      popBanner('LEVEL UP!'); snd('levelup');
      await wait(600);
      await skillSelect('Level ' + R.lv + '!');
    }
  }

  // ---------------------------------------------------------------- skills
  function eligible(id) { const s = SKILLS[id]; return sk(id) < s.max && (!s.needs || sk(s.needs) > 0); }
  function skillPool(n, rarities) {
    const ids = Object.keys(SKILLS).filter(id => eligible(id) && (!rarities || rarities.includes(SKILLS[id].rarity)));
    const w = { common: 10, rare: 7, epic: 4, legendary: 1.5 };
    const out = [];
    const bag = ids.slice();
    while (out.length < n && bag.length) {
      const tot = bag.reduce((a, id) => a + w[SKILLS[id].rarity] + (sk(id) ? 3 : 0), 0);
      let r = Math.random() * tot;
      for (let i = 0; i < bag.length; i++) { r -= w[SKILLS[bag[i]].rarity] + (sk(bag[i]) ? 3 : 0); if (r < 0) { out.push(bag.splice(i, 1)[0]); break; } }
    }
    return out;
  }
  function skillCard(id) { const s = SKILLS[id], l = sk(id); return { icon: s.icon, rarity: s.rarity, name: s.name, desc: s.desc(l), lv: l ? `Lv${l + 1}` : '', isNew: !l }; }
  function learn(id) {
    R.skills[id] = sk(id) + 1;
    if (id === 'atk') R.atkPct += 18;
    if (id === 'hp') { R.hpPct += 22; }
    if (id === 'def') R.defPct += 25;
    recalc(); updateStats();
  }
  function grantRandomSkill(rarities) {
    const p = skillPool(1, rarities)[0] || skillPool(1)[0];
    if (p) { learn(p); log(`Learned <b>${SKILLS[p].name}</b>!`); }
  }
  async function skillSelect(title) {
    const ids = skillPool(3);
    if (!ids.length) { R.atkPct += 10; recalc(); return; }
    const c = await choiceModal(title === 'Choose a starting skill' ? 'Select Skill' : 'Select Skill', null, ids.map(id => ({ ...skillCard(id), id, fn: () => learn(id) })), title);
    log(`You learned <b>${SKILLS[c.id].name}</b>${sk(c.id) > 1 ? ` (Lv.${sk(c.id)})` : ''}.`);
  }
  function choiceModal(title, iconSvg, options, sub) {
    setWalking(false);
    return new Promise(resolve => {
      const top = iconSvg ? `<div class="bigicon">${iconSvg}</div>` : `<div class="modal-hero">${art.hero(R.heroKey, uid())}</div>`;
      const m = modal(`${top}<div class="ribbon stroke">${title}</div>${sub && sub !== title ? `<div class="stroke-sm" style="margin-top:12px;font-size:16px">${sub}</div>` : ''}
        <div class="cards">${options.map((o, i) => `<button class="card r-${o.rarity}" data-i="${i}" ${o.disabled ? 'disabled style="filter:grayscale(.8);opacity:.7"' : ''}>${o.isNew && !iconSvg ? '<span class="newtag">NEW</span>' : ''}<div class="ci">${ICONS[o.icon] || ''}${o.lv ? `<span class="lv">${o.lv}</span>` : ''}</div><div class="cb"><div class="cn">${o.name}</div><div class="cd">${o.desc}</div></div></button>`).join('')}</div>`);
      $$('.card', m).forEach(b => b.onclick = () => { if (b.disabled) return; const o = options[+b.dataset.i]; SND.play('select'); o.fn(); m.remove(); updateStats(); resolve(o); });
    });
  }

  // ---------------------------------------------------------------- enemies
  function makeEnemy(key, tier, n) {
    const ch = R.ch, g = 1 + R.day * 0.06, s = ENEMY_STATS[key] || { hp: 1, atk: 1, def: 1 };
    const t = { mob: { hp: 1, atk: 1 }, elite: { hp: 3.2, atk: 1.2 }, boss: { hp: 6.5, atk: 1.45 } }[tier];
    const split = tier === 'mob' ? [1, 1, 0.62, 0.48][n] : 1;
    const hp = Math.round(140 * ch.mult * g * s.hp * t.hp * split);
    return {
      key, tier, name: enemyName(key), hp, maxHp: hp, alive: true,
      abil: (ENEMY_ABILITIES[key] || []).slice(), round: 0, shield: 0, minion: false, enraged: false, sumDone: {},
      atk: Math.round(34 * ch.mult * g * s.atk * t.atk * (tier === 'mob' && n > 1 ? 0.7 : 1)),
      def: Math.round(8 * ch.mult * g * s.def), burn: null, bleed: null, poison: 0, frozen: false,
    };
  }
  const ENEMY_POS = [{ l: 47, b: 8, z: 3 }, { l: 62, b: 19, z: 2, back: true }, { l: 76, b: 3, z: 4 }];
  const MINION_POS = [{ l: 33, b: 2, z: 5 }, { l: 79, b: 1, z: 5 }];
  function mountEnemy(e, i, total, minionSlot) {
    const big = e.tier !== 'mob';
    const p = e.minion ? MINION_POS[minionSlot % 2] : big ? { l: 52, b: 7, z: 3 } : ENEMY_POS[i];
    e.el = el(`<div class="actor enemy enter ${big ? 'boss' : ''} ${!big && total === 3 ? 'trio' : ''} ${p.back ? 'back' : ''} ${e.minion ? 'minion' : ''}" style="left:${p.l}%;bottom:${p.b}%;z-index:${p.z}"><div class="art">${art.enemy(e.key, uid())}</div><div class="status"></div><div class="hpbar"><b></b><i></i><span></span></div></div>`);
    if (e.tier === 'elite') e.el.classList.replace('boss', 'elite');
    S.actors.append(e.el);
    setBar(e.el, e.hp, e.maxHp, e.shield || 0);
  }
  function spawnEnemies(list) {
    R.enemies = list;
    list.forEach((e, i) => mountEnemy(e, i, list.length));
  }
  // Boss reinforcements: up to two weakened minions from this chapter's mobs.
  function summonMinions() {
    const live = R.enemies.filter(m => m.minion && m.alive).length;
    const n = 2 - live; if (n <= 0) return;
    popBanner('REINFORCEMENTS!'); snd('devil');
    for (let i = 0; i < n; i++) {
      const m = makeEnemy(pick(R.ch.mobs), 'mob', 2);
      m.minion = true; m.abil = m.abil.filter(a => a !== 'summon');
      R.enemies.push(m);
      mountEnemy(m, 0, 3, R.enemies.filter(x => x.minion).length - 1);
    }
  }
  const alive = () => R.enemies.filter(e => e.alive);

  // ---------------------------------------------------------------- fx helpers
  function pos(actorEl, fy = 0.45) {
    const a = $('.art', actorEl) || actorEl;
    const r = a.getBoundingClientRect(), s = S.fx.getBoundingClientRect();
    return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height * fy, w: r.width, h: r.height };
  }
  function fxEl(html, x, y, life = 900) {
    if (R.skip) return null;
    const d = el(html); d.style.left = x + 'px'; d.style.top = y + 'px'; S.fx.append(d); setTimeout(() => d.remove(), life); return d;
  }
  function num(actorEl, text, cls = '') {
    if (R.skip) return;
    const p = pos(actorEl, 0.25);
    fxEl(`<div class="dmg ${cls}">${text}</div>`, p.x + rand(-18, 18), p.y + rand(-10, 6), 1000);
  }
  function flashHit(actorEl) { if (R.skip) return; actorEl.classList.remove('hit'); void actorEl.offsetWidth; actorEl.classList.add('hit'); }
  function slashAt(actorEl, color, glow) {
    const p = pos(actorEl, 0.45);
    fxEl(`<svg class="slash" viewBox="0 0 130 100" style="width:${p.w * 1.3}px"><defs><linearGradient id="sg${uidN}" x1="0" x2="1"><stop offset="0" stop-color="${color}" stop-opacity="0"/><stop offset=".6" stop-color="${color}"/><stop offset="1" stop-color="${glow}"/></linearGradient></defs><path d="M10 85 Q40 5 125 15 Q55 25 22 90 Z" fill="url(#sg${uidN++})"/><path d="M30 70 Q55 25 110 18" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/></svg>`, p.x, p.y, 400);
  }
  function popBanner(text) { if (R.skip) return; const d = fxEl(`<div class="banner-pop title-gold">${text}</div>`, 0, 0, 1200); d.style.left = ''; d.style.top = ''; }
  async function projectile(from, to, svg, cls = '', t = 260) {
    if (R.skip) return;
    const a = pos(from, 0.45), b = pos(to, 0.45);
    const d = fxEl(`<div class="proj ${cls}" style="--t:${t / (save.speed || 1)}ms">${svg}</div>`, a.x + a.w * 0.25, a.y, t + 200);
    const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    if (!cls.includes('spin')) d.style.transform = `translate(-50%,-50%) rotate(${ang + 45}deg)`;
    await realWait(16);
    d.style.left = b.x + 'px'; d.style.top = b.y + 'px';
    await wait(t);
  }
  function lightningAt(actorEl) {
    const p = pos(actorEl, 0);
    fxEl(`<svg class="bolt" viewBox="0 0 60 200" style="height:${p.y + p.h * 0.5}px"><path d="M34 0 L18 80 H32 L14 200 L46 90 H30 L44 0 Z" fill="#fff6a0" stroke="#ffe14a" stroke-width="3"/></svg>`, p.x, 0, 500);
  }
  function boomAt(actorEl, size = 90) { const p = pos(actorEl, 0.5); const d = fxEl(`<div class="boom"></div>`, p.x, p.y, 500); if (d) { d.style.width = d.style.height = size + 'px'; } }
  function auraAt(actorEl, color) { const p = pos(actorEl, 0.5); const d = fxEl(`<div class="aura"></div>`, p.x, p.y, 700); if (d) { d.style.width = d.style.height = p.w * 1.1 + 'px'; d.style.background = `radial-gradient(${color}, transparent 70%)`; } }
  function screenFlash() { fxEl(`<div class="flash"></div>`, 0, 0, 400); if (!R.skip) { S.stage.classList.remove('shake'); void S.stage.offsetWidth; S.stage.classList.add('shake'); } }
  function restart(elm, ...cls) { elm.classList.remove(...cls); void elm.offsetWidth; elm.classList.add(...cls); }
  const DAGGER = ICONS.dagger;
  const ARROW = '<svg viewBox="0 0 64 64"><path d="M8 56 L50 14" stroke="#8a5a2b" stroke-width="5" stroke-linecap="round"/><path d="M56 8 L40 14 L50 24 Z" fill="#dfe7ef" stroke="#2b1d14" stroke-width="3" stroke-linejoin="round"/><path d="M8 56 L4 46 M8 56 L18 60 M14 50 L10 40 M14 50 L24 54" stroke="#e85d5d" stroke-width="4" stroke-linecap="round"/></svg>';

  // ---------------------------------------------------------------- combat math
  const dmgCalc = (atk, def) => Math.max(1, Math.round(atk * atk / (atk + def) * rand(0.92, 1.08)));
  function critRoll() {
    let c = R.sig === 'crit' ? 0.25 : 0.05, m = R.sig === 'crit' ? 2.5 : 1.5;
    if (sk('keen')) c += 0.12 + 0.06 * (sk('keen') - 1);
    if (sk('deadly')) m += 0.5 + 0.3 * (sk('deadly') - 1);
    c += R.bonus.critChance || 0; m += R.bonus.critDmg || 0;
    return chance(c) ? m : 0;
  }
  function damageEnemy(e, amount, cls = '') {
    if (!e.alive) return 0;
    amount = Math.max(1, Math.round(amount));
    if (cls !== 'dot' && e.abil.includes('armor')) amount = Math.max(1, Math.round(amount * 0.75)); // Armored
    // Barrier soaks damage first
    const soak = Math.min(e.shield || 0, amount);
    if (soak) { e.shield -= soak; num(e.el, fmt(soak), 'blk'); }
    const dealt = amount - soak;
    if (cls !== 'dot') snd('hit');
    flashHit(e.el);
    if (dealt <= 0) { setBar(e.el, e.hp, e.maxHp, e.shield || 0); return amount; }
    amount = dealt;
    e.hp -= amount;
    num(e.el, fmt(amount), cls);
    setBar(e.el, e.hp, e.maxHp, e.shield || 0);
    updateBossBar();
    // Thorns: never lethal
    if (cls !== 'dot' && e.abil.includes('thorns') && R.hp > 1) {
      const r = Math.min(R.hp - 1, Math.max(1, Math.round(amount * 0.15)));
      R.hp -= r; num(S.hero, fmt(r), 'hero'); updateStats();
    }
    // Summoner: reinforcements at 60% and 30%
    if (e.hp > 0 && e.abil.includes('summon')) {
      for (const th of [0.6, 0.3]) if (!e.sumDone[th] && e.hp <= e.maxHp * th) { e.sumDone[th] = true; summonMinions(); }
    }
    // lifesteal
    const ls = (sk('vamp') ? 0.08 + 0.05 * (sk('vamp') - 1) : 0) + (R.sig === 'lifesteal' ? 0.15 : 0) + (R.bonus.lifesteal || 0);
    if (ls && cls !== 'dot') { const h = heal(amount * ls); if (h > 0 && chance(0.35)) num(S.hero, '+' + fmt(h), 'heal'); }
    if (e.hp <= 0) {
      e.alive = false; e.hp = 0; R.kills++;
      if (R.bonus.killHeal && R.hp > 0) { const h = heal(R.maxHp * R.bonus.killHeal); if (h) num(S.hero, '+' + fmt(h), 'heal'); }
      e.el.classList.add('dead'); snd('poof');
      setBar(e.el, 0, e.maxHp, 0);
      // a fallen master takes its minions with it
      if (!e.minion) R.enemies.filter(m => m.minion && m.alive).forEach(m => { m.alive = false; m.hp = 0; m.el.classList.add('dead'); setBar(m.el, 0, m.maxHp, 0); });
    }
    return amount;
  }
  function onHitEffects(e) {
    if (!e.alive) return;
    if (sk('burn')) e.burn = { dmg: effAtk() * (0.10 + 0.06 * (sk('burn') - 1)), turns: 3 };
    if (R.sig === 'burn') e.bleed = { dmg: effAtk() * 0.2, turns: 3 };
    if (sk('poison')) e.poison = Math.min(10, e.poison + 1);
    if (sk('frost') && chance(0.12 + 0.08 * (sk('frost') - 1))) { e.frozen = true; e.el.classList.add('frozen'); num(e.el, 'Frozen', 'blk'); }
    statusIcons(e);
  }
  function statusIcons(e) {
    const s = $('.status', e.el); if (!s) return;
    s.innerHTML = (e.burn ? ICONS.fire : '') + (e.bleed ? ICONS.vamp : '') + (e.poison ? ICONS.poison : '') + (e.frozen ? ICONS.ice : '');
  }
  const front = () => alive()[0];
  async function heroStrike(target, mult = 1) {
    if (!target || !target.alive) return;
    const H = HEROES[R.heroKey];
    let cm = critRoll();
    if (R.bonus.firstCrit && !R.struckThisBattle) cm = cm || (R.sig === 'crit' ? 2.5 : 1.5);
    R.struckThisBattle = true;
    if (!R.skip) { restart(S.hero, 'lunge', 'attack'); await wait(150); slashAt(target.el, H ? H.fx.slash : '#fff', H ? H.fx.glow : '#fff'); snd(cm ? 'crit' : 'slash'); }
    const dmg = dmgCalc(effAtk() * mult, target.def) * (cm || 1);
    damageEnemy(target, dmg, cm ? 'crit' : '');
    onHitEffects(target);
    if (R.sig === 'stack' && (R.cry || 0) < 10) { R.cry = (R.cry || 0) + 1; if (R.cry % 3 === 0) num(S.hero, `Battle Cry x${R.cry}`, 'blk'); }
    if (!R.skip) { await wait(200); S.hero.classList.remove('lunge'); await wait(120); S.hero.classList.remove('attack'); }
  }
  async function heroTurn(round) {
    const H = HEROES[R.heroKey];
    if (R.stunned) { R.stunned = false; heroStatus(); num(S.hero, 'Stunned!', 'miss'); await wait(450); return; }
    // Spirit swords open the fight
    if (round === 1 && sk('spirit')) {
      for (let i = 0; i < sk('spirit') + 1; i++) { const t = pick(alive()); if (!t) break; snd('throw'); await projectile(S.hero, t.el, ICONS.sword, '', 220); damageEnemy(t, dmgCalc(effAtk() * 0.8, t.def)); }
    }
    // Meteor & fire burst
    if (sk('meteor') && round % 5 === 0 && alive().length) {
      screenFlash(); snd('boom'); alive().forEach(e => { boomAt(e.el, 140); damageEnemy(e, dmgCalc(effAtk() * (3.2 + 1.5 * (sk('meteor') - 1)), e.def)); }); await wait(400);
    }
    if (sk('fireball') && round % 3 === 0 && alive().length) {
      for (const e of alive()) { snd('fire'); await projectile(S.hero, e.el, ICONS.fire, 'spin', 220); boomAt(e.el); damageEnemy(e, dmgCalc(effAtk() * (1.6 + 0.6 * (sk('fireball') - 1)), e.def)); }
    }
    // Impi Swiftness: free opening spear throw
    if (round === 1 && R.bonus.openingThrow && front()) {
      const t = front(); snd('throw'); await projectile(S.hero, t.el, ICONS.sword, '', 240);
      damageEnemy(t, dmgCalc(effAtk() * R.bonus.openingThrow, t.def));
    }
    // main attack
    await heroStrike(front());
    if (R.sig === 'multi' && chance(0.3) && front()) { num(S.hero, 'Flurry!', 'blk'); await heroStrike(front()); }
    if (R.sig === 'volley') {
      for (let i = 0; i < 2; i++) {
        const t = pick(alive()); if (!t) break;
        snd('throw'); await projectile(S.hero, t.el, ARROW, '', 180);
        damageEnemy(t, dmgCalc(effAtk() * 0.5, t.def));
      }
    }
    if (sk('double') && chance(0.2 + 0.12 * (sk('double') - 1)) && front()) { num(S.hero, 'Double!', 'blk'); await heroStrike(front()); }
    // daggers
    for (let i = 0; i < sk('dagger'); i++) {
      const t = front(); if (!t) break;
      snd('throw');
      await projectile(S.hero, t.el, DAGGER, '', 200);
      damageEnemy(t, dmgCalc(effAtk() * 0.6, t.def));
    }
    // lightning
    if (sk('lightning') && alive().length && chance(0.25 + 0.15 * (sk('lightning') - 1))) {
      const t = pick(alive()); snd('zap'); lightningAt(t.el); damageEnemy(t, dmgCalc(effAtk() * 1.5, t.def)); await wait(250);
      if (sk('storm') && chance(0.4)) { screenFlash(); snd('storm'); for (const e of alive()) { lightningAt(e.el); damageEnemy(e, dmgCalc(effAtk() * 0.8, e.def)); } await wait(300); }
    }
    // pet
    if (R.pet && S.pet && alive().length) {
      const t = front();
      if (!R.skip) { restart(S.pet, 'hit'); snd('pew'); }
      await projectile(S.pet, t.el, `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="12" fill="#ffe7a0" stroke="#2b1d14" stroke-width="3"/><circle cx="20" cy="20" r="5" fill="#fff"/></svg>`, 'spin', 220);
      damageEnemy(t, dmgCalc(effAtk() * 0.3 * (R.bonus.petMult || 1), t.def));
      if (H) void H;
    }
  }
  const effDef = () => Math.max(0, Math.round(R.def * (1 - 0.05 * (R.defPen || 0))));
  function heroStatus() {
    const st = $('.status', S.hero); if (!st) return;
    st.innerHTML = (R.heroDot ? (R.heroDot.kind === 'burn' ? ICONS.fire : ICONS.poison) : '') + (R.stunned ? ICONS.bolt : '') + ((R.defPen || 0) ? ICONS.crit : '');
  }
  function setHeroDot(kind) {
    R.heroDot = { kind, turns: 3, pct: kind === 'burn' ? 0.035 : 0.03 };
    num(S.hero, kind === 'burn' ? 'Burning!' : 'Poisoned!', 'dot'); heroStatus();
  }

  // One strike from an enemy. `mult` scales the damage (multi-hit 0.65, power attack 2.5).
  async function enemyHit(e, mult) {
    const dodge = (sk('dodge') ? 0.08 + 0.05 * (sk('dodge') - 1) : 0) + (R.bonus.dodge || 0);
    if (chance(dodge)) { num(S.hero, 'Miss', 'miss'); snd('miss'); return; }
    let d = dmgCalc(e.atk * mult * (e.enraged ? 1.5 : 1), effDef());
    if (e.tier !== 'mob' && R.bonus.bigFoeGuard) d = Math.round(d * (1 - R.bonus.bigFoeGuard));
    if (R.bonus.dmgRed) d = Math.round(d * (1 - Math.min(0.5, R.bonus.dmgRed)));
    if (R.shield > 0) { const a = Math.min(R.shield, d); R.shield -= a; d -= a; if (a) { num(S.hero, fmt(a), 'blk'); snd('block'); } }
    if (d > 0) { R.hp = Math.max(0, R.hp - d); num(S.hero, fmt(d), mult > 2 ? 'hero crit' : 'hero'); snd('hurt'); flashHit(S.hero); if (mult > 2) screenFlash(); }
    if (R.hp <= 0 && R.bonus.lastStand && !R.lastStandUsed) {
      R.lastStandUsed = true; R.hp = Math.round(R.maxHp * R.bonus.lastStand);
      popBanner('LAST STAND!'); auraAt(S.hero, '#ffd27acc'); snd('revive');
    }
    if (d > 0 && R.sig === 'thorns' && e.alive) damageEnemy(e, d * 0.3, 'dot'); // Phalanx
    // what the enemy's hit does besides damage
    if (d > 0 && R.hp > 0 && e.alive) {
      if (e.abil.includes('drain')) { const h = Math.round(d * 0.3); e.hp = Math.min(e.maxHp, e.hp + h); setBar(e.el, e.hp, e.maxHp, e.shield || 0); updateBossBar(); num(e.el, '+' + fmt(h), 'heal'); }
      if (e.abil.includes('venom') && chance(0.4)) setHeroDot('venom');
      if (e.abil.includes('burn') && chance(0.4)) setHeroDot('burn');
      if (e.abil.includes('stun') && chance(0.2) && !R.stunned) { R.stunned = true; num(S.hero, 'Stunned!', 'miss'); heroStatus(); }
      if (e.abil.includes('sunder') && (R.defPen || 0) < 5) { R.defPen = (R.defPen || 0) + 1; num(S.hero, 'DEF down', 'miss'); heroStatus(); }
    }
    updateStats();
    if (R.hp > 0 && sk('counter') && chance(0.2 + 0.1 * (sk('counter') - 1))) { e.el.classList.remove('lunge'); num(S.hero, 'Counter!', 'blk'); await heroStrike(e, 0.8); }
  }

  async function enemyTurn(e) {
    if (!e.alive || R.hp <= 0) return;
    if (e.frozen) { e.frozen = false; e.el.classList.remove('frozen'); statusIcons(e); return; }
    e.round = (e.round || 0) + 1;
    if (e.abil.includes('enrage') && !e.enraged && e.hp <= e.maxHp * 0.5) {
      e.enraged = true; e.el.classList.add('enraged'); num(e.el, 'ENRAGED!', 'crit'); snd('alarm'); popBanner('ENRAGED!');
      if (!R.skip) await wait(500);
    }
    const power = e.abil.includes('charge') && e.round % 4 === 0;
    const hits = e.abil.includes('multi') && !power ? 2 : 1;
    if (power) e.el.classList.remove('charging');
    for (let h = 0; h < hits && R.hp > 0; h++) {
      if (!R.skip) { restart(e.el, 'lunge'); await wait(power ? 260 : 170); }
      await enemyHit(e, power ? 2.5 : hits === 2 ? 0.65 : 1);
      if (!R.skip) { await wait(160); e.el.classList.remove('lunge'); await wait(90); }
    }
    // warn the player one turn before a power attack
    if (e.alive && e.abil.includes('charge') && e.round % 4 === 3) {
      e.el.classList.add('charging'); num(e.el, 'Charging!', 'crit'); snd('alarm');
    }
  }
  function tickDots() {
    for (const e of alive()) {
      let t = 0;
      if (e.burn) { t += e.burn.dmg; if (--e.burn.turns <= 0) e.burn = null; }
      if (e.bleed) { t += e.bleed.dmg; if (--e.bleed.turns <= 0) e.bleed = null; }
      if (e.poison) t += e.poison * effAtk() * (0.06 + 0.04 * (sk('poison') - 1));
      if (t > 0) damageEnemy(e, t, 'dot');
      statusIcons(e);
    }
  }
  function updateBossBar() {
    if (!R.enemies.length || !S.bossBar.classList.contains('show')) return;
    const b = R.enemies[0];
    $('.bar i', S.bossBar).style.width = clamp(b.hp / b.maxHp * 100, 0, 100) + '%';
    $('.bar span', S.bossBar).textContent = `${fmt(Math.max(0, b.hp))}/${fmt(b.maxHp)}`;
  }

  // ---------------------------------------------------------------- battle
  async function battle(tier) {
    const ch = R.ch;
    let keys;
    if (tier === 'boss') keys = [ch.boss];
    else if (tier === 'elite') keys = [pick(ch.elites)];
    else { const n = R.day < 4 ? 1 : pick([1, 1, 2, 2, 3]); const k = pick(ch.mobs); keys = Array(n).fill(0).map((_, i) => i === 0 ? k : pick(ch.mobs)); }
    const lead = keys[0];
    setWalking(false);
    if (tier === 'boss') SND.music('boss');
    if (tier !== 'mob') SND.play('alarm');
    const foes = keys.map((k, i) => makeEnemy(k, tier, keys.length > 1 ? i + 1 : 0));
    const briefing = tier !== 'mob' && foes[0].abil.length
      ? `<div class="abil-list">${foes[0].abil.map(a => `<b>${ABILITY_INFO[a].name}</b>: ${ABILITY_INFO[a].desc}`).join('<br>')}</div>` : '';
    log((TEXT.battle[lead] ? pick(TEXT.battle[lead]) : `A wild ${enemyName(lead)} appears!`) + (tier === 'boss' ? ' <em>BOSS BATTLE!</em>' : tier === 'elite' ? ' <em>An elite foe!</em>' : '') + briefing,
      tier !== 'mob' ? foes[0].abil.map(a => ({ icon: ABILITY_INFO[a].icon, text: ABILITY_INFO[a].name, cls: 'bad' })) : null);
    spawnEnemies(foes);
    foes.forEach(f => { if (f.abil.includes('barrier')) { f.shield = Math.round(f.maxHp * 0.25); setBar(f.el, f.hp, f.maxHp, f.shield); } });
    R.defPen = 0; R.heroDot = null; R.stunned = false; heroStatus();
    if (tier !== 'mob') popBanner(tier === 'boss' ? 'BOSS!' : 'ELITE!');
    const maxRounds = tier === 'mob' ? 30 : tier === 'elite' ? 15 : 20;
    S.bossBar.classList.toggle('show', true);
    $('.bar', S.bossBar).style.display = tier === 'mob' ? 'none' : '';
    updateBossBar();
    S.skip.classList.add('show');
    R.skip = false;
    await wait(500);

    let result;
    R.struckThisBattle = false; R.cry = 0;
    if (R.sig === 'curse') { R.enemies.forEach(e => { e.atk = Math.round(e.atk * 0.75); num(e.el, 'Cursed', 'dot'); }); }
    if (R.bonus.battleHeal) { const h = heal(R.maxHp * R.bonus.battleHeal); if (h) { num(S.hero, '+' + fmt(h), 'heal'); snd('heal'); } }
    for (;;) {
      result = await fightRounds(maxRounds);
      if (result === 'win' || (result === 'timeout' && tier === 'mob')) break;
      const revived = await defeat(result === 'timeout');
      if (!revived) { S.bossBar.classList.remove('show'); clearEnemies(); return; }
      if (tier === 'mob') { S.bossBar.classList.remove('show'); clearEnemies(); log('Rising again, you drive the enemy off!'); return; }
      // elites and bosses must actually be beaten: the fight resumes, enemy HP carries over
      log('Rising again, you charge back into the fight!');
      S.skip.classList.add('show');
      await wait(400);
    }
    S.bossBar.classList.remove('show');
    clearEnemies();
    if (result === 'timeout') { log('The enemy grows bored and wanders off. <em>No reward.</em>'); return; }
    const tm = { mob: 1, elite: 3.5, boss: 8 }[tier];
    const g = addCoins((10 + R.day * 1.5) * keys.length * tm * ch.mult ** 0.5);
    const x = addXp((16 + R.day * 1.4) * (tier === 'mob' ? 0.9 + keys.length * 0.4 : tm));
    const winTags = [{ icon: 'coin', text: `+${fmt(g)}`, cls: 'gold' }, { icon: 'talent', text: `EXP+${fmt(x)}` }];
    const drops = [dropGear(tier)]; if (tier === 'boss' && chance(0.5)) drops.push(dropGear('boss'));
    drops.filter(Boolean).forEach(d => winTags.push(lootTag(d)));
    log(pick(TEXT.win).replace('{g}', fmt(g)), winTags);
    if (tier === 'elite') { popBanner('VICTORY!'); await wait(700); await skillSelect('Elite defeated!'); }
  }
  async function fightRounds(maxRounds) {
    // battle-start effects (also re-applied after a revive)
    R.shield = 0;
    if (sk('wall')) R.shield += R.maxHp * (0.15 + 0.1 * (sk('wall') - 1));
    if (R.sig === 'shield') R.shield += R.maxHp * 0.3;
    R.shield = Math.round(R.shield);
    if (R.shield) { auraAt(S.hero, '#9ad7ffcc'); snd('shield'); }
    let angel = sk('angel') ? 6 : 0;
    updateStats();
    let result = 'timeout';
    for (let round = 1; round <= maxRounds; round++) {
      $('.round-pill', S.bossBar).textContent = `Round : ${round}/${maxRounds}`;
      if (angel > 0) { angel--; const h = heal(R.maxHp * 0.06); if (h) { num(S.hero, '+' + fmt(h), 'heal'); auraAt(S.hero, '#fff8c0cc'); snd('heal'); } }
      if (sk('regen')) { const h = heal(R.maxHp * (0.03 + 0.02 * (sk('regen') - 1))); if (h) num(S.hero, '+' + fmt(h), 'heal'); }
      tickDots();
      for (const e of alive()) if (e.abil.includes('regen')) {
        const h = Math.round(Math.min(e.maxHp - e.hp, e.maxHp * (e.tier === 'boss' ? 0.03 : 0.05)));
        if (h > 0) { e.hp += h; setBar(e.el, e.hp, e.maxHp, e.shield || 0); updateBossBar(); num(e.el, '+' + fmt(h), 'heal'); }
      }
      if (R.heroDot) { // poison / burn on the hero: hurts, never kills
        const d = Math.max(1, Math.round(R.maxHp * R.heroDot.pct));
        if (R.hp > 1) { R.hp = Math.max(1, R.hp - d); num(S.hero, fmt(d), 'dot'); snd('hurt'); }
        if (--R.heroDot.turns <= 0) R.heroDot = null;
        heroStatus(); updateStats();
      }
      if (!alive().length) { result = 'win'; break; }
      await heroTurn(round);
      if (!alive().length) { result = 'win'; break; }
      for (const e of alive()) { await enemyTurn(e); if (R.hp <= 0) break; }
      if (R.hp <= 0) { result = 'lose'; break; }
      await wait(220);
    }
    R.skip = false;
    S.skip.classList.remove('show');
    await wait(450);
    return result;
  }
  function clearEnemies() { R.enemies.forEach(e => e.el && e.el.remove()); R.enemies = []; R.shield = 0; updateStats(); }

  async function defeat(timeout) {
    SND.play('defeat'); R.sadPlayed = true;
    const canRevive = (!R.revived || save.unlimited) && save.gems >= 50;
    const choice = await new Promise(res => {
      const m = modal(`<div class="bigicon">${ICONS.skull}</div><div class="ribbon stroke">${timeout ? 'Out of Time' : 'Defeated'}</div>
        <div class="panel"><p>${timeout ? 'You ran out of rounds!' : 'Your hero has fallen…'}</p><p style="font-size:13px;color:#7a6a5a">${save.unlimited ? 'Revive with full HP as often as you like.' : 'Revive once per journey with full HP.'}</p>
        <div class="actions"><button class="btn yellow" id="rv" ${canRevive ? '' : 'disabled'}>Revive ${ICONS.gem.replace('<svg', '<svg class="ico"')} 50</button><button class="btn red" id="gu">Give up</button></div></div>`);
      $('#rv', m).onclick = () => { m.remove(); res(true); };
      $('#gu', m).onclick = () => { m.remove(); res(false); };
    });
    if (choice) {
      save.gems -= 50; R.revived = true; persist();
      R.hp = R.maxHp; updateStats(); auraAt(S.hero, '#fff8c0'); popBanner('REVIVED!'); SND.play('revive');
      await wait(700);
      return true;
    }
    finishRun(false);
    return false;
  }

  // ---------------------------------------------------------------- end of run
  function finishRun(cleared) {
    if (R.over) return;
    R.over = true;
    setWalking(false);
    SND.music(null);
    if (cleared) SND.play('victory'); else if (!R.sadPlayed) SND.play('defeat');
    // a loss counts the days fully survived, so dying to the boss never reads as a clear
    const ch = R.ch, day = cleared ? ch.days : Math.max(0, R.day - 1);
    const prevBest = save.best[ch.id] || 0;
    save.best[ch.id] = Math.max(prevBest, day);
    const gems = Math.round(day * 1.5 + (cleared ? 80 * ch.id : 0));
    const eggs = cleared ? 2 : day >= ch.days / 2 ? 1 : 0;
    save.gold += R.coins; save.gems += gems; save.bonusEggs += eggs;
    let unlocked = false;
    if (cleared && save.unlocked === ch.id && ch.id < CHAPTERS.length) { save.unlocked++; unlocked = true; viewCh = save.unlocked; }
    persist();
    const m = modal(`${cleared ? '<div class="rays"></div>' : ''}<div class="result-title title-gold" style="position:relative">${cleared ? 'VICTORY!' : 'Journey Over'}</div>
      <div class="modal-hero" style="margin:0 0 6px">${art.hero(R.heroKey, uid())}</div>
      <div class="panel" style="position:relative">
        <p>Chapter ${ch.id} · ${ch.name}</p>
        <p style="font-family:var(--font-game);font-size:24px">Survived ${day} day${day === 1 ? '' : 's'}${day > prevBest ? ' <span style="color:#e05a1f">NEW BEST!</span>' : ''}</p>
        <div class="rewards">
          <div class="reward">${ICONS.coin}${fmt(R.coins)}</div>
          <div class="reward" style="animation-delay:.1s">${ICONS.gem}${gems}</div>
          ${eggs ? `<div class="reward" style="animation-delay:.2s">${ICONS.egg}x${eggs}</div>` : ''}
          <div class="reward" style="animation-delay:.3s">${ICONS.skull}${R.kills}</div>
        </div>
        ${R.loot.length ? `<p style="font-family:var(--font-game);font-size:16px;margin-bottom:0">Gear found</p><div class="loot">${R.loot.map(l => itemCell(l.it, { tag: 'span' })).join('')}</div>` : ''}
        ${unlocked ? `<p style="color:#2a6fd6">Chapter ${ch.id + 1} unlocked!</p>` : ''}
        <div class="actions"><button class="btn" id="home">Continue</button></div>
      </div>`);
    $('#home', m).onclick = () => { if (!R) return; R = null; S = {}; show('battle'); };
  }

  function pauseMenu() {
    if (!R || R.over || R.paused) return;
    const m = modal(`<div class="ribbon stroke">Paused</div><div class="panel">
      <p>Chapter ${R.ch.id} · Day ${R.day}</p>
      <p style="font-size:13px">${HEROES[R.heroKey] ? `<b>${HEROES[R.heroKey].signature.name}</b> · ` : ''}<b>${bonusOf(R.heroKey).name}</b></p>
      <div style="text-align:left;font-size:13px;margin:8px 0">${Object.keys(R.skills).map(id => `<span class="tag" style="margin:2px">${ICONS[SKILLS[id].icon]}${SKILLS[id].name} Lv${R.skills[id]}</span>`).join('') || 'No skills yet.'}</div>
      ${soundToggles()}

      <div class="actions"><button class="btn" id="res">Resume</button><button class="btn red" id="quit">Retreat</button></div></div>`);
    bindToggles(m);
    const wasWalking = S.stage.classList.contains('walking');
    R.paused = true; setWalking(false);
    const run = R;
    $('#res', m).onclick = () => { m.remove(); run.paused = false; if (wasWalking && !run.over) setWalking(true); };
    $('#quit', m).onclick = () => { m.remove(); $$('.modal').forEach(x => x.remove()); run.paused = false; finishRun(false); };
  }

  // ---------------------------------------------------------------- boot
  // TEMPORARY: while true, a save is unlocked once on load (Unlimited Mode + Unlock Everything).
  // Set to false to end it: Unlimited Mode switches off and earlier balances come back.
  const DEV_AUTO_UNLOCK = true;
  if (DEV_AUTO_UNLOCK && !save.devApplied) { unlockEverything(); save.devApplied = true; persist(); }
  else if (!DEV_AUTO_UNLOCK && save.devApplied) { setUnlimited(false); save.devApplied = false; persist(); }
  show('battle');
  splash();
  window.__heroGo = { get save() { return save; }, get run() { return R; } };
})();
