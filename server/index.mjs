/* ============================================================
   MISSION CONTROL — server

   One origin serves three things:
     /          the vanilla hub (gateway, ambient shader)
     /trading   the React dashboard (production build)
     /api       vault reads, trades, media uploads

   Binds 0.0.0.0 so the phone can reach it over LAN or Tailscale. There is
   no auth: this is meant to live on a private network only.
   ============================================================ */

import { access } from 'node:fs/promises';
import compression from 'compression';
import express from 'express';
import {
  HUB_DIR,
  MEDIA_DIR,
  PORT,
  VAULT_ROOT,
  WEB_DIST,
  localAddresses,
} from './config.mjs';
import { vaultRouter } from './vault.mjs';
import { ensureDataDirs, tradesRouter } from './trades.mjs';
import { disciplineRouter } from './discipline.mjs';
import { ensureMediaDir, mediaRouter } from './media.mjs';
import { settingsRouter } from './settings.mjs';
import { diagnoseRouter } from './diagnose.mjs';
import { startLogCapping } from './logs.mjs';

const app = express();
app.disable('x-powered-by');

/* Gzip everything compressible before it leaves the process.
   On the LAN this barely mattered, so it was never added. Over a tunnel it is
   the difference between working and not: the phone was pulling the 919KB
   dashboard bundle uncompressed, mobile Safari gave up part-way, and the app
   never booted — the tunnel log showed the same asset cancelled four times in
   a row. Compressed it is ~260KB, which survives the round trip.
   Must sit above the static handlers to catch what they serve. */
app.use(compression());

app.use(express.json({ limit: '2mb' }));

/* ---------- api ---------- */

app.get('/api/health', async (_req, res) => {
  let vaultOk = true;
  try {
    await access(VAULT_ROOT);
  } catch {
    vaultOk = false;
  }
  res.json({ ok: true, vault: vaultOk, vaultRoot: VAULT_ROOT });
});

app.use('/api/vault', vaultRouter());
app.use('/api/trades', tradesRouter());
app.use('/api/discipline', disciplineRouter());
app.use('/api/media', mediaRouter());
app.use('/api/settings', settingsRouter());
app.use('/api/diagnose', diagnoseRouter());

/* ---------- static ---------- */

app.use('/media', express.static(MEDIA_DIR, { maxAge: '7d' }));
app.use('/trading', express.static(WEB_DIST, { index: 'index.html' }));
app.use('/', express.static(HUB_DIR, { index: 'index.html' }));

// The dashboard is a single page — any unknown /trading/* path is its own route.
// Except under /assets: those filenames are content-hashed, so a request for one
// that no longer exists is a stale cache asking for a deleted build, not a route.
// Answering those with index.html handed the browser HTML labelled as
// JavaScript, with a 200 on it — so a phone holding an old service worker got a
// silent parse failure and a blank page instead of a cache miss it could
// recover from. A 404 is the truthful answer and the one that self-heals.
app.get('/trading/assets/*', (_req, res) => res.sendStatus(404));
app.get('/trading/*', (_req, res) => res.sendFile(`${WEB_DIST}/index.html`));

/* ---------- boot ---------- */

async function main() {
  await ensureDataDirs();
  await ensureMediaDir();
  startLogCapping();

  try {
    await access(VAULT_ROOT);
  } catch {
    console.warn(`[vault] NOT FOUND at ${VAULT_ROOT} — Knowledge Base will be empty.`);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  MISSION CONTROL — port ${PORT}`);
    console.log(`  vault: ${VAULT_ROOT}`);
    console.log(`\n  local     http://localhost:${PORT}`);
    for (const iface of localAddresses()) {
      const tag = iface.tailscale ? 'tailscale' : 'lan      ';
      console.log(`  ${tag} http://${iface.address}:${PORT}   (${iface.name})`);
    }
    console.log('');
  });
}

main();
