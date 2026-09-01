/**
 * Manifest generato, non scritto a mano: `start_url`, `scope` e i percorsi
 * delle icone devono seguire la base path (`/Semagnaa/` su GitHub Pages,
 * `/` su un dominio dedicato), quindi vengono costruiti da `percorso()`.
 */
import type { APIRoute } from 'astro';
import { T } from '../i18n';
import { percorso } from '../lib/percorsi';

export const prerender = true;

export const GET: APIRoute = async () => {
  const manifest = {
    name: `${T.app.nome} — ${T.app.tagline}`,
    short_name: T.app.nome,
    description: T.app.descrizione,
    lang: 'it',
    dir: 'ltr',
    start_url: percorso(),
    scope: percorso(),
    id: percorso(),
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#2f3e36',
    background_color: '#faf7f2',
    categories: ['food', 'lifestyle', 'utilities'],
    icons: [
      { src: percorso('icone/icona-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: percorso('icone/icona-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: percorso('icone/icona-maskable-512.png'),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      { src: percorso('icone/icona.svg'), sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
    shortcuts: [
      { name: T.spesa.titolo, url: percorso('spesa') },
      { name: T.nav.ricette, url: percorso('ricette') },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'content-type': 'application/manifest+json; charset=utf-8' },
  });
};
