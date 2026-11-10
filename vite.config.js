import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

/*
  Two separate sites from one repo, each built on its own so they can live on separate links:
    visual/    Visual design portfolio (light)       npm run dev:visual   / build:visual
    creative/  Creative development portfolio (dark) npm run dev:creative / build:creative
  Both share styles.css, script.js, hero*.js and everything in public/ (images, CV, favicons).
*/
const SITES = ['visual', 'creative'];
const here = import.meta.dirname;

export default defineConfig(({ mode }) => {
  const site = SITES.includes(mode) ? mode : 'visual';
  const root = resolve(here, site);
  // Every HTML page in the site folder is an entry, so new pages are picked up automatically
  const pages = readdirSync(root).filter((f) => f.endsWith('.html'));

  return {
    root,
    // Relative asset paths, so each site works from any sub-path or domain
    base: './',
    publicDir: resolve(here, 'public'),
    build: {
      outDir: resolve(here, 'dist', site),
      emptyOutDir: true,
      rollupOptions: {
        input: Object.fromEntries(pages.map((f) => [f.replace('.html', ''), resolve(root, f)])),
      },
    },
  };
});
