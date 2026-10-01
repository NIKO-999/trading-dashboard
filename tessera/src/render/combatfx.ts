// Combat feedback that is pure data and maths (no canvas), so the tests can check it: each empire's death
// effect, the particles it throws, a kill's screen shake and how a damage number pops and floats.
import { TRIBE_IDS } from '../data/tribes';
import { UNITS } from '../data/units';
import type { TribeId, UnitKind } from '../game/types';
import type { Fx, Particle, ParticleShape } from './common';

/** Whose death effect plays: an empire's, a Great Beast's, a Rogue State's, or a captive led away (Aztec). */
export type DeathTheme = TribeId | 'beast' | 'rebel' | 'captive';

/**
 * One handful of particles. `spread`: 'up' flies up out of the body, 'round' bursts every way,
 * 'ground' rolls out along the ground from the feet. `sway` makes light things flutter sideways.
 */
interface Layer { n: number; colors: string[]; shape: ParticleShape; speed: number; g: number; life: number; size: number; spread: 'up' | 'round' | 'ground'; sway?: number }
export interface DeathStyle { name: string; layers: Layer[] }

const L = (shape: ParticleShape, n: number, colors: string[], spread: Layer['spread'], speed: number, g: number, life: number, size: number, sway = 0): Layer =>
  ({ shape, n, colors, spread, speed, g, life, size, sway });
const DUST = ['#d9c9a6', '#c4b28c'];

