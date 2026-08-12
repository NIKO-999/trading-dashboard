/* ============================================================
   Turns the Complete Framework's markdown into HTML, and takes presentation
   away from the content while it does.

   The entries are hand-written markdown with raw HTML allowed through, and
   some of them carry their own colour — `<span style="color:red">Rules</span>`
   and the like, or a 🔴/✅ prefix on a heading. Inline colour always wins over
   a stylesheet, and emoji ignore `color` outright, so nothing the CSS says
   about these blocks can take effect while that markup is in the content.
   Fully saturated red and green also sit outside the app's palette entirely:
   the semantic tokens are #f87171 and #4ade80, deliberate pastels.

   So the colour is read, then removed. The hue a block was carrying is
   classified into one of the app's semantic tones and re-emitted as a
   `data-tone` attribute; the literal `color` declaration and the leading
   emoji are stripped. The stylesheet then owns how a tone looks, which is the
   arrangement the page comment in CompleteFramework.tsx already assumes —
   content is content, and what it looks like is not the data file's business.

   Reading the tone from the existing colour rather than from the heading text
   is what keeps this faithful: a section that was red stays the danger tone
   and a section that was green stays the success tone, whatever they happen
   to be called. Nothing is recoloured, only calmed.
   ============================================================ */

import { marked } from 'marked';

// Was set in CompleteFramework.tsx; it lives with the parse call it configures
// so the two cannot drift apart.
marked.setOptions({ gfm: true, breaks: false });

export type Tone = 'danger' | 'warn' | 'success' | 'info';

/** Emoji that carry a tone on their own — CSS cannot touch these, so the only
 *  way to quiet them is to take them out and keep what they meant. */
const TONE_BY_EMOJI: Array<[string, Tone]> = [
  ['🔴', 'danger'],
  ['❌', 'danger'],
  ['⛔', 'danger'],
  ['🚫', 'danger'],
  ['🛑', 'danger'],
  ['⚠️', 'warn'],
  ['⚠', 'warn'],
  ['🟡', 'warn'],
  ['🟠', 'warn'],
  ['✅', 'success'],
  ['🟢', 'success'],
  ['☑️', 'success'],
  ['✔️', 'success'],
  ['ℹ️', 'info'],
  ['🔵', 'info'],
  ['💡', 'info'],
];

const NAMED_COLORS: Record<string, [number, number, number]> = {
  red: [255, 0, 0],
  crimson: [220, 20, 60],
  firebrick: [178, 34, 34],
  tomato: [255, 99, 71],
  orangered: [255, 69, 0],
  salmon: [250, 128, 114],
  green: [0, 128, 0],
  lime: [0, 255, 0],
  limegreen: [50, 205, 50],
  forestgreen: [34, 139, 34],
  seagreen: [46, 139, 87],
  springgreen: [0, 255, 127],
  orange: [255, 165, 0],
  gold: [255, 215, 0],
  yellow: [255, 255, 0],
  blue: [0, 0, 255],
  dodgerblue: [30, 144, 255],
  deepskyblue: [0, 191, 255],
  cyan: [0, 255, 255],
};

function parseColor(raw: string): [number, number, number] | null {
  const value = raw.trim().toLowerCase();

  const named = NAMED_COLORS[value];
  if (named) return named;

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(value);
  if (hex) {
    const h = hex[1];
    if (h.length === 3) {
      return [
        parseInt(h[0] + h[0], 16),
        parseInt(h[1] + h[1], 16),
        parseInt(h[2] + h[2], 16),
      ];
    }
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }

  const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/.exec(value);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];

  return null;
}

/**
 * Hue buckets, not exact matches. The content was written by hand over time,
 * so the reds are not all one red — #f00, crimson and tomato all have to land
 * on the same tone. A near-grey is left alone: desaturated text was never a
 * signal, and dragging it into a tone would invent emphasis that was not there.
 */
