/* ============================================================
   Captures a baseline content hash for every note the framework mapping in
   web/src/data/framework.ts was curated from.

   The app compares live hashes against this baseline and warns when a source
   note has changed, so a hand-curated checklist can never silently drift out of
   step with the vault it claims to represent.

   Run this whenever you regenerate the mapping:
     node scripts/gen-framework-hashes.mjs
   ============================================================ */

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { VAULT_ROOT } from '../server/config.mjs';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const SOURCE = path.join(ROOT, 'web', 'src', 'data', 'framework.ts');
const OUT = path.join(ROOT, 'web', 'src', 'data', 'framework-hashes.json');

// Ask the mapping itself which notes it depends on.
//
// This used to regex `sourceNote:` string literals out of the file, which only
// ever saw INLINE literals — it silently missed every `sourceNote: S.foo`
// constant reference and every exported `*_SOURCE` constant. Those paths then
// had no baseline hash, and PreFlight's staleness check skips anything with no
// baseline, so the notes most likely to drift were the ones never checked. The
// hand-added Wick Size Rule line below was a patch for one instance of that.
//
// Node strips types natively now and framework.ts's only import is type-only,
// so the real frameworkSources() can just be called. One source of truth.
const { frameworkSources } = await import(pathToFileURL(SOURCE).href);
const paths = frameworkSources();

const hashes = {};
let missing = 0;

for (const rel of [...new Set(paths)].sort()) {
  try {
    const raw = await readFile(path.join(VAULT_ROOT, rel), 'utf8');
    hashes[rel] = createHash('sha1').update(raw).digest('hex').slice(0, 12);
  } catch {
    hashes[rel] = null;
    missing++;
    console.warn(`[framework]  MISSING  ${rel}`);
  }
}

await writeFile(OUT, `${JSON.stringify({ capturedAt: new Date().toISOString(), hashes }, null, 2)}\n`, 'utf8');

console.log(`[framework] ${Object.keys(hashes).length} sources hashed${missing ? `, ${missing} MISSING` : ''}`);
if (missing) process.exitCode = 1;