/** Every empire's own short death effect (the look of the one who falls), plus beasts, rebels and captives. */
export const DEATH_STYLES: Record<DeathTheme, DeathStyle> = {
  egypt: { name: 'Sand and golden ankhs', layers: [L('puff', 6, ['#e2c98a', '#d1b26c'], 'ground', 26, -8, 0.7, 3.4), L('ankh', 3, ['#ffd34a'], 'up', 70, 110, 0.8, 4.2)] },
  aztec: { name: 'Obsidian and marigolds', layers: [L('shard', 5, ['#2a2433', '#4b3f5e'], 'up', 85, 260, 0.6, 3.4), L('petal', 5, ['#ff9f1c', '#ffc233'], 'up', 55, 40, 0.9, 3, 5)] },
  polynesia: { name: 'Hibiscus and sea spray', layers: [L('petal', 5, ['#ff5a6e', '#ffd0d6'], 'up', 55, 40, 0.9, 3.2, 5), L('drop', 5, ['#e9fbff'], 'up', 80, 300, 0.5, 1.6)] },
  rome: { name: 'Laurel and bronze', layers: [L('leaf', 5, ['#5f8a3a', '#7fa84c'], 'up', 55, 50, 0.9, 3.4, 4), L('square', 4, ['#c8923a', '#e0b060'], 'up', 85, 260, 0.6, 2.6)] },
  pirates: { name: 'A burst of coins', layers: [L('coin', 8, ['#ffd34a', '#e8b02a'], 'up', 100, 320, 0.7, 3.2), L('puff', 3, ['#bdb6a6'], 'ground', 20, -10, 0.6, 3.4)] },
  vikings: { name: 'Splash and shield shards', layers: [L('ring', 1, ['rgba(255,255,255,0.8)'], 'ground', 0, 0, 0.6, 4), L('drop', 6, ['#d7f3ff', '#ffffff'], 'up', 90, 320, 0.55, 1.8), L('shard', 5, ['#a0612f', '#c8c8d0', '#8a2a24'], 'up', 80, 280, 0.65, 3.6)] },
  japan: { name: 'Cherry petals', layers: [L('petal', 10, ['#ffc4d6', '#ffe3ec', '#ff9ab8'], 'round', 45, 18, 1.1, 3, 7)] },
  mongols: { name: 'Steppe dust and blue silk', layers: [L('puff', 5, ['#cdb88f', '#b8a276'], 'ground', 30, -8, 0.7, 3.4), L('leaf', 3, ['#4a90d9', '#8fc1f0'], 'up', 55, 30, 1, 3.6, 6)] },
  greeks: { name: 'Marble shards and olive leaves', layers: [L('shard', 5, ['#f2efe6', '#d8d3c4'], 'up', 85, 280, 0.6, 3.4), L('leaf', 3, ['#8a9a5b', '#a9b774'], 'up', 50, 40, 0.9, 3, 4)] },
  zulu: { name: 'A cloud of red dust', layers: [L('puff', 9, ['#c79a6a', '#b0855a', '#d9b88f'], 'ground', 34, -14, 0.8, 4), L('square', 3, ['#7a5230'], 'up', 70, 300, 0.5, 2.2)] },
  persia: { name: 'Rose petals and gold', layers: [L('petal', 6, ['#c2185b', '#e84b7a'], 'up', 55, 35, 0.95, 3.2, 5), L('star', 2, ['#ffcf33'], 'up', 60, 120, 0.7, 3)] },
  celts: { name: 'Whirling leaves', layers: [L('leaf', 9, ['#4f8a3c', '#8fb24a', '#c9a13a'], 'round', 48, 22, 1.05, 3.4, 6)] },
  inuit: { name: 'Ice shards', layers: [L('shard', 8, ['#e6f7ff', '#a8dcf0', '#ffffff'], 'up', 95, 300, 0.6, 3.6), L('puff', 3, ['#f4fbff'], 'ground', 22, -6, 0.6, 3)] },
  inca: { name: 'Sparks of sun-gold', layers: [L('star', 4, ['#ffcf33'], 'up', 75, 140, 0.75, 3.2), L('square', 4, ['#e8a33a', '#ffdd70'], 'round', 60, 120, 0.65, 2.4)] },
  ethiopia: { name: 'Incense smoke and embers', layers: [L('puff', 5, ['#d9d1c4', '#c4bba9'], 'up', 22, -40, 0.9, 3.2), L('square', 5, ['#ff8a2a', '#ffc24a'], 'up', 65, 90, 0.7, 1.8)] },
  aboriginal: { name: 'Ochre dots', layers: [L('drop', 10, ['#c1440e', '#f2e8d5', '#e8a33a'], 'round', 55, 60, 0.8, 1.7)] },
  china: { name: 'Firecrackers', layers: [L('square', 5, ['#d62828', '#b01e1e'], 'round', 90, 200, 0.6, 2.8), L('star', 3, ['#ffcf33'], 'round', 70, 60, 0.5, 2.8), L('puff', 2, ['#aaa49a'], 'up', 18, -20, 0.8, 3.4)] },
  india: { name: 'A cloud of coloured powder', layers: [L('puff', 8, ['#ff4fa3', '#ffcc00', '#3ec1d3', '#7ac943'], 'round', 34, -6, 0.85, 3.6)] },
  mali: { name: 'Gold dust', layers: [L('square', 10, ['#ffd34a', '#e0a526'], 'up', 75, 160, 0.75, 1.6), L('puff', 3, ['#d9bf7a'], 'ground', 22, -8, 0.6, 3.2)] },
  lakota: { name: 'Drifting feathers', layers: [L('feather', 6, ['#f5f0e6', '#2b2b2b', '#b5452a'], 'up', 50, 25, 1.1, 4.4, 6), L('puff', 3, DUST, 'ground', 22, -8, 0.6, 3.2)] },
  ottoman: { name: 'Tulip petals', layers: [L('petal', 8, ['#d7263d', '#f46036', '#ffd1dc'], 'up', 55, 35, 1, 3.2, 6)] },
  maya: { name: 'Jade shards', layers: [L('shard', 8, ['#2aa876', '#7fd6b0', '#1c6e55'], 'up', 90, 290, 0.6, 3.4)] },
  korea: { name: 'Celadon shards and magnolia', layers: [L('shard', 6, ['#9cc9b4', '#c8e3d4'], 'up', 85, 280, 0.6, 3.4), L('petal', 3, ['#fffaf0'], 'up', 45, 30, 0.9, 3.2, 5)] },
  khmer: { name: 'Lotus petals', layers: [L('petal', 8, ['#ff9ec4', '#ffffff', '#f7c6dc'], 'round', 45, 20, 1, 3.4, 5), L('drop', 3, ['#e9fbff'], 'up', 60, 280, 0.45, 1.5)] },
  swahili: { name: 'Cowrie shells and spray', layers: [L('coin', 5, ['#fff3dc', '#f0dcb8'], 'up', 80, 280, 0.65, 2.8), L('drop', 4, ['#bff0f0'], 'up', 80, 300, 0.5, 1.6)] },
  tibet: { name: 'Prayer-flag scraps', layers: [L('square', 10, ['#2d6cdf', '#ffffff', '#d62828', '#2aa84a', '#ffd34a'], 'up', 55, 30, 1.1, 3, 6)] },
  carthage: { name: 'Purple dye and silver shekels', layers: [L('drop', 6, ['#5a1e6e', '#8a3aa8'], 'up', 70, 280, 0.6, 2), L('coin', 4, ['#d8dce0', '#b8bcc4'], 'up', 75, 260, 0.6, 2.6)] },
  byzantium: { name: 'Mosaic tesserae', layers: [L('square', 10, ['#d4a62a', '#2f7a3a', '#1a5aa8', '#f4efe0'], 'up', 80, 260, 0.65, 2.2)] },
  arabia: { name: 'Sand and rose petals', layers: [L('puff', 6, ['#e6cf96', '#d8b878'], 'ground', 30, -8, 0.7, 3.4), L('petal', 4, ['#e85a7a', '#f7c6d0'], 'up', 50, 30, 1, 3.2, 5)] },
  rus: { name: 'Snow and birch bark', layers: [L('puff', 6, ['#ffffff', '#e4eef6'], 'round', 40, -10, 0.9, 3.2), L('shard', 4, ['#f4f0e6', '#2a2a2a'], 'up', 70, 260, 0.6, 2.6)] },
  vietnam: { name: 'Lotus petals and bamboo leaves', layers: [L('petal', 6, ['#f08aa8', '#ffd1e0'], 'up', 50, 30, 1, 3.2, 5), L('feather', 4, ['#6ab04a', '#3a8a3a'], 'up', 55, 25, 1, 4, 6)] },
  babylon: { name: 'Lapis tiles and clay shards', layers: [L('square', 8, ['#2a3fd0', '#4a6af0', '#e8c060'], 'up', 80, 260, 0.65, 2.2), L('shard', 4, ['#c8a070', '#a8845a'], 'up', 70, 260, 0.6, 2.6)] },
  nubia: { name: 'Iron sparks and red sand', layers: [L('star', 6, ['#ffb03a', '#ff7a1a'], 'round', 80, 120, 0.5, 2.4), L('puff', 4, ['#c8784a', '#b0603a'], 'ground', 26, -8, 0.7, 3.2)] },
  majapahit: { name: 'Cloves and frangipani', layers: [L('petal', 6, ['#fff6e0', '#ffd34a'], 'up', 50, 30, 1, 3.2, 5), L('square', 5, ['#6a3a1a', '#8a4a20'], 'up', 70, 240, 0.6, 2.2)] },
  spain: { name: 'Silver reales and carnations', layers: [L('coin', 5, ['#e0e4e8', '#b8bcc4'], 'up', 75, 260, 0.6, 2.6), L('petal', 5, ['#d7263d', '#ff5a6a'], 'up', 50, 30, 1, 3.2, 5)] },
  haudenosaunee: { name: 'Wampum beads and maple leaves', layers: [L('coin', 5, ['#f4f0e6', '#4a3a8a'], 'up', 70, 250, 0.6, 2.4), L('petal', 5, ['#d84a1a', '#f0a030'], 'up', 50, 30, 1.1, 3.6, 6)] },
  assyria: { name: 'Clay dust and bronze scales', layers: [L('puff', 6, ['#c8a070', '#b08a5a'], 'ground', 28, -8, 0.7, 3.2), L('square', 5, ['#c9974a', '#a87a3a'], 'up', 75, 260, 0.6, 2.2)] },
  poland: { name: 'Hussar feathers', layers: [L('feather', 7, ['#ffffff', '#e8e0d0', '#e04060'], 'up', 55, 30, 1.1, 4.2, 6)] },
  scotland: { name: 'Heather and thistledown', layers: [L('petal', 6, ['#a05aa8', '#c88ad0'], 'up', 50, 30, 1, 3.2, 5), L('puff', 4, ['#f4f0e6'], 'up', 30, 10, 1.2, 4)] },
  england: { name: 'Roses and oak leaves', layers: [L('petal', 6, ['#c8243a', '#ffffff'], 'up', 50, 30, 1, 3.2, 5), L('feather', 3, ['#4a7a3a', '#6a9a4a'], 'up', 55, 25, 1, 4, 6)] },
  france: { name: 'Fleurs-de-lis and lavender', layers: [L('star', 5, ['#f0c43a', '#ffe08a'], 'up', 70, 120, 0.6, 2.6), L('petal', 5, ['#9a7ad8', '#c8b0f0'], 'up', 50, 30, 1, 3.2, 5)] },
  germany: { name: 'Oak leaves and pfennigs', layers: [L('feather', 5, ['#5a8a3a', '#8aaa4a'], 'up', 55, 25, 1, 4, 6), L('coin', 4, ['#e0e4e8', '#c8a040'], 'up', 70, 250, 0.6, 2.4)] },
  sweden: { name: 'Snow and copper shavings', layers: [L('puff', 5, ['#ffffff', '#e4eef6'], 'round', 40, -10, 0.9, 3.2), L('shard', 5, ['#c87a3a', '#e09a5a'], 'up', 70, 260, 0.6, 2.4)] },
  portugal: { name: 'Blue tiles and sea spray', layers: [L('square', 7, ['#2a5ad0', '#f4f4f8'], 'up', 80, 260, 0.65, 2.2), L('drop', 4, ['#bff0f0'], 'up', 80, 300, 0.5, 1.6)] },
  venice: { name: 'Glass beads and ducats', layers: [L('coin', 5, ['#f0c43a', '#e0a526'], 'up', 75, 260, 0.6, 2.6), L('shard', 5, ['#5ad0f0', '#f05aa0', '#8af08a'], 'up', 80, 270, 0.6, 2.4)] },
  kongo: { name: 'Raffia threads and copper crosses', layers: [L('feather', 5, ['#d8b878', '#c8a060'], 'up', 55, 25, 1, 4, 6), L('star', 4, ['#d87a3a', '#f09a5a'], 'up', 70, 120, 0.6, 2.4)] },
  ashanti: { name: 'Gold dust and kente threads', layers: [L('square', 8, ['#f0c43a', '#e0a526'], 'up', 75, 160, 0.75, 1.6), L('feather', 4, ['#1a8a3a', '#c8243a', '#f0c43a'], 'up', 55, 25, 1, 4, 6)] },
  mapuche: { name: 'Silver trapelakucha and copihue petals', layers: [L('coin', 4, ['#e0e4e8', '#b8bcc4'], 'up', 70, 250, 0.6, 2.4), L('petal', 5, ['#d01a3a', '#f05a6a'], 'up', 50, 30, 1, 3.2, 5)] },
  georgia: { name: 'Grapes and wine drops', layers: [L('drop', 6, ['#7a1a3a', '#a02a5a'], 'up', 70, 280, 0.6, 2), L('petal', 4, ['#6a9a3a', '#8aba4a'], 'up', 50, 30, 1, 3.2, 5)] },
  nepal: { name: 'Rhododendron petals and prayer-flag scraps', layers: [L('petal', 6, ['#d0203a', '#f05a7a'], 'up', 50, 30, 1, 3.2, 5), L('square', 5, ['#2d6cdf', '#ffffff', '#ffd34a', '#2aa84a'], 'up', 55, 30, 1.1, 3, 6)] },
  cree: { name: 'Beadwork flowers', layers: [L('petal', 6, ['#c8243a', '#2a7ad0', '#f0c43a', '#ffffff'], 'up', 50, 30, 1, 3.2, 5)] },
  beast: { name: 'An ink splash', layers: [L('ring', 1, ['rgba(30,24,50,0.8)'], 'ground', 0, 0, 0.7, 5), L('puff', 7, ['#1c1830', '#2e2848'], 'round', 34, -4, 0.9, 4.4), L('drop', 7, ['#14101f', '#3a2f5c'], 'up', 95, 300, 0.6, 2.4)] },
  rebel: { name: 'Torn banners and smoke', layers: [L('square', 5, ['#6b2a2a', '#3a3a3a'], 'up', 60, 60, 0.9, 3.2), L('puff', 4, ['#8a857c'], 'up', 20, -30, 0.9, 3.6)] },
  captive: { name: 'Led away on a rope', layers: [L('petal', 4, ['#ff9f1c', '#ffc233'], 'up', 40, 30, 0.8, 2.8, 4)] },
};

