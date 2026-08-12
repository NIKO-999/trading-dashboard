/* ============================================================
   Discipline store — accounts, balance ledger, daily check-ins.

   Kept separate from trades.json on purpose: different lifecycle, and it keeps
   the trade store clean. Same durability rules as trades.mjs — atomic writes and
   rolling backups, because losing a discipline history is losing the whole point
   of the module.
   ============================================================ */

import { copyFile, mkdir, readdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import express from 'express';
import { BACKUP_DIR, DATA_DIR } from './config.mjs';

const FILE = path.join(DATA_DIR, 'discipline.json');
const KEEP_BACKUPS = 20;

const EMPTY = {
  version: 1,
  accounts: [],
  activeAccountId: null,
  adjustments: [],
  checks: [],
  equippedOutfit: 'standard',
  equippedCompanion: null,
  live: null,
  backtests: [],
  updatedAt: null,
};

export async function readDiscipline() {
  try {
    const parsed = JSON.parse(await readFile(FILE, 'utf8'));
    return {
      ...EMPTY,
      ...parsed,
      accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
      adjustments: Array.isArray(parsed.adjustments) ? parsed.adjustments : [],
      checks: Array.isArray(parsed.checks) ? parsed.checks : [],
      backtests: Array.isArray(parsed.backtests) ? parsed.backtests : [],
      // One open position at a time. Anything else on disk is treated as none —
      // a malformed live record must never block you from logging.
      live: parsed.live && typeof parsed.live === 'object' ? parsed.live : null,
    };
  } catch (err) {
    if (err.code === 'ENOENT') return { ...EMPTY };
    console.error('[discipline] could not parse discipline.json:', err.message);
    throw err;
  }
}

async function backup() {
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    await copyFile(FILE, path.join(BACKUP_DIR, `discipline-${stamp}.json`));
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn('[discipline] backup failed:', err.message);
    return;
  }
  try {
    const files = (await readdir(BACKUP_DIR)).filter((f) => f.startsWith('discipline-')).sort();
    for (const stale of files.slice(0, -KEEP_BACKUPS)) {
      await unlink(path.join(BACKUP_DIR, stale));
    }
  } catch {
    /* pruning is best-effort */
  }
}

export async function writeDiscipline(payload) {
  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(BACKUP_DIR, { recursive: true });
  await backup();

  const next = {
    version: 1,
    accounts: payload.accounts ?? [],
    activeAccountId: payload.activeAccountId ?? null,
    adjustments: payload.adjustments ?? [],
    checks: payload.checks ?? [],
    // Explicitly listed, not spread — the shape on disk is the contract. That
    // also means a new field is invisible until it is named here.
    equippedOutfit: payload.equippedOutfit ?? 'standard',
    equippedCompanion: payload.equippedCompanion ?? null,
    live: payload.live ?? null,
    backtests: payload.backtests ?? [],
    updatedAt: new Date().toISOString(),
  };

  const tmp = `${FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(next, null, 2), 'utf8');
  await rename(tmp, FILE);
  return next;
}

export function disciplineRouter() {
  const router = express.Router();

  router.get('/', async (_req, res) => {
    try {
      res.json(await readDiscipline());
    } catch {
      res.status(500).json({ error: 'discipline.json is unreadable' });
    }
  });

  router.put('/', async (req, res) => {
    const body = req.body;
    if (!body || !Array.isArray(body.accounts) || !Array.isArray(body.checks)) {
      return res.status(400).json({ error: 'Expected { accounts: [], checks: [], ... }' });
    }
    try {
      res.json(await writeDiscipline(body));
    } catch (err) {
      console.error('[discipline] write failed:', err);
      res.status(500).json({ error: 'Could not save discipline data' });
    }
  });

  return router;
}
