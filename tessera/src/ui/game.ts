import { TECH_BY_ID } from '../data/techs';
import { portraitKind, TRIBES } from '../data/tribes';
import { UNITS } from '../data/units';
import { aiStep } from '../game/ai';
import { drain, type GameEvent } from '../game/events';
import { tileAt } from '../game/grid';
import {
  applyReward, attack, attackOptions, cityById, citiesOf, cityIncome, def, doAction, income, isExplored, maxHp,
  moveOptions, moveUnit, previewCombat, rewardOptions, score, tileActions, tileOwnerPlayer, unitAt, unitCap, type Action,
} from '../game/rules';
import { endTurn, isHumanTurn } from '../game/turn';
import type { City, GameState, Tile } from '../game/types';
import { Camera } from '../render/camera';
import { ANIM_MS, drawIcon, FLOAT_MS, renderWorld, type Overlay } from '../render/draw';
import { addScore, clearSave, loadSettings, saveGame } from '../save';
import { $ui, h, iconEl, paint, starSpan } from './dom';
import { unitPortrait } from './menu';
import { modal, toast } from './modal';
import { showTechTree } from './techtree';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const UNIT_ACTIONS = (id: string) => id === 'capture' || id === 'recover' || id.startsWith('upgrade:');

interface Selection { x: number; y: number; mode: 'unit' | 'tile' }

export class GameView {
  private canvas = document.getElementById('game') as HTMLCanvasElement;
  private ctx = this.canvas.getContext('2d')!;
  private cam = new Camera();
  private ov: Overlay = { selected: null, moves: [], attacks: [], glow: new Set(), anims: new Map(), floaters: [], now: 0 };
  private sel: Selection | null = null;
  private dirty = true;
  private busy = false;
  private raf = 0;
  private me: number;
  private vw = 0;
  private vh = 0;
  private hud!: HTMLElement;
  private panel!: HTMLElement;
  private bottom!: HTMLElement;
  private hint!: HTMLElement;
  private banner!: HTMLElement;
  private settings = loadSettings();
  private destroyed = false;
  private rewardOpen = false;
  private ro = () => this.resize();

  constructor(private s: GameState, private onExit: (next: 'title' | 'new') => void) {
    this.me = s.players.findIndex((p) => p.human);
    this.buildUi();
    this.resize();
    window.addEventListener('resize', this.ro);
    this.bindInput();
    const cap = citiesOf(s, this.me).find((c) => c.capital) ?? citiesOf(s, this.me)[0];
    this.cam.zoom = Math.min(2.2, Math.max(1.2, this.vw / 250));
    if (cap) this.cam.centerOn(cap.x, cap.y, this.vw, this.vh * 0.95);
    // Canvas text only picks up the web font once it has loaded.
    document.fonts?.ready.then(() => (this.dirty = true));
    this.loop();
    this.refresh();
    if (import.meta.env.DEV) Object.assign(window, { __game: this });
    if (s.turn === 0 && s.current === this.me && !s.log.some((l) => l.text === 'welcome')) this.welcome();
    else if (!isHumanTurn(s) && !s.over) void this.runRivals();
    else this.checkRewards();
  }

  /** Screen position of a tile centre (used by browser tests). */
  tileScreen(x: number, y: number) {
    return this.cam.toScreen((x - y) * 32, (x + y) * 16 + 16);
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.ro);
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // ------------------------------------------------------------ layout

  private buildUi() {
    const root = $ui();
    root.innerHTML = '';
    this.hud = h('div', { class: 'hud' });
    this.hint = h('div', { class: 'hint hidden' });
    this.banner = h('div', { class: 'turn-banner hidden' });
    this.panel = h('div', { class: 'sheet hidden' });
    this.bottom = h('div', { class: 'bottom-bar' });
    root.append(h('div', { class: 'game-ui' }, this.hud, this.hint, this.banner, this.panel, this.bottom));
    const btn = (icon: Parameters<typeof iconEl>[0], label: string, cls: string, onclick: () => void) =>
      h('button', { class: `dock-btn ${cls}`, onclick }, h('span', { class: 'round' }, iconEl(icon)), h('span', { class: 'dock-label' }, label));
    this.bottom.append(
      btn('menu', 'Menu', 'dark', () => this.openMenu()),
      btn('globe', 'Empires', 'dark', () => this.openStats()),
      btn('tech', 'Tech Tree', 'blue', () => this.openTech()),
      btn('check', 'End Turn', 'blue end-turn', () => void this.onEndTurn()),
    );
  }