/** Every theme with a death effect (51 empires, then the neutral ones). */
export const DEATH_THEMES = [...TRIBE_IDS, 'beast', 'rebel', 'captive'] as DeathTheme[];

/**
 * Which death effect a fallen unit gets. `neutral`: owned by the hidden neutral player, so it is a Great
 * Beast (a kraken) or a Rogue State's soldier. `captive`: taken alive by the Aztecs instead of slain.
 */
export function deathTheme(tribe: TribeId, kind: UnitKind, neutral: boolean, captive: boolean): DeathTheme {
  if (captive) return 'captive';
  if (kind === 'kraken') return 'beast';
  return neutral ? 'rebel' : tribe;
}

/** Units whose fall shakes the screen hard. */
export const BIG_UNITS: UnitKind[] = ['giant', 'kraken'];
export const isBigUnit = (kind: UnitKind) => BIG_UNITS.includes(kind);
/** At most this many particles per death, so a battle stays cheap to draw. */
export const DEATH_PARTICLE_CAP = 24;

/** The particles of a death effect around a tile centre (world px), starting at `t0` ms. `rnd` gives 0..1. */
export function deathParticles(theme: DeathTheme, cx: number, cy: number, t0: number, big: boolean, rnd: () => number): Particle[] {
  const out: Particle[] = [];
  const k = big ? 1.5 : 1;
  for (const l of DEATH_STYLES[theme].layers) {
    const n = Math.round(l.n * (l.shape === 'ring' ? 1 : k));
    for (let i = 0; i < n && out.length < DEATH_PARTICLE_CAP; i++) {
      const sp = l.speed * (big ? 1.3 : 1) * (0.55 + rnd() * 0.7);
      let x = cx, y = cy, vx = 0, vy = 0;
      if (l.spread === 'up') {
        const a = -Math.PI / 2 + (rnd() - 0.5) * 2.2;
        x += (rnd() - 0.5) * 14; y += -16 + (rnd() - 0.5) * 8;
        vx = Math.cos(a) * sp; vy = Math.sin(a) * sp;
      } else if (l.spread === 'round') {
        const a = (i / n) * Math.PI * 2 + rnd() * 0.6;
        x += (rnd() - 0.5) * 6; y += -14 + (rnd() - 0.5) * 6;
        vx = Math.cos(a) * sp; vy = Math.sin(a) * sp * 0.6 - 12;
      } else {
        const a = (i / n) * Math.PI * 2 + rnd() * 0.5;
        x += Math.cos(a) * 5; y += 5 + Math.sin(a) * 2;
        vx = Math.cos(a) * sp; vy = Math.sin(a) * sp * 0.35 - 8;
      }
      out.push({ x, y, vx, vy, g: l.g, t0, life: l.life * (0.8 + rnd() * 0.4), color: l.colors[i % l.colors.length], size: l.size * (big ? 1.6 : 1.25), shape: l.shape, sway: l.sway || undefined });
    }
  }
  return out;
}

