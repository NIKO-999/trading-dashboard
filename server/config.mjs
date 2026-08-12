import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

export const PORT = Number(process.env.PORT || 4400);

/** The Obsidian vault we read from. Read-only, always. */
export const VAULT_ROOT =
  process.env.VAULT_ROOT ||
  path.join(
    os.homedir(),
    'Library/Mobile Documents/iCloud~md~obsidian/Documents/AIOS',
  );

export const DATA_DIR = path.join(ROOT, 'data');
export const MEDIA_DIR = path.join(DATA_DIR, 'media');
export const BACKUP_DIR = path.join(DATA_DIR, 'backups');

/** Where launchd points the agent's stdout and stderr. Named here so the
 *  installer that writes those paths into the plist and the process that has
 *  to keep them from growing without bound cannot disagree about them. */
export const LOG_FILE = path.join(DATA_DIR, 'server.log');
export const ERROR_LOG_FILE = path.join(DATA_DIR, 'server.error.log');
export const TRADES_FILE = path.join(DATA_DIR, 'trades.json');
export const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

/** Cheapest current model — the diagnosis task is narrow enough not to need more. */
export const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';

export const HUB_DIR = path.join(ROOT, 'hub');
export const WEB_DIST = path.join(ROOT, 'web', 'dist');

/** Every LAN / Tailscale address this machine answers on — printed at boot. */
export function localAddresses() {
  const out = [];
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    for (const a of addrs || []) {
      if (a.family === 'IPv4' && !a.internal) {
        out.push({ name, address: a.address, tailscale: name.startsWith('utun') });
      }
    }
  }
  return out;
}
