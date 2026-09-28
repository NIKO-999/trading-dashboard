// Single-file build: everything (JS, CSS, fonts) ends up inline in one HTML page, with no
// service worker. Used for sharing a playable link; the normal build stays the installable PWA.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
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
