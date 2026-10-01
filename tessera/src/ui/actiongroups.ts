// Sorting a long tile menu into tabs: the city's units by kind (ground, ranged, mounted, support, ships, economy), its
// own works (governors, festivals, the Barracks), the Armoury, a unit's own orders, and building on the land. Pure, so
// it can be tested without a page; ui/game draws the tabs.
import { UNITS } from '../data/units';
import { MOUNTED_KINDS } from '../game/perks';
import { isRoleKind } from '../game/roles';
import { isTraderKind } from '../game/trade';
import type { Action } from '../game/rules';
import type { UnitKind } from '../game/types';

export type ActGroup = 'ground' | 'ranged' | 'mounted' | 'support' | 'ships' | 'economy' | 'city' | 'armoury' | 'unit' | 'build';
export const GROUPS: { id: ActGroup; label: string; icon: string }[] = [
  { id: 'unit', label: 'Unit', icon: '⭐' },
  { id: 'ground', label: 'Ground', icon: '🗡' },
  { id: 'ranged', label: 'Ranged', icon: '🏹' },
  { id: 'mounted', label: 'Mounted', icon: '🐎' },
  { id: 'support', label: 'Support', icon: '✚' },
  { id: 'ships', label: 'Ships', icon: '⛵' },
  { id: 'economy', label: 'Economy', icon: '💰' },
  { id: 'city', label: 'City', icon: '🏛' },
  { id: 'armoury', label: 'Armoury', icon: '⚒' },
  { id: 'build', label: 'Build', icon: '🔨' },
];
/** A menu this short is shown as one row, without tabs. */
export const TAB_THRESHOLD = 7;

const ECONOMY_ROLES: UnitKind[] = ['builder', 'collector'];
const SHIP_ROLES: UnitKind[] = ['fishfleet', 'voyager'];

function unitGroup(k: UnitKind): ActGroup {
  const d = UNITS[k];
  if (!d) return 'ground';
  if (isTraderKind(k) || ECONOMY_ROLES.includes(k)) return 'economy';
  if (d.naval || SHIP_ROLES.includes(k)) return 'ships';
  if (isRoleKind(k) || k === 'scout' || k === 'healer' || k === 'explorer') return 'support';
  if (MOUNTED_KINDS.includes(k)) return 'mounted';
  if (d.range > 1) return 'ranged';
  return 'ground';
}

/** Which tab an action belongs in. */
export function actionGroup(a: Action): ActGroup {
  const id = a.id;
  if (id.startsWith('train:')) return unitGroup(id.slice(6) as UnitKind);
  if (id.startsWith('forge:') || id === 'barracks:expand') return 'armoury';
  if (id.startsWith('upgrade:') || id === 'recover' || id === 'capture' || id === 'barracks:train' || id.startsWith('aux:') || id.startsWith('role:') || id === 'frontier' || id.startsWith('hero:')) return 'unit';
  if (id.startsWith('gov:') || id.startsWith('req:') || id === 'fest' || id === 'barracks' || id.startsWith('wonder:') || id.startsWith('free:') || id.startsWith('mech:') || id.startsWith('trade:')) return 'city';
  return 'build';
}

/** Ready first, then those waiting on Stars or room, then those locked behind a tech. */
export const actionRank = (a: Action) => (a.enabled ? 0 : a.needs ? 2 : 1);

export interface ActTab { id: ActGroup; label: string; icon: string; acts: Action[]; ready: number }

/** The menu's tabs, in a fixed order, each with its actions sorted ready-first. Empty tabs are left out. */
export function groupActions(acts: Action[]): ActTab[] {
  const by = new Map<ActGroup, Action[]>();
  for (const a of acts) {
    const g = actionGroup(a);
    by.set(g, [...(by.get(g) ?? []), a]);
  }
  return GROUPS.filter((g) => by.has(g.id)).map((g) => {
    const list = by.get(g.id)!.map((a, i) => ({ a, i })).sort((x, y) => actionRank(x.a) - actionRank(y.a) || x.i - y.i).map((x) => x.a);
    return { ...g, acts: list, ready: list.filter((a) => a.enabled).length };
  });
}

/** The tab to open: the remembered one if it is still there, else the first with something ready, else the first. */
export function pickTab(tabs: ActTab[], remembered: ActGroup | null): ActGroup | null {
  if (!tabs.length) return null;
  if (remembered && tabs.some((t) => t.id === remembered)) return remembered;
  return (tabs.find((t) => t.ready > 0) ?? tabs[0]).id;
}
