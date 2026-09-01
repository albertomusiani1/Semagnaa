/**
 * Verifica 3 della Definizione di Fatto: tutte le pagine costruite devono
 * rispondere 200 sul server di preview.
 *
 * Legge l'elenco dalle pagine HTML presenti in `dist/` (l'app non ha una
 * sitemap: non è un sito indicizzabile), le richiede una per una, stampa una
 * tabella e chiude con exit code 1 se anche solo una non risponde 200.
 *
 * Uso: npm run build && npm run preview &   poi   node scripts/check-pages.mjs
 *      opzioni: --base http://localhost:4321/Semagnaa/
 */
import { readdir } from 'node:fs/promises';
import { join, posix, relative, sep } from 'node:path';

const DIST = 'dist';
const argomenti = process.argv.slice(2);
const indiceBase = argomenti.indexOf('--base');
const BASE_URL =
  indiceBase !== -1 && argomenti[indiceBase + 1] !== undefined
    ? argomenti[indiceBase + 1]
    : `http://localhost:4321${process.env.BASE_PATH ?? '/Semagnaa/'}`;

async function elencaFile(cartella) {
  const voci = await readdir(cartella, { withFileTypes: true });
  const file = [];
  for (const voce of voci) {
    const percorso = join(cartella, voce.name);
    if (voce.isDirectory()) file.push(...(await elencaFile(percorso)));
    else file.push(percorso);
  }
  return file;
}

const radice = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
const file = await elencaFile(DIST);
const pagine = file
  .map((f) => relative(DIST, f).split(sep).join(posix.sep))
  .filter((f) => f.endsWith('.html') || f.endsWith('.webmanifest') || f.endsWith('.json'))
  .map((f) => (f.endsWith('index.html') ? f.slice(0, -'index.html'.length) : f))
  .sort();

// La 404 si controlla a parte (verifica 4): qui deve rispondere 200 come file.
let fallite = 0;
const righe = [];
for (const pagina of pagine) {
  const url = `${radice}${pagina}`;
  let stato = 0;
  let errore = '';
  try {
    const risposta = await fetch(url, { redirect: 'manual' });
    stato = risposta.status;
  } catch (e) {
    errore = e instanceof Error ? e.message : String(e);
  }
  const ok = stato === 200;
  if (!ok) fallite += 1;
  righe.push({ url: url.replace(radice, '/'), stato: stato === 0 ? errore : stato, esito: ok ? 'OK' : 'FALLITO' });
}

const larghezza = Math.max(...righe.map((r) => r.url.length), 4);
console.log(`${'URL'.padEnd(larghezza)}  STATO  ESITO`);
for (const riga of righe) {
  console.log(`${riga.url.padEnd(larghezza)}  ${String(riga.stato).padEnd(5)}  ${riga.esito}`);
}
console.log(`\n${righe.length - fallite}/${righe.length} risorse rispondono 200.`);

if (fallite > 0) {
  console.error(`${fallite} risorse non rispondono 200.`);
  process.exit(1);
}
