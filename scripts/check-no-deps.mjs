/**
 * Verifica 12 della Definizione di Fatto:
 *  - nessuna dipendenza runtime oltre ad Astro;
 *  - nessun riferimento a domini terzi nel codice sorgente e nel costruito.
 *
 * Uso: node scripts/check-no-deps.mjs
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const AMMESSE = new Set(['astro']);
const CARTELLE = ['src', 'scripts', 'public', 'dist'];
const ESTENSIONI = ['.ts', '.astro', '.js', '.mjs', '.css', '.json', '.html', '.webmanifest', '.md'];
// Domini ammessi: solo namespace tecnici, non richieste di rete.
const AMMESSI_URL = [
  'http://www.w3.org/2000/svg',
  'https://json.schemastore.org',
  'http://localhost',
];

let problemi = 0;

const pacchetto = JSON.parse(await readFile('package.json', 'utf8'));
for (const nome of Object.keys(pacchetto.dependencies ?? {})) {
  if (!AMMESSE.has(nome)) {
    console.error(`Dipendenza runtime non prevista: ${nome}`);
    problemi += 1;
  }
}
if (Object.keys(pacchetto.devDependencies ?? {}).length > 0) {
  console.log(`devDependencies presenti: ${Object.keys(pacchetto.devDependencies).join(', ')}`);
}

async function elencaFile(cartella) {
  let voci;
  try {
    voci = await readdir(cartella, { withFileTypes: true });
  } catch {
    return [];
  }
  const file = [];
  for (const voce of voci) {
    const percorso = join(cartella, voce.name);
    if (voce.isDirectory()) file.push(...(await elencaFile(percorso)));
    else if (ESTENSIONI.some((e) => voce.name.endsWith(e))) file.push(percorso);
  }
  return file;
}

const schema = /https?:\/\/[^\s"'`)<>]+/g;
for (const cartella of CARTELLE) {
  for (const percorso of await elencaFile(cartella)) {
    const contenuto = await readFile(percorso, 'utf8');
    for (const trovato of contenuto.match(schema) ?? []) {
      if (AMMESSI_URL.some((ammesso) => trovato.startsWith(ammesso))) continue;
      // Il dominio di pubblicazione (GitHub Pages) compare solo come URL canonico.
      if (trovato.startsWith('https://albertomusiani1.github.io')) continue;
      console.error(`Riferimento esterno in ${percorso}: ${trovato}`);
      problemi += 1;
    }
  }
}

if (problemi > 0) {
  console.error(`\n${problemi} problemi trovati.`);
  process.exit(1);
}
console.log('Nessuna dipendenza runtime estranea e nessun riferimento a domini terzi.');