export function toneFromColor(raw: string): Tone | null {
  const parsed = parseColor(raw);
  if (!parsed) return null;
  const [r, g, b] = parsed;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta < 40) return null; // grey enough to carry no meaning

  let hue: number;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue = (hue * 60 + 360) % 360;

  if (hue < 20 || hue >= 330) return 'danger';
  if (hue < 45) return 'warn'; // orange
  if (hue < 70) return 'warn'; // yellow
  if (hue < 170) return 'success';
  return 'info';
}

/** Pulls `color: …` out of a style attribute, returning the tone it implied
 *  and whatever declarations are left. Anything that is not colour — a
 *  margin, a width — is content's business and stays. */
function stripColor(style: string): { tone: Tone | null; rest: string } {
  let tone: Tone | null = null;
  const kept: string[] = [];

  for (const decl of style.split(';')) {
    const [propRaw, ...valueParts] = decl.split(':');
    if (!propRaw || valueParts.length === 0) continue;
    const prop = propRaw.trim().toLowerCase();
    const value = valueParts.join(':').trim();

    if (prop === 'color') {
      tone ??= toneFromColor(value);
      continue;
    }
    if (prop === 'background' || prop === 'background-color') {
      tone ??= toneFromColor(value);
      continue;
    }
    kept.push(`${prop}: ${value}`);
  }

  return { tone, rest: kept.join('; ') };
}

/** Tailwind-style utility classes are the third way colour reaches this page —
 *  the scanner globs src/**, which includes the data file, so `text-red-500`
 *  in an entry really does get generated. */
function toneFromClasses(className: string): { tone: Tone | null; rest: string } {
  let tone: Tone | null = null;
  const kept: string[] = [];

  for (const cls of className.split(/\s+/).filter(Boolean)) {
    const match = /^(?:text|bg|border)-(red|rose|orange|amber|yellow|green|emerald|lime|blue|sky|cyan)-\d{2,3}$/.exec(cls);
    if (match) {
      const family = match[1];
      tone ??=
        family === 'red' || family === 'rose'
          ? 'danger'
          : family === 'orange' || family === 'amber' || family === 'yellow'
            ? 'warn'
            : family === 'blue' || family === 'sky' || family === 'cyan'
              ? 'info'
              : 'success';
      continue;
    }
    kept.push(cls);
  }

  return { tone, rest: kept.join(' ') };
}

/**
 * Strips hard-coded colour off every tag and replaces it with the tone that
 * colour stood for. The tone is stamped on the element it came from, so a
 * heading that wrapped its text in a coloured span leaves a marker the block
 * pass below can find and lift onto the heading itself.
 */
function rewriteAttributes(html: string): string {
  return html.replace(/<([a-z0-9]+)((?:\s+[^<>]*)?)>/gi, (_whole, tag: string, attrs: string) => {
    let rewritten: string = attrs;
    let tone: Tone | null = null;

    rewritten = rewritten.replace(/\sstyle\s*=\s*"([^"]*)"/i, (_m, style: string) => {
      const { tone: t, rest } = stripColor(style);
      tone ??= t;
      return rest ? ` style="${rest}"` : '';
    });

    rewritten = rewritten.replace(/\sclass\s*=\s*"([^"]*)"/i, (_m, className: string) => {
      const { tone: t, rest } = toneFromClasses(className);
      tone ??= t;
      return rest ? ` class="${rest}"` : '';
    });

    return tone ? `<${tag}${rewritten} data-tone="${tone}">` : `<${tag}${rewritten}>`;
  });
}

/** Blocks that can become a callout. An inline <span> keeps its tone as a
 *  quiet text emphasis instead — turning every coloured word into a panel
 *  would be louder than what it replaced, not calmer. */
const BLOCK_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p']);

/** Top-level blocks in marked's output, in order. Its output is a flat
 *  sequence, so a scan is enough — nothing here needs a real parser. */
