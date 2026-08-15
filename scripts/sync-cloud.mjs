#!/usr/bin/env node
/* ============================================================
   Cloud sync — snapshots trades, discipline, and the vault into
   static files under web/public/, so the Vercel deploy (no
   server, no filesystem access to the Mac) has something to read.

   Run this whenever you want the phone's cloud view refreshed:
     npm run sync:cloud
   It regenerates the snapshot and (unless --no-push) commits and
   pushes it, which triggers a Vercel redeploy in ~30-60s.
   ============================================================ */

import { copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import matter from 'gray-matter';
import { ROOT, VAULT_ROOT, TRADES_FILE, DATA_DIR, MEDIA_DIR } from '../server/config.mjs';
import { getIndex, buildTree, extractLinks, safeVaultPath } from '../server/vault.mjs';

const run = promisify(execFile);

const WEB_PUBLIC = path.join(ROOT, 'web', 'public');
const CLOUD_DATA = path.join(WEB_PUBLIC, 'cloud-data');
const VAULT_MEDIA_OUT = path.join(CLOUD_DATA, 'vault-media');
const TRADE_MEDIA_OUT = path.join(WEB_PUBLIC, 'media');
const DISCIPLINE_FILE = path.join(DATA_DIR, 'discipline.json');

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
}

async function copyDir(src, dest) {
  await mkdir(dest, { recursive: true });
  let entries;
  try {
    entries = await readdir(src, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return;
    throw err;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) await copyDir(from, to);
    else await copyFile(from, to);
  }
}

async function buildVaultSnapshot() {
  const index = await getIndex(true);
  const tree = buildTree(index.notes);

  const notes = {};
  const backlinksByPath = {};
  for (const n of index.notes) backlinksByPath[n.path] = [];

  for (const n of index.notes) {
    if (n.empty) continue;
    const abs = safeVaultPath(n.path);
    let raw;
    try {
      raw = await readFile(abs, 'utf8');
    } catch {
      continue;
    }
    const parsed = matter(raw);
    const links = extractLinks(parsed.content, n.path, index);
    notes[n.path] = {
      path: n.path,
      name: n.name,
      folder: n.folder || '',
      frontmatter: parsed.data,
      body: parsed.content,
      links,
    };
    for (const link of links) {
      if (link.resolved && backlinksByPath[link.resolved]) {
        backlinksByPath[link.resolved].push({ name: n.name, path: n.path, folder: n.folder || '' });
      }
    }
  }

  // Every media file in the vault, copied flat under a safe encoded name so
  // nested folders never collide and the URL scheme stays trivial.
  const mediaMap = {};
  await rm(VAULT_MEDIA_OUT, { recursive: true, force: true });
  await mkdir(VAULT_MEDIA_OUT, { recursive: true });
  for (const m of index.media) {
    const safe = Buffer.from(m.path).toString('base64url') + path.extname(m.path);
    await copyFile(path.join(VAULT_ROOT, m.path), path.join(VAULT_MEDIA_OUT, safe));
    mediaMap[m.path] = `/cloud-data/vault-media/${safe}`;
  }

  return {
    vault: path.basename(VAULT_ROOT),
    noteCount: index.notes.filter((n) => !n.empty).length,
    tree,
    notes,
    backlinksByPath,
    mediaMap,
  };
}

async function main() {
  const push = !process.argv.includes('--no-push');

  const trades = await readJson(TRADES_FILE, { version: 1, entries: [], updatedAt: null });
  const discipline = await readJson(DISCIPLINE_FILE, {
    version: 1,
    accounts: [],
    activeAccountId: null,
    adjustments: [],
    checks: [],
    equippedOutfit: 'standard',
    equippedCompanion: null,
    live: null,
    backtests: [],
  });

  console.log('[sync-cloud] walking vault…');
  const vault = await buildVaultSnapshot();

  console.log('[sync-cloud] copying trade screenshots…');
  await rm(TRADE_MEDIA_OUT, { recursive: true, force: true });
  await copyDir(MEDIA_DIR, TRADE_MEDIA_OUT);

  await mkdir(CLOUD_DATA, { recursive: true });
  const snapshot = {
    syncedAt: new Date().toISOString(),
    trades: { entries: trades.entries },
    discipline: {
      version: 1,
      accounts: discipline.accounts ?? [],
      activeAccountId: discipline.activeAccountId ?? null,
      adjustments: discipline.adjustments ?? [],
      checks: discipline.checks ?? [],
      equippedOutfit: discipline.equippedOutfit ?? 'standard',
      equippedCompanion: discipline.equippedCompanion ?? null,
      live: discipline.live ?? null,
      backtests: discipline.backtests ?? [],
    },
    vault,
  };
  await writeFile(path.join(CLOUD_DATA, 'snapshot.json'), JSON.stringify(snapshot), 'utf8');

  const kb = (JSON.stringify(snapshot).length / 1024).toFixed(0);
  console.log(`[sync-cloud] snapshot.json written (${kb} KB), ${vault.noteCount} notes, ${Object.keys(vault.mediaMap).length} vault images, ${trades.entries.length} trades`);

  if (!push) {
    console.log('[sync-cloud] --no-push — leaving changes uncommitted');
    return;
  }

  await run('git', ['add', 'web/public/cloud-data', 'web/public/media'], { cwd: ROOT });
  const status = await run('git', ['status', '--porcelain', '--', 'web/public/cloud-data', 'web/public/media'], { cwd: ROOT });
  if (!status.stdout.trim()) {
    console.log('[sync-cloud] nothing changed since last sync');
    return;
  }
  await run('git', ['commit', '-m', `Cloud sync: ${new Date().toISOString()}`], { cwd: ROOT });
  await run('git', ['push'], { cwd: ROOT });
  console.log('[sync-cloud] pushed — Vercel will redeploy shortly');
}

main().catch((err) => {
  console.error('[sync-cloud] failed:', err);
  process.exit(1);
});
