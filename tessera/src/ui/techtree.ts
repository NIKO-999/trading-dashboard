import { TECHS, TECH_BY_ID } from '../data/techs';
import { portraitKind, TRIBES } from '../data/tribes';
import { UNITS } from '../data/units';
import { research, researchStatus, techCost } from '../game/rules';
import { drawIcon } from '../render/draw';
import type { GameState } from '../game/types';
import { h, iconEl, paint, starSpan } from './dom';
import { modal } from './modal';
import { unitPortrait } from './menu';

const RADIUS = [0, 0.35, 0.67, 1]; // fraction of the usable radius for tiers 1..3

// Picture shown inside a node once it is researched or researchable.
const TECH_ICON: Record<string, string> = {
  gathering: 'fruit', farming: 'crop', masonry: 'temple', tactics: 'defender', engineering: 'catapult',
  hunting: 'animal', archery: 'archer', spiritualism: 'forest', forestry: 'lumber', carpentry: 'market',
  fishing: 'fish', sailing: 'ship', navigation: 'warship', whaling: 'whale', aquaculture: 'port',
  riding: 'rider', roads: 'road', trade: 'star', horsemanship: 'chariot', chivalry: 'knight',
  climbing: 'mountain', mining: 'mine', smithing: 'swordsman', meditation: 'temple', philosophy: 'star',
};

/** Full-screen radial tech tree. `onChange` runs after a successful research. */
export function showTechTree(s: GameState, pid: number, hud: Node, onChange: () => void, onClose: () => void) {
  const p = s.players[pid];
  const tribe = TRIBES[p.tribe];
  const layer = h('div', { class: 'techtree' });
  const close = () => {
    layer.remove();
    onClose();
  };

  const render = () => {
    layer.innerHTML = '';
    // Lay the tree out on an ellipse so it uses the height of a portrait phone.
    const w = Math.min(window.innerWidth - 8, 620);
    const hgt = Math.min(window.innerHeight - 190, w * 1.6);
    const nodeSize = Math.max(48, Math.min(70, w / 7.3));
    const rx = w / 2 - nodeSize / 2 - 2;
    const ry = hgt / 2 - nodeSize / 2 - 2;
    const pos = (id: string) => {
      const t = TECH_BY_ID[id];
      const a = (t.angle * Math.PI) / 180;
      return { x: w / 2 + Math.cos(a) * rx * RADIUS[t.tier], y: hgt / 2 + Math.sin(a) * ry * RADIUS[t.tier] };
    };
    const half = { x: w / 2, y: hgt / 2 };
    let lines = '';
    for (const t of TECHS) {
      const a = pos(t.id);
      const b = t.parent ? pos(t.parent) : half;
      const on = researchStatus(s, pid, t.id) === 'owned';
      lines += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${on ? '#22c33a' : '#555'}" stroke-width="${on ? 4 : 3}"/>`;
    }
    const board = h('div', { class: 'tt-board', style: { width: `${w}px`, height: `${hgt}px` } });
    board.append(h('div', { class: 'tt-lines', html: `<svg width="${w}" height="${hgt}">${lines}</svg>` }));
    const center = h('div', { class: 'tt-center', style: { left: `${half.x}px`, top: `${half.y}px`, '--tc': tribe.color } as Record<string, string> },
      unitPortrait(portraitKind(p.tribe), p.tribe, 58));
    board.append(center);

    for (const t of TECHS) {
      const { x, y } = pos(t.id);
      const st = researchStatus(s, pid, t.id);
      const cost = techCost(s, pid, t.id);
      const affordable = st === 'available' && p.stars >= cost;
      const node = h('button', {
        class: `tt-node ${st}${affordable ? ' affordable' : ''}`,
        style: { left: `${x}px`, top: `${y}px`, width: `${nodeSize}px`, height: `${nodeSize}px`, '--tc': tribe.color } as Record<string, string>,
        onclick: () => openTech(t.id),
      },
        st === 'available' ? h('span', { class: 'tt-cost' }, starSpan(cost)) : null,
        st !== 'locked' ? paint(28, 19, (ctx) => { ctx.translate(14, 10); ctx.scale(0.42, 0.42); drawIcon(ctx, TECH_ICON[t.id], p.tribe, 0, 0); }) : null,
        h('span', { class: 'tt-name', style: { fontSize: `${Math.min(10.5, (nodeSize - (st === 'available' ? 15 : 9)) / (t.name.length * 0.5)).toFixed(1)}px` } }, t.name),
      );
      board.append(node);
    }

    layer.append(
      h('div', { class: 'tt-top' },
        h('button', { class: 'round-btn light', onclick: close, 'aria-label': 'Close tech tree' }, iconEl('back')),
        hud.cloneNode(true),
      ),
      h('div', { class: 'tt-wrap' }, board),
      h('div', { class: 'tt-foot' }, 'Each new city makes research a little pricier.'),
    );
  };

  const openTech = (id: string) => {
    const t = TECH_BY_ID[id];
    const st = researchStatus(s, pid, id);
    const cost = techCost(s, pid, id);
    const unit = Object.values(UNITS).find((u) => u.tech === id && u.trainable && (u.kind === tribe.unique || u.kind !== tribe.replaces));
    const body: (Node | string)[] = [h('p', {}, t.unlocks)];
    if (st === 'locked') body.push(h('p', { class: 'muted' }, `Research ${TECH_BY_ID[t.parent!].name} first.`));
    if (st === 'owned') body.push(h('p', { class: 'muted' }, 'Already known.'));
    modal({
      title: t.name,
      art: unit ? unitPortrait(unit.kind, p.tribe, 72) : undefined,
      body,
      dismissable: true,
      buttons: st === 'available'
        ? [
          { label: 'Cancel' },
          {
            label: h('span', {}, 'Research ', starSpan(cost)),
            primary: true,
            onClick: () => {
              if (research(s, pid, id)) {
                onChange();
                render();
              }
            },
          },
        ]
        : [{ label: 'OK', primary: true }],
    });
    if (st === 'available' && p.stars < cost) {
      const btn = document.querySelector<HTMLButtonElement>('.modal-layer:last-child .mbtn.primary');
      if (btn) btn.disabled = true;
    }
  };

  render();
  document.getElementById('ui')!.append(layer);
  return { close, refresh: render };
}
