/* ============================================================
   Trades store — one JSON file, atomically written.

   This is the single source of truth shared by the Mac and the phone.
   Writes go to a temp file and are renamed into place, so an interrupted
   write can never leave a half-written trades.json behind.
   ============================================================ */

import { copyFile, mkdir, readdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import express from 'express';
import { BACKUP_DIR, DATA_DIR, TRADES_FILE } from './config.mjs';

const KEEP_BACKUPS = 20;
const EMPTY = { version: 1, entries: [], updatedAt: null };

export async function ensureDataDirs() {
  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(BACKUP_DIR, { recursive: true });
}

export async function readTrades() {
  try {
    const raw = await readFile(TRADES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.entries)) return { ...EMPTY };
    return parsed;
  } catch (err) {
    if (err.code === 'ENOENT') return { ...EMPTY };
    // A corrupt file is worth shouting about rather than silently resetting.
    console.error('[trades] could not parse trades.json:', err.message);
    throw err;
  }
}

async function backup() {
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    await copyFile(TRADES_FILE, path.join(BACKUP_DIR, `trades-${stamp}.json`));
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn('[trades] backup failed:', err.message);
    return;
  }
  try {
    const files = (await readdir(BACKUP_DIR)).filter((f) => f.startsWith('trades-')).sort();
    for (const stale of files.slice(0, -KEEP_BACKUPS)) {
      await unlink(path.join(BACKUP_DIR, stale));
    }
  } catch {
    /* pruning is best-effort */
  }
}

export async function writeTrades(payload) {
  await ensureDataDirs();
  await backup();
  const next = {
    version: 1,
    entries: payload.entries,
    updatedAt: new Date().toISOString(),
  };
  const tmp = `${TRADES_FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(next, null, 2), 'utf8');
  await rename(tmp, TRADES_FILE);
  return next;
}

export function tradesRouter() {
  const router = express.Router();

  router.get('/', async (_req, res) => {
    try {
      res.json(await readTrades());
    } catch {
      res.status(500).json({ error: 'trades.json is unreadable' });
    }
  });

  router.put('/', async (req, res) => {
    const body = req.body;
    if (!body || !Array.isArray(body.entries)) {
      return res.status(400).json({ error: 'Expected { entries: [...] }' });
    }
    try {
      res.json(await writeTrades(body));
    } catch (err) {
      console.error('[trades] write failed:', err);
      res.status(500).json({ error: 'Could not save trades' });
    }
  });

  return router;
}
