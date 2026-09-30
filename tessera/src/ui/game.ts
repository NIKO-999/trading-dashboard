import { MECH_UI } from './mech';
import type { MechView } from './mech/types';
import { TECH_BY_ID } from '../data/techs';
import { portraitKind, TRIBES } from '../data/tribes';
import { CLIMATE_INFO, isClimate } from '../data/terrain';
import { UNITS } from '../data/units';
import { aiStep } from '../game/ai';
import { drain, type GameEvent } from '../game/events';
import { tileAt } from '../game/grid';
import {
  applyReward, attack, attackOptions, cityById, citiesOf, cityIncome, def, defenseBonus, doAction, popNeeded, hasTech, income, isExplored, maxHp,
  moveOptions, moveUnit, paxHolds, previewCombat, rewardOptions, score, seaBonus, tileActions, tileOwnerPlayer, unitAt, unitCap, type Action,
} from '../game/rules';
import { endTurn, isHumanTurn } from '../game/turn';
import { ASH_NOTE, BEASTS, empires, isAsh, isNeutral, wildDescribe } from '../game/wild';
import { surgingNodes } from '../game/skills';
import { perkRange } from '../game/perks';
import type { City, GameState, Tile, TribeId, Unit, UnitKind } from '../game/types';
import { Camera } from '../render/camera';
import { roadNetwork, ROAD_MILESTONES } from '../game/network';
import { CAPTIVE_MS, REDUCED_MOTION, renderDpr, setSharpness } from '../render/common';
import { livingScene } from '../render/living';
import { LivingLayer, picturePlace } from './living';
import { damageFloater, deathParticles, deathTheme, isBigUnit, killShake, mergeShake, shakeOffset } from '../render/combatfx';
import { tileCenter } from '../render/camera';
import { setCrispArt } from '../render/prims';
import { clearSpriteCache, isDirectDraw, setDirectDraw } from '../render/sprites';
import { WILD_COLOR } from '../render/wild';
import { REBEL_COLOR } from '../render/rebels';
import { isRogueCity, isRogueUnit, onBrink, rogueDescribe, subject, unrestFactors, unrestLine, unrestOf, UNREST_WARN } from '../game/rebels';
import { drawIcon, FLASH_MS, FLOAT_MS, GHOST_MS, HOP_MS, LUNGE_MS, newFx, SAIL_MS, WorldRenderer, type Fx, type Overlay } from '../render/draw';
import { bubbleAt, cityLabelAt, unitAtScreen, type BubbleKind } from '../render/dynamic';
import { music } from '../audio/music';
import { sfx, type SoundName } from '../audio/sfx';
import { addScore, clearSave, loadSettings, saveGame, saveSettings } from '../save';
import { $ui, h, iconEl, paint, starSpan } from './dom';
import { unitPortrait } from './menu';
import { showSharpnessTest } from './diag';
import { modal, toast } from './modal';
import { showTechTree } from './techtree';
import { adoptedLines, showCultureOffer } from './culture';
import { adopt, offersOf } from '../game/culture';
import { knows, wonderDescribe } from '../game/wonders';
import { WONDER_BY_ID } from '../data/wonders';
import { celebrateWonder, wonderChip, wonderHud, wondersList } from './wonders';
import { ChipRow, shortChip, skillChip, unrestChip, type HudLine } from './hudchips';
import { answer, diploIncome, diploNews, diploOn, offersFor, opinion, opinionWord, relation } from '../game/diplomacy';
import { showDiplomacy, showOffer } from './diplomacy';
import { cooldownLeft, HERO_ATK_PER_LEVEL, HERO_MAX_LEVEL, HERO_XP, heroDef, isHero } from '../game/heroes';
import { isTraderKind, liveRoutes, routeIncome, routesOfCity, routesPerCity, traderName, traderPreview } from '../game/trade';
import { tradeList } from './trade';
import { categoryOf } from '../data/tribes';
import { cityTax, fleetIncome, isRoleKind, isSapperFort, minedLeft, postAt, rallyLeft, RECRUIT_CAP, RECRUIT_DISCOUNT, roleName, roleParts, rolePreview, upgradeName, upgradesOf, UPGRADE_STARS } from '../game/roles';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const UNIT_ACTIONS = (id: string) => id === 'capture' || id === 'recover' || id.startsWith('upgrade:') || id.startsWith('hero:') || id.startsWith('trade:');

interface Selection { x: number; y: number; mode: 'unit' | 'tile' }

export class GameView {
  private canvas = document.getElementById('game') as HTMLCanvasElement;
  private ctx = this.canvas.getContext('2d')!;
  private cam = new Camera();
  private ov: Overlay = { selected: null, moves: [], attacks: [], glow: new Set(), fx: newFx(), now: 0 };
  private renderer = new WorldRenderer();
  private version = 0; // bumped whenever the cached map layer must be redrawn
  private drawnVersion = -1;
  private lastFrame = 0;
  private lastTick = 0;
  private dpr = 1;
  private wantedDpr = 0; // what renderDpr asked for, before the canvas-size cap
  private touching = 0; // fingers currently on the map
  private inputAbort = new AbortController(); // ends every input listener when this game closes
  private frameAvg = 0; // recent time to draw a frame (ms)
  private tagAt = 0;
  private lastPointerAt = 0; // when a finger last touched or moved on the map
  private wasTouching = false;
  private sel: Selection | null = null;
  private busy = false;
  private raf = 0;
  private me: number; // the human player whose view is shown (changes hands in pass & play)
  private hotseat: boolean;
  private vw = 0;
  private vh = 0;
  private hud!: HTMLElement;
  private buildTag!: HTMLElement;
  private panel!: HTMLElement;
  private bottom!: HTMLElement;
  private hint!: HTMLElement;
  private banner!: HTMLElement;
  private settings = loadSettings();
  private destroyed = false;
  private rewardOpen = false;
  private ro = () => this.resize();

  constructor(private s: GameState, private onExit: (next: 'title' | 'new') => void) {
    this.me = s.players[s.current].human ? s.current : s.players.findIndex((p) => p.human);
    this.hotseat = s.players.filter((p) => p.human).length > 1;
    this.buildUi();
    this.resize();
    window.addEventListener('resize', this.ro);
    window.visualViewport?.addEventListener('resize', this.ro);
    this.bindInput();
    music.play(s.players[this.me].tribe);
    const cap = citiesOf(s, this.me).find((c) => c.capital) ?? citiesOf(s, this.me)[0];
    this.cam.zoom = Math.min(2.2, Math.max(1.2, this.vw / 250));
    if (cap) this.cam.centerOn(cap.x, cap.y, this.vw, this.vh * 0.95);
    // Canvas text only picks up the web font once it has loaded.
    document.fonts?.ready.then(() => this.version++);
    this.loop();
    this.refresh();
    if (import.meta.env.DEV) Object.assign(window, { __game: this });
    if (!isHumanTurn(s) && !s.over) void this.runRivals();
    else if (!s.over) this.startHumanTurn(true);
  }

  /**
   * A bar over the live map with four ways of putting the map on the screen. The player taps each,
   * keeps the sharpest and the choice is saved; no numbers to read.
   */
  private showDisplayPicker() {
    document.querySelector('.display-picker')?.remove();
    const MODES: { label: string; display: 'standard' | 'exact' | 'image'; sharp: 1 | 4 }[] = [
      { label: '1', display: 'standard', sharp: 1 },
      { label: '2', display: 'exact', sharp: 1 },
      { label: '3', display: 'exact', sharp: 4 },
      { label: '4', display: 'standard', sharp: 4 },
      { label: '5', display: 'image', sharp: 1 },
    ];
    const current = () => MODES.findIndex((m) => m.display === (this.settings.display ?? 'standard') && m.sharp === (this.settings.sharp === 1 ? 1 : 4));
    const buttons = MODES.map((m, i) => h('button', { class: 'dp-opt', onclick: () => {
      this.settings.display = m.display;
      this.settings.sharp = m.sharp;
      saveSettings(this.settings);
      setSharpness(m.sharp);
      this.hidePhoto();
      this.resize();
      mark();
    } }, m.label));
    const mark = () => buttons.forEach((b, i) => b.classList.toggle('on', i === current()));
    const bar = h('div', { class: 'display-picker' },
      h('div', { class: 'dp-text' }, 'Which map looks sharpest? Tap each number, look at the map for a second, keep the best. (5 = still picture)'),
      h('div', { class: 'dp-row' }, ...buttons, h('button', { class: 'dp-done', onclick: () => {
        this.settings.displayPicked = true;
        saveSettings(this.settings);
        bar.remove();
      } }, 'Done')));
    mark();
    $ui().append(bar);
  }

  private myTurn() {
    return isHumanTurn(this.s) && this.s.current === this.me;
  }

  /** Screen position of a tile centre (used by browser tests). */
  tileScreen(x: number, y: number) {
    return this.cam.toScreen((x - y) * 32, (x + y) * 16 + 16);
  }

  destroy() {
    this.destroyed = true;
    this.inputAbort.abort();
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.ro);
    window.visualViewport?.removeEventListener('resize', this.ro);
    for (const img of this.photoImgs) img.remove();
    this.living.destroy();
    if (this.photoUrl) URL.revokeObjectURL(this.photoUrl);
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // ------------------------------------------------------------ layout

  private buildUi() {
    const root = $ui();
    root.innerHTML = '';
    this.hud = h('div', { class: 'hud' });
    // tiny and faint: with "Build info" on, any screenshot says which build it is and how sharply the map is drawn
    this.buildTag = h('div', { class: 'build-tag' });
    this.hint = h('div', { class: 'hint hidden' });
    this.banner = h('div', { class: 'turn-banner hidden' });
    this.panel = h('div', { class: 'sheet hidden' });
    this.bottom = h('div', { class: 'bottom-bar' });
    // the vignette is a CSS layer (composited for free) rather than a full-screen gradient painted every frame
    root.append(h('div', { class: `game-ui${this.settings.buildInfo ? ' show-build' : ''}` }, h('div', { class: 'vignette' }), this.buildTag, this.hud, this.hint, this.banner, this.panel, this.bottom));
    const btn = (icon: Parameters<typeof iconEl>[0], label: string, cls: string, onclick: () => void) =>
      h('button', { class: `dock-btn ${cls}`, onclick }, h('span', { class: 'round' }, iconEl(icon)), h('span', { class: 'dock-label' }, label));
    this.hud.after(this.chips.row);
    this.bottom.append(
      btn('menu', 'Menu', 'dark', () => this.openMenu()),
      btn('globe', 'Empires', 'dark', () => this.openStats()),
      btn('tech', 'Tech Tree', 'blue', () => this.openTech()),
      btn('check', 'End Turn', 'blue end-turn', () => void this.onEndTurn()),
    );
  }

