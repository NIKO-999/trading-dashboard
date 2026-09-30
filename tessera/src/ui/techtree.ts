import { prereqs, TECH_BY_ID, techsFor, type TechDef } from '../data/techs';
import { UNIQUE_BY_ID } from '../data/uniqueTechs';
import { portraitKind, TRIBES } from '../data/tribes';
import { UNITS } from '../data/units';
import { WONDERS } from '../data/wonders';
import { COND_TEXT, condActive } from '../game/alignment';
import { research, researchStatus, subBranch, techCost, transmute, transmuteCheck, transmuteCost, transmuteRefund, type ResearchStatus } from '../game/rules';
import type { GameState } from '../game/types';
import { ringLabel, skyLayout, skyLinks, type Sky } from './constellation';
import { h, iconEl, starSpan } from './dom';
import { modal } from './modal';
import { unitPortrait } from './menu';

// The Constellation View: the skill tree as stars on a pitch-black sky (layout in ui/constellation.ts). Learned stars
// shine gold (the Core Domain, forks and the empire's own line) or silver (Aether Links and Wildcards); the rest are
// faint fine-line outlines whose shape tells the ring: circle core, triangle fork, diamond culture, hexagon link,
// eight-point star wildcard. The sky is wider than a phone: it scrolls, and "Whole sky" shrinks it to fit.

const GOLD = new Set<TechDef['ring']>(['core', 'fork', 'culture']);

/** A star's outline for its ring, centred on 0,0 with radius `r`. */
function glyph(ring: TechDef['ring'], r: number): string {
  const poly = (n: number, rot: number, inner?: number) => Array.from({ length: n * (inner ? 2 : 1) }, (_, i) => {
    const a = rot + (i * Math.PI * 2) / (n * (inner ? 2 : 1));
    const rr = inner && i % 2 ? r * inner : r;
    return `${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`;
  }).join(' ');
  switch (ring) {
    case 'core': return `<circle r="${r * 0.8}"/>`;
    case 'fork': return `<polygon points="${poly(3, -Math.PI / 2)}"/>`;
    case 'culture': return `<polygon points="${poly(4, -Math.PI / 2)}"/>`;
    case 'aether': return `<polygon points="${poly(6, 0)}"/>`;
    case 'wild': return `<polygon points="${poly(8, -Math.PI / 2, 0.55)}"/>`;
  }
}

/** Faint background stars, the same every time. */
function dust(size: number): string {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let out = '';
  for (let i = 0; i < 140; i++) out += `<circle cx="${(rnd() * size).toFixed(1)}" cy="${(rnd() * size).toFixed(1)}" r="${(0.3 + rnd() * 0.9).toFixed(2)}" fill="#fff" opacity="${(0.15 + rnd() * 0.45).toFixed(2)}"/>`;
  return out;
}

/**
 * The research screen. With `focus` (e.g. from a locked "Build Farm" button) that tech is
 * highlighted and its card opened; if its parent isn't known yet the card offers to go there,
 * and once the missing parents are researched the card for the original goal comes back up.
 */
