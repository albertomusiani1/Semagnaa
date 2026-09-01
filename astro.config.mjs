// @ts-check
import { defineConfig } from 'astro/config';

/**
 * Base path e dominio arrivano dall'ambiente, mai hardcoded nel codice.
 *
 *   BASE_PATH=/Semagnaa/  -> GitHub Pages di progetto (default)
 *   BASE_PATH=/           -> dominio dedicato o server locale in root
 *
 * Ogni URL nel codice si costruisce da `import.meta.env.BASE_URL`
 * (helper: `src/lib/percorsi.ts`), così entrambi i casi funzionano
 * senza toccare una riga.
 */
const base = process.env.BASE_PATH ?? '/Semagnaa/';
const site = process.env.SITE_URL ?? 'https://albertomusiani1.github.io';

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  compressHTML: true,
  devToolbar: { enabled: false },
  i18n: {
    defaultLocale: 'it',
    locales: ['it'],
    routing: { prefixDefaultLocale: false },
  },
  vite: {
    build: { assetsInlineLimit: 0 },
  },
});
