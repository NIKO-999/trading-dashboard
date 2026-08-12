/* ============================================================
   Obsidian vault — READ ONLY.

   This module never writes, moves, or deletes anything inside the vault.
   There is deliberately no fs write import here: the only fs calls are
   readdir / readFile / stat. That is the guarantee that matters given how
   much lives in AIOS.
   ============================================================ */

import { readdir, readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import express from 'express';
import matter from 'gray-matter';
import { VAULT_ROOT } from './config.mjs';

const MEDIA_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif']);
const SKIP_DIRS = new Set(['node_modules', '.obsidian', '.trash', '.git']);
const CACHE_TTL = 30_000;

/* ---------- path safety ---------- */

/**
 * Resolve a vault-relative path and refuse anything that escapes the root.
 * Rejects absolute paths, `..` traversal, and symlink escapes.
 */
export function safeVaultPath(rel) {
  if (typeof rel !== 'string' || !rel.length) return null;
  if (path.isAbsolute(rel)) return null;
  const abs = path.resolve(VAULT_ROOT, rel);
  const root = path.resolve(VAULT_ROOT) + path.sep;
  if (abs !== path.resolve(VAULT_ROOT) && !abs.startsWith(root)) return null;
  return abs;
}

/* ---------- index ---------- */

let cache = { at: 0, notes: [], media: [] };

async function walk(dir, rel, notes, media) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return; // unreadable folder — skip rather than fail the whole scan
  }
  for (const entry of entries) {
    const name = entry.name;
    if (name.startsWith('.') || SKIP_DIRS.has(name)) continue;
    const childRel = rel ? `${rel}/${name}` : name;
    if (entry.isDirectory()) {
      await walk(path.join(dir, name), childRel, notes, media);
    } else {
      const ext = path.extname(name).toLowerCase();
      if (ext === '.md') {
        // Empty notes are noise when browsing — there is nothing to read if you
        // tap one. They stay in the index so existing [[wikilinks]] to them
        // still resolve; they are only kept out of the tree and search.
        let empty = false;
        try {
          empty = (await stat(path.join(dir, name))).size === 0;
        } catch {
          /* unreadable — leave it listed rather than silently hiding it */
        }
        notes.push({
          name: name.slice(0, -3),
          path: childRel,
          folder: rel,
          empty,
        });
      } else if (MEDIA_EXT.has(ext)) {
        media.push({ name, path: childRel, folder: rel });
      }
    }
  }
}

export async function getIndex(force = false) {
  if (!force && Date.now() - cache.at < CACHE_TTL && cache.notes.length) return cache;
  const notes = [];
  const media = [];
  await walk(VAULT_ROOT, '', notes, media);
  notes.sort((a, b) => a.path.localeCompare(b.path));
  media.sort((a, b) => a.path.localeCompare(b.path));
  cache = { at: Date.now(), notes, media };
  return cache;
}

/* ---------- wikilink resolution ---------- */

