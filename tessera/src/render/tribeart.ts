// Per-empire art hooks for the newer empires. Each empire's art lives in its own module (render/tribes/<id>.ts) and
// registers here; render/units and render/draw ask TRIBE_ART before falling back to the shared drawing. Every hook is
// optional, and one that returns false (or is missing) leaves the default drawing in place.
//  - unit: draw a whole unit (its unique, a rider, a siege engine, a boat...) instead of the shared code;
//  - dress: the colours of the torso, legs and sleeves of every foot figure;
//  - torso, face, head, weapon, shield: details on the shared figure (render/units `figure`);
//  - building: a city building; tree: a forest tree on its homeland.
// A module draws with render/prims and may call render/units' `figure`, but only inside its functions: never at load.
import type { BiomePalette } from '../data/tribes';
import type { TribeId, UnitKind } from '../game/types';
import type { Ctx } from './prims';

export interface Body { hand: { x: number; y: number }; off: { x: number; y: number }; top: number }

export interface TribeArt {
  unit?(ctx: Ctx, kind: UnitKind, x: number, y: number): boolean;
  dress?(kind: UnitKind, armoured: boolean): [torso: string, legs: string, sleeves: string] | null;
  torso?(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number): void;
  face?(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number): void;
  head?(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number): void;
  weapon?(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean;
  shield?(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number): boolean;
  building?(ctx: Ctx, x: number, y: number, big: boolean, roofC: string, capital: boolean): void;
  tree?(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, variant: number): void;
}

export const TRIBE_ART: Partial<Record<TribeId, TribeArt>> = {};
export function registerArt(tribe: TribeId, art: TribeArt) { TRIBE_ART[tribe] = art; }