export function showTechTree(s: GameState, pid: number, hud: () => Node, onChange: () => void, onClose: () => void, focus?: string) {
  const p = s.players[pid];
  const tribe = TRIBES[p.tribe];
  const layer = h('div', { class: 'techtree' });
  const mine = techsFor(p.tribe); // the shared tree, forks, links, wildcards and this empire's own line
  const goal = focus && TECH_BY_ID[focus] ? focus : null;
  let focused = goal;
  let whole = false; // "Whole sky": shrink the constellation to fit the screen
  let sky: Sky | null = null;
  const close = () => {
    layer.remove();
    onClose();
  };

  const render = () => {
    const keep = layer.querySelector<HTMLElement>('.tt-wrap');
    const scroll = keep && !keep.classList.contains('whole') ? { x: keep.scrollLeft, y: keep.scrollTop } : null; // keep the view on a redraw
    layer.innerHTML = '';
    const size = Math.max(720, Math.min(window.innerWidth - 8, 900));
    if (sky?.size !== size) sky = skyLayout(p.tribe, size);
    const pos = new Map(sky.stars.map((st) => [st.id, st]));
    const status = new Map<string, ResearchStatus>(mine.map((t) => [t.id, researchStatus(s, pid, t.id)]));
    const lit = (id: string) => status.get(id) === 'owned';

    let svg = `<rect width="${size}" height="${size}" fill="#000"/>${dust(size)}`;
    for (const ring of sky.rings) {
      svg += `<circle cx="${sky.cx}" cy="${sky.cy}" r="${ring.r}" fill="none" stroke="#9fb4ff" stroke-opacity="0.09" stroke-width="1" stroke-dasharray="2 6"/>`;
      svg += `<text x="${ring.x}" y="${ring.y + 3}" class="tt-ring">${ring.name.toUpperCase()}</text>`;
    }
    for (const l of skyLinks(p.tribe)) {
      const a = pos.get(l.from)!;
      const b = l.to ? pos.get(l.to)! : { x: sky.cx, y: sky.cy };
      if (l.kind === 'fork') {
        const sealed = status.get(l.from) === 'sealed' || status.get(l.to!) === 'sealed';
        svg += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#ff6a5a" stroke-opacity="${sealed ? 0.25 : 0.55}" stroke-width="1" stroke-dasharray="1 4"/>`;
        continue;
      }
      const on = lit(l.from) && (!l.to || lit(l.to));
      const col = l.kind === 'link' || TECH_BY_ID[l.from].ring === 'wild' ? '#dfe7f5' : '#f5c542';
      svg += on
        ? `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${col}" stroke-width="1.6" class="tt-glow"/>`
        : `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#fff" stroke-opacity="0.16" stroke-width="0.8"${l.kind === 'link' ? ' stroke-dasharray="3 4"' : ''}/>`;
    }
    const board = h('div', { class: 'tt-board', style: { width: `${size}px`, height: `${size}px` } });
    board.append(h('div', { class: 'tt-lines', html: `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${svg}</svg>` }));
    board.append(h('div', { class: 'tt-center', style: { left: `${sky.cx}px`, top: `${sky.cy}px`, '--tc': tribe.color } as Record<string, string> },
      unitPortrait(portraitKind(p.tribe), p.tribe, 50), h('span', { class: 'tt-origin' }, 'Empire Origin')));

    for (const t of mine) {
      const at = pos.get(t.id)!;
      const st = status.get(t.id)!;
      const cost = techCost(s, pid, t.id);
      const affordable = st === 'available' && p.stars >= cost;
      const surging = st === 'owned' && t.cond && condActive(s, pid, t.cond);
      const tone = GOLD.has(t.ring) ? 'gold' : 'silver';
      board.append(h('button', {
        class: `tt-star ${st} ${tone} ring-${t.ring}${affordable ? ' affordable' : ''}${surging ? ' surging' : ''}${focused === t.id ? ' focus' : ''}`,
        style: { left: `${at.x}px`, top: `${at.y}px` },
        'aria-label': `${t.name} (${st})`,
        onclick: () => openTech(t.id),
      },
        h('span', { class: 'tt-glyph', html: `<svg width="26" height="26" viewBox="-13 -13 26 26">${glyph(t.ring, 10)}${st === 'sealed' ? '<path d="M-6 -6L6 6M6 -6L-6 6"/>' : ''}</svg>` }),
        h('span', { class: 'tt-label' }, t.name),
        st === 'available' ? h('span', { class: 'tt-cost' }, starSpan(cost)) : null,
      ));
    }

    const wrap = h('div', { class: `tt-wrap${whole ? ' whole' : ''}` });
    if (whole) {
      const fit = Math.min(1, (window.innerWidth - 12) / size, (window.innerHeight - 200) / size);
      board.style.transform = `scale(${fit})`;
      wrap.append(h('div', { class: 'tt-fit', style: { width: `${size * fit}px`, height: `${size * fit}px` } }, board));
    } else wrap.append(board);
    layer.append(
      h('div', { class: 'tt-top' },
        h('button', { class: 'round-btn light', onclick: close, 'aria-label': 'Close skill tree' }, iconEl('back')),
        hud(),
      ),
      wrap,
      h('div', { class: 'tt-foot' },
        h('button', { class: 'tt-zoom', onclick: () => { whole = !whole; render(); } }, whole ? 'Close-up' : 'Whole sky'),
        h('span', {}, 'Gold and silver stars are learned. Triangles are forks: one side only. Hexagons link two finished branches. The outer ring surges with the map.'),
      ),
    );
    // open centred on the Empire Origin (or where the player was looking)
    requestAnimationFrame(() => {
      if (whole) return;
      const f = focused ? pos.get(focused) : null;
      wrap.scrollLeft = scroll?.x ?? (f ? f.x : size / 2) - wrap.clientWidth / 2;
      wrap.scrollTop = scroll?.y ?? (f ? f.y : size / 2) - wrap.clientHeight / 2;
    });
  };

  /** The first tech still to research on the way to `target` (itself once it is open), or null. */
  const nextStep = (target: string): string | null => {
    const st = researchStatus(s, pid, target);
    if (st === 'available') return target;
    if (st !== 'locked') return null;
    for (const q of prereqs(TECH_BY_ID[target])) {
      if (researchStatus(s, pid, q) === 'owned') continue;
      const n = nextStep(q);
      if (n) return n;
    }
    return null;
  };

  const openTech = (id: string) => {
    const t = TECH_BY_ID[id];
    const st = researchStatus(s, pid, id);
    const cost = techCost(s, pid, id);
    const unit = Object.values(UNITS).find((u) => u.tech === id && u.trainable && (u.kind === tribe.unique || u.kind !== tribe.replaces));
    // Egyptians' farms grow cities by 3
    const unlocks = id === 'farming' && p.tribe === 'egypt' ? t.unlocks.replace('+2 pop', '+3 pop')
      : id === 'hunting' && p.tribe === 'zulu' ? t.unlocks.replace('+1 pop', '+2 pop') : t.unlocks;
    const body: (Node | string)[] = [h('p', { class: 'tt-kind' }, t.tribe ? `${ringLabel(t)} · ${tribe.people}` : ringLabel(t))];
    if (t.flavor) body.push(h('p', { class: 'muted' }, t.flavor));
    if (!t.tribe || UNIQUE_BY_ID[t.id].perks.length) body.push(h('p', {}, unlocks));
    if (t.cond) {
      const on = condActive(s, pid, t.cond);
      body.push(h('p', { class: `tt-surge${on ? ' on' : ''}` }, `Surge — while ${COND_TEXT[t.cond].when}: ${t.surge} `, h('b', {}, on ? '(surging now)' : '(dormant)')));
    }
    if (t.requires) body.push(h('p', { class: 'muted' }, `Opens when both branches are complete: ${t.branches}.`));
    const wonders = WONDERS.filter((w) => w.tech === id); // World Wonders this tech lets you begin (see game/wonders)
    if (wonders.length) body.push(h('p', { class: 'muted' }, `World Wonder${wonders.length > 1 ? 's' : ''}: ${wonders.map((w) => w.name).join(', ')}.`));
    const rivals = mine.filter((x) => x.fork && x.fork === t.fork && x.id !== id);
    if (t.fork && st !== 'owned') body.push(h('p', { class: 'muted' }, st === 'sealed' ? `Sealed: you chose ${rivals.map((r) => r.name).join(', ')}. A Transmutation Shift can undo that.` : `A fork: learning this seals ${rivals.map((r) => r.name).join(', ')}.`));
    const missing = prereqs(t).filter((q) => researchStatus(s, pid, q) !== 'owned');
    if (st === 'locked' && missing.length) body.push(h('p', { class: 'muted' }, `Research ${missing.map((q) => TECH_BY_ID[q].name).join(' and ')} first.`));
    const goTo = (next: string) => {
      focused = next;
      render();
      openTech(next);
    };
    if (st === 'owned') {
      body.push(h('p', { class: 'muted' }, 'Already known.'));
      const why = transmuteCheck(s, pid, id);
      const branch = subBranch(s, pid, id);
      const tc = transmuteCost(s, pid), back = transmuteRefund(s, pid, id);
      if (!(t.ring === 'core' && t.tier === 1)) {
        body.push(h('p', { class: 'tt-transmute' }, `Transmutation Shift: pay ${tc}★ to unlearn ${branch.map((b) => TECH_BY_ID[b].name).join(', ')} and get ${back}★ back to spend anew.`));
      }
      modal({
        title: t.name, art: unit ? unitPortrait(unit.kind, p.tribe, 72) : undefined, body, dismissable: true,
        buttons: t.ring === 'core' && t.tier === 1 ? [{ label: 'OK', primary: true }] : [
          { label: 'OK' },
          {
            label: h('span', {}, 'Transmute ', starSpan(tc)),
            primary: !why,
            onClick: () => { if (!why && transmute(s, pid, id)) { onChange(); render(); } },
          },
        ],
      });
      if (why) {
        const btn = document.querySelector<HTMLButtonElement>('.modal-layer:last-child .mbtn:last-child');
        if (btn) { btn.disabled = true; btn.title = why; }
      }
      return;
    }
    const step = st === 'locked' ? nextStep(id) : null;
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
                // researched a step on the way to the goal: go on to the next missing one (or the goal)
                const next = goal && goal !== id ? nextStep(goal) : null;
                if (next) goTo(next);
                else render();
              }
            },
          },
        ]
        : step
          ? [{ label: 'Close' }, { label: `Go to ${TECH_BY_ID[step].name}`, primary: true, onClick: () => goTo(step) }]
          : [{ label: 'OK', primary: true }],
    });
    if (st === 'available' && p.stars < cost) {
      const btn = document.querySelector<HTMLButtonElement>('.modal-layer:last-child .mbtn.primary');
      if (btn) btn.disabled = true;
    }
  };

  render();
  document.getElementById('ui')!.append(layer);
  if (focused) openTech(focused);
  return { close, refresh: render };
}
