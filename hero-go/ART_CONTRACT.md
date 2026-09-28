# Hero Go! — Art module contract

All art is hand-authored inline SVG returned as strings from plain JS (no build step,
no modules, no external assets). Style: cute chibi mobile-game look (thick dark
outlines ~#2b1d14 at 3-4px, soft cel shading with 1-2 shade layers + a highlight,
saturated friendly palette) — but HIGHLY detailed: stitching, rivets, fabric folds,
engraving, patterns, straps, buckles, tattoos, feathers, etc.

## Global rules
- Every `id` used inside an SVG (gradients, clipPaths, filters) MUST be prefixed with
  the module key, e.g. `samurai-grad-armor`, so several SVGs can live on one page.
  Because the same hero can be drawn twice on screen, also accept an optional `uid`
  argument and append it to every id: `id="samurai-grad-armor-${uid}"`.
- No `<script>`, no external `href`s, no fonts. Pure shapes/paths/gradients.
- Characters face RIGHT (enemies face LEFT).
- Return a full `<svg xmlns="http://www.w3.org/2000/svg" viewBox="..." ...>` string.
  Do not set width/height attributes (the game sizes them with CSS).
- Animation hooks (the game animates these with CSS; keep them as `<g>` groups):
  - `class="part-body"`  – everything that bobs while idle (torso+head+arms). 
  - `class="part-head"`  – head group (slight tilt).
  - `class="part-eyes"`  – eyes only (game scales Y to blink).
  - `class="part-weapon"` – weapon + the arm holding it. Must carry
    `style="transform-origin: Xpx Ypx"` where X,Y = shoulder pivot in viewBox units.
  - `class="part-cape"` optional – cloth/feathers that sway.
  - `class="part-shadow"` – ground ellipse.

## Heroes — file `js/heroes/<key>.js`
viewBox `0 0 200 240`, feet on y≈228, body centered on x≈95, chibi proportions
(head ≈ 40% of height). Register:

```js
window.HEROES = window.HEROES || {};
window.HEROES.<key> = {
  key: '<key>', name: 'Kenji', title: 'The Samurai',
  lore: 'one-two sentence flavour',
  color: '#c0392b',          // UI accent
  base: { hp: 520, atk: 95, def: 25 },   // keep totals roughly equal across heroes
  fx: { slash: '#ffd24a', glow: '#fff3b0' }, // attack trail colours
  signature: { name: 'Iaijutsu', desc: 'short text', type: 'crit'|'lifesteal'|'shield'|'burn'|'multi' },
  svg: function (uid) { return `<svg ...>` },
  portrait: function (uid) { return `<svg viewBox="0 0 120 120">` } // head+shoulders bust for UI cards
};
```

## Enemies — file `js/art/enemies.js`
viewBox `0 0 200 200`, feet y≈190, facing LEFT. `window.ENEMIES = { key: {name, svg(uid)} }`.

## Pets — file `js/art/pets.js`
viewBox `0 0 120 120`, facing RIGHT. `window.PETS = { key: {name, rarity, bonus:{stat,pct}, desc, svg(uid)} }`.

## Scenes — file `js/art/scenes.js`
viewBox `0 0 400 300`, `preserveAspectRatio="xMidYMax slice"`, ground plane from y≈190
down (battle floor). `window.SCENES = { key: {name, sky:'#hex', svg()} }`.
