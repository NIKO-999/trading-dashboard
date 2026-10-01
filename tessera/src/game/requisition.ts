// Requisition: a big city (level 3+) or a market town can buy 1 Iron or 1 Horse with Stars. Each purchase raises the
// next price by REQ_STEP★ and the price only cools 1 step a turn (game/goods), so it is a way out of a
// shortage, not a mine.
import { canRequisition, reqPrice, STOCK_CAP, stockOf, type Strategic } from './goods';
import { cityById, citiesOf, doAction, type Action } from './rules';
import type { GameState, Tile } from './types';
import { emit } from './events';

const NAME: Record<Strategic, string> = { iron: 'Iron', horses: 'Horses' };

export function requisitionActions(s: GameState, pid: number, t: Tile): Action[] {
  const c = cityById(s, t.cityId);
  const p = s.players[pid];
  if (!c || c.owner !== pid || t.cityId !== c.id || p.neutral || c.data?.waka) return [];
  const price = reqPrice(p);
  const can = canRequisition(s, c);
  return (['iron', 'horses'] as Strategic[]).map((r) => {
    const full = stockOf(p)[r] >= STOCK_CAP;
    const why = !can ? 'Needs a level-3 city or a Market in its land' : full ? `Your ${NAME[r]} store is full` : p.stars < price ? 'Not enough stars' : undefined;
    return {
      id: `req:${r}`, label: `Buy 1 ${r === 'iron' ? 'Iron' : 'Horse'}`, cost: price, icon: r === 'iron' ? 'mine' : 'animal', enabled: !why, reason: why,
      desc: `Requisition from the city's smiths and horse-traders. Each purchase raises the price by 2★ (it eases 1★ a turn).`,
    };
  });
}

export function requisitionDo(s: GameState, pid: number, id: string): boolean {
  const r = id.slice(4) as Strategic;
  const p = s.players[pid];
  const st = stockOf(p);
  if (st[r] >= STOCK_CAP) return false;
  st[r] += 1;
  p.req = (p.req ?? 0) + 1;
  emit({ type: 'toast', player: pid, text: `+1 ${NAME[r] === 'Horses' ? 'Horse' : 'Iron'} requisitioned. The next costs ${reqPrice(p)}★.` });
  return true;
}

/** An AI that can field iron or horse units but has none buys one when the price is low and it is rich. */
export function requisitionAi(s: GameState, pid: number, wants: (r: Strategic) => boolean): boolean {
  const p = s.players[pid];
  if (p.stars < reqPrice(p) + 12 || (p.req ?? 0) >= 2) return false;
  const c = citiesOf(s, pid).find((k) => canRequisition(s, k));
  if (!c) return false;
  for (const r of ['iron', 'horses'] as Strategic[]) {
    if (stockOf(p)[r] < 2 && wants(r)) return doAction(s, pid, s.tiles[c.y * s.size + c.x], `req:${r}`);
  }
  return false;
}
