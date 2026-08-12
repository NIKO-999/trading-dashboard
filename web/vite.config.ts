import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const API = 'http://127.0.0.1:4400';

// Built output is served by the Express server under /trading/, so assets are
// referenced relatively. In dev, /api is proxied to the same Express server
// so the front end talks to one origin in both modes.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': { target: API, changeOrigin: true },
      '/media': { target: API, changeOrigin: true },
    },
    // The ambient shader lives in hub/js and is shared with the gateway page —
    // one copy, imported from both.
    fs: { allow: ['..'] },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
