// A one-screen "is this phone drawing 1:1?" test. It draws one-pixel stripes, tiny text and a game
// unit through the same path as the map, and prints what the device reports, so a single screenshot
// shows whether the picture is being stretched by the phone or is soft in the art itself.
import { renderDpr } from '../render/common';
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
      h('p', { class: 'muted small' }, 'Take a screenshot of this screen. The stripes, diagonal and text below should look razor sharp.'),
      c,
      report,
      h('p', { class: 'small', style: { fontSize: '13px', margin: '6px 0 0' } }, 'Same text as normal page text, for comparison: Sharp text 0123456789'),
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
  const cssH = 145;
  c.width = Math.round(cssW * dpr);
  c.height = Math.round(cssH * dpr);
  c.style.width = `${cssW}px`;
  c.style.height = `${cssH}px`;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  // alternating 1-device-pixel black and white columns, then rows
  ctx.fillStyle = '#000';
  for (let x = 0; x < 120; x += 2) ctx.fillRect(x, 0, 1, 60);
  for (let y = 0; y < 60; y += 2) ctx.fillRect(0, 70 + y, 120, 1);
  // a 1-device-pixel diagonal
  ctx.beginPath();
  ctx.moveTo(140, 8);
  ctx.lineTo(240, 108);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.stroke();
  // small text at the size labels use
  ctx.fillStyle = '#000';
  ctx.font = `${Math.round(11 * dpr)}px "Josefin Sans", system-ui, sans-serif`;
  ctx.fillText('Sharp text 0123456789', 8 * dpr, 112 * dpr);
  ctx.font = `${Math.round(8 * dpr)}px system-ui, sans-serif`;
  ctx.fillText('tiny text: the quick brown fox', 8 * dpr, 130 * dpr);
  // a game unit at its usual size (1.35x), drawn the way the map draws it
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.translate(cssW - 44, cssH - 24);
  ctx.scale(1.35, 1.35);
  drawUnitSprite(ctx, 'legionary', 'rome', 0, 0);
  ctx.restore();

  // Reads back what the canvas actually holds: if the stripes are still 1px black/white here, the
  // canvas itself is sharp and any blur happens after the game (a scaled page or web view).
  const row = ctx.getImageData(0, 4, 8, 1).data;
  const crisp = row[0] < 40 && row[4] > 215 && row[8] < 40 && row[12] > 215;
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
    `canvas holds 1px stripes: ${crisp ? 'YES' : 'NO'}`,
    `inside a frame  ${framed ? 'yes' : 'no'}`,
    navigator.userAgent.replace(/^Mozilla\/5\.0 /, '').slice(0, 70),
  ].join('\n');
  // the dialog zooms in for a moment when it opens, so read the final size afterwards
  report.textContent = lines(cssW);
  setTimeout(() => { report.textContent = lines(+c.getBoundingClientRect().width.toFixed(1)); }, 450);
}
