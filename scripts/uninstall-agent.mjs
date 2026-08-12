/* ============================================================
   Stops the launchd agent and removes its plist.

   `launchctl unload` is the command most instructions still reach for, and on
   a current macOS it is the deprecated half of the API — it can report success
   while leaving the job registered, which then reappears at the next login and
   looks like an uninstall that silently undid itself. bootout is the modern
   counterpart to bootstrap and is what actually unregisters the label.
   ============================================================ */

import { execFile } from 'node:child_process';
import { rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

const LABEL = 'com.niko.missioncontrol';
const PLIST_PATH = path.join(os.homedir(), 'Library', 'LaunchAgents', `${LABEL}.plist`);
const TARGET = `gui/${process.getuid()}`;

if (process.platform !== 'darwin') {
  console.error('[agent] launchd is macOS-only — nothing to uninstall here.');
  process.exit(1);
}

let wasLoaded = true;
try {
  await run('launchctl', ['bootout', `${TARGET}/${LABEL}`]);
} catch {
  // Nothing was loaded. Fine — the plist still gets removed below.
  wasLoaded = false;
}

await rm(PLIST_PATH, { force: true });

console.log(
  wasLoaded
    ? `[agent] stopped and removed ${PLIST_PATH}`
    : `[agent] nothing was loaded; removed ${PLIST_PATH} if it existed`,
);
console.log('[agent] your data in data/ is untouched.');
