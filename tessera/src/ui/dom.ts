import { renderDpr } from '../render/common';

type Child = Node | string | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, unknown> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener);
    else if (k === 'class') el.className = String(v);
    else if (k === 'style' && typeof v === 'object') {
      // Custom properties (--x) need setProperty; Object.assign silently drops them.
      for (const [prop, val] of Object.entries(v as Record<string, string>)) {
        if (prop.startsWith('--')) el.style.setProperty(prop, val);
        else (el.style as unknown as Record<string, string>)[prop] = val;
      }
    }
    else if (k === 'html') el.innerHTML = String(v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children) if (c !== null && c !== undefined && c !== false) el.append(c);
  return el;
}

export const $ui = () => document.getElementById('ui')!;

const pictures = new Map<string, string>();

/**
 * Draws a small picture (unit portrait, action icon). With a `key` the drawing is rendered once,
 * cached as an image and reused: iOS limits total canvas memory, so the UI shouldn't keep
 * dozens of live canvases around.
 */
export function paint(w: number, hgt: number, draw: (ctx: CanvasRenderingContext2D) => void, key?: string): HTMLElement {
  const picture = (src: string) => {
    const img = document.createElement('img');
    img.src = src;
    img.width = w;
    img.height = hgt;
    img.alt = '';
    img.draggable = false;
    img.className = 'pic';
    return img;
  };
  const cached = key ? pictures.get(key) : undefined;
  if (cached) return picture(cached);
  const c = document.createElement('canvas');
  const dpr = renderDpr();
  c.width = Math.round(w * dpr);
  c.height = Math.round(hgt * dpr);
  c.style.width = `${w}px`;
  c.style.height = `${hgt}px`;
  const ctx = c.getContext('2d')!;
  ctx.scale(dpr, dpr);
  draw(ctx);
  if (!key) return c;
  let url = '';
  try {
    url = c.toDataURL('image/png');
  } catch {
    return c;
  }
  pictures.set(key, url);
  c.width = c.height = 0; // hand the canvas memory back straight away
  return picture(url);
}

export const ICONS = {
  menu: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" fill="none"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
  tech: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" fill="currentColor"/><circle cx="4.5" cy="6" r="2" fill="currentColor"/><circle cx="19.5" cy="6" r="2" fill="currentColor"/><circle cx="12" cy="21" r="2" fill="currentColor"/><path d="M6 7l4.5 3.5M18 7l-4.5 3.5M12 15v4" stroke="currentColor" stroke-width="1.6"/></svg>',
  info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 10.5v6.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="7" r="1.5" fill="currentColor"/></svg>',
  trophy: '<svg viewBox="0 0 24 24"><path d="M7 4h10v5a5 5 0 0 1-10 0z" fill="currentColor"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M10 14h4l1 4H9z" fill="currentColor"/><rect x="7.5" y="18" width="9" height="2.5" rx="1" fill="currentColor"/></svg>',
  crown: '<svg viewBox="0 0 24 24"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" fill="currentColor"/></svg>',
  star: '<svg viewBox="0 0 24 24"><defs><linearGradient id="star-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset="0.5" stop-color="#ffcf33"/><stop offset="1" stop-color="#ff9a1a"/></linearGradient></defs><path d="M12 3.4l2.5 5.3 5.8.8-4.2 4.1 1 5.8L12 16.6l-5.1 2.8 1-5.8-4.2-4.1 5.8-.8z" fill="url(#star-g)" stroke="#b8650a" stroke-width="2.2" stroke-linejoin="round"/><ellipse cx="9.6" cy="8.9" rx="1.7" ry="0.95" fill="#fff" opacity="0.6" transform="rotate(-28 9.6 8.9)"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg>',
  lock: '<svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10.5" rx="2.5" fill="currentColor"/><path d="M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5" stroke="currentColor" stroke-width="2.4" fill="none"/></svg>',
  globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>',
};

export const iconEl = (name: keyof typeof ICONS, cls = 'ico') => h('span', { class: cls, html: ICONS[name] });
export const starSpan = (n: number | string) => h('span', { class: 'stars' }, String(n), iconEl('star', 'ico-star'));
