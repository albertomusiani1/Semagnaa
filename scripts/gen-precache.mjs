/**
 * Post-build: legge il contenuto reale di `dist/` e scrive l'elenco di
 * precache dentro `dist/sw.js`, sostituendo i segnaposto.
 *
 * L'elenco non si scrive a mano: se domani aggiungi una pagina, la trova qui.
 *
 * Uso: node scripts/gen-precache.mjs   (lo fa già `npm run build`)
 */
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, posix, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';

const DIST = 'dist';
const BASE = process.env.BASE_PATH ?? '/Semagnaa/';
const ESCLUSI = new Set(['sw.js', 'robots.txt']);
const ESTENSIONI = new Set([
  '.html',
  '.css',
  '.js',
  '.json',
  '.webmanifest',
  '.woff2',
  '.svg',
  '.png',
  '.ico',
]);

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

function urlPubblico(percorsoFile) {
  const relativo = relative(DIST, percorsoFile).split(sep).join(posix.sep);
  const base = BASE.endsWith('/') ? BASE : `${BASE}/`;
  // Le pagine si chiedono per cartella: `/spesa/`, non `/spesa/index.html`.
  if (relativo.endsWith('index.html')) return `${base}${relativo.slice(0, -'index.html'.length)}`;
  return `${base}${relativo}`;
}

const tuttiFile = await elencaFile(DIST);
const daPrecache = tuttiFile
  .filter((percorsoFile) => {
    const nome = relative(DIST, percorsoFile).split(sep).join(posix.sep);
    if (ESCLUSI.has(nome)) return false;
    const punto = nome.lastIndexOf('.');
    return punto !== -1 && ESTENSIONI.has(nome.slice(punto));
  })
  .map(urlPubblico)
  .sort();

// Versione della cache: impronta del contenuto, così cambia solo quando serve.
const impronte = [];
for (const percorsoFile of tuttiFile.sort()) {
  const contenuto = await readFile(percorsoFile);
  impronte.push(`${percorsoFile}:${createHash('sha256').update(contenuto).digest('hex')}`);
}
const versione = createHash('sha256').update(impronte.join('\n')).digest('hex').slice(0, 12);

const sorgente = await readFile(join(DIST, 'sw.js'), 'utf8');
if (!sorgente.includes('__PRECACHE__')) {
  console.error('gen-precache: dist/sw.js non contiene i segnaposto attesi.');
  process.exit(1);
}
const risultato = sorgente
  .replace('__PRECACHE__', JSON.stringify(daPrecache, null, 2))
  .replace('__VERSIONE__', versione)
  .replace('__BASE__', BASE.endsWith('/') ? BASE : `${BASE}/`);
await writeFile(join(DIST, 'sw.js'), risultato, 'utf8');

const pesi = await Promise.all(tuttiFile.map(async (f) => (await stat(f)).size));
const totale = pesi.reduce((a, b) => a + b, 0);
console.log(
  `gen-precache: ${daPrecache.length} file in precache, versione ${versione}, dist ${(totale / 1000).toFixed(1)} kB`,
);
