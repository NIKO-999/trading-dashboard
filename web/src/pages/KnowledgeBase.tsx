/* ============================================================
   Knowledge Base — read-only window onto the AIOS vault.

   This is the pathway the whole project exists for: the vault lives in
   iCloud on the Mac, the server reads it, and the phone gets to browse it
   with wikilinks intact.
   ============================================================ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  CornerUpLeft,
  FileText,
  Folder,
  FolderOpen,
  Link2,
  Loader2,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { Empty, Lightbox } from '../components/kit';
import { renderNote } from '../utils/markdown';
import { ApiError, vault, type VaultFolder, type VaultNote, type VaultNoteRef, type VaultTree } from '../utils/api';

/**
 * The folder chain leading to a path, root first: 'a/b/c.md' → ['', 'a', 'a/b'].
 * Expanding is accordion-style — the expanded set is always exactly one chain,
 * so opening a folder closes whatever else was open and the tree never grows
 * long enough that you have to scroll back up past it.
 */
function ancestorsOf(path: string): string[] {
  const chain = [''];
  const parts = path.split('/');
  for (let i = 1; i < parts.length; i++) chain.push(parts.slice(0, i).join('/'));
  return chain;
}

/* ---------- tree ---------- */

function FolderNode({
  folder,
  depth,
  activePath,
  expanded,
  onToggle,
  onOpen,
}: {
  folder: VaultFolder;
  depth: number;
  activePath: string | null;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  onOpen: (path: string) => void;
}) {
  const isOpen = expanded.has(folder.path);
  const indent = depth * 11;

  return (
    <div>
      {depth > 0 && (
        <button
          className="mc-kb-folder-row"
          style={{ paddingLeft: 9 + indent }}
          onClick={() => onToggle(folder.path)}
        >
          <ChevronRight
            size={12}
            style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}
          />
          {isOpen ? <FolderOpen size={13} /> : <Folder size={13} />}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder.name}</span>
        </button>
      )}

      {(isOpen || depth === 0) && (
        <>
          {folder.folders.map((f) => (
            <FolderNode
              key={f.path}
              folder={f}
              depth={depth + 1}
              activePath={activePath}
              expanded={expanded}
              onToggle={onToggle}
              onOpen={onOpen}
            />
          ))}
          {folder.notes.map((n) => (
            <button
              key={n.path}
              className={`mc-kb-note-row ${activePath === n.path ? 'active' : ''}`}
              style={{ paddingLeft: 9 + (depth + 1) * 11 }}
              onClick={() => onOpen(n.path)}
              title={n.path}
            >
              <FileText size={12} style={{ flexShrink: 0, opacity: 0.7 }} />
              <span className="name">{n.name}</span>
            </button>
          ))}
        </>
      )}
    </div>
  );
}

/* ---------- page ---------- */

