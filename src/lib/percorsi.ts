/**
 * Costruzione degli URL a partire dalla base di Astro.
 *
 * L'app gira sotto `/Semagnaa/` su GitHub Pages e sotto `/` su un dominio
 * dedicato: nessun percorso assoluto va scritto a mano da nessuna parte.
 */
const BASE: string = import.meta.env.BASE_URL;

/** `percorso('ricette')` -> `/Semagnaa/ricette/` */
export function percorso(relativo = ''): string {
  const base = BASE.endsWith('/') ? BASE : `${BASE}/`;
  const pulito = relativo.replace(/^\/+/, '');
  if (pulito === '') return base;
  // I file (favicon.svg, manifest.webmanifest, sw.js) restano senza slash
  // finale; le pagine lo prendono, come chiede `trailingSlash: 'always'`.
  const ultimoPezzo = pulito.split('/').pop() ?? '';
  const eFile = ultimoPezzo.includes('.');
  if (eFile || pulito.includes('?') || pulito.endsWith('/')) return `${base}${pulito}`;
  return `${base}${pulito}/`;
}

export const PERCORSI = {
  home: percorso(),
  ricette: percorso('ricette'),
  ricetta: percorso('ricetta'),
  cucina: percorso('cucina'),
  modifica: percorso('modifica'),
  spesa: percorso('spesa'),
  dispensa: percorso('spesa/dispensa'),
  lista: percorso('spesa/lista'),
  impostazioni: percorso('impostazioni'),
  info: percorso('info'),
  seed: percorso('dati/ricette-seed.json'),
} as const;

export function urlRicetta(id: string): string {
  return `${PERCORSI.ricetta}?id=${encodeURIComponent(id)}`;
}

export function urlCucina(id: string): string {
  return `${PERCORSI.cucina}?id=${encodeURIComponent(id)}`;
}

export function urlModifica(id?: string): string {
  return id === undefined ? PERCORSI.modifica : `${PERCORSI.modifica}?id=${encodeURIComponent(id)}`;
}

/** Legge un parametro dalla query string corrente (solo lato client). */
export function parametro(nome: string): string | null {
  if (typeof location === 'undefined') return null;
  return new URLSearchParams(location.search).get(nome);
}
