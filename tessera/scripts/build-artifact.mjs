// Builds the single-file page: runs the artifact Vite config, then inlines the script and
// stylesheet into one HTML fragment (no <html>/<head>/<body>; the host adds its own skeleton).
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
execSync('npx vite build --config vite.artifact.config.ts --logLevel warn', { cwd: root, stdio: 'inherit' });

const dist = new URL('dist-artifact/', root);
const html = readFileSync(new URL('index.html', dist), 'utf8');
const js = [...html.matchAll(/<script[^>]*src="\.\/([^"]+)"[^>]*><\/script>/g)].map((m) => readFileSync(new URL(m[1], dist), 'utf8'));
let css = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="\.\/([^"]+)"[^>]*>/g)].map((m) => readFileSync(new URL(m[1], dist), 'utf8')).join('\n');
// Browsers that run this build all read woff2, so drop the heavier woff fallbacks.
css = css.replace(/,\s*url\(data:font\/woff;base64,[^)]+\)\s*format\(["']woff["']\)/g, '');
// The artifact host caps the page's size, so the two italic faces are left out here: browsers slant the upright ones
// instead (the installed PWA keeps the true italics).
css = css.replace(/@font-face\{[^}]*font-style:\s*italic[^}]*\}/g, '');
if (!js.length) throw new Error('no script found in the built page');

const page = [
  '<title>Tessera</title>',
  '<meta name="theme-color" content="#000000">',
  `<style>\n${css.replace(/<\/style/gi, '<\\/style')}\n</style>`,
  '<canvas id="game"></canvas>',
  '<div id="ui"></div>',
  ...js.map((code) => `<script type="module">\n${code.replace(/<\/script/gi, '<\\/script')}\n</script>`),
].join('\n');

const out = new URL('tessera.html', dist);
writeFileSync(out, page);
console.log(`wrote ${out.pathname} (${(page.length / 1024).toFixed(0)} KB)`);

// The same page split in two for publishing: a small page and the game script as a file beside it (game.js).
const split = [
  '<title>Tessera</title>',
  '<meta name="theme-color" content="#000000">',
  `<style>\n${css.replace(/<\/style/gi, '<\\/style')}\n</style>`,
  '<canvas id="game"></canvas>',
  '<div id="ui"></div>',
  '<script type="module" src="game.js"></script>',
].join('\n');
writeFileSync(new URL('page.html', dist), split);
writeFileSync(new URL('game.js', dist), js.join('\n'));
console.log(`wrote page.html (${(split.length / 1024).toFixed(0)} KB) + game.js (${(js.join('').length / 1024).toFixed(0)} KB)`);
