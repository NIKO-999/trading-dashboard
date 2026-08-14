/* ============================================================
   Complete Framework — a standalone, offline reference of the trading
   material itself, each topic its own collapsible section. Not the
   Knowledge Base — no vault, no graph, no server round-trip, nothing here
   is fetched. It reads straight from data/completeFramework.ts, which is
   hand-populated from the source PDFs, same spirit as data/framework.ts
   being hand-curated from the vault.

   Two levels of navigation, and the outer one matters: material from
   different authors stays in its own body rather than being merged. They
   overlap and they disagree; a reader should always know whose model they
   are looking at. Sections within a source are free to be named whatever
   that source actually covers.
   ============================================================ */

import { useState } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { marked } from 'marked';
import { Empty, Lightbox } from '../components/kit';
import { FRAMEWORK_SOURCES, type FrameworkEntry, type FrameworkImage } from '../data/completeFramework';

marked.setOptions({ gfm: true, breaks: false });

const md = (t: string) => marked.parse(t, { async: false }) as string;

const escapeHtml = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Callout fences, on top of ordinary markdown:
 *
 *   :::danger Rules & Cautions
 *   - no counter-trend trades
 *   :::
 *
 * The tone is the point. A list of things that invalidate a trade and a list
 * of things that qualify one read identically as plain bold-headed
 * paragraphs, which is exactly wrong for a reference you check under
 * pressure — the two should be distinguishable before you have read a word.
 * `danger` is what stops a trade, `success` is what makes one, `warn` is a
 * caveat, `info` is context.
 */
const CALLOUT_RE = /:::(danger|success|warn|info)[ \t]+([^\n]+)\n([\s\S]*?)\n:::/g;

function renderBody(body: string): string {
  let out = '';
  let last = 0;
  for (const m of body.matchAll(CALLOUT_RE)) {
    const at = m.index ?? 0;
    if (at > last) out += md(body.slice(last, at));
    const [full, tone, title, inner] = m;
    out +=
      `<div class="mc-fw-callout ${tone}">` +
      `<div class="mc-fw-callout-title">${escapeHtml(title.trim())}</div>` +
      `<div class="mc-fw-callout-body">${md(inner)}</div>` +
      `</div>`;
    last = at + full.length;
  }
  return out + md(body.slice(last));
}

/**
 * Deliberately relative, no leading slash. These images live in
 * web/public/framework and are only ever served under /trading/ (see
 * server/index.mjs — WEB_DIST is mounted at /trading, not at the root the
 * hub's own static files use). A leading-slash path resolves against the
 * origin and 404s; a relative one resolves against whatever this app is
 * mounted at, the same way its own JS/CSS bundle references do (vite's
 * base: './'). The SPA never changes the document's path — only the hash —
 * so this stays correct across every in-app navigation.
 */
function frameworkImageUrl(src: string): string {
  return `framework/${src}`;
}

function FrameworkEntryCard({
  entry,
  onImage,
  onFollow,
}: {
  entry: FrameworkEntry;
  onImage: (img: FrameworkImage) => void;
  onFollow: (ref: NonNullable<FrameworkEntry['crossRef']>) => void;
}) {
  return (
    <div className="mc-fw-entry">
      <div className="mc-fw-entry-title">{entry.title}</div>
      {entry.source && <div className="mc-fw-entry-source">{entry.source}</div>}
      <div className="mc-fw-entry-body" dangerouslySetInnerHTML={{ __html: renderBody(entry.body) }} />
      {entry.crossRef && (
        <button className="mc-fw-crossref" onClick={() => onFollow(entry.crossRef!)}>
          <ArrowRight size={13} />
          {entry.crossRef.label}
        </button>
      )}
      {entry.images && entry.images.length > 0 && (
        <div className="mc-fw-figures">
          {entry.images.map((img) => (
            // A real <figure>/<figcaption>: the diagram is shown in full at a
            // readable size with its description sitting under it, rather than
            // a cropped thumbnail whose meaning only appears on click. Tapping
            // still enlarges it — that is now the extra, not the only way to
            // read the thing.
            <figure key={img.src} className="mc-fw-figure">
              <button
                className="mc-fw-figure-btn"
                onClick={() => onImage(img)}
                aria-label={img.caption ? `Enlarge diagram: ${img.caption}` : 'Enlarge diagram'}
              >
                <img src={frameworkImageUrl(img.src)} alt={img.caption ?? ''} loading="lazy" />
              </button>
              {img.caption && <figcaption className="mc-fw-figure-caption">{img.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}

export function CompleteFramework() {
  const [sourceId, setSourceId] = useState(FRAMEWORK_SOURCES[0].id);
  // Collapsed by default. Several sections' worth of diagrams open at once
  // turns "quickly refer to" into a long scroll past things you didn't come
  // for — tap the one you need.
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const [lightbox, setLightbox] = useState<FrameworkImage | null>(null);

  const source = FRAMEWORK_SOURCES.find((s) => s.id === sourceId) ?? FRAMEWORK_SOURCES[0];

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /** Jump to another source's section — switch, open it, scroll it into view. */
  function follow(ref: NonNullable<FrameworkEntry['crossRef']>) {
    setSourceId(ref.sourceId);
    setOpen(new Set([ref.sectionId]));
    // The target section only exists after the source swap renders, so the
    // scroll waits a frame rather than looking for an element that is not
    // in the document yet.
    requestAnimationFrame(() => {
      document.getElementById(`fw-${ref.sectionId}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  }

  function pickSource(id: string) {
    setSourceId(id);
    // Section ids are namespaced per source, so stale open ids would be
    // harmless — but collapsing anyway means switching source always lands
    // you on the same clean overview instead of a half-scrolled diagram.
    setOpen(new Set());
  }

  return (
    <div className="mc-page" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="mc-fw-sources" role="tablist" aria-label="Framework source">
        {FRAMEWORK_SOURCES.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={s.id === source.id}
            className={`mc-fw-source ${s.id === source.id ? 'active' : ''}`}
            onClick={() => pickSource(s.id)}
          >
            <span className="mc-fw-source-label">{s.label}</span>
            <span className="mc-fw-source-blurb">{s.blurb}</span>
          </button>
        ))}
      </div>

      {source.sections.map((section) => {
        const isOpen = open.has(section.id);
        return (
          <div key={section.id} id={`fw-${section.id}`} className="glass mc-card mc-fw-section">
            <button
              className={`mc-fw-section-head ${isOpen ? 'open' : ''}`}
              onClick={() => toggle(section.id)}
              aria-expanded={isOpen}
            >
              <ChevronRight size={15} className="mc-fw-section-chevron" />
              <div className="mc-fw-section-heading">
                <div className="mc-fw-section-title">{section.label}</div>
                <div className="mc-fw-section-desc">{section.description}</div>
              </div>
              <span className="mc-fw-section-count">{section.entries.length}</span>
            </button>

            {isOpen && (
              <div className="mc-fw-section-body">
                {section.entries.length === 0 ? (
                  <Empty>Nothing added yet.</Empty>
                ) : (
                  section.entries.map((entry) => (
                    <FrameworkEntryCard key={entry.id} entry={entry} onImage={setLightbox} onFollow={follow} />
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}

      {lightbox && (
        <Lightbox
          src={frameworkImageUrl(lightbox.src)}
          caption={lightbox.caption}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
