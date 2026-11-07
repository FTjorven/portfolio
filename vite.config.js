import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Multi-page site: every HTML page needs to be listed so `npm run build` includes it
export default defineConfig({
  // Relative asset paths, so the site works under ftjorven.github.io/portfolio/
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        about: resolve(import.meta.dirname, 'about.html'),
        work: resolve(import.meta.dirname, 'work.html'),
        myst: resolve(import.meta.dirname, 'myst.html'),
        soundcheck: resolve(import.meta.dirname, 'soundcheck.html'),
        walter: resolve(import.meta.dirname, 'walter.html'),
        milesmeals: resolve(import.meta.dirname, 'milesmeals.html'),
      },
    },
  },
});