// ---------------------------------------------------------------- damage numbers

export const DAMAGE_COLOR = '#ff4d3d';
export const COUNTER_COLOR = '#ffa43a'; // a counter-blow
export const CRIT_COLOR = '#ffe14a'; // a critical or bonus blow (Kiai, a Zulu trap, a Great Beast...)
/** How much bigger a critical damage number is. */
export const CRIT_SCALE = 1.55;

/** The floating number for one blow. */
export function damageFloater(amount: number, counter: boolean, crit: string | undefined, x: number, y: number, t0: number, dx = 0): Fx['floaters'][number] {
  const big = !!crit;
  return { x, y, text: `-${amount}`, color: big ? CRIT_COLOR : counter ? COUNTER_COLOR : DAMAGE_COLOR, t0, hit: true, big, label: crit?.toUpperCase(), dx };
}

const backOut = (k: number) => 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2);

/**
 * A floater at `q` (0..1 of its life): how far above the tile centre it sits (screen px before the
 * label scale), its size and opacity. Damage numbers pop out big, bounce up off the unit and drift;
 * other floaters (+stars, +pop) keep their gentle rise.
 */
export function floaterPose(q: number, hit: boolean, big: boolean): { rise: number; scale: number; alpha: number } {
  if (!hit) {
    const pop = q < 0.15 ? 0.6 + (q / 0.15) * 0.5 : 1.1 - Math.min(0.1, q - 0.15);
    return { rise: 54 + q * 26, scale: pop, alpha: 1 - q * q };
  }
  const jump = Math.min(1, q / 0.28);
  const rise = 34 + backOut(jump) * 24 + q * 20;
  const scale = (q < 0.1 ? 0.35 + (q / 0.1) * 1.05 : q < 0.24 ? 1.4 - ((q - 0.1) / 0.14) * 0.4 : 1) * (big ? CRIT_SCALE : 1);
  const fade = Math.max(0, (q - 0.62) / 0.38);
  return { rise, scale, alpha: 1 - fade * fade };
}

