/* ============================================================
   Settings store — right now, just the Anthropic API key.

   Same durability shape as trades.mjs/discipline.mjs: atomic write, one file.
   No backups here on purpose — a lost key just gets re-pasted, it's not data
   you can lose in the way a trade record is.

   The one rule this file exists to enforce: the raw key never leaves the
   server. GET returns whether one is set and a masked preview only, so a
   screenshot or a shared screen never leaks the whole thing. Only PUT ever
   carries the full value, and only inbound.
   ============================================================ */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import express from 'express';
import { DATA_DIR, SETTINGS_FILE } from './config.mjs';

const EMPTY = { version: 1, anthropicApiKey: null, updatedAt: null };

export async function readSettings() {
  try {
    const parsed = JSON.parse(await readFile(SETTINGS_FILE, 'utf8'));
    return { ...EMPTY, ...parsed };
  } catch (err) {
    if (err.code === 'ENOENT') return { ...EMPTY };
    console.error('[settings] could not parse settings.json:', err.message);
    throw err;
  }
}

async function writeSettings(next) {
  await mkdir(DATA_DIR, { recursive: true });
  const payload = { version: 1, ...next, updatedAt: new Date().toISOString() };
  const tmp = `${SETTINGS_FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(payload, null, 2), 'utf8');
  await rename(tmp, SETTINGS_FILE);
  return payload;
}

/** Last 4 characters only — enough to recognise which key it is, nothing to act on. */
function mask(key) {
  if (!key || key.length < 4) return null;
  return `••••${key.slice(-4)}`;
}

export function settingsRouter() {
  const router = express.Router();

  router.get('/', async (_req, res) => {
    try {
      const s = await readSettings();
      res.json({ anthropicKeySet: Boolean(s.anthropicApiKey), anthropicKeyPreview: mask(s.anthropicApiKey) });
    } catch {
      res.status(500).json({ error: 'settings.json is unreadable' });
    }
  });

  router.put('/', async (req, res) => {
    const key = req.body?.anthropicApiKey;
    if (key !== null && typeof key !== 'string') {
      return res.status(400).json({ error: 'Expected { anthropicApiKey: string | null }' });
    }
    try {
      const s = await readSettings();
      const next = await writeSettings({ ...s, anthropicApiKey: key || null });
      res.json({ anthropicKeySet: Boolean(next.anthropicApiKey), anthropicKeyPreview: mask(next.anthropicApiKey) });
    } catch (err) {
      console.error('[settings] write failed:', err);
      res.status(500).json({ error: 'Could not save settings' });
    }
  });

  return router;
}
