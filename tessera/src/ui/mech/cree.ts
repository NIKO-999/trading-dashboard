import { h } from '../dom';
import { contactIncome, hardWinter, postIncome, posts, turnsToWinter, winters } from '../../game/mech/cree';
import type { MechUi } from './types';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// HUD readout: the trading posts and what they and their visitors pay, then the Winter Count (the years recorded, good
// ones as a deer and hard ones as a snowflake, and the turns to the next count).
export const ui: MechUi = {
  hud(v) {
    const ps = posts(v.s, v.me).length;
    const inc = postIncome(v.s, v.me), met = contactIncome(v.s, v.me);
    const ws = winters(v.s, v.me);
    const story = ws.slice(-4).map((w) => (w.good ? '🦌' : '❄')).join('');
    const next = turnsToWinter(v.s);
    const hard = hardWinter(v.s, v.me);
    return h('div', { class: 'karma', title: 'Trading posts pay +1★ a turn, +1★ per animal beside them (at most 3★); foreign units and traders beside a post pay +1★ each (at most 3★). Every 10 turns the Winter Count: if no city was lost, every city grows by 1. Pemmican: your units outside your borders heal 2 HP a turn.' },
      `🛶 ${plural(ps, 'post', 'posts')} · +${inc}★${met ? ` · visitors +${met}★` : ''} · Winter Count ${story ? story + ' ' : ''}in ${next}${hard ? ' (a hard year)' : ''}`);
  },
  chip(v) {
    return { icon: '🛶', text: `+${postIncome(v.s, v.me) + contactIncome(v.s, v.me)}★ · ❄${turnsToWinter(v.s)}` };
  },
};