  private resize() {
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const oldW = this.vw, oldH = this.vh;
    this.vw = window.innerWidth;
    this.vh = window.innerHeight;
    this.canvas.width = this.vw * dpr;
    this.canvas.height = this.vh * dpr;
    this.canvas.style.width = `${this.vw}px`;
    this.canvas.style.height = `${this.vh}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (oldW) {
      this.cam.x += (this.vw - oldW) / 2;
      this.cam.y += (this.vh - oldH) / 2;
    }
    this.dirty = true;
  }

  private loop = () => {
    if (this.destroyed) return;
    const now = performance.now();
    this.ov.now = now;
    for (const [id, a] of this.ov.anims) if (now - a.t0 > ANIM_MS) this.ov.anims.delete(id);
    this.ov.floaters = this.ov.floaters.filter((f) => now - f.t0 < FLOAT_MS);
    const animating = this.ov.anims.size > 0 || this.ov.floaters.length > 0;
    if (this.dirty || animating) {
      renderWorld(this.ctx, this.s, this.me, this.cam, this.ov, this.vw, this.vh);
      this.dirty = false;
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  // ------------------------------------------------------------ input

  private bindInput() {
    const pts = new Map<number, { x: number; y: number }>();
    let panned = false;
    let start = { x: 0, y: 0 };
    let pinch = 0;
    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => {
      c.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 1) {
        panned = false;
        start = { x: e.clientX, y: e.clientY };
      }
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        pinch = Math.hypot(a.x - b.x, a.y - b.y);
        panned = true;
      }
    });
    c.addEventListener('pointermove', (e) => {
      const prev = pts.get(e.pointerId);
      if (!prev) return;
      const cur = { x: e.clientX, y: e.clientY };
      if (pts.size === 1) {
        if (!panned && Math.hypot(cur.x - start.x, cur.y - start.y) > 8) panned = true;
        if (panned) {
          this.cam.x += cur.x - prev.x;
          this.cam.y += cur.y - prev.y;
          this.dirty = true;
        }
      } else if (pts.size === 2) {
        pts.set(e.pointerId, cur);
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch > 0) this.cam.zoomAt(d / pinch, (a.x + b.x) / 2, (a.y + b.y) / 2);
        pinch = d;
        this.dirty = true;
      }
      pts.set(e.pointerId, cur);
    });
    const up = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      if (pts.size === 0 && !panned && e.type === 'pointerup') this.tap(e.clientX, e.clientY);
      pinch = 0;
    };
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cam.zoomAt(e.deltaY < 0 ? 1.1 : 1 / 1.1, e.clientX, e.clientY);
      this.dirty = true;
    }, { passive: false });
  }

  private tap(sx: number, sy: number) {
    if (this.busy) return;
    const { x, y } = this.cam.pickTile(sx, sy);
    const t = tileAt(this.s, x, y);
    if (!t) return this.select(null);
    const sel = this.sel;
    if (sel && sel.mode === 'unit' && isHumanTurn(this.s)) {
      const u = unitAt(this.s, sel.x, sel.y);
      if (u && u.owner === this.me) {
        if (this.ov.attacks.some((a) => a.x === x && a.y === y)) {
          const target = unitAt(this.s, x, y)!;
          this.act(() => attack(this.s, u, target));
          const still = this.s.units.includes(u);
          return this.select(still ? { x: u.x, y: u.y, mode: 'unit' } : null);
        }
        if (this.ov.moves.some((m) => m.x === x && m.y === y)) {
          this.act(() => moveUnit(this.s, u, x, y));
          this.advanceHints();
          return this.select({ x: u.x, y: u.y, mode: 'unit' });
        }
      }
    }
    const hasUnit = !!unitAt(this.s, x, y) && isExplored(this.s, this.me, x, y);
    if (sel && sel.x === x && sel.y === y) {
      if (sel.mode === 'unit') return this.select({ x, y, mode: 'tile' });
      return this.select(null);
    }
    this.select({ x, y, mode: hasUnit ? 'unit' : 'tile' });
  }

  private select(sel: Selection | null) {
    this.sel = sel;
    this.ov.selected = sel ? { x: sel.x, y: sel.y } : null;
    this.ov.moves = [];
    this.ov.attacks = [];
    if (sel && sel.mode === 'unit' && isHumanTurn(this.s)) {
      const u = unitAt(this.s, sel.x, sel.y);
      if (u && u.owner === this.me) {
        this.ov.moves = moveOptions(this.s, u);
        this.ov.attacks = attackOptions(this.s, u).map((e) => ({ x: e.x, y: e.y }));
      }
    }
    this.dirty = true;
    this.updatePanel();
  }

  /** Runs a state-changing action with move animations and event handling. */
  private act(fn: () => unknown) {
    const before = new Map(this.s.units.map((u) => [u.id, { x: u.x, y: u.y }]));
    fn();
    const now = performance.now();
    for (const u of this.s.units) {
      const b = before.get(u.id);
      if (b && (b.x !== u.x || b.y !== u.y)) this.ov.anims.set(u.id, { fx: b.x, fy: b.y, t0: now });
    }
    this.handleEvents(drain());
    this.refresh();
    if (isHumanTurn(this.s)) saveGame(this.s);
  }

  // ------------------------------------------------------------ HUD & panel

  private refresh() {
    const p = this.s.players[this.me];
    const turnText = this.s.maxTurns > 0 ? `${Math.min(this.s.turn, this.s.maxTurns)}/${this.s.maxTurns}` : String(this.s.turn);
    this.hud.innerHTML = '';
    this.hud.append(
      h('div', { class: 'hud-cell' }, h('div', { class: 'hud-label' }, 'Score'), h('div', { class: 'hud-val' }, score(this.s, this.me).toLocaleString())),
      h('div', { class: 'hud-cell' }, h('div', { class: 'hud-label' }, `Stars (+${income(this.s, this.me)})`), h('div', { class: 'hud-val' }, iconEl('star', 'ico-star big'), String(p.stars))),
      h('div', { class: 'hud-cell' }, h('div', { class: 'hud-label' }, 'Turn'), h('div', { class: 'hud-val' }, turnText)),
    );
    this.bottom.classList.toggle('waiting', !isHumanTurn(this.s));
    this.ov.glow = this.harvestable();
    this.updateHint();
    this.dirty = true;
    if (this.sel) this.select(this.sel);
  }

  /** Tiles in my territory where a harvest, farm or mine can be bought right now. */
  private harvestable() {
    const out = new Set<number>();
    if (!isHumanTurn(this.s)) return out;
    for (const t of this.s.tiles) {
      if (!t.resource || tileOwnerPlayer(this.s, t) !== this.me) continue;
      if (tileActions(this.s, this.me, t).some((a) => a.enabled && (a.id === 'harvest' || a.id === 'farm' || a.id === 'mine'))) out.add(t.y * this.s.size + t.x);
    }
    return out;
  }

  /** Bottom sheet for the selection: a title, a description and a row of round action buttons. */
  private updatePanel() {
    const sel = this.sel;
    this.panel.innerHTML = '';
    this.panel.classList.toggle('hidden', !sel);
    this.bottom.classList.toggle('hidden', !!sel);
    if (!sel) return;
    const t = tileAt(this.s, sel.x, sel.y)!;
    const p = this.s.players[this.me];
    const close = h('button', { class: 'sheet-close', onclick: () => this.select(null), 'aria-label': 'Close' }, iconEl('close'));
    const head = (title: string, ...desc: (Node | string | null)[]) =>
      h('div', { class: 'sheet-head' }, h('div', { class: 'sheet-title' }, title), h('div', { class: 'sheet-desc' }, ...desc));

    if (!isExplored(this.s, this.me, t.x, t.y)) {
      this.panel.append(close, head('Unexplored', 'Send a unit to lift the clouds.'));
      return;
    }
    const u = unitAt(this.s, t.x, t.y);
    const myTurn = isHumanTurn(this.s);
    const allActs = myTurn ? tileActions(this.s, this.me, t) : [];

    if (sel.mode === 'unit' && u) {
      const d = def(u);
      const owner = this.s.players[u.owner];
      const status = u.owner === this.me
        ? u.moved && u.attacked ? 'Done for this turn.' : !u.moved ? 'Ready to move.' : 'Can still attack.'
        : `${TRIBES[owner.tribe].people} unit.`;
      const preview = this.previewLine(u);
      const stats = h('span', { class: 'stat-line' },
        h('span', {}, 'Attack ', h('b', {}, String(d.atk))),
        h('span', {}, 'Defence ', h('b', {}, String(d.def))),
        h('span', {}, 'Health ', h('b', {}, `${Math.ceil(u.hp)}/${maxHp(u)}`)),
        h('span', {}, 'Move ', h('b', {}, String(d.move))),
        d.range > 1 ? h('span', {}, 'Range ', h('b', {}, String(d.range))) : null,
      );
      this.panel.append(close, head(`${u.veteran ? '★ ' : ''}${d.name}${u.carrying ? ` (carrying ${UNITS[u.carrying].name})` : ''}`,
        stats, h('br'), status, preview ? ` ${preview}` : null));
      this.renderActions(allActs.filter((a) => UNIT_ACTIONS(a.id)), p.tribe);
      return;
    }

    const city = t.cityId !== null ? cityById(this.s, t.cityId) : undefined;
    if (city) return this.cityPanel(city, close, head, allActs.filter((a) => !UNIT_ACTIONS(a.id)));

    const { title, desc } = describeTile(this.s, t);
    this.panel.append(close, head(title, desc));
    this.renderActions(allActs.filter((a) => !UNIT_ACTIONS(a.id)), p.tribe);
  }

  private previewLine(u: GameState['units'][number]) {
    const sel = this.sel;
    if (!sel || u.owner === this.me) return null;
    // If one of my units could hit this one, preview the fight.
    const mine = this.s.units.filter((m) => m.owner === this.me && attackOptions(this.s, m).includes(u));
    if (!mine.length) return null;
    const best = mine.map((m) => ({ m, ...previewCombat(this.s, m, u) })).sort((a, b) => b.dmg - a.dmg)[0];
    return `Your ${def(best.m).name} would deal ${best.dmg}${best.kills ? ' (kill)' : ''}, taking ${best.ret}.`;
  }

  private cityPanel(city: City, close: Node, head: (title: string, ...desc: (Node | string | null)[]) => HTMLElement, acts: Action[]) {
    const owner = this.s.players[city.owner];
    const T = TRIBES[owner.tribe];
    const mine = city.owner === this.me;
    const info = mine
      ? `Level ${city.level} · population ${city.pop}/${city.level + 1} · +${cityIncome(this.s, city)}★ per turn · units ${city.units}/${unitCap(city)}${city.walls ? ' · walls' : ''}`
      : `${T.people} city · level ${city.level}${city.walls ? ' · walls' : ''}`;
    this.panel.append(close, head(city.name, info,
      mine && city.pendingRewards.length ? h('button', { class: 'mini-btn', onclick: () => this.checkRewards() }, 'Choose level-up reward') : null));
    if (mine) this.renderActions(acts, owner.tribe);
  }

  private renderActions(acts: Action[], tribe: GameState['players'][number]['tribe']) {
    if (!acts.length) return;
    const row = h('div', { class: 'sheet-actions' });
    for (const a of acts) {
      const icon = paint(54, 54, (ctx) => drawIcon(ctx, a.icon, tribe, 27, 26));
      row.append(h('button', {
        class: `rbtn${a.enabled ? '' : ' off'}`,
        title: a.reason ?? a.desc,
        onclick: () => {
          if (!a.enabled) {
            toast(a.reason ? `${a.label}: ${a.reason}` : a.desc);
            return;
          }
          const t = tileAt(this.s, this.sel!.x, this.sel!.y)!;
          this.act(() => doAction(this.s, this.me, t, a.id));
          this.advanceHints();
          if (a.id.startsWith('train:')) this.select({ x: t.x, y: t.y, mode: 'tile' });
          this.checkRewards();
        },
      },
        h('span', { class: 'rbtn-circle' }, icon, a.cost > 0 ? h('span', { class: 'rbtn-cost' }, starSpan(a.cost)) : null),
        h('span', { class: 'rbtn-label' }, a.label),
      ));
    }
    this.panel.append(row);
  }

  // ------------------------------------------------------------ events & rewards

  private handleEvents(evs: GameEvent[]) {
    const now = performance.now();
    for (const e of evs) {
      switch (e.type) {
        case 'damage':
          if (isExplored(this.s, this.me, e.x, e.y)) this.ov.floaters.push({ x: e.x, y: e.y, text: `-${e.amount}`, color: '#ff5a5a', t0: now });
          break;
        case 'stars':
          if (e.player === this.me) this.ov.floaters.push({ x: e.x, y: e.y, text: `+${e.amount}★`, color: '#ffd54a', t0: now });
          break;
        case 'ruin':
          if (e.player === this.me) modal({ title: e.title, body: [h('p', {}, e.text)], art: paint(64, 56, (ctx) => drawIcon(ctx, 'flag', this.s.players[this.me].tribe, 32, 30)) });
          break;
        case 'capture': {
          const c = cityById(this.s, e.cityId)!;
          if (e.player === this.me) toast(e.from === null ? `${c.name} joins your empire!` : `You captured ${c.name}!`, TRIBES[this.s.players[this.me].tribe].color);
          else if (e.from === this.me) toast(`${c.name} has fallen to the ${TRIBES[this.s.players[e.player].tribe].people}s!`, '#ff5a5a');
          break;
        }
        case 'eliminated': {
          const who = TRIBES[this.s.players[e.player].tribe];
          if (e.player !== this.me) toast(`The ${who.name} has been destroyed.`, who.color);
          break;
        }
        case 'levelup':
          if (e.player === this.me) {
            const c = cityById(this.s, e.cityId)!;
            this.ov.floaters.push({ x: c.x, y: c.y, text: `Level ${e.level}!`, color: '#7cf07c', t0: now });
          }
          break;
      }
    }
    if (this.s.over) this.gameOver();
  }

  private checkRewards() {
    if (this.rewardOpen || !isHumanTurn(this.s)) return;
    const c = citiesOf(this.s, this.me).find((k) => k.pendingRewards.length);
    if (!c) return;
    this.rewardOpen = true;
    const level = c.pendingRewards[0];
    const [a, b] = rewardOptions(level);
    const tribe = this.s.players[this.me].tribe;
    const pick = (id: typeof a.id) => {
      this.rewardOpen = false;
      this.act(() => applyReward(this.s, c, id));
      this.checkRewards();
    };
    let close = () => {};
    const opt = (o: typeof a) => h('button', { class: 'rbtn big', onclick: () => { close(); pick(o.id); } },
      h('span', { class: 'rbtn-circle' }, paint(66, 66, (ctx) => drawIcon(ctx, o.id === 'giant' ? 'giant' : o.id, tribe, 33, 32))),
      h('span', { class: 'rbtn-label' }, o.name),
      h('span', { class: 'rbtn-sub' }, o.desc),
    );
    close = modal({
      title: `${c.name} grew!`,
      body: [h('p', {}, `Level ${level}. The people are thriving; choose a reward:`), h('div', { class: 'reward-row' }, opt(a), opt(b))],
      buttons: [],
      cls: 'reward',
    });
  }

  // ------------------------------------------------------------ hints

  private hintSteps() {
    const s = this.s;
    const me = this.s.players[this.me];
    const cap = citiesOf(s, this.me).find((c) => c.capital);
    const startRes: Record<string, string> = { gathering: 'fruit', hunting: 'wild animals', fishing: 'fish', riding: 'fruit', climbing: 'fruit' };
    return [
      { title: 'Scout’s Guide 1/5', text: `Tap the ${startRes[TRIBES[me.tribe].startTech]} near ${cap?.name ?? 'your capital'} and harvest it to grow your city.`, done: () => citiesOf(s, this.me).some((c) => c.pop > 0 || c.level > 1) },
      { title: 'Scout’s Guide 2/5', text: 'Tap your unit, then a glowing dot to move. Explore to find villages and ruins.', done: () => me.explored.filter(Boolean).length > 30 },
      { title: 'Scout’s Guide 3/5', text: 'Open the Tech Tree and research a new skill.', done: () => me.techs.length > 1 },
      { title: 'Scout’s Guide 4/5', text: 'Stand on a village and claim it next turn to found a new city.', done: () => citiesOf(s, this.me).length > 1 },
      { title: 'Scout’s Guide 5/5', text: 'Grow cities to level up and unlock rewards. Press End Turn when you are done.', done: () => s.turn > 3 },
    ];
  }

  private advanceHints() {
    const steps = this.hintSteps();
    while (this.s.hintStep < steps.length && steps[this.s.hintStep].done()) this.s.hintStep++;
    this.updateHint();
  }

  private updateHint() {
    const steps = this.hintSteps();
    const step = steps[this.s.hintStep];
    if (!this.settings.hints || !step || !isHumanTurn(this.s)) return this.hint.classList.add('hidden');
    this.hint.classList.remove('hidden');
    this.hint.innerHTML = '';
    this.hint.append(
      h('div', {}, h('div', { class: 'hint-title' }, step.title), h('div', { class: 'hint-text' }, step.text)),
      h('button', { class: 'hint-x', 'aria-label': 'Hide hints', onclick: () => { this.s.hintStep = steps.length; this.updateHint(); } }, iconEl('close')),
    );
  }

  // ------------------------------------------------------------ turns

  private welcome() {
    const me = this.s.players[this.me];
    const T = TRIBES[me.tribe];
    this.s.log.push({ turn: 0, text: 'welcome' });
    modal({
      title: 'Rise, Ruler!',
      art: unitPortrait(portraitKind(me.tribe), me.tribe, 80),
      body: [
        h('p', {}, `The ${T.people} people have placed their fate in your hands. Scout the land, grow your cities and stand firm against rival empires.`),
        h('p', {}, h('b', {}, 'Your gift: '), 'a treasury to start your reign.'),
      ],
      buttons: [{ label: h('span', { class: 'gift' }, String(me.stars), iconEl('star', 'ico-star big')), primary: true, onClick: () => this.updateHint() }],
      cls: 'welcome',
    });
  }

  private async onEndTurn() {
    if (this.busy || !isHumanTurn(this.s)) return;
    this.select(null);
    endTurn(this.s);
    this.handleEvents(drain());
    this.refresh();
    await this.runRivals();
  }

  private async runRivals() {
    this.busy = true;
    this.refresh();
    const fast = this.settings.fastAi;
    let steps = 0;
    while (!this.s.over && !isHumanTurn(this.s) && !this.destroyed) {
      const p = this.s.players[this.s.current];
      const T = TRIBES[p.tribe];
      this.banner.classList.remove('hidden');
      this.banner.style.setProperty('--tc', T.color);
      this.banner.textContent = `${T.people} turn…`;
      let acted = false;
      this.act(() => (acted = aiStep(this.s)));
      if (!acted) {
        endTurn(this.s);
        this.handleEvents(drain());
        this.refresh();
        await sleep(fast ? 0 : 120);
        continue;
      }
      steps++;
      if (!fast) await sleep(this.ov.anims.size ? ANIM_MS * 0.6 : 25);
      else if (steps % 25 === 0) await sleep(0);
    }
    this.banner.classList.add('hidden');
    this.busy = false;
    if (this.destroyed) return;
    this.refresh();
    if (!this.s.over) {
      saveGame(this.s);
      this.advanceHints();
      this.checkRewards();
    }
  }

  private gameOverShown = false;
  private gameOver() {
    if (this.gameOverShown) return;
    this.gameOverShown = true;
    const s = this.s;
    const me = s.players[this.me];
    const ranking = s.players.map((p) => ({ p, sc: score(s, p.id) })).sort((a, b) => b.sc - a.sc);
    const won = s.winner === this.me;
    const myScore = score(s, this.me);
    addScore({ score: myScore, tribe: me.tribe, won, mode: s.mode, turns: s.turn, date: new Date().toLocaleDateString() });
    clearSave();
    modal({
      title: won ? 'Glorious Victory!' : me.alive ? 'The Age Ends' : 'Your Empire Has Fallen',
      art: unitPortrait(portraitKind(me.tribe), me.tribe, 80),
      body: [
        h('p', {}, won ? `The ${TRIBES[me.tribe].name} stands above all others.` : `The ${TRIBES[ranking[0].p.tribe].name} takes the crown this time.`),
        h('ol', { class: 'rank' }, ...ranking.map((r) => h('li', { style: { color: TRIBES[r.p.tribe].color } }, `${TRIBES[r.p.tribe].people}${r.p.id === this.me ? ' (you)' : ''} — ${r.sc.toLocaleString()}${r.p.alive ? '' : ' ✝'}`))),
      ],
      buttons: [
        { label: 'Main Menu', onClick: () => this.onExit('title') },
        { label: 'Play Again', primary: true, onClick: () => this.onExit('new') },
      ],
    });
  }

  // ------------------------------------------------------------ menus

  private openMenu() {
    modal({
      title: 'Menu',
      body: [h('p', { class: 'muted' }, 'Your game is saved automatically every turn.')],
      dismissable: true,
      buttons: [
        { label: 'Resume', primary: true },
        { label: 'Hints: ' + (this.settings.hints ? 'On' : 'Off'), onClick: () => { this.settings.hints = !this.settings.hints; this.updateHint(); } },
        { label: 'Center on capital', onClick: () => { const c = citiesOf(this.s, this.me)[0]; if (c) { this.cam.centerOn(c.x, c.y, this.vw, this.vh * 0.92); this.dirty = true; } } },
        { label: 'Quit to title', onClick: () => { if (!this.s.over) saveGame(this.s); this.onExit('title'); } },
      ],
      cls: 'menu',
    });
  }

  private openStats() {
    const s = this.s;
    const rows = s.players.map((p) => {
      const known = p.id === this.me || s.cities.some((c) => c.owner === p.id && isExplored(s, this.me, c.x, c.y));
      const T = TRIBES[p.tribe];
      return h('div', { class: 'stat-row', style: { '--tc': T.color } as Record<string, string> },
        unitPortrait(portraitKind(p.tribe), p.tribe, 44),
        h('div', {},
          h('b', {}, known ? `${T.people}${p.id === this.me ? ' (you)' : ''}` : 'Unknown empire'),
          h('div', { class: 'muted small' }, !p.alive ? 'Destroyed' : known ? `${score(s, p.id).toLocaleString()} pts · ${citiesOf(s, p.id).length} cities · ${p.techs.length} techs` : 'Not yet met'),
        ),
      );
    });
    modal({ title: 'Empires', body: rows, dismissable: true, cls: 'stats' });
  }

  private openTech() {
    if (this.busy) return;
    const tt = showTechTree(this.s, this.me, this.hud, () => {
      this.refresh();
      this.advanceHints();
      saveGame(this.s);
    }, () => this.refresh());
    void tt;
  }
}

function describeTile(s: GameState, t: Tile): { title: string; desc: string } {
  const owner = tileOwnerPlayer(s, t);
  const where = owner === null ? 'Unclaimed land.' : `${TRIBES[s.players[owner].tribe].people} territory (${cityById(s, t.owner)!.name}).`;
  const terrain: Record<Tile['terrain'], string> = { field: 'Field', forest: 'Forest', mountain: 'Mountain', shallow: 'Shallow Water', ocean: 'Ocean' };
  const res: Record<string, [string, string]> = {
    fruit: ['Wild Fruit', 'Harvest with Gathering.'],
    crop: ['Crops', 'Farm with Farming.'],
    animal: ['Wild Animals', 'Hunt with Hunting.'],
    fish: ['Fish', 'Catch with Fishing.'],
    ore: ['Ore', 'Mine with Mining.'],
    whale: ['Whales', 'Hunt with Whaling.'],
  };
  const imp: Record<string, string> = { farm: 'Farm', mine: 'Mine', lumber: 'Lumber Hut', port: 'Port', temple: 'Shrine', market: 'Market' };
  if (t.village) return { title: 'Village', desc: 'Move a unit here, then claim it next turn to found a city.' };
  if (t.ruin) return { title: 'Ancient Ruins', desc: 'Step on them to discover what was left behind.' };
  if (t.resource) return { title: `${res[t.resource][0]}`, desc: `${res[t.resource][1]} ${where}` };
  if (t.improvement) return { title: imp[t.improvement], desc: `${terrain[t.terrain]}. ${where}` };
  const extra = t.terrain === 'mountain' ? ` Needs ${TECH_BY_ID.climbing.name} to enter.` : t.terrain === 'ocean' ? ' Needs a Galley to cross.' : '';
  return { title: terrain[t.terrain] + (t.road ? ' (road)' : ''), desc: `${where}${extra}` };
}