// ---------------------------------------------------------------- screen shake

/** The shake a kill of `kind` causes, or null with reduced motion. Big units (Colossus, Kraken) shake harder. */
export function killShake(kind: UnitKind, t0: number, reduced: boolean): Fx['shake'] {
  if (reduced) return null;
  if (isBigUnit(kind)) return { t0, dur: 420, mag: 5.5 };
  const heavy = UNITS[kind].naval || UNITS[kind].hp >= 15;
  return { t0, dur: 240, mag: heavy ? 2.6 : 1.8 };
}

/** Keeps whichever shake is stronger right now. */
export function mergeShake(cur: Fx['shake'], next: Fx['shake'], now: number): Fx['shake'] {
  if (!next) return cur;
  if (!cur || now > cur.t0 + cur.dur) return next;
  return next.mag >= cur.mag * (1 - Math.max(0, (now - cur.t0) / cur.dur)) ? next : cur;
}

/** The screen offset (css px) of a shake at `now`: a quick jitter dying away. */
export function shakeOffset(sh: Fx['shake'], now: number): { x: number; y: number } {
  if (!sh) return { x: 0, y: 0 };
  const k = (now - sh.t0) / sh.dur;
  if (k < 0 || k >= 1) return { x: 0, y: 0 };
  const amp = sh.mag * (1 - k) * (1 - k);
  const t = now - sh.t0;
  return { x: Math.sin(t * 0.09) * amp, y: Math.cos(t * 0.117) * amp * 0.6 };
}
