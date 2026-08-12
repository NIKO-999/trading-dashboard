/* ============================================================
   Complete Framework — a standalone, offline reference of the trading
   material itself, each topic its own collapsible section. Not the
   Knowledge Base — no vault, no graph, no server round-trip, nothing here
   is fetched. It reads straight from data/completeFramework.ts, which is
   hand-populated from the source PDFs, same spirit as data/framework.ts
   being hand-curated from the vault. Sections are not fixed to
   reversal/continuation/profiles — new source material adds or removes
   whichever sections actually fit it.

   Purely a reading surface. There is no editor here on purpose — content
   goes in by editing the data file directly, so what's on screen is always
   exactly what was written, never something reshaped by a form.
   ============================================================ */

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Empty, Lightbox } from '../components/kit';
import { FRAMEWORK_SECTIONS, type FrameworkEntry } from '../data/completeFramework';
import { renderFrameworkBody } from '../utils/frameworkMarkdown';

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

function FrameworkEntryCard({ entry, onImage }: { entry: FrameworkEntry; onImage: (src: string) => void }) {
  return (
    <div className="mc-fw-entry">
      <div className="mc-fw-entry-title">{entry.title}</div>
      {entry.source && <div className="mc-fw-entry-source">{entry.source}</div>}
      <div
        className="mc-fw-entry-body"
        dangerouslySetInnerHTML={{ __html: renderFrameworkBody(entry.body) }}
      />
      {entry.images && entry.images.length > 0 && (
        <div className="mc-fw-entry-images">
          {entry.images.map((img) => (
            <button
              key={img.src}
              className="mc-fw-entry-image"
              onClick={() => onImage(frameworkImageUrl(img.src))}
              title={img.caption ?? img.src}
            >
              <img src={frameworkImageUrl(img.src)} alt={img.caption ?? ''} loading="lazy" />
              {img.caption && <span className="mc-fw-entry-caption">{img.caption}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CompleteFramework() {
  // Collapsed by default. Six sections' worth of diagrams open at once turns
  // "quickly refer to" into a long scroll past five things you didn't come
  // for — tap the one you need.
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const [lightbox, setLightbox] = useState<string | null>(null);

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="mc-page" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {FRAMEWORK_SECTIONS.map((section) => {
        const isOpen = open.has(section.id);
        return (
          <div key={section.id} className="glass mc-card mc-fw-section">
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
                    <FrameworkEntryCard key={entry.id} entry={entry} onImage={setLightbox} />
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}
