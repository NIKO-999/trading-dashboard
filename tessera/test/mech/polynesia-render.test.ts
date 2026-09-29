import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame } from '../../src/game/mapgen';
import { render } from '../../src/render/mech/polynesia';
import { ui } from '../../src/ui/mech/polynesia';

// The canvas is stubbed: this proves the Great Waka art and overlay run without throwing on a real game state.
test('the Great Waka art, overlay and HUD run against a real Maori game', () => {
  const s = createGame({ seed: 7, human: 'polynesia', opponents: ['japan'], mode: 'perfection' });
  let strokes = 0;
  const ctx = new Proxy({}, {
    get: (_t, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => { if (k === 'fill' || k === 'stroke') strokes++; }),
    set: () => true,
  }) as unknown as CanvasRenderingContext2D;
  for (const t of s.tiles) render.tile!(ctx, s, t, 0, 0);
  render.overlay!(ctx, s, 0, null as never, null as never, 1000);
  assert.ok(strokes > 20, 'something was drawn');
  assert.ok(typeof ui.hud === 'function' && typeof ui.dock === 'function');
});