  private resize() {
    // Render at the screen's real pixel density (see renderDpr) so the map stays sharp.
    this.wantedDpr = renderDpr();
    // iOS refuses canvases much past 16 million pixels, so a high density gives way on big screens
    const dpr = Math.min(this.wantedDpr, Math.sqrt(16_000_000 / (window.innerWidth * window.innerHeight)));
    this.dpr = dpr;
    this.showTag();
    const oldW = this.vw, oldH = this.vh;
    this.vw = window.innerWidth;
    this.vh = window.innerHeight;
    this.canvas.width = Math.round(this.vw * dpr);
    this.canvas.height = Math.round(this.vh * dpr);
    if (this.settings.display === 'exact') {
      // One CSS pixel per canvas pixel, then shrunk to the screen by the compositor: the canvas is
      // laid out at its true bitmap size, so nothing in the page pipeline can resample it softer.
      this.canvas.style.width = `${this.canvas.width}px`;
      this.canvas.style.height = `${this.canvas.height}px`;
      this.canvas.style.transformOrigin = '0 0';
      this.canvas.style.transform = `scale(${this.vw / this.canvas.width}, ${this.vh / this.canvas.height})`;
    } else {
      this.canvas.style.width = `${this.vw}px`;
      this.canvas.style.height = `${this.vh}px`;
      this.canvas.style.transform = '';
    }
    this.ctx.setTransform(this.canvas.width / this.vw, 0, 0, this.canvas.height / this.vh, 0, 0);
    // zooming out stops once the whole map fits, so small maps can't shrink to an island in the dark
    const fit = Math.min(this.vw / (this.s.size * 64), this.vh / (this.s.size * 32 + 40));
    this.cam.minZoom = Math.min(1, Math.max(0.45, fit * 0.92));
    if (oldW) {
      this.cam.x += (this.vw - oldW) / 2;
      this.cam.y += (this.vh - oldH) / 2;
    }
    this.version++;
  }

  /** The tiny corner tag: version, drawing density, drawing mode and how long a frame takes to draw. */
  private showTag() {
    const ms = this.frameAvg > 0 ? ` · ${isDirectDraw() ? 'direct' : 'cached'} ${this.frameAvg.toFixed(0)}ms` : '';
    this.buildTag.textContent = `v${__APP_VERSION__.replace(/\.0$/, '')} · ${+this.dpr.toFixed(2)}×${this.settings.display && this.settings.display !== 'standard' ? ` ${this.settings.display}` : ''}${ms}`;
  }

  /**
   * Photo display. iOS shows a live canvas soft but a picture pin-sharp, so the map is shown as a
   * picture: one a little larger than the screen, slid (and, while pinching, scaled) with the camera
   * as you scroll, and retaken whenever the view settles or the game changes. The live canvas stays
   * underneath for the moments a fresh picture isn't ready yet. What moves on its own at rest (units
   * breathing, fish, glints, banners) is left out of the picture and shown by the living layer on top
   * (see ui/living). Two picture elements take turns, so a new picture and its living layer appear
   * together, once both are ready.
   */
  private photoImgs = [0, 1].map(() => {
    const img = document.createElement('img');
    img.alt = '';
    img.draggable = false;
    img.style.cssText = 'position:fixed;left:0;top:0;pointer-events:none;visibility:hidden;transform-origin:0 0;will-change:transform;';
    document.getElementById('game')!.after(img);
    return img;
  });
  private photoImg = this.photoImgs[0]; // the one on screen
  private living = new LivingLayer(this.photoImgs[0]); // after both pictures (each went in straight after the canvas)
  private photoRenderer = new WorldRenderer();
  private photoCanvas = document.createElement('canvas');
  private photoValid = false; // the picture shows the current game state
  private photoWanted = false; // the view has changed since the picture was taken
  private photoBusy = false;
  private photoUrl = '';
  private photoAt = { x: 0, y: 0, zoom: 1, mx: 0, my: 0, w: 0, h: 0, version: -1 };

  private hidePhoto() {
    this.photoValid = false;
    this.photoImg.style.visibility = 'hidden';
    this.living.place(this.cam, this.dpr, false, this.version);
  }

  /** Slides the picture to where the camera now is; hides it if it no longer covers the screen. */
  private placePhoto() {
    if (!this.photoValid) return;
    const P = this.photoAt;
    const { left, top, k, transform } = picturePlace(P, this.cam, this.dpr);
    const covers = left <= 0.5 && top <= 0.5 && left + k * P.w >= this.vw - 0.5 && top + k * P.h >= this.vh - 0.5;
    this.photoImg.style.transform = transform;
    this.photoImg.style.visibility = covers ? 'visible' : 'hidden';
    this.living.place(this.cam, this.dpr, covers, this.version);
    // retake before the edge shows: once less than 40% of the spare border is left
    const slack = Math.min(-left, -top, left + k * P.w - this.vw, top + k * P.h - this.vh);
    this.photoCovers = covers && slack > Math.min(P.mx, P.my) * 0.4;
  }
  private photoCovers = false;
  private photoTakenAt = 0;

  private async takePhoto() {
    this.photoBusy = true;
    this.photoTakenAt = performance.now();
    this.photoWanted = false;
    const mx = Math.round(Math.min(220, this.vw * 0.35)), my = Math.round(Math.min(320, this.vh * 0.3));
    const W = this.vw + mx * 2, H = this.vh + my * 2;
    const pc = this.photoCanvas;
    pc.width = Math.round(W * this.dpr);
    pc.height = Math.round(H * this.dpr);
    const pctx = pc.getContext('2d')!;
    pctx.setTransform(pc.width / W, 0, 0, pc.height / H, 0, 0);
    const lc = new Camera();
    lc.x = this.cam.x + mx;
    lc.y = this.cam.y + my;
    lc.zoom = this.cam.zoom;
    // with motion allowed, the moving parts go in the living layer instead of the picture
    const living = !REDUCED_MOTION;
    const pov = { ...this.ov, hudBottom: (this.ov.hudBottom ?? 0) + my }; // the picture reaches `my` above the screen
    this.photoRenderer.render(pctx, this.s, this.me, lc, { ...pov, still: true, living }, W, H, this.dpr, this.version, false);
    const scene = living ? livingScene(this.s, this.me, lc, pov, W, H, this.dpr) : null;
    const at = { x: this.cam.x, y: this.cam.y, zoom: this.cam.zoom, mx, my, w: W, h: H, version: this.version };
    const current = () => !this.destroyed && this.settings.display === 'image' && this.version === at.version;
    try {
      const blob = await new Promise<Blob | null>((done) => pc.toBlob(done, 'image/png'));
      if (!blob || !current()) { this.photoWanted = !this.destroyed; return; }
      const url = URL.createObjectURL(blob);
      const img = this.photoImgs[this.photoImg === this.photoImgs[0] ? 1 : 0]; // the one off screen
      img.src = url;
      img.style.width = `${W}px`;
      img.style.height = `${H}px`;
      const ready = await Promise.all([img.decode().then(() => true, () => false), scene ? this.living.prepare(scene, at) : true]);
      if (!ready[0] || !ready[1] || !current()) {
        URL.revokeObjectURL(url);
        this.photoWanted = !this.destroyed;
        return;
      }
      // the new picture and its living layer go on screen in the same frame
      this.photoImg.style.visibility = 'hidden';
      this.photoImg = img;
      if (this.photoUrl) URL.revokeObjectURL(this.photoUrl);
      this.photoUrl = url;
      if (scene) this.living.commit();
      else this.living.clear();
      this.photoAt = at;
      this.photoValid = true;
      this.placePhoto();
    } finally {
      this.photoBusy = false;
    }
  }

