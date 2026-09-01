/**
 * Verifica 14 della Definizione di Fatto: screenshot di ogni schermata a
 * 360, 768 e 1280 px, con controllo automatico di overflow orizzontale e di
 * contenuto tagliato.
 *
 * Serve Playwright (vedi scripts/verifica-flussi.mjs).
 *   node scripts/verifica-responsive.mjs verifiche/screenshot
 */
import pw from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { mkdir } from 'node:fs/promises';
const { chromium } = pw;
const BASE = process.env.URL_APP ?? `http://localhost:4321${process.env.BASE_PATH ?? '/Semagnaa/'}`;
const OUT = process.argv[2] ?? 'verifiche/screenshot';
await mkdir(OUT, { recursive: true });

const PAGINE = [
  ['home', ''],
  ['ricette', 'ricette/'],
  ['ricetta', 'ricetta/?id=focaccia-genovese-a-lunga-lievitazione-in-teglia'],
  ['cucina', 'cucina/?id=ragu-alla-bolognese-della-domenica'],
  ['modifica', 'modifica/?id=tiramisu-classico'],
  ['spesa', 'spesa/'],
  ['spesa-dispensa', 'spesa/dispensa/'],
  ['spesa-lista', 'spesa/lista/'],
  ['impostazioni', 'impostazioni/'],
  ['info', 'info/'],
  ['404', 'non-esiste/'],
];
const LARGHEZZE = [360, 768, 1280];

const browser = await chromium.launch({
  ...(process.env.CHROME_PATH === undefined ? {} : { executablePath: process.env.CHROME_PATH }),
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const contesto = await browser.newContext({ viewport: { width: 360, height: 800 } });
const p = await contesto.newPage();

// Prepara dati: seed + una selezione di spesa, così le pagine non sono vuote.
await p.goto(BASE, { waitUntil: 'networkidle' });
await p.goto(`${BASE}spesa/`, { waitUntil: 'networkidle' });
await p.waitForSelector('.voce');
await p.locator('#scelta-ragu-alla-bolognese-della-domenica').check();
await p.locator('#scelta-insalata-di-finocchi-e-arance').check();
await p.waitForTimeout(200);

const problemi = [];
const righe = [];
for (const larghezza of LARGHEZZE) {
  await p.setViewportSize({ width: larghezza, height: larghezza < 700 ? 800 : 900 });
  for (const [nome, percorso] of PAGINE) {
    await p.goto(`${BASE}${percorso}`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(300);
    const misure = await p.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
      tagliati: [...document.querySelectorAll('body *')]
        .filter((n) => n.scrollWidth > n.clientWidth + 1 && getComputedStyle(n).overflowX === 'visible')
        .slice(0, 3)
        .map((n) => `${n.tagName.toLowerCase()}.${n.className}`),
    }));
    const overflow = misure.scroll > misure.client + 1;
    if (overflow) problemi.push(`${nome} @${larghezza}px: scrollWidth ${misure.scroll} > ${misure.client}`);
    if (misure.tagliati.length > 0) problemi.push(`${nome} @${larghezza}px: contenuto tagliato in ${misure.tagliati.join(', ')}`);
    righe.push(`${nome.padEnd(16)} @${String(larghezza).padStart(4)}px  scroll ${String(misure.scroll).padStart(4)} / client ${String(misure.client).padStart(4)}  ${overflow || misure.tagliati.length ? 'PROBLEMA' : 'OK'}`);
    await p.screenshot({ path: `${OUT}/${nome}-${larghezza}.png`, fullPage: larghezza === 360 });
  }
}

console.log('--- RESPONSIVE ---');
for (const riga of righe) console.log(riga);
if (problemi.length > 0) {
  console.log('\nProblemi:');
  for (const problema of problemi) console.log(' -', problema);
}
console.log(`\n${righe.length - problemi.length}/${righe.length} viste senza overflow orizzontale né testo tagliato.`);
await browser.close();
process.exit(problemi.length > 0 ? 1 : 0);
