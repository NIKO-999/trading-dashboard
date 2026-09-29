// A one-screen "is this phone drawing 1:1?" test. It draws the same things two ways: straight onto
// the canvas, and through hidden canvases copied across the way the map does (the big ground/scenery
// layers and the small unit bitmaps). One screenshot then shows whether the phone softens the copy,
// and the read-back below says whether the canvas itself still holds the sharp stripes.
import { renderDpr } from '../render/common';
import { drawSprite, unitSprite } from '../render/sprites';
import { drawUnitSprite } from '../render/units';
import { h } from './dom';
import { modal } from './modal';

export function showSharpnessTest() {
  const dpr = renderDpr();
  const c = document.createElement('canvas');
  c.style.display = 'block';
  const report = h('pre', { class: 'diag' });
  modal({
    title: 'Sharpness test',
    body: [
      h('p', { class: 'muted small' }, 'Take a screenshot of this screen. Top row: drawn straight onto the screen. Bottom row: copied in from hidden canvases, the way the map is. Both should look razor sharp.'),
      c,
      report,
    ],
    dismissable: true,
    cls: 'diag-card',
  });

  // Size the canvas to the room it really gets once it is on the page, so nothing rescales it.
  c.width = 1;
  c.height = 1;
  c.style.width = '100%'; // measure the room available with the canvas collapsed, not at its default 300px
  c.style.height = '1px';
  const cssW = Math.max(120, Math.min(300, c.clientWidth));
  const rowH = 105;
  const cssH = rowH * 2 + 6;
  c.width = Math.round(cssW * dpr);
  c.height = Math.round(cssH * dpr);
  c.style.width = `${cssW}px`;
  c.style.height = `${cssH}px`;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);

  /** One-device-pixel stripes (columns then rows) and a diagonal, drawn with whatever context and origin you give. */
  const pattern = (g: CanvasRenderingContext2D, ox: number, oy: number) => {
    g.fillStyle = '#000';
    for (let x = 0; x < 100; x += 2) g.fillRect(ox + x, oy, 1, 40);
    for (let y = 0; y < 40; y += 2) g.fillRect(ox, oy + 46 + y, 100, 1);
    g.strokeStyle = '#000';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(ox + 120, oy);
    g.lineTo(ox + 200, oy + 80);
    g.stroke();
  };
  const rowB = Math.round((rowH + 6) * dpr);

  // Top row: everything drawn directly.
  pattern(ctx, 0, 0);
  ctx.fillStyle = '#000';
  ctx.font = `${Math.round(10 * dpr)}px "Josefin Sans", system-ui, sans-serif`;
  ctx.fillText('direct', 8 * dpr, 98 * dpr);
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.translate(cssW - 40, rowH - 16);
  ctx.scale(1.35, 1.35);
  drawUnitSprite(ctx, 'legionary', 'rome', 0, 0);
  ctx.restore();

  // Bottom row: the same pattern drawn into a hidden layer as big as the map's, then copied over.
  const vw = window.innerWidth, vh = window.innerHeight;
  const mx = Math.round(Math.min(180, vw * 0.22)), my = Math.round(Math.min(180, vh * 0.22));
  const LW = vw + mx * 2, LH = vh + my * 2;
  const layerDpr = Math.min(dpr, Math.sqrt(10_000_000 / (LW * LH)));
  const layer = document.createElement('canvas');
  layer.width = Math.round(LW * layerDpr);
  layer.height = Math.round(LH * layerDpr);
  const lctx = layer.getContext('2d')!;
  pattern(lctx, 0, Math.round(rowB * (layerDpr / dpr)));
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.imageSmoothingQuality = 'low';
  ctx.drawImage(layer, 0, 0, LW, LH);
  ctx.restore();
  ctx.fillStyle = '#000';
  ctx.fillText('via hidden layer', 8 * dpr, (rowH + 6 + 98) * dpr);
  // ...and the soldier through the unit-bitmap cache, exactly as units are drawn on the map
  ctx.save();
  ctx.scale(dpr, dpr);
  drawSprite(ctx, unitSprite('legionary', 'rome', 1.35 * dpr, 'base', true), cssW - 40, rowH + 6 + rowH - 16, 1.35);
  ctx.restore();

  // Read back what the canvas holds. If these say YES, the stripes reached the canvas pixel-perfect,
  // so any blur seen in the screenshot happens after the game, in the phone's own compositing.
  const stripes = (y: number) => {
    const row = ctx.getImageData(0, y, 8, 1).data;
    return row[0] < 40 && row[4] > 215 && row[8] < 40 && row[12] > 215;
  };
  const vv = window.visualViewport;
  let framed = false;
  try { framed = window.self !== window.top; } catch { framed = true; }
  const lines = (shown: number) => [
    `density drawn   ${+dpr.toFixed(2)}x  (screen reports ${window.devicePixelRatio}x)`,
    `page zoom       ${vv ? +vv.scale.toFixed(2) : '?'}`,
    `window          ${window.innerWidth} x ${window.innerHeight} css px`,
    `screen          ${screen.width} x ${screen.height}`,
    `test canvas     ${c.width} x ${c.height} px`,
    `shown at        ${shown} css px (should be ${cssW})${Math.abs(shown - cssW) < 0.6 ? '' : '  <-- SCALED'}`,
    `hidden layer    ${layer.width} x ${layer.height} px (${+layerDpr.toFixed(2)}x)`,
    `direct stripes crisp:        ${stripes(4) ? 'YES' : 'NO'}`,
    `layer-copy stripes crisp:    ${stripes(rowB + 4) ? 'YES' : 'NO'}`,
    `inside a frame  ${framed ? 'yes' : 'no'}`,
    navigator.userAgent.replace(/^Mozilla\/5\.0 /, '').slice(0, 70),
  ].join('\n');
  report.textContent = lines(cssW);
  // the dialog zooms in for a moment when it opens, so read the final size afterwards
  setTimeout(() => { report.textContent = lines(+c.getBoundingClientRect().width.toFixed(1)); }, 450);
}
