/* ============================================================
   Keeps the launchd agent's log files from growing without bound.

   Under the agent the server is not a thing you start and stop — RunAtLoad
   plus KeepAlive mean it runs from login until shutdown, for weeks. Every
   request line, every restart banner and every vault warning appends to
   data/server.log, and nothing was ever removing any of it. macOS ships
   newsyslog for exactly this, but its config lives in /etc and needs sudo,
   which is a heavy thing to require for an app that otherwise installs by
   copying one file into your own home directory.

   So the process caps its own logs. The one constraint that shapes how: the
   log file is not ours to replace. launchd opened it before we existed and
   holds the descriptor for the life of the process — rename it and launchd
   keeps writing happily into the unlinked inode, so the visible log stops
   updating and the disk never comes back. Truncating in place is the move
   that works, because launchd opens these append-only: after ftruncate the
   next write lands at offset 0 rather than off the end of a sparse file.

   The cost is that a truncation loses the old lines rather than rotating them
   to a .1 file. For a personal dashboard's stdout that is the right trade —
   what you want from this log is the last few hundred restarts, not an
   archive.
   ============================================================ */

import { open, stat } from 'node:fs/promises';
import { ERROR_LOG_FILE, LOG_FILE } from './config.mjs';

const MAX_BYTES = 5 * 1024 * 1024;

/** Long enough that a healthy server never pays for it, short enough that a
 *  crash loop writing a stack trace every 10s cannot fill a disk overnight. */
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

async function capOne(file) {
  let size;
  try {
    ({ size } = await stat(file));
  } catch {
    return; // Not running under launchd, or nothing has been logged yet.
  }
  if (size <= MAX_BYTES) return;

  // r+ rather than w: opening for write would truncate on open, which is the
  // same outcome by luck but leaves a window where the file is gone.
  const handle = await open(file, 'r+');
  try {
    await handle.truncate(0);
    console.log(`[logs] truncated ${file} at ${(size / 1024 / 1024).toFixed(1)}MB`);
  } finally {
    await handle.close();
  }
}

async function capAll() {
  for (const file of [LOG_FILE, ERROR_LOG_FILE]) {
    try {
      await capOne(file);
    } catch (err) {
      // A log that cannot be capped is not a reason to fail the boot.
      console.warn(`[logs] could not cap ${file}: ${err.message}`);
    }
  }
}

export function startLogCapping() {
  void capAll();
  // unref so this timer alone never holds the process open.
  setInterval(() => void capAll(), CHECK_INTERVAL_MS).unref();
}
