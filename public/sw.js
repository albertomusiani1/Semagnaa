/*
 * Service worker di Semagnaa, scritto a mano (niente Workbox, niente plugin).
 *
 * I tre segnaposto qui sotto vengono sostituiti da `scripts/gen-precache.mjs`
 * subito dopo `astro build`, leggendo il contenuto reale di `dist/`:
 * l'elenco dei file da mettere in cache non si scrive a mano.
 *
 * Strategia:
 *  - documenti HTML: rete per prima, **senza passare dalla cache HTTP**
 *    (`cache: 'no-store'`), con ricaduta sulla cache del service worker e
 *    infine sulla home, così offline si apre sempre qualcosa di sensato.
 *    Il `no-store` è la differenza fra vedere l'aggiornamento e restare
 *    con la pagina di dieci minuti prima servita dalla CDN;
 *  - tutto il resto: cache per prima, poi rete, e quello che arriva dalla
 *    rete viene messo in cache.
 */
const VERSIONE = '__VERSIONE__';
const BASE = '__BASE__';
const PRECACHE = __PRECACHE__;
const NOME_CACHE = `semagnaa-${VERSIONE}`;

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    (async () => {
      const cache = await caches.open(NOME_CACHE);
      // `reload` evita di installare una copia già vecchia presa dalla cache HTTP.
      await Promise.allSettled(PRECACHE.map((url) => cache.add(new Request(url, { cache: 'reload' }))));
    })(),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      const nomi = await caches.keys();
      await Promise.all(nomi.filter((nome) => nome !== NOME_CACHE).map((nome) => caches.delete(nome)));
      await self.clients.claim();
    })(),
  );
});

// L'aggiornamento non è mai forzato: l'utente tocca "Ricarica" nel banner.
// L'app può anche chiedere quale versione sta servendo: serve alle
// impostazioni, per far vedere a occhio se l'aggiornamento è arrivato.
self.addEventListener('message', (evento) => {
  const dati = evento.data;
  if (!dati) return;
  if (dati.tipo === 'attiva-subito') self.skipWaiting();
  if (dati.tipo === 'versione' && evento.ports && evento.ports[0]) {
    evento.ports[0].postMessage({ versione: VERSIONE });
  }
});

function eDocumento(richiesta) {
  return richiesta.mode === 'navigate' || (richiesta.headers.get('accept') || '').includes('text/html');
}

self.addEventListener('fetch', (evento) => {
  const richiesta = evento.request;
  if (richiesta.method !== 'GET') return;
  const url = new URL(richiesta.url);
  if (url.origin !== self.location.origin) return;

  if (eDocumento(richiesta)) {
    evento.respondWith(
      (async () => {
        try {
          // `no-store`: la pagina arriva dal server, non dalla cache HTTP del
          // browser (GitHub Pages dichiara dieci minuti di validità).
          const dallaRete = await fetch(richiesta, { cache: 'no-store' });
          const cache = await caches.open(NOME_CACHE);
          cache.put(richiesta, dallaRete.clone());
          return dallaRete;
        } catch {
          const cache = await caches.open(NOME_CACHE);
          const dallaCache = await cache.match(richiesta, { ignoreSearch: true });
          if (dallaCache) return dallaCache;
          const home = await cache.match(BASE);
          if (home) return home;
          return new Response('Offline', { status: 503, headers: { 'content-type': 'text/plain' } });
        }
      })(),
    );
    return;
  }

  evento.respondWith(
    (async () => {
      const cache = await caches.open(NOME_CACHE);
      const dallaCache = await cache.match(richiesta, { ignoreSearch: false });
      if (dallaCache) return dallaCache;
      try {
        const dallaRete = await fetch(richiesta);
        if (dallaRete.ok && dallaRete.type === 'basic') cache.put(richiesta, dallaRete.clone());
        return dallaRete;
      } catch {
        const perIgnoranza = await cache.match(richiesta, { ignoreSearch: true });
        if (perIgnoranza) return perIgnoranza;
        return new Response('', { status: 504 });
      }
    })(),
  );
});
