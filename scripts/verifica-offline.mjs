/**
 * Verifica 17 della Definizione di Fatto: dopo la prima visita l'app deve
 * aprirsi senza rete, su tutte le schermate, con i dati ancora al loro posto.
 *
 * Serve Playwright (vedi scripts/verifica-flussi.mjs).
 *   node scripts/verifica-offline.mjs
 */
// Playwright si risolve normalmente; PLAYWRIGHT_MODULE serve solo se è
// installato altrove (per esempio in globale).
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const BASE = process.env.URL_APP ?? `http://localhost:4321${process.env.BASE_PATH ?? '/Semagnaa/'}`;
const PAGINE = [
  ['home', '', '#conteggio'],
  ['ricette', 'ricette/', '.scheda'],
  ['ricetta', 'ricetta/?id=brodo-vegetale', '.elenco-ingredienti li'],
  ['cucina', 'cucina/?id=brodo-vegetale', '#passaggio'],
  ['modifica', 'modifica/?id=brodo-vegetale', '#titolo'],
  ['spesa', 'spesa/', '.voce'],
  ['dispensa', 'spesa/dispensa/', '.elenco-dispensa'],
  ['lista', 'spesa/lista/', '#elenco'],
  ['impostazioni', 'impostazioni/', '#quante'],
  ['info', 'info/', 'h1'],
];

const browser = await chromium.launch({
  ...(process.env.CHROME_PATH === undefined ? {} : { executablePath: process.env.CHROME_PATH }),
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const contesto = await browser.newContext({ viewport: { width: 390, height: 844 } });
const p = await contesto.newPage();
const righe = [];
let falliti = 0;

// 1. Prima visita: registra il service worker e riempie la cache.
await p.goto(BASE, { waitUntil: 'networkidle' });
const registrato = await p.evaluate(async () => {
  const r = await navigator.serviceWorker.ready;
  return r.active !== null;
});
righe.push(`service worker attivo dopo la prima visita: ${registrato ? 'OK' : 'FALLITO'}`);
if (!registrato) falliti += 1;

// Seleziona una ricetta per la spesa, così i dati da verificare offline ci sono.
await p.goto(`${BASE}spesa/`, { waitUntil: 'networkidle' });
await p.waitForSelector('.voce');
await p.locator('#scelta-brodo-vegetale').check();
await p.waitForTimeout(200);

// Visita tutte le pagine una volta (il precache le ha già, questa è la prova del giro).
for (const [, percorso] of PAGINE) await p.goto(`${BASE}${percorso}`, { waitUntil: 'networkidle' });
await p.waitForTimeout(500);

// 2. Rete staccata.
await contesto.setOffline(true);
righe.push('--- rete staccata ---');

for (const [nome, percorso, selettore] of PAGINE) {
  let esito = 'FALLITO';
  let nota = '';
  try {
    await p.goto(`${BASE}${percorso}`, { waitUntil: 'domcontentloaded' });
    await p.waitForSelector(selettore, { timeout: 5000 });
    const titolo = await p.title();
    // La modalità Cucina cambia il titolo in "<ricetta> · In cucina":
    // basta che la pagina si sia aperta e abbia reso il suo contenuto.
    esito = titolo.length > 0 ? 'OK' : 'FALLITO';
    nota = titolo;
  } catch (e) {
    nota = e instanceof Error ? e.message.split('\n')[0] : String(e);
  }
  if (esito !== 'OK') falliti += 1;
  righe.push(`${esito.padEnd(8)} ${nome.padEnd(14)} ${nota}`);
}

// 3. I dati sono ancora lì?
await p.goto(`${BASE}spesa/lista/`, { waitUntil: 'domcontentloaded' });
await p.waitForSelector('#elenco');
await p.waitForTimeout(300);
const vociOffline = await p.locator('.elenco-spesa li').count();
righe.push(`${vociOffline > 0 ? 'OK      ' : 'FALLITO '} lista della spesa offline: ${vociOffline} voci`);
if (vociOffline === 0) falliti += 1;

const ricetteOffline = await p.evaluate(() => JSON.parse(localStorage.getItem('semagnaa:ricette') ?? '[]').length);
righe.push(`${ricetteOffline === 9 ? 'OK      ' : 'FALLITO '} ricette in archivio offline: ${ricetteOffline}`);
if (ricetteOffline !== 9) falliti += 1;

console.log('--- OFFLINE ---');
for (const riga of righe) console.log(riga);
console.log(`\n${falliti === 0 ? 'Tutte le schermate si aprono senza rete.' : `${falliti} problemi.`}`);
await browser.close();
process.exit(falliti > 0 ? 1 : 0);
