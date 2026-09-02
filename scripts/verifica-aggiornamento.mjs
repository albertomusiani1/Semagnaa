/**
 * Verifica che una versione nuova dell'app arrivi davvero sul dispositivo.
 *
 * Simula una pubblicazione: dopo la prima visita (che installa il service
 * worker) cambia i file in `dist/` come farebbe un deploy, poi controlla che
 * l'app se ne accorga, mostri il banner e, toccando "Ricarica", serva la
 * versione nuova. Verifica anche la via di fuga "svuota la cache e ricarica"
 * e che i dati dell'utente sopravvivano a entrambe le cose.
 *
 * Serve Playwright (vedi scripts/verifica-flussi.mjs).
 *   npm run build && npm run preview &
 *   node scripts/verifica-aggiornamento.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');

const BASE = process.env.URL_APP ?? `http://localhost:4321${process.env.BASE_PATH ?? '/Semagnaa/'}`;
const FILE_SW = 'dist/sw.js';
const FILE_HOME = 'dist/index.html';

const passi = [];
const ok = (nome, esito, extra = '') => {
  passi.push({ nome, esito: esito ? 'OK' : 'FALLITO', extra });
  if (!esito) console.error('FALLITO:', nome, extra);
};

// Copie di sicurezza: la prova modifica dist/, poi rimette tutto a posto.
const swOriginale = await readFile(FILE_SW, 'utf8');
const homeOriginale = await readFile(FILE_HOME, 'utf8');

const browser = await chromium.launch({
  ...(process.env.CHROME_PATH === undefined ? {} : { executablePath: process.env.CHROME_PATH }),
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const contesto = await browser.newContext({ viewport: { width: 390, height: 844 } });
const p = await contesto.newPage();

try {
  // --- 1. prima visita: il service worker si installa --------------------
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.evaluate(() => navigator.serviceWorker.ready);
  await p.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 10_000 });
  const versionePrima = await p.evaluate(async () => {
    const chiavi = await caches.keys();
    return chiavi[0] ?? null;
  });
  ok('prima visita: service worker attivo e cache creata', versionePrima !== null, versionePrima ?? '');

  // Dati dell'utente: devono sopravvivere a tutto quello che segue.
  const ricettePrima = await p.evaluate(() =>
    JSON.parse(localStorage.getItem('semagnaa:ricette') ?? '[]').length,
  );
  ok('ricette in archivio prima dell aggiornamento', ricettePrima === 9, String(ricettePrima));

  // --- 2. arriva una pubblicazione nuova ---------------------------------
  const versioneFinta = 'provaversione';
  await writeFile(FILE_SW, swOriginale.replace(/const VERSIONE = '[^']+'/, `const VERSIONE = '${versioneFinta}'`));
  await writeFile(FILE_HOME, homeOriginale.replace('</head>', '<meta name="prova-aggiornamento" content="v2" /></head>'));

  // --- 3. l'app se ne accorge da sola e propone l'aggiornamento ---------
  await p.reload({ waitUntil: 'networkidle' });
  const bannerVisibile = await p
    .locator('#banner-aggiornamento')
    .waitFor({ state: 'visible', timeout: 15_000 })
    .then(() => true)
    .catch(() => false);
  ok('la nuova versione viene rilevata e proposta nel banner', bannerVisibile);

  // --- 4. "Ricarica" porta davvero la versione nuova --------------------
  if (bannerVisibile) {
    await Promise.all([p.waitForNavigation({ timeout: 20_000 }).catch(() => null), p.click('#banner-ricarica')]);
    await p.waitForTimeout(1500);
    const marcatore = await p.locator('meta[name="prova-aggiornamento"]').count();
    ok('dopo "Ricarica" la pagina servita è quella nuova', marcatore === 1);
    const versioneDopo = await p.evaluate(async () => (await caches.keys()).join(','));
    ok('la cache è quella della versione nuova', versioneDopo.includes(versioneFinta), versioneDopo);
    const vecchiaSparita = !versioneDopo.includes(versionePrima ?? 'x');
    ok('la cache vecchia è stata cancellata', vecchiaSparita, versioneDopo);
  }

  // --- 5. i dati dell'utente sono ancora lì ----------------------------
  const ricetteDopo = await p.evaluate(() =>
    JSON.parse(localStorage.getItem('semagnaa:ricette') ?? '[]').length,
  );
  ok('le ricette sopravvivono all aggiornamento', ricetteDopo === ricettePrima, String(ricetteDopo));

  // --- 6. la via di fuga: svuota la cache e ricarica -------------------
  await p.goto(`${BASE}impostazioni/`, { waitUntil: 'networkidle' });
  await p.waitForSelector('#versione-cache');
  const versioneMostrata = (await p.locator('#versione-cache').textContent()) ?? '';
  ok('le impostazioni mostrano la versione in uso', versioneMostrata.trim() === versioneFinta, versioneMostrata);

  await p.click('#forza-aggiornamento');
  await p.waitForURL(/aggiornata=/, { timeout: 20_000 });
  await p.waitForTimeout(2000);
  ok('la via di fuga ricarica l app', /aggiornata=/.test(p.url()), p.url().replace(BASE, '/'));
  const ricetteDopoSvuotamento = await p.evaluate(() =>
    JSON.parse(localStorage.getItem('semagnaa:ricette') ?? '[]').length,
  );
  ok('svuotare la cache non tocca le ricette', ricetteDopoSvuotamento === ricettePrima, String(ricetteDopoSvuotamento));
  await p.waitForSelector('#conteggio');
  ok('dopo lo svuotamento l app funziona', (await p.locator('#conteggio').textContent()) !== '');
} finally {
  await writeFile(FILE_SW, swOriginale);
  await writeFile(FILE_HOME, homeOriginale);
  await browser.close();
}

console.log('--- AGGIORNAMENTO ---');
for (const passo of passi) console.log(`${passo.esito.padEnd(8)} ${passo.nome}${passo.extra ? ` (${passo.extra})` : ''}`);
const falliti = passi.filter((x) => x.esito !== 'OK').length;
console.log(`\n${passi.length - falliti}/${passi.length} passi riusciti`);
process.exit(falliti > 0 ? 1 : 0);
