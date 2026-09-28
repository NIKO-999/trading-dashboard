// Single-file build: everything (JS, CSS, fonts) ends up inline in one HTML page, with no
// service worker. Used for sharing a playable link; the normal build stays the installable PWA.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // shown on the title screen and in the in-game menu, so a screenshot says which build it is
  define: { __APP_VERSION__: JSON.stringify(JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version) },
  resolve: {
    alias: { 'virtual:pwa-register': fileURLToPath(new URL('./src/pwa-stub.ts', import.meta.url)) },
  },
  build: {
    outDir: 'dist-artifact',
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: { output: { codeSplitting: false } },
  },
});