export function KnowledgeBase() {
  const [tree, setTree] = useState<VaultTree | null>(null);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [note, setNote] = useState<VaultNote | null>(null);
  const [noteLoading, setNoteLoading] = useState(false);
  const [backlinks, setBacklinks] = useState<VaultNoteRef[]>([]);
  const [history, setHistory] = useState<string[]>([]);

  const [expanded, setExpanded] = useState<Set<string>>(new Set(['']));
  const [query, setQuery] = useState('');
  const [lightbox, setLightbox] = useState<string | null>(null);
  // On mobile the tree stacks above the reader; opening a note collapses it
  // so the note gets the full screen. Ignored on desktop.
  const [treeCollapsed, setTreeCollapsed] = useState(false);

  const viewRef = useRef<HTMLDivElement>(null);

  /* ---------- load tree ---------- */

  const loadTree = useCallback(async (refresh = false) => {
    setRefreshing(refresh);
    try {
      setTree(await vault.tree(refresh));
      setTreeError(null);
    } catch (err) {
      setTreeError(err instanceof ApiError && err.status === 0 ? 'offline' : 'error');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadTree();
  }, [loadTree]);

  /* ---------- open a note ---------- */

  const openNote = useCallback(
    async (path: string, pushHistory = true) => {
      setNoteLoading(true);
      setTreeCollapsed(true);
      try {
        const next = await vault.note(path);
        setNote((prev) => {
          if (pushHistory && prev) setHistory((h) => [...h, prev.path]);
          return next;
        });
        setBacklinks([]);
        // Show exactly where this note lives — everything else folds away.
        setExpanded(new Set(ancestorsOf(path)));
        viewRef.current?.scrollTo({ top: 0 });
        vault
          .backlinks(path)
          .then((r) => setBacklinks(r.backlinks))
          .catch(() => setBacklinks([]));
      } catch {
        setNote(null);
      } finally {
        setNoteLoading(false);
      }
    },
    [],
  );

  const goBack = useCallback(() => {
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      void openNote(prev, false);
      return h.slice(0, -1);
    });
  }, [openNote]);

  /* ---------- wikilink + embed click handling ---------- */

  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest<HTMLElement>('a.mc-wikilink[data-note]');
      if (link) {
        e.preventDefault();
        void openNote(link.dataset.note!);
        return;
      }
      if (target.tagName === 'IMG' && target.classList.contains('mc-note-embed')) {
        setLightbox((target as HTMLImageElement).src);
      }
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [openNote]);

  /* ---------- search ---------- */

  const searchResults = useMemo(() => {
    if (!query.trim() || !tree) return null;
    const q = query.toLowerCase();
    const out: { name: string; path: string }[] = [];
    const walk = (f: VaultFolder) => {
      for (const n of f.notes) {
        if (n.name.toLowerCase().includes(q) || n.path.toLowerCase().includes(q)) out.push(n);
      }
      for (const sub of f.folders) walk(sub);
    };
    walk(tree.tree);
    return out.slice(0, 80);
  }, [query, tree]);

  const html = useMemo(() => (note ? renderNote(note.body, note.links) : ''), [note]);

  const toggleFolder = useCallback((path: string) => {
    setExpanded((prev) =>
      prev.has(path)
        ? // collapsing: keep the chain above it open, drop this and its children
          new Set(ancestorsOf(path))
        : // expanding: this chain only — siblings and their subtrees close
          new Set([...ancestorsOf(path), path]),
    );
  }, []);

  /* ---------- server unreachable ---------- */

  if (treeError) {
    return (
      <div className="mc-page glass mc-card mc-kb-empty">
        <div className="mc-kb-empty-title">Vault unreachable</div>
        <div className="mc-kb-empty-hint">
          {treeError === 'offline'
            ? 'Mission Control cannot reach the server on your Mac. Check that it is awake and running, then try again.'
            : 'The server is running but could not read the vault. Check the VAULT_ROOT path in server/config.mjs.'}
        </div>
        <button className="mc-btn" onClick={() => void loadTree(true)}>
          <RefreshCw size={13} /> Try again
        </button>
      </div>
    );
  }

  return (
    // `tree-open` lets the phone show one thing at a time: while the folder
    // list is up the reader is dropped entirely, whether it is empty or still
    // holding the last note you read.
    <div className={`mc-page mc-kb-layout ${treeCollapsed ? '' : 'tree-open'}`}>
      {/* ---------- tree ---------- */}
      <aside
        className={`glass mc-card mc-kb-tree ${treeCollapsed ? 'mc-kb-tree-collapsed' : ''}`}
        style={{ padding: '14px 10px' }}
      >
        <div style={{ padding: '0 4px 10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="mc-kb-source">
            <span className="dot" />
            <span className="mc-kb-source-name">{tree?.vault || 'Loading…'}</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--txt-faint)' }}>
              {tree ? `${tree.noteCount}` : ''}
            </span>
            <button
              className="mc-kb-source-btn"
              onClick={() => void loadTree(true)}
              disabled={refreshing}
              title="Rescan vault"
              aria-label="Rescan vault"
            >
              <RefreshCw size={13} className={refreshing ? 'mc-spin' : undefined} />
            </button>
          </div>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={13} style={{ position: 'absolute', left: 11, color: 'var(--txt-faint)' }} />
            <input
              className="mc-input"
              style={{ paddingLeft: 32, fontSize: 12.5 }}
              placeholder="Search notes"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                className="mc-icon-btn"
                style={{ position: 'absolute', right: 4, width: 24, height: 24 }}
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="mc-kb-tree-scroll">
          {searchResults ? (
            searchResults.length ? (
              searchResults.map((n) => (
                <button
                  key={n.path}
                  className={`mc-kb-note-row ${note?.path === n.path ? 'active' : ''}`}
                  onClick={() => void openNote(n.path)}
                  title={n.path}
                >
                  <FileText size={12} style={{ flexShrink: 0, opacity: 0.7 }} />
                  <span className="name">{n.name}</span>
                </button>
              ))
            ) : (
              <div className="view-note" style={{ padding: '18px 10px', fontSize: 12, color: 'var(--txt-faint)' }}>
                No notes match “{query}”.
              </div>
            )
          ) : tree ? (
            <FolderNode
              folder={tree.tree}
              depth={0}
              activePath={note?.path || null}
              expanded={expanded}
              onToggle={toggleFolder}
              onOpen={(p) => void openNote(p)}
            />
          ) : (
            <div style={{ display: 'grid', placeItems: 'center', padding: 30, color: 'var(--txt-faint)' }}>
              <Loader2 size={18} className="mc-spin" />
            </div>
          )}
        </div>
      </aside>

      {/* ---------- reader ---------- */}
      <section className="glass mc-card mc-kb-view" ref={viewRef}>
        {/* Floats over the note while you scroll, so the way back is always one
            tap away even at the bottom of a long note. */}
        {treeCollapsed && (
          <div className="mc-kb-mobile-bar">
            <button className="mc-btn sm" onClick={() => setTreeCollapsed(false)}>
              <ArrowLeft size={14} /> All notes
            </button>
            {history.length > 0 && (
              <button className="mc-btn sm" onClick={goBack}>
                <CornerUpLeft size={13} /> Back
              </button>
            )}
          </div>
        )}

        {noteLoading && !note ? (
          <div style={{ display: 'grid', placeItems: 'center', padding: 60, color: 'var(--txt-faint)' }}>
            <Loader2 size={20} className="mc-spin" />
          </div>
        ) : !note ? (
          <Empty icon={<FileText size={18} />}>
            Pick a note to read it here.
            <br />
            Wikilinks work — tap one to follow it.
          </Empty>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
              {history.length > 0 && (
                <button
                  className="mc-icon-btn mc-kb-desktop-back"
                  onClick={goBack}
                  title="Back"
                  aria-label="Back"
                >
                  <CornerUpLeft size={15} />
                </button>
              )}
              <div style={{ minWidth: 0 }}>
                {note.folder && (
                  <div style={{ fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--txt-faint)' }}>
                    {note.folder}
                  </div>
                )}
              </div>
            </div>

            {Object.keys(note.frontmatter).length > 0 && (
              <div className="mc-kb-fm">
                {Object.entries(note.frontmatter)
                  .filter(([, v]) => v !== null && v !== '' && !(Array.isArray(v) && !v.length))
                  .map(([k, v]) => (
                    <span key={k} className="mc-kb-fm-chip" style={{ display: 'inline-flex', gap: 6 }}>
                      <span style={{ color: 'var(--txt-faint)' }}>{k}</span>
                      <span style={{ color: 'var(--txt-dim)' }}>
                        {String(Array.isArray(v) ? v.join(', ') : v)}
                      </span>
                    </span>
                  ))}
              </div>
            )}

            <article className="mc-note" dangerouslySetInnerHTML={{ __html: html }} />

            {backlinks.length > 0 && (
              <div className="mc-kb-backlinks">
                <div className="mc-section-title" style={{ marginBottom: 10 }}>
                  <Link2 size={12} style={{ marginRight: 6, verticalAlign: -1 }} />
                  {backlinks.length} note{backlinks.length === 1 ? '' : 's'} link here
                </div>
                {backlinks.map((b) => (
                  <button key={b.path} className="mc-kb-backlink-row" onClick={() => void openNote(b.path)} title={b.path}>
                    <FileText size={12} style={{ opacity: 0.7, flexShrink: 0 }} />
                    <span className="name">{b.name}</span>
                    {b.folder && <span className="folder">{b.folder}</span>}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}
