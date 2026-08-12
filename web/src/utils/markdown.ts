/* ============================================================
   Obsidian markdown → HTML.

   Handles the syntax the vault actually uses that plain markdown does not:
   [[wikilinks]] with aliases, ![[embeds]], and ==highlights==.
   ============================================================ */

import { marked } from 'marked';
import { vault, type VaultLink } from './api';

marked.setOptions({ gfm: true, breaks: false });

const WIKILINK_RE = /(!?)\[\[([^\]|#]+)(#[^\]|]+)?(?:\|([^\]]+))?\]\]/g;

function escapeAttr(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function escapeText(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Replace wikilinks with anchors the reader can intercept, and embeds with
 * <img> pointing at the vault media endpoint. Resolution comes from the
 * server so the client never has to guess where a note lives.
 */
function transformWikilinks(md: string, links: VaultLink[]): string {
  const resolutionFor = new Map<string, string | null>();
  for (const l of links) resolutionFor.set(l.raw, l.resolved);

  return md.replace(WIKILINK_RE, (raw, bang: string, target: string, heading: string | undefined, alias: string | undefined) => {
    const resolved = resolutionFor.has(raw) ? resolutionFor.get(raw)! : null;
    const label = alias?.trim() || target.trim();

    if (bang === '!') {
      if (!resolved) return `<span class="mc-wikilink mc-wikilink-missing">${escapeText(label)}</span>`;
      return `<img class="mc-note-embed" src="${escapeAttr(vault.mediaUrl(resolved))}" alt="${escapeAttr(label)}" loading="lazy" />`;
    }

    if (!resolved) {
      return `<span class="mc-wikilink mc-wikilink-missing">${escapeText(label)}</span>`;
    }
    const anchor = heading ? escapeAttr(heading.slice(1)) : '';
    return `<a class="mc-wikilink" href="#" data-note="${escapeAttr(resolved)}"${anchor ? ` data-heading="${anchor}"` : ''}>${escapeText(label)}</a>`;
  });
}

/** Obsidian's ==highlight== — not part of GFM. */
function transformHighlights(md: string): string {
  return md.replace(/==([^=\n]+)==/g, '<mark class="mc-note-mark">$1</mark>');
}

export function renderNote(body: string, links: VaultLink[]): string {
  const withLinks = transformWikilinks(body, links);
  const withMarks = transformHighlights(withLinks);
  return marked.parse(withMarks, { async: false });
}