const TOP_LEVEL = /<(h[1-6]|p|ul|ol|blockquote|pre|table)(?:\s[^>]*)?>[\s\S]*?<\/\1>|<hr\s*\/?>/gi;

/**
 * Wraps a toned heading and the content beneath it into a single callout.
 *
 * A heading alone in a panel with its text left outside is not the shape the
 * reference has: there the label and what it says are one block, which is what
 * makes it read as a single quiet statement rather than a banner with loose
 * prose under it. The run ends at the next heading of any kind — that is the
 * next label, and by then the previous one has said everything it had to.
 */
function groupCallouts(html: string): string {
  type Block = { html: string; isHeading: boolean; tone: Tone | null };
  const blocks: Block[] = [];
  let cursor = 0;

  TOP_LEVEL.lastIndex = 0;
  for (let m = TOP_LEVEL.exec(html); m; m = TOP_LEVEL.exec(html)) {
    // Whitespace between blocks — keep it so the output stays readable.
    if (m.index > cursor) blocks.push({ html: html.slice(cursor, m.index), isHeading: false, tone: null });
    const tag = (m[1] ?? '').toLowerCase();
    const toneMatch = /\sdata-tone="(danger|warn|success|info)"/i.exec(m[0]);
    blocks.push({
      html: m[0],
      isHeading: /^h[1-6]$/.test(tag),
      tone: (toneMatch?.[1] as Tone | undefined) ?? null,
    });
    cursor = m.index + m[0].length;
  }
  if (cursor < html.length) blocks.push({ html: html.slice(cursor), isHeading: false, tone: null });

  const out: string[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (!block.isHeading || !block.tone) {
      out.push(block.html);
      continue;
    }

    // The tone moves to the wrapper; the heading goes back to being a label.
    const label = block.html.replace(/\sdata-tone="[a-z]+"/i, '');
    // The run ends at the next heading — or at a block that already carries a
    // tone of its own. That block is its own statement; nesting a toned panel
    // inside a toned panel is two borders and two bars saying one thing.
    const body: string[] = [];
    let j = i + 1;
    for (; j < blocks.length && !blocks[j].isHeading && !blocks[j].tone; j++) {
      body.push(blocks[j].html);
    }

    out.push(
      `<div class="mc-fw-callout" data-tone="${block.tone}">${label}${body.join('')}</div>`,
    );
    i = j - 1;
  }

  return out.join('');
}

export function renderFrameworkBody(body: string): string {
  const raw = marked.parse(body, { async: false }) as string;
  const html = rewriteAttributes(raw);

  // Second pass over blocks: adopt a tone from a leading emoji, or from a
  // coloured inline child, and stamp it on the block itself.
  const tagged = html.replace(
    /<(h[1-6]|blockquote|p)((?:\s+[^<>]*)?)>([\s\S]*?)<\/\1>/gi,
    (whole: string, tag: string, attrs: string, inner: string) => {
      if (!BLOCK_TAGS.has(tag.toLowerCase())) return whole;
      if (/\sdata-tone=/.test(attrs)) return whole; // already tagged by its own colour

      let tone: Tone | null = null;
      let content = inner;

      for (const [emoji, emojiTone] of TONE_BY_EMOJI) {
        // Only a *leading* emoji is a label; one mid-sentence is prose.
        const leading = new RegExp(`^\\s*${emoji}\\uFE0F?\\s*`);
        if (leading.test(content)) {
          tone = emojiTone;
          content = content.replace(leading, '');
          break;
        }
      }

      if (!tone) {
        const child = /<span[^>]*\sdata-tone="(danger|warn|success|info)"/i.exec(content);
        if (child) tone = child[1] as Tone;
      }

      if (!tone) return `<${tag}${attrs}>${content}</${tag}>`;
      return `<${tag}${attrs} data-tone="${tone}">${content}</${tag}>`;
    },
  );

  return groupCallouts(tagged);
}
