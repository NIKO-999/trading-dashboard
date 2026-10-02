// Layout of the Constellation View (the skill tree screen, ui/techtree.ts): three converging rings around the Empire
// Origin. Pure geometry with no DOM, so the tests can check that no two stars overlap.
//  - Core Domain: the shared techs on their five spokes (tiers 1-3), the two forks just outside their parent;
//  - Master Culture: the empire's own line spiralling out from its base tech, and the Aether Links between branches;
//  - Doctrine: the empire type's own branch, each track straight out from its root;
//  - Alignment: the Wildcards spread around the rim.
import { prereqs, techsFor, type TechDef } from '../data/techs';
import { DOCTRINE_NAME } from '../data/doctrines';
import { TRIBES } from '../data/tribes';
import type { TribeId } from '../game/types';

export interface Star { id: string; x: number; y: number; ring: TechDef['ring'] }
export interface Sky { size: number; cx: number; cy: number; r: number; stars: Star[]; rings: { name: string; r: number; x: number; y: number }[] }

/** Radius (fraction of the sky) of each band. */
const CORE = [0, 0.2, 0.35, 0.49];
const FORK = 0.575;
const AETHER = 0.625;
const DOCTRINE = [0.7, 0.765, 0.83]; // the empire type's branch: one track out from each of its three roots
const CULTURE = [0.875, 0.915, 0.955];
const CULTURE_TURN = 9; // degrees each step of an empire's line turns as it spirals out
const WILD = 1;
/** Closest two star centres may sit, in px. */
export const STAR_GAP = 42;

const rad = (deg: number) => (deg * Math.PI) / 180;
const meanAngle = (as: number[]) => (Math.atan2(as.reduce((a, d) => a + Math.sin(rad(d)), 0), as.reduce((a, d) => a + Math.cos(rad(d)), 0)) * 180) / Math.PI;

/** Where every star of this empire's sky goes on a square board `size` px wide. */
export function skyLayout(tribe: TribeId, size: number): Sky {
  const cx = size / 2, cy = size / 2, r = size / 2 - 30;
  const stars: Star[] = [];
  const angle = new Map<string, number>();
  const at = (deg: number, f: number) => ({ x: cx + Math.cos(rad(deg)) * r * f, y: cy + Math.sin(rad(deg)) * r * f });
  const clear = (x: number, y: number) => stars.every((s) => Math.hypot(s.x - x, s.y - y) >= STAR_GAP) && Math.hypot(x - cx, y - cy) >= STAR_GAP * 1.2;
  /** Place a star at `deg`, turning it a little either way until it has room. */
  const place = (t: TechDef, deg: number, f: number) => {
    for (let k = 0; k <= 40; k++) {
      const d = deg + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 2.5;
      const p = at(d, f);
      if (k === 40 || clear(p.x, p.y)) { stars.push({ id: t.id, ring: t.ring, ...p }); angle.set(t.id, d); return; }
    }
  };
  const all = techsFor(tribe);
  for (const t of all.filter((x) => x.ring === 'core')) { const p = at(t.angle, CORE[t.tier]); stars.push({ id: t.id, ring: 'core', ...p }); angle.set(t.id, t.angle); }
  const line = all.filter((t) => t.ring === 'culture').sort((a, b) => a.tier - b.tier);
  const base = line.length ? angle.get(line[0].parent!) ?? 0 : 0;
  line.forEach((t, i) => place(t, base + i * CULTURE_TURN, CULTURE[i]));
  for (const t of all.filter((x) => x.ring === 'fork')) {
    const twins = all.filter((x) => x.fork === t.fork);
    place(t, angle.get(t.parent!)! + (twins.indexOf(t) === 0 ? -6 : 6), FORK);
  }
  for (const t of all.filter((x) => x.ring === 'aether')) place(t, meanAngle(prereqs(t).map((q) => angle.get(q)!)), AETHER);
  // doctrines: each track runs straight out from the shared tech it grows from
  const doctrine = all.filter((x) => x.ring === 'doctrine');
  const tracks = [...new Set(doctrine.map((t) => t.track!))];
  // each track heads out along its root's angle, nudged apart so no two tracks run side by side
  const heading = new Map(tracks.map((tr) => [tr, angle.get(doctrine.find((t) => t.track === tr && t.tier === 2)!.parent!)!]));
  for (let pass = 0; pass < 20; pass++) {
    for (const a of tracks) for (const b of tracks) {
      if (a >= b) continue;
      const d = ((heading.get(b)! - heading.get(a)! + 540) % 360) - 180;
      if (Math.abs(d) < 34) { const push = (34 - Math.abs(d)) / 2 * (d >= 0 ? 1 : -1); heading.set(a, heading.get(a)! - push); heading.set(b, heading.get(b)! + push); }
    }
  }
  for (const t of doctrine.sort((a, b) => a.tier - b.tier)) place(t, heading.get(t.track!)!, DOCTRINE[t.tier - 2]);
  // wildcards: spread evenly round the rim, each near its parent, starting clear of the empire's line
  const wild = all.filter((x) => x.ring === 'wild').sort((a, b) => ((angle.get(a.parent!)! - base + 720) % 360) - ((angle.get(b.parent!)! - base + 720) % 360));
  wild.forEach((t, i) => place(t, base + ((i + 0.5) * 360) / wild.length, WILD));
  // ring names sit in the gap between two wildcards nearest the top (never over the empire's line)
  const gaps = Array.from({ length: Math.max(1, wild.length - 1) }, (_, k) => base + ((k + 1) * 360) / Math.max(2, wild.length));
  const top = gaps.sort((a, b) => Math.abs(((a + 90 + 540) % 360) - 180) - Math.abs(((b + 90 + 540) % 360) - 180))[0];
  const ring = (name: string, f: number) => ({ name, r: r * f, ...at(top, f) });
  return { size, cx, cy, r, stars, rings: [ring('Core Domain', CORE[3] + 0.05), ring(DOCTRINE_NAME[TRIBES[tribe].category], DOCTRINE[2] + 0.04), ring('Master Culture', CULTURE[2] + 0.04), ring('Alignment', WILD + 0.05)] };
}

/** The lines of the constellation: each star to what it grows from (roots to the origin). */
export function skyLinks(tribe: TribeId): { from: string; to: string | null; kind: 'tree' | 'link' | 'fork' }[] {
  const out: { from: string; to: string | null; kind: 'tree' | 'link' | 'fork' }[] = [];
  for (const t of techsFor(tribe)) {
    if (t.requires) for (const q of t.requires) out.push({ from: t.id, to: q, kind: 'link' });
    else out.push({ from: t.id, to: t.parent, kind: 'tree' });
    if (t.fork) {
      const twin = techsFor(tribe).find((x) => x.fork === t.fork && x.id > t.id);
      if (twin) out.push({ from: t.id, to: twin.id, kind: 'fork' });
    }
  }
  return out;
}

export const ringLabel = (t: TechDef) =>
  t.ring === 'core' ? `Core Domain · tier ${t.tier}` : t.ring === 'fork' ? 'Fork · choose one' : t.ring === 'culture' ? 'Master Culture' : t.ring === 'aether' ? 'Aether Link' : t.ring === 'doctrine' ? `${DOCTRINE_NAME[t.category!]} · ${t.track}` : 'Alignment Wildcard';