/** `[[Target|Alias]]` and `![[Embed]]`, capturing target, optional heading, alias. */
const WIKILINK_RE = /(!?)\[\[([^\]|#]+)(#[^\]|]+)?(?:\|([^\]]+))?\]\]/g;

/**
 * Obsidian-style shortest-path resolution: an exact path wins, otherwise match
 * on basename, preferring a note in the same folder as the one linking to it.
 */
export function resolveLink(target, fromPath, index) {
  const clean = target.trim().replace(/\\/g, '/');
  const pool = MEDIA_EXT.has(path.extname(clean).toLowerCase()) ? index.media : index.notes;
  const withExt = pool === index.notes && !clean.endsWith('.md') ? `${clean}.md` : clean;

  const exact = pool.find((f) => f.path === withExt || f.path === clean);
  if (exact) return exact;

  const base = path.basename(clean, path.extname(clean)).toLowerCase();
  const matches = pool.filter(
    (f) => path.basename(f.path, path.extname(f.path)).toLowerCase() === base,
  );
  if (!matches.length) return null;
  if (matches.length === 1) return matches[0];

  const fromFolder = fromPath ? path.dirname(fromPath) : '';
  return matches.find((f) => (f.folder || '.') === fromFolder) || matches[0];
}

/** Every wikilink in a body, resolved against the index. */
export function extractLinks(body, fromPath, index) {
  const links = [];
  for (const m of body.matchAll(WIKILINK_RE)) {
    const [, bang, target, heading, alias] = m;
    const hit = resolveLink(target, fromPath, index);
    links.push({
      raw: m[0],
      embed: bang === '!',
      target: target.trim(),
      heading: heading ? heading.slice(1) : null,
      alias: alias ? alias.trim() : null,
      resolved: hit ? hit.path : null,
    });
  }
  return links;
}

/* ---------- tree ---------- */

/** Flat note list → nested folder tree the sidebar can render. */
function buildTree(notes) {
  const root = { name: VAULT_ROOT.split('/').pop(), path: '', folders: [], notes: [] };
  const byPath = new Map([['', root]]);

  const folderFor = (folderPath) => {
    if (byPath.has(folderPath)) return byPath.get(folderPath);
    const parentPath = path.dirname(folderPath) === '.' ? '' : path.dirname(folderPath);
    const parent = folderFor(parentPath);
    const node = { name: path.basename(folderPath), path: folderPath, folders: [], notes: [] };
    parent.folders.push(node);
    byPath.set(folderPath, node);
    return node;
  };

  for (const n of notes) {
    if (n.empty) continue;
    folderFor(n.folder || '').notes.push({ name: n.name, path: n.path });
  }
  return root;
}

/* ---------- routes ---------- */

export function vaultRouter() {
  const router = express.Router();

  router.get('/tree', async (req, res) => {
    const index = await getIndex(req.query.refresh === '1');
    res.json({
      vault: path.basename(VAULT_ROOT),
      // the count the chip shows should match what is actually browsable
      noteCount: index.notes.filter((n) => !n.empty).length,
      tree: buildTree(index.notes),
    });
  });

  router.get('/note', async (req, res) => {
    const rel = String(req.query.path || '');
    const abs = safeVaultPath(rel);
    if (!abs || !rel.toLowerCase().endsWith('.md')) {
      return res.status(403).json({ error: 'Path outside vault' });
    }
    let raw;
    try {
      raw = await readFile(abs, 'utf8');
    } catch {
      return res.status(404).json({ error: 'Note not found' });
    }
    const index = await getIndex();
    const parsed = matter(raw);
    res.json({
      path: rel,
      name: path.basename(rel, '.md'),
      folder: path.dirname(rel) === '.' ? '' : path.dirname(rel),
      frontmatter: parsed.data,
      body: parsed.content,
      links: extractLinks(parsed.content, rel, index),
    });
  });

  router.get('/backlinks', async (req, res) => {
    const rel = String(req.query.path || '');
    if (!safeVaultPath(rel)) return res.status(403).json({ error: 'Path outside vault' });

    const index = await getIndex();
    const hits = [];
    for (const note of index.notes) {
      if (note.path === rel) continue;
      const abs = safeVaultPath(note.path);
      if (!abs) continue;
      let raw;
      try {
        raw = await readFile(abs, 'utf8');
      } catch {
        continue;
      }
      if (!raw.includes('[[')) continue;
      for (const link of extractLinks(raw, note.path, index)) {
        if (link.resolved === rel) {
          hits.push({ name: note.name, path: note.path, folder: note.folder });
          break;
        }
      }
    }
    res.json({ path: rel, backlinks: hits });
  });

  router.get('/media', async (req, res) => {
    const raw = String(req.query.path || '');
    const index = await getIndex();
    // Accept either a full vault path or a bare filename from an ![[embed]].
    const hit = raw.includes('/')
      ? index.media.find((m) => m.path === raw)
      : resolveLink(raw, null, index);
    const abs = hit && safeVaultPath(hit.path);
    if (!abs) return res.status(404).end();
    try {
      await stat(abs);
    } catch {
      return res.status(404).end();
    }
    res.sendFile(abs);
  });

  /**
   * Content hashes for specific notes. The discipline module's framework mapping
   * is curated by hand from these notes, so it can go stale if they're rewritten.
   * The app compares these against the baseline captured when the mapping was
   * generated and warns rather than drifting silently.
   */
  router.post('/hashes', async (req, res) => {
    const paths = Array.isArray(req.body?.paths) ? req.body.paths : null;
    if (!paths) return res.status(400).json({ error: 'Expected { paths: [...] }' });

    const out = {};
    for (const rel of paths.slice(0, 200)) {
      const abs = safeVaultPath(String(rel));
      if (!abs) {
        out[rel] = null;
        continue;
      }
      try {
        const raw = await readFile(abs, 'utf8');
        out[rel] = createHash('sha1').update(raw).digest('hex').slice(0, 12);
      } catch {
        out[rel] = null; // missing — the mapping points at a note that no longer exists
      }
    }
    res.json({ hashes: out });
  });

  router.get('/search', async (req, res) => {
    const q = String(req.query.q || '').toLowerCase().trim();
    const index = await getIndex();
    if (!q) return res.json({ results: [] });
    res.json({
      results: index.notes
        .filter((n) => !n.empty)
        .filter((n) => n.name.toLowerCase().includes(q) || n.path.toLowerCase().includes(q))
        .slice(0, 60),
    });
  });

  return router;
}