  private loop = (now: number = performance.now()) => {
    if (this.destroyed) return;
    // Screens can change density without any resize event (an app showing a web view it loaded
    // off-screen, a window dragged to another monitor), so check every frame; it costs nothing.
    if (window.innerWidth !== this.vw || window.innerHeight !== this.vh || renderDpr() !== this.wantedDpr) this.resize();
    const dt = Math.min(50, now - (this.lastTick || now));
    this.lastTick = now;
    this.ov.now = now;
    const camMoving = this.cam.step(now, dt);
    const fxActive = this.pruneFx(now);
    // Full frame rate while anything moves; idle breathing only needs ~30 fps.
    const gestureEnded = this.touching === 0 && this.wasTouching;
    this.wasTouching = this.touching > 0;
    // The cached map is only stretched while a finger is actually moving. A phone can lose a
    // finger-up (a system gesture, an app switch), and a stuck "touching" must never leave the map
    // as a stretched, blurry copy: once the fingers rest for a moment it is redrawn sharp.
    const interacting = this.touching > 0 && now - this.lastPointerAt < 200;
    const photo = this.settings.display === 'image';
    const needed = camMoving || fxActive || gestureEnded || this.touching > 0 || this.version !== this.drawnVersion;
    // in photo mode the resting map is a still picture, so the idle breathing redraws stop
    if (needed || (!photo && now - this.lastFrame > (isDirectDraw() ? 50 : 33))) {
      const t0 = performance.now();
      const shake = shakeOffset(this.ov.fx.shake, now); // a kill jolts the view for a moment (the camera itself stays put)
      this.cam.x += shake.x;
      this.cam.y += shake.y;
      this.renderer.render(this.ctx, this.s, this.me, this.cam, this.ov, this.vw, this.vh, this.dpr, this.version, interacting);
      this.cam.x -= shake.x;
      this.cam.y -= shake.y;
      this.frameAvg = this.frameAvg ? this.frameAvg * 0.9 + (performance.now() - t0) * 0.1 : performance.now() - t0;
      if (now - this.tagAt > 1000) { this.tagAt = now; this.showTag(); }
      this.drawnVersion = this.version;
      this.lastFrame = now;
      if (photo) {
        // only scrolling and zooming keep the picture: anything that changes the map itself hides it
        if (fxActive || this.version !== this.photoAt.version) this.hidePhoto();
        this.photoWanted = true;
      }
    }
    if (photo) {
      this.placePhoto();
      // retaken once the view rests, including a finger resting mid-scroll
      const resting = this.touching ? now - this.lastPointerAt > 150 : !camMoving;
      if (this.photoWanted && !this.photoBusy && resting && !fxActive && now - this.lastFrame > 120) void this.takePhoto();
      // a long scroll runs past the picture's edge: take a new one on the way rather than show the soft live map
      else if (!this.photoBusy && !fxActive && (camMoving || this.touching) && this.version === this.photoAt.version && !this.photoCovers && now - this.photoTakenAt > 200) void this.takePhoto();
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  /** Drops finished effects. Returns true while any effect is still playing. */
  private pruneFx(now: number) {
    const fx = this.ov.fx;
    let active = false;
    for (const [id, m] of fx.moves) if (now > m.t0 + m.dur) fx.moves.delete(id); else active = true;
    for (const [id, l] of fx.lunges) if (now > l.t0 + LUNGE_MS) fx.lunges.delete(id); else active = true;
    for (const [id, t] of fx.flashes) if (now > t + FLASH_MS) fx.flashes.delete(id); else active = true;
    for (const [id, h] of fx.hpHold) if (now > h.until) fx.hpHold.delete(id);
    fx.ghosts = fx.ghosts.filter((g) => now < g.t0 + (g.dur ?? GHOST_MS));
    if (fx.shake && now > fx.shake.t0 + fx.shake.dur) fx.shake = null;
    else if (fx.shake) active = true;
    fx.projectiles = fx.projectiles.filter((p) => now < p.t0 + p.dur);
    fx.particles = fx.particles.filter((p) => now < p.t0 + p.life * 1000);
    fx.floaters = fx.floaters.filter((f) => now < f.t0 + FLOAT_MS);
    return active || fx.ghosts.length + fx.projectiles.length + fx.particles.length + fx.floaters.length > 0;
  }

  // ------------------------------------------------------------ input

  private bindInput() {
    const pts = new Map<number, { x: number; y: number }>();
    let panned = false;
    let start = { x: 0, y: 0 };
    let pinch = 0;
    let vx = 0, vy = 0, lastT = 0;
    const c = this.canvas;
    const signal = this.inputAbort.signal;
    c.addEventListener('pointerdown', (e) => {
      sfx.unlock();
      this.cam.stop();
      vx = vy = 0;
      lastT = e.timeStamp;
      c.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.touching = pts.size;
      this.lastPointerAt = e.timeStamp;
      if (pts.size === 1) {
        panned = false;
        start = { x: e.clientX, y: e.clientY };
      }
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        pinch = Math.hypot(a.x - b.x, a.y - b.y);
        panned = true;
      }
    }, { signal });
    c.addEventListener('pointermove', (e) => {
      const prev = pts.get(e.pointerId);
      if (!prev) return;
      this.lastPointerAt = e.timeStamp;
      const cur = { x: e.clientX, y: e.clientY };
      if (pts.size === 1) {
        if (!panned && Math.hypot(cur.x - start.x, cur.y - start.y) > 8) panned = true;
        if (panned) {
          this.cam.x += cur.x - prev.x;
          this.cam.y += cur.y - prev.y;
          const dtm = Math.max(1, e.timeStamp - lastT);
          vx = vx * 0.6 + ((cur.x - prev.x) / dtm) * 0.4;
          vy = vy * 0.6 + ((cur.y - prev.y) / dtm) * 0.4;
          lastT = e.timeStamp;
        }
      } else if (pts.size === 2) {
        pts.set(e.pointerId, cur);
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        // the renderer stretches its cached map while fingers are down and redraws it sharp on release
        if (pinch > 0) this.cam.zoomAt(d / pinch, (a.x + b.x) / 2, (a.y + b.y) / 2);
        pinch = d;
      }
      pts.set(e.pointerId, cur);
    }, { signal });
    const up = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      this.touching = pts.size;
      if (pts.size === 0 && !panned && e.type === 'pointerup') this.tap(e.clientX, e.clientY);
      // fling: keep gliding after a quick pan
      if (pts.size === 0 && panned && pinch === 0 && e.timeStamp - lastT < 80) {
        const sp = Math.hypot(vx, vy);
        const max = 3;
        this.cam.vx = sp > max ? (vx / sp) * max : vx;
        this.cam.vy = sp > max ? (vy / sp) * max : vy;
      }
      pinch = 0;
    };
    c.addEventListener('pointerup', up, { signal });
    c.addEventListener('pointercancel', up, { signal });
    c.addEventListener('lostpointercapture', up, { signal });
    // Clear fingers the canvas never heard leave (system gestures, app switches, a hidden page).
    const release = (e: Event) => {
      if (e.type === 'touchend' && (e as TouchEvent).touches.length > 0) return;
      pts.clear();
      this.touching = 0;
      pinch = 0;
    };
    const stale = () => { if (document.visibilityState !== 'visible') release(new Event('visibility')); };
    window.addEventListener('touchend', release, { passive: true, signal });
    window.addEventListener('touchcancel', release, { passive: true, signal });
    window.addEventListener('blur', release, { signal });
    document.addEventListener('visibilitychange', stale, { signal });
    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cam.zoomAt(e.deltaY < 0 ? 1.1 : 1 / 1.1, e.clientX, e.clientY);
    }, { passive: false, signal });
  }

  /** A tap on one of the round buttons above the selected unit. */
  private onBubble(kind: BubbleKind) {
    const sel = this.sel;
    if (!sel) return;
    if (kind === 'attack') {
      sfx.play('tap');
      toast('Tap a red-marked enemy to attack it.');
      return;
    }
    const t = tileAt(this.s, sel.x, sel.y)!;
    const id = kind === 'heal' ? 'recover' : 'capture';
    const act = tileActions(this.s, this.me, t).find((a) => a.id === id);
    if (!act?.enabled) {
      sfx.play('error');
      if (act?.reason) toast(id === 'capture' ? 'This unit can claim it next turn: it has to start the turn here.' : act.reason);
      return;
    }
    sfx.play(kind === 'heal' ? 'harvest' : 'build');
    this.act(() => doAction(this.s, this.me, t, id));
    this.advanceHints();
    this.checkRewards();
  }

  private tap(sx: number, sy: number) {
    if (this.busy) return;
    const bubble = bubbleAt(sx, sy);
    if (bubble) return this.onBubble(bubble);
    // What was tapped: a unit's figure (units stand about a tile above their tile), a city's
    // label, or else the tile under the finger.
    const figure = unitAtScreen(this.s, this.me, this.cam, sx, sy, this.ov.fx.facing);
    const labelCity = cityLabelAt(sx, sy);
    const under = this.cam.pickTile(sx, sy);
    const sel = this.sel;
    const mover = sel && sel.mode === 'unit' && this.myTurn() ? unitAt(this.s, sel.x, sel.y) : undefined;
    const mine = mover && mover.owner === this.me ? mover : undefined;
    let { x, y } = under;
    let asTile = false;
    // a unit you touch wins (attack it if you can, else select it); otherwise the tile or label under the finger
    // (a tall figure reaches up into the tile above it, so a tile you can step to or hit wins over
    // any figure that only overlaps it, unless the figure itself is something you can attack)
    const canGo = (a: { x: number; y: number }) => this.ov.moves.some((m) => m.x === a.x && m.y === a.y) || this.ov.attacks.some((m) => m.x === a.x && m.y === a.y);
    if (figure && !(mine && canGo(under) && !this.ov.attacks.some((a) => a.x === figure.x && a.y === figure.y))) ({ x, y } = figure);
    else if (mine && canGo(under)) ({ x, y } = under);
    else if (labelCity !== null) {
      const c = cityById(this.s, labelCity)!;
      ({ x, y } = c);
      asTile = true;
    }
    const t = tileAt(this.s, x, y);
    if (!t) return this.select(null);
    if (mine) {
      const u = mine;
      if (this.ov.attacks.some((a) => a.x === x && a.y === y)) {
        const target = unitAt(this.s, x, y)!;
        this.rewardsAfter(this.act(() => attack(this.s, u, target))); // a kill can level up a city
        const still = this.s.units.includes(u);
        return this.select(still ? { x: u.x, y: u.y, mode: 'unit' } : null);
      }
      if (this.ov.moves.some((m) => m.x === x && m.y === y)) {
        this.rewardsAfter(this.act(() => moveUnit(this.s, u, x, y))); // stepping on ruins can level up a city
        const sp = this.tileScreen(x, y);
        if (sp.x < this.vw * 0.15 || sp.x > this.vw * 0.85 || sp.y < this.vh * 0.22 || sp.y > this.vh * 0.7) this.cam.glideTo(x, y, this.vw, this.vh * 0.9, 550);
        this.advanceHints();
        return this.select({ x: u.x, y: u.y, mode: 'unit' });
      }
    }
    if (mine && !asTile && t.terrain === 'ocean' && UNITS[mine.kind].naval && mine.kind !== 'ship' && mine.kind !== 'warship' && isExplored(this.s, this.me, x, y) && !unitAt(this.s, x, y)) {
      // a canoe can't leave the shallows: say what it takes to sail the open ocean
      sfx.play('error');
      toast(hasTech(this.s, this.me, 'sailing') ? 'Canoes stay in the shallows. Upgrade this one to a Galley to sail the open ocean.' : 'Open ocean needs Sailing. Research it, then upgrade your canoe to a Galley.');
    }
    const hasUnit = !asTile && !!unitAt(this.s, x, y) && isExplored(this.s, this.me, x, y);
    if (sel && sel.x === x && sel.y === y) {
      if (sel.mode === 'unit') return this.select({ x, y, mode: 'tile' });
      if (!asTile) return this.select(null);
    }
    sfx.play('tap');
    this.select({ x, y, mode: hasUnit ? 'unit' : 'tile' });
  }

  private select(sel: Selection | null) {
    this.sel = sel;
    this.ov.selected = sel ? { x: sel.x, y: sel.y } : null;
    this.ov.moves = [];
    this.ov.attacks = [];
    this.ov.bubbles = [];
    this.ov.bubblesOff = [];
    if (sel && sel.mode === 'unit' && this.myTurn()) {
      const u = unitAt(this.s, sel.x, sel.y);
      if (u && u.owner === this.me) {
        this.ov.moves = moveOptions(this.s, u);
        this.ov.attacks = attackOptions(this.s, u).map((e) => ({ x: e.x, y: e.y }));
        const acts = tileActions(this.s, this.me, tileAt(this.s, u.x, u.y)!);
        if (this.ov.attacks.length) this.ov.bubbles.push('attack');
        if (acts.some((a) => a.id === 'recover' && a.enabled)) this.ov.bubbles.push('heal');
        // claiming shows as soon as the unit stands on a village or enemy city, greyed out until it can act
        const claim = acts.find((a) => a.id === 'capture');
        if (claim) {
          this.ov.bubbles.push('capture');
          if (!claim.enabled) this.ov.bubblesOff.push('capture');
        }
      }
    }
    this.version++;
    this.updatePanel();
  }

  /**
   * Runs a state-changing action, then plays its animations: attacks first, then any unit that
   * moved hops to its new tile. Returns when (performance.now() time) the visible effects settle.
   */
  private act(fn: () => unknown, rival = false): number {
    const before = new Map(this.s.units.map((u) => [u.id, { x: u.x, y: u.y }]));
    const moved = new Set<number>();
    fn();
    const now = performance.now();
    const evs = drain();
    this.lastEvents = evs;
    for (const e of evs) if (e.type === 'move') moved.add(e.unitId);
    const { end } = this.handleEvents(evs);
    let settle = end;
    // anything that changed tiles without walking (rare) just hops straight there
    for (const u of this.s.units) {
      const b = before.get(u.id);
      if (!b || (b.x === u.x && b.y === u.y) || moved.has(u.id)) continue;
      this.ov.fx.moves.set(u.id, { path: [b, { x: u.x, y: u.y }], t0: now, dur: HOP_MS * 1.3 });
      settle = Math.max(settle, now + HOP_MS * 1.3);
    }
    if (rival) this.refreshDuringRivals();
    else this.refresh();
    if (isHumanTurn(this.s)) saveGame(this.s);
    return settle;
  }

  private lastRivalRedraw = 0;
  private lastEvents: GameEvent[] = [];

  /** Whether any of these events happens inside the part of the map on screen right now. */
  private onScreen(evs: GameEvent[]) {
    const inView = (p: { x: number; y: number }) => {
      if (!isExplored(this.s, this.me, p.x, p.y)) return false;
      const q = this.tileScreen(p.x, p.y);
      return q.x > -40 && q.x < this.vw + 40 && q.y > -40 && q.y < this.vh + 40;
    };
    return evs.some((e) => {
      if (e.type === 'move') return e.path.some(inView);
      if (e.type === 'attack') return inView(e.from) || inView(e.to);
      return 'x' in e && typeof e.x === 'number' && inView(e as { x: number; y: number });
    });
  }
  /**
   * The HUD during rival turns, and the map redrawn at most every quarter-second: rivals take
   * many small steps and redrawing the whole map after each one slowed big maps down.
   */
  private refreshDuringRivals() {
    const now = performance.now();
    if (now - this.lastRivalRedraw > 250) {
      this.lastRivalRedraw = now;
      this.refresh();
    }
  }

  private sound(name: SoundName, delayMs: number, player: number) {
    sfx.play(name, delayMs, player === this.me ? 1 : 0.5);
  }

  private tileGround(x: number, y: number) {
    const t = tileAt(this.s, x, y);
    const water = !!t && (t.terrain === 'shallow' || t.terrain === 'ocean');
    return { x: (x - y) * 32, y: (x + y) * 16 + 16 + (water ? 5 : 0), water };
  }

  /** Dust kicked up where a unit lands. */
  private dust(x: number, y: number, t0: number) {
    const g = this.tileGround(x, y);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.random() * 0.5;
      this.ov.fx.particles.push({ x: g.x + Math.cos(a) * 5, y: g.y + 5 + Math.sin(a) * 2, vx: Math.cos(a) * 22, vy: Math.sin(a) * 8 - 10, g: 20, t0, life: 0.42, color: '#e7dcc4', size: 2.3, shape: 'puff' });
    }
  }

  /** Spray and a ring where a unit enters the water. */
  private splash(x: number, y: number, t0: number) {
    const g = this.tileGround(x, y);
    this.ov.fx.particles.push({ x: g.x, y: g.y + 3, vx: 0, vy: 0, g: 0, t0, life: 0.6, color: 'rgba(255,255,255,0.85)', size: 3, shape: 'ring' });
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const sp = 45 + Math.random() * 45;
      this.ov.fx.particles.push({ x: g.x + (Math.random() - 0.5) * 8, y: g.y, vx: Math.cos(a) * sp * 0.6, vy: Math.sin(a) * sp, g: 300, t0, life: 0.5, color: '#e9fbff', size: 1.6, shape: 'drop' });
    }
  }

  /** A soft wake ring behind a boat. */
  private wake(x: number, y: number, t0: number) {
    const g = this.tileGround(x, y);
    this.ov.fx.particles.push({ x: g.x, y: g.y + 3, vx: 0, vy: 0, g: 0, t0, life: 0.7, color: 'rgba(255,255,255,0.6)', size: 4, shape: 'ring' });
  }

  /** A little burst of particles above a tile. */
  private burst(x: number, y: number, t0: number, n: number, colors: string[], shape: Fx['particles'][number]['shape'], speed: number) {
    const c = { x: (x - y) * 32, y: (x + y) * 16 + 16 };
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const sp = speed * (0.5 + Math.random() * 0.7);
      this.ov.fx.particles.push({
        x: c.x + (Math.random() - 0.5) * 14, y: c.y - 18 + (Math.random() - 0.5) * 8,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: shape === 'puff' ? -20 : 240,
        t0, life: 0.6 + Math.random() * 0.4, color: colors[i % colors.length], size: shape === 'star' ? 3.4 : shape === 'puff' ? 4 : 3.2, shape,
      });
    }
  }

  // ------------------------------------------------------------ HUD & panel

  private refresh() {
    const p = this.s.players[this.me];
    const turnText = this.s.maxTurns > 0 ? `${Math.min(this.s.turn, this.s.maxTurns)}/${this.s.maxTurns}` : String(this.s.turn);
    const sc = score(this.s, this.me);
    if (!this.hudEls) {
      const val = () => h('span', {});
      this.hudEls = { score: val(), starsLabel: h('div', { class: 'hud-label' }), stars: val(), turn: val(), scoreBox: h('div', { class: 'hud-val' }), starsBox: h('div', { class: 'hud-val' }) };
      const e = this.hudEls;
      e.scoreBox.append(e.score);
      e.starsBox.append(iconEl('star', 'ico-star big'), e.stars);
      this.hud.append(
        h('div', { class: 'hud-cell' }, h('div', { class: 'hud-label' }, 'Score'), e.scoreBox),
        h('div', { class: 'hud-cell' }, e.starsLabel, e.starsBox),
        h('div', { class: 'hud-cell' }, h('div', { class: 'hud-label' }, 'Turn'), h('div', { class: 'hud-val' }, e.turn)),
      );
    }
    const e = this.hudEls;
    e.starsLabel.textContent = `Stars (+${income(this.s, this.me) + diploIncome(this.s, this.me) + fleetIncome(this.s, this.me)})`; // trade and tribute count too (see game/diplomacy), and fishing fleets (see game/roles)
    e.turn.textContent = turnText;
    this.countTo(e.score, e.scoreBox, sc, (v) => v.toLocaleString());
    this.countTo(e.stars, e.starsBox, p.stars, String);
    this.bottom.classList.toggle('waiting', !this.myTurn());
    this.refreshMech();
    // where the score bar and its chips end, for the map to keep its labels and badges clear of them
    this.ov.hudBottom = Math.max(this.hud.getBoundingClientRect().bottom, this.chips.row.getBoundingClientRect().bottom);
    this.ov.glow = this.harvestable();
    this.updateHint();
    this.version++;
    if (this.sel) this.select(this.sel);
  }

  private chips = new ChipRow();
  private mechDock: HTMLElement | null = null;

  /** The empire mechanic's own readout and dock button (see ui/mech). */
  private refreshMech() {
    const ui = MECH_UI[this.s.players[this.me].tribe];
    const view: MechView = {
      s: this.s, me: this.me,
      refresh: () => this.refresh(),
      act: (fn) => { fn(); this.refresh(); },
      focus: (x, y) => this.cam.glideTo(x, y, this.vw, this.vh * 0.9, 450),
    };
    // one row of chips (see ui/hudchips): a restless city first, then the mechanic, the skill tree and a wonder
    const lines: HudLine[] = [];
    const unrest = this.unrestHud();
    if (unrest) lines.push(unrest);
    const hud = ui?.hud?.(view) ?? null;
    if (hud) lines.push({ key: 'mech', ...(ui?.chip?.(view) ?? { icon: '◆', text: shortChip(hud.textContent ?? '') }), full: hud });
    const skill = this.skillReadout();
    if (skill) lines.push(skill);
    const openWonders = () => this.openStats(true);
    const wonder = wonderChip(this.s, this.me); // a wonder being raised or held (see ui/wonders)
    if (wonder) lines.push({ key: 'wonder', ...wonder, full: wonderHud(this.s, this.me, openWonders), onTap: openWonders });
    this.chips.set(lines);
    const dock = ui?.dock?.(view) ?? null;
    if (!dock) { this.mechDock?.remove(); this.mechDock = null; return; }
    if (!this.mechDock) {
      this.mechDock = h('button', { class: 'dock-btn dark' });
      this.bottom.insertBefore(this.mechDock, this.bottom.lastElementChild);
    }
    this.mechDock.onclick = () => dock.open();
    this.mechDock.replaceChildren(h('span', { class: 'round' }, iconEl(dock.icon as Parameters<typeof iconEl>[0])), h('span', { class: 'dock-label' }, dock.label));
  }

  /** The skill tree's passive states (surging Wildcards, Pax Romana, a fork's cost): a chip, and its full line. */
  private skillReadout(): HudLine | null {
    const s = this.s, me = this.me;
    const bits: string[] = [];
    const surging = surgingNodes(s, me).map((id) => TECH_BY_ID[id].name);
    if (surging.length) bits.push(`${surging.join(', ')} surging`);
    if (hasTech(s, me, 'rome:3')) bits.push(paxHolds(s, me) ? 'Pax Romana holds' : 'Pax Romana broken');
    if (hasTech(s, me, 'fork:mercenary')) bits.push('Mercenaries: growth halved');
    const chip = skillChip(s, me);
    return bits.length && chip ? { key: 'skill', ...chip, full: h('div', { class: 'skill-hud' }, bits.join(' · ')) } : null;
  }

  /** The most restless of my conquered cities, e.g. "Unrest in Kyoto 3/6 — garrison it" (tap to look at it). */
  private unrestHud(): HudLine | null {
    const worst = citiesOf(this.s, this.me).filter((c) => subject(this.s, c) && unrestLine(this.s, c) && (unrestOf(c) > 0))
      .sort((a, b) => Number(onBrink(b)) - Number(onBrink(a)) || unrestOf(b) - unrestOf(a))[0];
    if (!worst) return null;
    const line = unrestLine(this.s, worst)!.replace(/^Unrest /, `Unrest in ${worst.name} `);
    const look = () => { this.cam.glideTo(worst.x, worst.y, this.vw, this.vh * 0.9, 450); this.select({ x: worst.x, y: worst.y, mode: 'tile' }); };
    return { key: 'unrest', ...unrestChip(worst), full: h('div', { class: `unrest-hud${onBrink(worst) ? ' brink' : unrestOf(worst) >= UNREST_WARN ? ' hot' : ''}` }, line), onTap: look };
  }

  /** A still copy of the HUD with the current numbers (the live one counts up, so copying it mid-count shows stale values). */
  private hudSnapshot(): HTMLElement {
    const p = this.s.players[this.me];
    const turnText = this.s.maxTurns > 0 ? `${Math.min(this.s.turn, this.s.maxTurns)}/${this.s.maxTurns}` : String(this.s.turn);
    return h('div', { class: 'hud' },
      h('div', { class: 'hud-cell' }, h('div', { class: 'hud-label' }, 'Score'), h('div', { class: 'hud-val' }, score(this.s, this.me).toLocaleString())),
      h('div', { class: 'hud-cell' }, h('div', { class: 'hud-label' }, `Stars (+${income(this.s, this.me) + diploIncome(this.s, this.me) + fleetIncome(this.s, this.me)})`), h('div', { class: 'hud-val' }, iconEl('star', 'ico-star big'), String(p.stars))),
      h('div', { class: 'hud-cell' }, h('div', { class: 'hud-label' }, 'Turn'), h('div', { class: 'hud-val' }, turnText)),
    );
  }

  /** Tiles in my territory where a harvest, farm or mine can be bought right now. */
  private hudEls: { score: HTMLElement; starsLabel: HTMLElement; stars: HTMLElement; turn: HTMLElement; scoreBox: HTMLElement; starsBox: HTMLElement } | null = null;
  private counters = new WeakMap<HTMLElement, { value: number; raf: number }>();

  /** Animates a HUD number toward `target` and gives it a little pop. */
  private countTo(el: HTMLElement, box: HTMLElement, target: number, fmt: (v: number) => string) {
    const cur = this.counters.get(el);
    const from = cur?.value ?? target;
    if (cur?.raf) cancelAnimationFrame(cur.raf);
    if (from === target) {
      el.textContent = fmt(target);
      this.counters.set(el, { value: target, raf: 0 });
      return;
    }
    box.classList.remove('bump');
    void box.offsetWidth;
    box.classList.add('bump');
    const t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / 450);
      const v = Math.round(from + (target - from) * (1 - Math.pow(1 - k, 3)));
      el.textContent = fmt(v);
      this.counters.set(el, { value: v, raf: k < 1 ? requestAnimationFrame(step) : 0 });
    };
    step();
  }

  private harvestable() {
    const out = new Set<number>();
    if (!this.myTurn()) return out;
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
    const myTurn = this.myTurn();
    const allActs = myTurn ? tileActions(this.s, this.me, t) : [];

    if (sel.mode === 'unit' && u) {
      const d = def(u);
      const owner = this.s.players[u.owner];
      const status = u.owner === this.me
        ? u.moved && u.attacked ? 'Done for this turn.' : !u.moved ? (this.ov.moves.length ? 'Tap a blue ring to move.' : 'Ready to move.') : 'Can still attack.'
        : isRogueUnit(this.s, u) ? `A rebel of the Rogue State of ${cityById(this.s, u.data!.rogue as number)?.name ?? 'a lost city'}. It holds its ground and strikes any unit next to it at the end of each round.`
        : isNeutral(this.s, u.owner) ? `A wild beast that belongs to no one. It attacks any ship beside it at the end of each round; slay it for ${BEASTS[u.kind] ?? 0}★.`
          : `${TRIBES[owner.tribe].people} unit.`;
      const preview = this.previewLine(u);
      const hero = isHero(this.s, u) ? heroDef(this.s, u.owner) : null;
      const hs = hero ? owner.hero! : null;
      const stats = h('span', { class: 'stat-line' },
        h('span', {}, 'Attack ', h('b', {}, String(d.atk + seaBonus(this.s, u) + (hs ? HERO_ATK_PER_LEVEL * (hs.lvl - 1) : 0)))),
        h('span', {}, 'Defence ', h('b', {}, String(d.def)), defenseBonus(this.s, u) > 1 && u.owner === this.me ? h('span', { class: 'bonus' }, ` ×${defenseBonus(this.s, u)}`) : null),
        h('span', {}, 'Health ', h('b', {}, `${Math.ceil(u.hp)}/${maxHp(u)}`)),
        h('span', {}, 'Move ', h('b', {}, String(d.move + seaBonus(this.s, u)))),
        d.range > 1 ? h('span', {}, 'Range ', h('b', {}, String(d.range + perkRange(this.s, u)))) : null,
      );
      this.panel.append(close, h('div', { class: 'sheet-head' },
        h('div', { class: 'sheet-title' },
          isRogueUnit(this.s, u)
            ? h('span', { class: 'tribe-chip', style: { '--tc': REBEL_COLOR } as Record<string, string> }, 'Rebels')
            : isNeutral(this.s, u.owner)
            ? h('span', { class: 'tribe-chip', style: { '--tc': WILD_COLOR } as Record<string, string> }, 'Wild')
            : h('span', { class: 'tribe-chip', style: { '--tc': TRIBES[owner.tribe].color } as Record<string, string> }, TRIBES[owner.tribe].people),
          hero ? `★ ${hero.name}${u.carrying ? ' (at sea)' : ''}` : isTraderKind(u.kind) ? traderName(owner.tribe, u.kind) : isRoleKind(u.kind) ? roleName(owner.tribe, u.kind) : `${u.veteran ? '★ ' : ''}${d.name}${u.carrying ? ` (carrying ${isRoleKind(u.carrying) ? roleName(owner.tribe, u.carrying) : UNITS[u.carrying].name})` : ''}`),
        h('div', { class: 'sheet-desc' }, hero && hs ? this.heroLine(u.owner, hero, hs) : null, stats, h('br'), status, preview ? ` ${preview}` : null,
          u.owner === this.me && isTraderKind(u.kind) ? h('div', { class: 'small trade-preview' }, traderPreview(this.s, u)) : null, // the route yield preview (see game/trade)
          isRoleKind(u.kind) ? h('div', { class: 'small trade-preview' }, `${d.name}. ${u.owner === this.me ? rolePreview(this.s, u) : d.blurb}`) : null))); // what a role unit does (see game/roles)
      // empire actions on a unit's tile (launch, board...), camp bids, and this role unit's own actions (see game/roles)
      this.renderActions(allActs.filter((a) => UNIT_ACTIONS(a.id) || a.id.startsWith('mech:') || a.id.startsWith('wild:') || a.id.startsWith('wonder:') || roleParts(a.id)?.unit === u.id), p.tribe);
      return;
    }

    // a tile's menu: what can be done here, and the role units' actions aimed at this tile (see game/roles)
    const here = t.y * this.s.size + t.x;
    const tileActs = allActs.filter((a) => !UNIT_ACTIONS(a.id) && (!a.id.startsWith('role:') || roleParts(a.id)?.target === here));
    const city = t.cityId !== null ? cityById(this.s, t.cityId) : undefined;
    if (city) return this.cityPanel(city, close, head, tileActs);

    const { title, desc } = describeTile(this.s, t, this.me);
    this.panel.append(close, head(title, desc));
    this.renderActions(tileActs, p.tribe);
  }

  /** A hero's title, level, XP and ability with its cooldown (see game/heroes). */
  private heroLine(pid: number, d: ReturnType<typeof heroDef>, hs: NonNullable<GameState['players'][number]['hero']>) {
    const cd = cooldownLeft(this.s, pid);
    const xp = hs.lvl >= HERO_MAX_LEVEL ? 'max level' : `XP ${hs.xp}/${HERO_XP[hs.lvl + 1]}`;
    return h('span', { class: 'hero-line' },
      h('i', {}, d.title), ` · Level ${hs.lvl} (${xp})`, h('br'),
      h('b', {}, `${d.ability}: `), cd > 0 ? `ready in ${cd} turn${cd === 1 ? '' : 's'}. ` : 'ready! ', d.desc, h('br'));
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

  /** " · roads 5 (next bonus at 6) · linked to 2 cities" for the city panel. */
  private roadLine(city: City) {
    const net = roadNetwork(this.s, city);
    const next = ROAD_MILESTONES.find((m) => m.roads > net.roads);
    if (!net.roads && !net.linked.length && !hasTech(this.s, this.me, 'roads')) return '';
    return ` · roads ${net.roads}${next ? ` (+${next.pop} pop at ${next.roads})` : ''}${net.linked.length ? ` · linked to ${net.linked.length} ${net.linked.length === 1 ? 'city' : 'cities'}` : ''}`;
  }

  private cityPanel(city: City, close: Node, head: (title: string, ...desc: (Node | string | null)[]) => HTMLElement, acts: Action[]) {
    const owner = this.s.players[city.owner];
    const T = TRIBES[owner.tribe];
    const mine = city.owner === this.me;
    const info = mine
      ? `Level ${city.level} · population ${city.pop}/${popNeeded(city.level)} · +${cityIncome(this.s, city)}★ per turn · units ${city.units}/${unitCap(city)}${routesOfCity(this.s, city).length ? ` · trade routes ${routesOfCity(this.s, city).length}/${routesPerCity(city)}` : ''}${city.walls ? ' · walls' : ''}${this.roadLine(city)}`
      : isRogueCity(this.s, city) ? rogueDescribe(this.s, city)
      : `${T.people} city · level ${city.level}${city.walls ? ' · walls' : ''}`;
    // a conquered city's unrest, with what moves it (see game/rebels)
    const unrest = mine ? unrestLine(this.s, city) : null;
    const roles = this.roleCityLine(city); // a stationed Recruiter or Tax Collector, grand works, undermined walls (see game/roles)
    const unrestEl = unrest
      ? h('div', { class: `unrest-line${onBrink(city) ? ' brink' : unrestOf(city) >= UNREST_WARN ? ' hot' : ''}` }, unrest, h('span', { class: 'muted small' }, ` · ${unrestFactors(this.s, city).why.join(', ')}`))
      : null;
    this.panel.append(close, head(city.name, info, roles, unrestEl,
      mine && city.pendingRewards.length ? h('button', { class: 'mini-btn', onclick: () => this.checkRewards() }, 'Choose level-up reward') : null));
    if (mine) this.renderActions(acts, owner.tribe);
    else this.renderActions(acts.filter((a) => a.id.startsWith('mech:') || a.id.startsWith('role:')), this.s.players[this.me].tribe); // e.g. Mali's market flood, Sappers undermining it
  }

  /** The city panel's role-unit line: "Tax Collector: +3★ a turn", "Recruiter: units 1★ off, +1 slot, rally ready"... */
  private roleCityLine(city: City) {
    const s = this.s;
    const parts: string[] = [];
    const mine = city.owner === this.me;
    const post = postAt(s, city);
    const T = s.players[city.owner].tribe;
    if (post?.kind === 'recruiter') {
      const left = rallyLeft(s, city);
      parts.push(`${roleName(T, 'recruiter')} stationed: units ${RECRUIT_DISCOUNT}★ cheaper, +${RECRUIT_CAP} unit slot, Rally Militia ${left ? `in ${left} turn${left === 1 ? '' : 's'}` : 'ready (when foes are within 3)'}`);
    }
    if (post?.kind === 'collector' && mine) parts.push(`${roleName(T, 'collector')} stationed: +${cityTax(s, city)}★ a turn in taxes (included)`);
    const ups = upgradesOf(s, city);
    if (ups && mine) parts.push(`${ups} grand work${ups === 1 ? '' : 's'}: +${ups * UPGRADE_STARS}★ a turn`);
    if (minedLeft(s, city)) parts.push(`Undermined: walls and garrison bonus down for ${minedLeft(s, city)} turn${minedLeft(s, city) === 1 ? '' : 's'}`);
    if (city.data?.outpost) parts.push('An outpost founded by a Voyager');
    return parts.length ? h('div', { class: 'small role-line' }, parts.join(' · ')) : null;
  }

  private renderActions(acts: Action[], tribe: GameState['players'][number]['tribe']) {
    if (!acts.length) return;
    const row = h('div', { class: 'sheet-actions' });
    for (const a of acts) {
      const icon = paint(54, 54, (ctx) => drawIcon(ctx, a.icon, tribe, 27, 26), `icon:${a.icon}:${tribe}:54`);
      row.append(h('button', {
        class: `rbtn${a.enabled ? '' : ' off'}${a.needs ? ' locked' : ''}`,
        title: a.reason ?? a.desc,
        onclick: () => {
          // like Polytopia: an action waiting on a tech takes you to that tech in the tree
          if (a.needs) {
            sfx.play('tap');
            this.openTech(a.needs);
            return;
          }
          if (!a.enabled) {
            sfx.play('error');
            toast(a.reason ? `${a.label}: ${a.reason}` : a.desc);
            return;
          }
          const t = tileAt(this.s, this.sel!.x, this.sel!.y)!;
          if (a.id.startsWith('train:')) {
            sfx.play('train');
            this.burst(t.x, t.y, performance.now(), 10, ['#ffffff', '#e6e1d4'], 'puff', 45);
          } else if (a.id === 'road' || a.id.startsWith('upgrade:')) sfx.play('build');
          this.act(() => doAction(this.s, this.me, t, a.id));
          this.advanceHints();
          if (a.id.startsWith('train:')) this.select({ x: t.x, y: t.y, mode: 'tile' });
          this.checkRewards();
        },
      },
        h('span', { class: 'rbtn-circle' }, icon, a.cost > 0 ? h('span', { class: 'rbtn-cost' }, starSpan(a.cost)) : null,
          a.needs ? h('span', { class: 'rbtn-lock' }, iconEl('lock')) : null),
        h('span', { class: 'rbtn-label' }, a.label),
        a.needs ? h('span', { class: 'rbtn-need' }, TECH_BY_ID[a.needs].name) : null,
      ));
    }
    this.panel.append(row);
  }

  // ------------------------------------------------------------ events & rewards

  /**
   * Turns rule events into animations, floating numbers, particles and sounds. Attacks are
   * chained: each blow (and any retaliation) lands after the previous one.
   */
  private handleEvents(evs: GameEvent[]): { impact: number | null; end: number } {
    const now = performance.now();
    const fx = this.ov.fx;
    const seen = (x: number, y: number) => isExplored(this.s, this.me, x, y);
    const myColor = TRIBES[this.s.players[this.me].tribe].color;
    let cursor = now;
    let impact: number | null = null;
    let end = now;
    for (const e of evs) {
      switch (e.type) {
        case 'move': {
          const isWater = (p: { x: number; y: number }) => this.tileGround(p.x, p.y).water;
          const segs = e.path.length - 1;
          if (segs < 1) break;
          const seg = isWater(e.path[0]) && isWater(e.path[segs]) ? SAIL_MS : HOP_MS;
          const start = Math.max(impact ?? now, now);
          fx.moves.set(e.unitId, { path: e.path, t0: start, dur: seg * segs, before: e.before });
          const a = e.path[segs - 1], b = e.path[segs];
          const sdx = b.x - b.y - (a.x - a.y);
          if (sdx !== 0) fx.facing.set(e.unitId, sdx > 0 ? 1 : -1);
          if (!e.path.some((p) => seen(p.x, p.y))) break;
          for (let i = 1; i <= segs; i++) {
            const p = e.path[i];
            if (!seen(p.x, p.y)) continue;
            const at = start + seg * i;
            if (isWater(p)) {
              if (!isWater(e.path[i - 1])) {
                this.splash(p.x, p.y, at);
                this.sound('splash', at - now, e.owner);
              } else this.wake(p.x, p.y, at - seg * 0.5);
            } else {
              this.dust(p.x, p.y, at);
              this.sound('step', at - now, e.owner);
            }
          }
          end = Math.max(end, start + seg * segs);
          break;
        }
        case 'attack': {
          const sdx = e.to.x - e.to.y - (e.from.x - e.from.y);
          if (sdx !== 0) fx.facing.set(e.unitId, sdx > 0 ? 1 : -1);
          if (!seen(e.from.x, e.from.y) && !seen(e.to.x, e.to.y)) {
            impact = null;
            break;
          }
          const start = cursor;
          if (e.ranged) {
            const d = Math.max(Math.abs(e.from.x - e.to.x), Math.abs(e.from.y - e.to.y));
            const dur = 240 + d * 80;
            fx.projectiles.push({ fx: e.from.x, fy: e.from.y, tx: e.to.x, ty: e.to.y, t0: start, dur, kind: projectileFor(e.kind, this.s.players[e.player].tribe) });
            impact = start + dur;
          } else {
            fx.lunges.set(e.unitId, { tx: e.to.x, ty: e.to.y, t0: start });
            impact = start + LUNGE_MS * 0.5;
          }
          cursor = impact + 260;
          end = Math.max(end, cursor);
          this.sound('attack', start - now, e.player);
          break;
        }
        case 'damage': {
          if (!seen(e.x, e.y)) break;
          const at = impact ?? now;
          // numbers landing on the same tile together fan out sideways so they never overlap
          const stacked = fx.floaters.filter((f) => f.hit && f.x === e.x && f.y === e.y && Math.abs(f.t0 - at) < FLOAT_MS * 0.5).length;
          fx.floaters.push(damageFloater(e.amount, !!e.counter, e.crit, e.x, e.y, at, [0, 13, -13][stacked % 3]));
          fx.flashes.set(e.unitId, at);
          const hurt = this.s.units.find((u) => u.id === e.unitId);
          if (hurt) fx.hpHold.set(e.unitId, { hp: hurt.hp + e.amount, until: at });
          this.burst(e.x, e.y, at, e.crit ? 11 : 6, e.crit ? ['#ffffff', '#ffe14a', '#ff9a3a'] : ['#ffffff', '#ffd9a0'], 'square', e.crit ? 110 : 70);
          sfx.play(e.crit ? 'crit' : 'hit', at - now, e.counter ? 0.7 : 0.9);
          end = Math.max(end, at + FLASH_MS);
          break;
        }
        case 'death': {
          if (!seen(e.x, e.y)) break;
          const at = (impact ?? now) + 120;
          const tribe = this.s.players[e.owner].tribe;
          const big = isBigUnit(e.kind);
          // each empire falls its own way (cherry petals, ice shards, a burst of coins...); see render/combatfx
          const theme = deathTheme(tribe, e.kind, isNeutral(this.s, e.owner), !!e.captor);
          const c = tileCenter(e.x, e.y);
          fx.particles.push(...deathParticles(theme, c.x, c.y, at, big, Math.random));
          if (e.captor) {
            // taken alive by the Aztecs: led away to the captor on a rope rather than struck down
            fx.ghosts.push({ kind: e.kind, tribe, x: e.x, y: e.y, t0: at, facing: fx.facing.get(e.unitId) ?? 1, lead: e.captor, dur: CAPTIVE_MS });
            sfx.play('captive', at - now, 0.8);
            end = Math.max(end, at + CAPTIVE_MS * 0.6);
            break;
          }
          fx.ghosts.push({ kind: e.kind, tribe, x: e.x, y: e.y, t0: at, facing: fx.facing.get(e.unitId) ?? 1 });
          fx.shake = mergeShake(fx.shake, killShake(e.kind, at, REDUCED_MOTION), now);
          sfx.play(big ? 'bigkill' : 'kill', at - now, 0.85);
          end = Math.max(end, at + GHOST_MS * 0.6);
          break;
        }
        case 'harvest':
          if (e.player === this.me) {
            if (e.pop > 0) fx.floaters.push({ x: e.x, y: e.y, text: `+${e.pop}`, color: '#8cff8c', t0: now });
            this.burst(e.x, e.y, now, 8, ['#ffcf33'], 'star', 95);
            sfx.play(e.pop >= 2 || e.pop === 0 ? 'build' : 'harvest');
          }
          break;
        case 'toast':
          if (e.player === this.me) toast(e.text, myColor);
          break;
        case 'stars':
          if (e.player === this.me) {
            fx.floaters.push({ x: e.x, y: e.y, text: `+${e.amount}★`, color: '#ffd54a', t0: now });
            this.burst(e.x, e.y, now, 6, ['#ffcf33'], 'star', 80);
            sfx.play('stars');
          }
          break;
        case 'heal':
          if (seen(e.x, e.y)) {
            fx.floaters.push({ x: e.x, y: e.y, text: `+${e.amount}`, color: '#7cf07c', t0: now });
            this.burst(e.x, e.y, now, 10, ['#7cf07c', '#ffffff', '#b6ffb6'], 'puff', 40);
            sfx.play('harvest');
          }
          break;
        case 'ruin':
          if (e.player === this.me) {
            const { title, text } = e;
            const show = () => {
              if (this.destroyed) return;
              sfx.play('ruin');
              modal({ title, body: [h('p', {}, text)], art: paint(64, 56, (ctx) => drawIcon(ctx, 'flag', this.s.players[this.me].tribe, 32, 30), `icon:flag:${this.s.players[this.me].tribe}:64`) });
            };
            // open the card once the unit has landed on the ruins, not while it is still walking
            const wait = end - performance.now();
            if (wait > 30) window.setTimeout(show, wait);
            else show();
          }
          break;
        case 'capture': {
          const c = cityById(this.s, e.cityId)!;
          const color = TRIBES[this.s.players[e.player].tribe].color;
          if (seen(c.x, c.y)) {
            this.burst(c.x, c.y, now, 18, [color, '#ffcf33', '#ffffff'], 'square', 150);
            this.sound('capture', 0, e.player);
          }
          if (e.player === this.me) toast(e.from === null ? `${c.name} joins your empire!` : `You captured ${c.name}!`, myColor);
          else if (e.from === this.me) toast(`${c.name} has fallen to the ${TRIBES[this.s.players[e.player].tribe].people}s!`, '#ff5a5a');
          break;
        }
        case 'eliminated': {
          const who = TRIBES[this.s.players[e.player].tribe];
          if (e.player !== this.me) toast(`The ${who.name} has been destroyed.`, who.color);
          break;
        }
        case 'wonder': { // a World Wonder is finished: a card for everyone who knows the builder (see ui/wonders)
          const color = TRIBES[this.s.players[e.player].tribe].color;
          if (seen(e.x, e.y)) this.burst(e.x, e.y, now, 26, [color, '#ffcf33', '#ffffff'], 'star', 170);
          if (knows(this.s, this.me, e.player)) {
            const { player, id } = e;
            sfx.play('levelup');
            const show = () => { if (!this.destroyed) celebrateWonder(this.s, this.me, player, id); };
            const wait = end - performance.now();
            if (wait > 30) window.setTimeout(show, wait);
            else show();
          } else toast(`Far away, an unknown empire has completed the ${WONDER_BY_ID[e.id].name}.`, color);
          break;
        }
        case 'levelup':
          if (e.player === this.me) {
            const c = cityById(this.s, e.cityId)!;
            fx.floaters.push({ x: c.x, y: c.y, text: `Level ${e.level}!`, color: '#7cf07c', t0: now + 150 });
            this.burst(c.x, c.y, now + 150, 22, [myColor, '#ffcf33', '#ffffff', '#7cf07c'], 'square', 170);
            sfx.play('levelup', 150);
          }
          break;
      }
    }
    if (this.s.over) this.gameOver();
    return { impact, end };
  }

  /** Offers any pending level-up reward once the animations that caused it have played out. */
  private rewardsAfter(settle: number) {
    window.setTimeout(() => this.checkRewards(), Math.max(0, settle - performance.now()) + 60);
  }

  private rewardTimer = 0;
  private checkRewards() {
    if (this.rewardOpen || !this.myTurn() || this.destroyed || this.s.over) return;
    // let a card that is already open (a ruin's find, a message) be read first
    if (document.querySelector('#ui .modal-layer')) {
      window.clearTimeout(this.rewardTimer);
      this.rewardTimer = window.setTimeout(() => this.checkRewards(), 350);
      return;
    }
    // a conquered people's tradition to adopt comes first (see ui/culture)
    const offered = showCultureOffer(this.s, this.me, (from, id) => {
      sfx.play('build');
      this.rewardOpen = false;
      this.act(() => adopt(this.s, this.me, from, id));
      this.checkRewards();
    });
    if (offered) { this.rewardOpen = true; return; }
    const c = citiesOf(this.s, this.me).find((k) => k.pendingRewards.length);
    if (!c) return;
    this.rewardOpen = true;
    const level = c.pendingRewards[0];
    const tribe = this.s.players[this.me].tribe;
    const [a, b] = rewardOptions(level, tribe);
    const pick = (id: typeof a.id) => {
      sfx.play('build');
      this.rewardOpen = false;
      this.act(() => applyReward(this.s, c, id));
      this.checkRewards();
    };
    let close = () => {};
    const opt = (o: typeof a) => h('button', { class: 'rbtn big', onclick: () => { close(); pick(o.id); } },
      h('span', { class: 'rbtn-circle' }, paint(66, 66, (ctx) => drawIcon(ctx, o.id === 'giant' ? 'giant' : o.id, tribe, 33, 32), `reward:${o.id}:${tribe}`)),
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
    return [
      { title: 'Scout’s Guide 1/5', text: this.firstHint(cap), done: () => citiesOf(s, this.me).some((c) => c.pop > 0 || c.level > 1) },
      { title: 'Scout’s Guide 2/5', text: 'Tap your unit, then a glowing dot to move. Explore to find villages and ruins.', done: () => me.explored.filter(Boolean).length > 30 },
      { title: 'Scout’s Guide 3/5', text: 'Open the Tech Tree and research a new skill.', done: () => me.techs.length > 1 },
      { title: 'Scout’s Guide 4/5', text: 'Stand on a village and claim it next turn to found a new city.', done: () => citiesOf(s, this.me).length > 1 },
      { title: 'Scout’s Guide 5/5', text: 'Grow cities to level up and unlock rewards. Press End Turn when you are done.', done: () => s.turn > 3 },
    ];
  }

  /** The opening tip, fitted to what this empire can actually do with the resources around its capital. */
  private firstHint(cap: City | undefined) {
    const where = cap?.name ?? 'your capital';
    const names: Record<string, [string, string]> = {
      fruit: ['fruit', 'it'], animal: ['wild animals', 'them'], fish: ['fish', 'them'], crop: ['crops', 'them'], ore: ['ore', 'it'], whale: ['whales', 'them'],
    };
    const grow = ['harvest', 'farm', 'mine'];
    let locked: { res: string; pron: string; tech: string } | null = null;
    for (const t of this.s.tiles) {
      if (!cap || t.owner !== cap.id || !t.resource) continue;
      const a = tileActions(this.s, this.me, t).find((x) => grow.includes(x.id));
      if (!a) continue;
      const [name, pron] = names[t.resource];
      if (!a.needs) return `Tap the ${name} near ${where} and harvest ${pron} to grow your city.`;
      locked ??= { res: name, pron, tech: TECH_BY_ID[a.needs].name };
    }
    if (locked) return `The ${locked.res} near ${where} ${locked.pron === 'it' ? 'needs' : 'need'} ${locked.tech}. Tap ${locked.pron}, then the locked button to research ${locked.tech}.`;
    return `Nothing to harvest near ${where} yet: tap your unit, then a glowing dot, and go exploring.`;
  }

  private advanceHints() {
    const steps = this.hintSteps();
    while (this.s.hintStep < steps.length && steps[this.s.hintStep].done()) this.s.hintStep++;
    this.updateHint();
  }

  private updateHint() {
    const steps = this.hintSteps();
    const step = steps[this.s.hintStep];
    if (!this.settings.hints || this.hotseat || !step || !this.myTurn()) return this.hint.classList.add('hidden');
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
    this.s.log.push({ turn: this.s.turn, text: `welcome:${this.me}` });
    modal({
      title: 'Rise, Ruler!',
      art: unitPortrait(portraitKind(me.tribe), me.tribe, 80),
      body: [
        h('p', {}, `The ${T.people} people have placed their fate in your hands. Scout the land, grow your cities and stand firm against rival empires.`),
        h('p', {}, h('b', {}, 'Your gift: '), 'a treasury to start your reign.'),
      ],
      buttons: [{ label: h('span', { class: 'gift' }, String(me.stars), iconEl('star', 'ico-star big')), primary: true, onClick: () => { sfx.unlock(); sfx.play('stars'); this.updateHint(); this.checkRewards(); } }],
      cls: 'welcome',
    });
  }

  /** Starts the next human turn, handing the device over first when several people share it. */
  private startHumanTurn(initial = false) {
    if (this.s.over || this.destroyed) return;
    saveGame(this.s);
    const next = this.s.current;
    const humansAlive = this.s.players.filter((p) => p.human && p.alive).length;
    if (this.hotseat && humansAlive > 1) return this.showPassScreen(next);
    this.beginTurnFor(next, !initial);
  }

  private showPassScreen(pid: number) {
    const p = this.s.players[pid];
    const T = TRIBES[p.tribe];
    this.select(null);
    const layer = h('div', { class: 'pass-screen', style: { '--tc': T.color } as Record<string, string> },
      h('div', { class: 'pass-card' },
        h('span', { class: 'pass-portrait' }, unitPortrait(portraitKind(p.tribe), p.tribe, 110)),
        h('div', { class: 'pass-kicker' }, `Turn ${this.s.turn}${this.s.maxTurns > 0 ? ` of ${this.s.maxTurns}` : ''}`),
        h('h2', {}, `${T.people} turn`),
        h('p', {}, `Pass the device to whoever leads the ${T.name}.`),
        h('button', { class: 'pill', onclick: () => { sfx.unlock(); layer.remove(); this.beginTurnFor(pid, true); } }, 'START TURN'),
      ));
    $ui().append(layer);
  }

  private beginTurnFor(pid: number, chime: boolean) {
    const switched = pid !== this.me;
    this.me = pid;
    music.play(this.s.players[pid].tribe);
    this.select(null);
    if (switched || this.hotseat) {
      const cap = citiesOf(this.s, pid).find((c) => c.capital) ?? citiesOf(this.s, pid)[0];
      if (cap) this.cam.centerOn(cap.x, cap.y, this.vw, this.vh * 0.95);
    }
    this.version++;
    this.refresh();
    if (chime) sfx.play('turn');
    if (this.hotseat && diploOn(this.s)) { // news about me that broke while another player held the device (see game/diplomacy)
      const mine = TRIBES[this.s.players[pid].tribe].people;
      for (const n of diploNews(this.s, pid, 4).reverse()) if (n.turn >= this.s.turn - 1 && n.text.includes(mine)) toast(n.text, TRIBES[this.s.players[pid].tribe].color);
    }
    const welcomed = this.s.log.some((l) => l.text === `welcome:${pid}` || (l.text === 'welcome' && pid === this.s.players.findIndex((q) => q.human)));
    if (!welcomed) this.welcome();
    else {
      this.advanceHints();
      this.checkOffers();
      this.checkRewards();
    }
  }

  /** Envoys waiting for me (proposals, demands, calls to arms; see game/diplomacy): one card at a time. */
  private checkOffers() {
    if (!this.myTurn() || this.destroyed || this.s.over) return;
    const o = offersFor(this.s, this.me)[0];
    if (!o) return;
    showOffer(this.s, o, (yes) => {
      sfx.play(yes ? 'build' : 'endturn');
      this.act(() => answer(this.s, o.id, yes));
      this.checkOffers();
    });
  }

  /** My units that could still move or strike this turn but have done neither. */
  private idleUnits() {
    return this.s.units
      .filter((u) => u.owner === this.me && !u.moved && !u.attacked && u.kind !== 'explorer' && (moveOptions(this.s, u).length > 0 || attackOptions(this.s, u).length > 0))
      .sort((a, b) => a.y - b.y || a.x - b.x);
  }

  /** Ask before ending the turn while some units haven't moved: list them, and jump to one on tap. */
  private confirmEndTurn(idle: Unit[]) {
    const where = (u: Unit) => {
      const near = citiesOf(this.s, this.me).sort((a, b) => Math.abs(a.x - u.x) + Math.abs(a.y - u.y) - (Math.abs(b.x - u.x) + Math.abs(b.y - u.y)))[0];
      return near ? `near ${near.name}` : `at ${u.x},${u.y}`;
    };
    const goTo = (u: Unit) => {
      close();
      this.cam.glideTo(u.x, u.y, this.vw, this.vh * 0.85, 450);
      this.select({ x: u.x, y: u.y, mode: 'unit' });
    };
    const rows = idle.slice(0, 8).map((u) => h('button', { class: 'idle-row', onclick: () => goTo(u) },
      h('b', {}, `${u.veteran ? '★ ' : ''}${UNITS[u.kind].name}`),
      h('span', {}, where(u)),
      attackOptions(this.s, u).length ? h('em', {}, 'can attack') : null));
    const close = modal({
      title: idle.length === 1 ? '1 unit hasn’t moved' : `${idle.length} units haven’t moved`,
      body: [h('p', {}, 'Tap one to go to it, or end your turn anyway.'), h('div', { class: 'idle-list' }, ...rows), idle.length > 8 ? h('p', {}, `…and ${idle.length - 8} more.`) : ''],
      buttons: [
        { label: 'Show me', primary: true, onClick: () => goTo(idle[0]) },
        { label: 'End turn anyway', onClick: () => void this.onEndTurn(true) },
      ],
      dismissable: true,
    });
  }

  private async onEndTurn(force = false) {
    if (this.busy || !this.myTurn()) return;
    if (!force) {
      const idle = this.idleUnits();
      if (idle.length) return this.confirmEndTurn(idle);
    }
    this.select(null);
    sfx.play('endturn');
    endTurn(this.s);
    this.handleEvents(drain());
    this.refresh();
    if (isHumanTurn(this.s)) this.startHumanTurn();
    else await this.runRivals();
  }

  private async runRivals() {
    this.busy = true;
    this.refresh();
    const fast = this.settings.fastAi;
    let steps = 0;
    let quiet = 0;
    while (!this.s.over && !isHumanTurn(this.s) && !this.destroyed) {
      const p = this.s.players[this.s.current];
      const T = TRIBES[p.tribe];
      this.banner.classList.remove('hidden');
      this.banner.style.setProperty('--tc', T.color);
      this.banner.textContent = `${T.people} turn…`;
      let acted = false;
      const settle = this.act(() => (acted = aiStep(this.s)), true);
      if (!acted) {
        endTurn(this.s);
        this.handleEvents(drain());
        this.refresh();
        await sleep(fast ? 0 : 120);
        continue;
      }
      steps++;
      // wait only for what is on screen (briefly); everything else plays out without holding the turn up
      const visible = settle - performance.now() > 5 && this.onScreen(this.lastEvents);
      if (!fast && visible) await sleep(Math.min(450, settle - performance.now()));
      else if (++quiet % 8 === 0) await sleep(0);
    }
    this.banner.classList.add('hidden');
    this.busy = false;
    if (this.destroyed) return;
    this.refresh();
    if (!this.s.over) this.startHumanTurn();
  }

  private gameOverShown = false;
  private gameOver() {
    if (this.gameOverShown) return;
    this.gameOverShown = true;
    const s = this.s;
    const ranking = empires(s).map((p) => ({ p, sc: score(s, p.id) })).sort((a, b) => b.sc - a.sc);
    const me = this.hotseat ? ranking.find((r) => r.p.human)!.p : s.players[this.me];
    const won = s.winner === me.id || !!s.diplo?.victors?.includes(me.id); // allies who win Domination together (see game/diplomacy)
    addScore({ score: score(s, me.id), tribe: me.tribe, won, mode: s.mode, turns: s.turn, date: new Date().toLocaleDateString() });
    clearSave();
    const winner = s.winner !== null ? s.players[s.winner] : null;
    const title = this.hotseat
      ? winner?.human ? `${TRIBES[winner.tribe].people} win!` : 'The Age Ends'
      : won ? 'Glorious Victory!' : me.alive ? 'The Age Ends' : 'Your Empire Has Fallen';
    modal({
      title,
      art: unitPortrait(portraitKind(me.tribe), me.tribe, 80),
      body: [
        h('p', {}, s.diplo?.victors ? `The alliance of the ${s.diplo.victors.map((id) => TRIBES[s.players[id].tribe].people).join(', ')} peoples rules the world together.`
          : won ? `The ${TRIBES[me.tribe].name} stands above all others.` : `The ${TRIBES[ranking[0].p.tribe].name} takes the crown this time.`),
        h('ol', { class: 'rank' }, ...ranking.map((r) => h('li', { style: { color: TRIBES[r.p.tribe].color } }, `${TRIBES[r.p.tribe].people}${r.p.human ? (this.hotseat ? ' (player)' : ' (you)') : ''} — ${r.sc.toLocaleString()}${r.p.alive ? '' : ' ✝'}`))),
      ],
      buttons: [
        { label: 'Main Menu', onClick: () => this.onExit('title') },
        { label: 'Play Again', primary: true, onClick: () => this.onExit('new') },
      ],
    });
  }

  // ------------------------------------------------------------ menus

  private openMenu() {
    const onOff = (name: string, on: boolean) => `${name}: ${on ? 'On' : 'Off'}`;
    const hintsLabel = h('span', {}, onOff('Hints', this.settings.hints));
    const soundLabel = h('span', {}, onOff('Sound', this.settings.sound));
    const musicLabel = h('span', {}, onOff('Music', this.settings.music));
    const SHARP = [[1, 'Auto'], [4, 'High'], [5, 'Max']] as const;
    const sharpText = () => `Sharpness: ${SHARP.find(([v]) => v === this.settings.sharp)?.[1] ?? 'Auto'}`;
    const sharpLabel = h('span', {}, sharpText());
    const directText = () => `Map drawing: ${this.settings.cached ? 'Cached' : 'Direct'}`;
    const directLabel = h('span', {}, directText());
    const artText = () => `Art style: ${this.settings.flat ? 'Crisp' : 'Soft'}`;
    const artLabel = h('span', {}, artText());
    const buildLabel = h('span', {}, onOff('Build info', !!this.settings.buildInfo));
    modal({
      title: 'Menu',
      body: [
        h('p', { class: 'muted' }, 'Your game is saved automatically every turn.'),
        h('p', { class: 'muted small build' }, `Tessera v${__APP_VERSION__.replace(/\.0$/, '')} · drawn at ${+this.dpr.toFixed(2)}× (${this.canvas.width}×${this.canvas.height})`),
      ],
      dismissable: true,
      buttons: [
        { label: 'Resume', primary: true },
        // toggles flip in place and keep the menu open
        { label: hintsLabel, keepOpen: true, onClick: () => { this.settings.hints = !this.settings.hints; saveSettings(this.settings); this.updateHint(); hintsLabel.textContent = onOff('Hints', this.settings.hints); } },
        { label: soundLabel, keepOpen: true, onClick: () => { this.settings.sound = !this.settings.sound; sfx.enabled = this.settings.sound; saveSettings(this.settings); soundLabel.textContent = onOff('Sound', this.settings.sound); } },
        { label: musicLabel, keepOpen: true, onClick: () => { this.settings.music = !this.settings.music; music.setEnabled(this.settings.music); if (this.settings.music) music.play(this.s.players[this.me].tribe); saveSettings(this.settings); musicLabel.textContent = onOff('Music', this.settings.music); } },
        { label: sharpLabel, keepOpen: true, onClick: () => {
          const i = SHARP.findIndex(([v]) => v === this.settings.sharp);
          this.settings.sharp = SHARP[(i + 1) % SHARP.length][0];
          saveSettings(this.settings);
          setSharpness(this.settings.sharp); // the game loop notices the new density and redraws
          sharpLabel.textContent = sharpText();
        } },
        { label: artLabel, keepOpen: true, onClick: () => {
          this.settings.flat = !this.settings.flat;
          saveSettings(this.settings);
          setCrispArt(this.settings.flat);
          clearSpriteCache();
          this.version++; // redraw the whole map in the new style
          artLabel.textContent = artText();
        } },
        { label: directLabel, keepOpen: true, onClick: () => {
          this.settings.cached = !this.settings.cached;
          saveSettings(this.settings);
          setDirectDraw(!this.settings.cached);
          this.version++;
          directLabel.textContent = directText();
        } },
        { label: buildLabel, keepOpen: true, onClick: () => {
          this.settings.buildInfo = !this.settings.buildInfo;
          saveSettings(this.settings);
          this.buildTag.parentElement?.classList.toggle('show-build', this.settings.buildInfo);
          buildLabel.textContent = onOff('Build info', this.settings.buildInfo);
        } },
        { label: 'Sharpness picker', onClick: () => this.showDisplayPicker() },
        { label: 'Sharpness test', onClick: () => showSharpnessTest() },
        { label: 'Center on capital', onClick: () => { const c = citiesOf(this.s, this.me).find((k) => k.capital) ?? citiesOf(this.s, this.me)[0]; if (c) this.cam.glideTo(c.x, c.y, this.vw, this.vh * 0.95); } },
        { label: 'Quit to title', onClick: () => { if (!this.s.over) saveGame(this.s); this.onExit('title'); } },
      ],
      cls: 'menu',
    });
  }

  /** The Empires screen, with a Wonders tab (see ui/wonders); `wonders` opens that tab. */
  private openStats(wonders = false) {
    const s = this.s;
    const rows = empires(s).map((p) => {
      const known = p.id === this.me || (s.players[this.me].met ?? []).includes(p.id) || s.cities.some((c) => c.owner === p.id && isExplored(s, this.me, c.x, c.y));
      const T = TRIBES[p.tribe];
      return h('div', { class: 'stat-row', style: { '--tc': T.color } as Record<string, string> },
        known ? unitPortrait(portraitKind(p.tribe), p.tribe, 44) : h('div', { class: 'stat-unknown' }, '?'),
        h('div', {},
          h('b', {}, known ? `${T.people}${p.id === this.me ? ' (you)' : ''}` : 'Unknown empire'),
          known ? h('span', { class: 'type-badge', title: categoryOf(p.tribe).blurb }, `${categoryOf(p.tribe).icon} ${categoryOf(p.tribe).name}`) : null,
          h('div', { class: 'muted small' }, !p.alive ? 'Destroyed' : known ? `${score(s, p.id).toLocaleString()} pts · ${citiesOf(s, p.id).length} cities · ${p.techs.length} techs` : 'Not yet met'),
          diploOn(s) && p.alive && p.id !== this.me && (s.players[this.me].met ?? []).includes(p.id)
            ? h('div', { class: 'small' }, `${{ war: 'At war', peace: 'At peace', alliance: 'Allied' }[relation(s, this.me, p.id)]} · they feel ${opinionWord(opinion(s, p.id, this.me))}`) : null,
          known ? adoptedLines(s, p.id) : null,
          p.id === this.me && offersOf(s, this.me).length && this.myTurn()
            ? h('button', { class: 'mini-btn', onclick: () => { close(); this.checkRewards(); } }, 'Adopt a conquered tradition') : null,
        ),
      );
    });
    const list = h('div', {});
    const tab = (label: string, show: () => Node[]) => h('button', { class: 'stats-tab', onclick: (ev: Event) => {
      tabs.querySelectorAll('.stats-tab').forEach((b) => b.classList.toggle('on', b === ev.currentTarget));
      list.replaceChildren(...show());
    } }, label);
    const go = (x: number, y: number) => { close(); this.cam.glideTo(x, y, this.vw, this.vh * 0.9, 450); this.select({ x, y, mode: 'tile' }); };
    const tabs = h('div', { class: 'stats-tabs' }, tab('Empires', () => rows), tab('Wonders', () => [wondersList(s, this.me, go)]), tab(`Trade${routeIncome(s, this.me) ? ` +${routeIncome(s, this.me)}★` : ''}`, () => [tradeList(s, this.me, go)]));
    (tabs.children[wonders ? 1 : 0] as HTMLElement).classList.add('on');
    list.replaceChildren(...(wonders ? [wondersList(s, this.me, go)] : rows));
    const diplo = diploOn(s) ? h('button', { class: 'mini-btn diplo-open', onclick: () => { close(); this.openDiplomacy(); } }, 'Diplomacy: treaties, trade & tribute') : null;
    const close = modal({ title: 'Empires', body: diplo ? [diplo, tabs, list] : [tabs, list], dismissable: true, cls: 'stats' });
  }

  /** The Diplomacy screen (see ui/diplomacy): treaties, trade, tribute and war with the empires I have met. */
  private openDiplomacy() {
    showDiplomacy({
      s: this.s, me: this.me,
      canAct: () => this.myTurn() && !this.busy,
      act: (fn) => { this.act(fn); },
    });
  }

  /** Opens the tech tree; with `focus`, that tech is highlighted and its research card opened. */
  private openTech(focus?: string) {
    if (this.busy) return;
    showTechTree(this.s, this.me, () => this.hudSnapshot(), () => {
      sfx.play('research');
      this.refresh();
      this.advanceHints();
      saveGame(this.s);
    }, () => this.refresh(), focus);
  }
}

function describeTile(s: GameState, t: Tile, viewer: number): { title: string; desc: string } {
  const wild = wildDescribe(s, t, viewer); // camps, volcanoes and lava (see game/wild)
  if (wild) return wild;
  const wonder = wonderDescribe(s, t, viewer); // a World Wonder standing or rising (see game/wonders)
  if (wonder) return wonder;
  const d = describePlainTile(s, t, viewer);
  const ash = isAsh(t) ? ` ${ASH_NOTE}` : '';
  const trails = liveRoutes(s).filter((r) => r.path.includes(t.y * s.size + t.x) && t.cityId === null); // a trade trail runs here (see game/trade)
  const trade = trails.length ? ` Trade route: ${trails.map((r) => `${cityById(s, r.a)?.name} ⇄ ${cityById(s, r.b)?.name}`).join(', ')}. An enemy unit standing here can pillage it.` : '';
  return ash || trade ? { title: d.title, desc: `${d.desc}${ash}${trade}` } : d;
}

function describePlainTile(s: GameState, t: Tile, viewer: number): { title: string; desc: string } {
  const owner = tileOwnerPlayer(s, t);
  const land = owner === null ? 'Unclaimed land.' : isNeutral(s, owner) ? `Rogue State territory (${cityById(s, t.owner)!.name}).` : `${TRIBES[s.players[owner].tribe].people} territory (${cityById(s, t.owner)!.name}).`;
  // treaty borders (see game/diplomacy): a peace partner's land is closed, an ally's open
  const rel = owner !== null && owner !== viewer && diploOn(s) && !isNeutral(s, owner) ? relation(s, viewer, owner) : 'war';
  const where = rel === 'peace' ? `${land} Peace treaty: closed to your units.` : rel === 'alliance' ? `${land} Allied: open to your units.` : land;
  const terrain: Record<Tile['terrain'], string> = { field: 'Field', forest: 'Forest', mountain: 'Mountain', shallow: 'Shallow Water', ocean: 'Ocean', desert: 'Desert', swamp: 'Swamp', tundra: 'Tundra', ice: 'Ice', platform: 'Floating Platform', bridge: 'Bridge' };
  const res: Record<string, [string, string]> = {
    fruit: ['Wild Fruit', 'Harvest with Gathering.'],
    crop: ['Crops', 'Farm with Farming.'],
    animal: ['Wild Animals', 'Hunt with Hunting.'],
    fish: ['Fish', 'Catch with Fishing.'],
    ore: ['Ore', 'Mine with Mining.'],
    whale: ['Whales', 'Hunt with Whaling.'],
  };
  const imp: Record<string, string> = { farm: 'Farm', mine: 'Mine', lumber: 'Lumber Hut', port: 'Port', temple: 'Shrine', market: 'Market', songline: 'Songline Track', fort: 'Castra' };
  // the role units' works (see game/roles): a Sappers' fort, a Master Builder's grand work, a bridge
  if (isSapperFort(t)) return { title: 'Fort', desc: `Raised by ${TRIBES[s.players[t.data!.sfort as number].tribe].people} sappers: their units here defend +1. ${where}` };
  if (upgradeName(t)) return { title: upgradeName(t)!, desc: `A grand ${imp[t.improvement!]?.toLowerCase() ?? 'work'} raised by a Master Builder: +${UPGRADE_STARS}★ a turn to its city. ${terrain[t.terrain]}. ${where}` };
  if (t.terrain === 'bridge') return { title: 'Bridge', desc: `A wooden bridge over the shallows: land units walk over it (a road); ships can no longer pass. ${where}` };
  if (t.village) return { title: 'Village', desc: 'Move a unit here, then claim it next turn to found a city.' };
  if (t.ruin) return { title: 'Ancient Ruins', desc: 'Step on them to discover what was left behind.' };
  if (t.improvement && (t.improvement !== 'songline' || s.players[viewer]?.tribe === 'aboriginal')) { // Songlines are secret
    const title = t.improvement === 'temple' ? (t.terrain === 'field' ? 'Temple' : t.terrain === 'forest' ? 'Grove Shrine' : 'Mountain Shrine') : imp[t.improvement];
    return { title, desc: `${terrain[t.terrain]}. ${where}` };
  }
  if (t.resource) return { title: `${res[t.resource][0]}`, desc: `${res[t.resource][1]} ${where}` };
  const extra = t.terrain === 'mountain' && !hasTech(s, viewer, 'climbing') ? ` Needs ${TECH_BY_ID.climbing.name} to enter.`
    : t.terrain === 'ocean' && !hasTech(s, viewer, 'sailing') ? ' Needs a Galley (Sailing) to cross.' : '';
  const climate = isClimate(t.terrain) ? ` ${CLIMATE_INFO[t.terrain].blurb}` : '';
  return { title: terrain[t.terrain] + (t.road ? ' (road)' : ''), desc: `${where}${extra}${climate}` };
}

function projectileFor(kind: UnitKind, tribe: TribeId): Fx['projectiles'][number]['kind'] {
  if (kind === 'catapult') return ({ egypt: 'bolt', pirates: 'ball', greeks: 'bolt' } as Partial<Record<TribeId, 'bolt' | 'ball'>>)[tribe] ?? 'stone';
  if (kind === 'warship') return tribe === 'pirates' ? 'ball' : 'stone';
  if (kind === 'buccaneer') return 'shot';
  return 'arrow';
}
