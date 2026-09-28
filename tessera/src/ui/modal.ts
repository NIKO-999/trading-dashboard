import { h } from './dom';

export interface ModalButton {
  label: string | Node;
  primary?: boolean;
  onClick?: () => void;
  keepOpen?: boolean;
}

/** Shows a centred card. Returns a close function. */
export function modal(opts: { title: string; body: (Node | string)[]; art?: Node; buttons?: ModalButton[]; dismissable?: boolean; cls?: string }) {
  const layer = h('div', { class: 'modal-layer' });
  const close = () => layer.remove();
  const buttons = (opts.buttons ?? [{ label: 'OK', primary: true }]).map((b) =>
    h('button', {
      class: `mbtn${b.primary ? ' primary' : ''}`,
      onclick: () => {
        if (!b.keepOpen) close();
        b.onClick?.();
      },
    }, b.label),
  );
  const card = h('div', { class: `modal ${opts.cls ?? ''}` },
    h('h2', {}, opts.title),
    h('div', { class: 'modal-row' }, opts.art ? h('div', { class: 'modal-art' }, opts.art) : null, h('div', { class: 'modal-body' }, ...opts.body)),
    buttons.length ? h('div', { class: 'modal-buttons' }, ...buttons) : null,
  );
  layer.append(card);
  if (opts.dismissable) layer.addEventListener('click', (e) => e.target === layer && close());
  document.getElementById('ui')!.append(layer);
  return close;
}

export function toast(text: string, color?: string) {
  let host = document.querySelector<HTMLElement>('.toasts');
  if (!host) {
    host = h('div', { class: 'toasts' });
    document.getElementById('ui')!.append(host);
  }
  const t = h('div', { class: 'toast', style: color ? { borderLeftColor: color } : {} }, text);
  host.append(t);
  setTimeout(() => t.classList.add('out'), 2600);
  setTimeout(() => t.remove(), 3100);
}
