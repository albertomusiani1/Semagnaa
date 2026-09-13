/**
 * Verifica 20 della Definizione di Fatto: la cantina, dal vino vuoto alla
 * ricerca con i filtri.
 *
 * Controlla il percorso richiesto: si entra e si vedono **solo i filtri**,
 * si sceglie, si tocca Cerca e solo allora compaiono le bottiglie. Più: la
 * foto scattata viene rimpicciolita e salvata sul dispositivo, la
 * descrizione lunga si vede **solo** aprendo il singolo vino, e cancellando
 * un vino sparisce anche la sua foto.
 *
 * Serve Playwright (vedi scripts/verifica-flussi.mjs) e una foto di prova:
 *   node scripts/verifica-vini.mjs <percorso-foto.jpg>
 */
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');

const BASE = process.env.URL_APP ?? `http://localhost:4321${process.env.BASE_PATH ?? '/Semagnaa/'}`;
const FOTO = process.argv[2] ?? null;

const passi = [];
const ok = (nome, esito, extra = '') => {
  passi.push({ nome, esito: esito ? 'OK' : 'FALLITO', extra });
  if (!esito) console.error('FALLITO:', nome, extra);
};

const browser = await chromium.launch({
  ...(process.env.CHROME_PATH === undefined ? {} : { executablePath: process.env.CHROME_PATH }),
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const contesto = await browser.newContext({ viewport: { width: 390, height: 844 } });
const p = await contesto.newPage();
const errori = [];
p.on('pageerror', (e) => errori.push(`pageerror: ${e.message}`));
p.on('console', (m) => {
  if (m.type() === 'error') errori.push(`console: ${m.text()}`);
});

async function creaVino({ nome, cantina, paese, regione, colore, bollicine, annata, gusto, descrizione, foto }) {
  await p.goto(`${BASE}vino/modifica/`, { waitUntil: 'networkidle' });
  await p.fill('#nome', nome);
  await p.fill('#cantina', cantina);
  await p.fill('#paese', paese);
  await p.fill('#regione', regione);
  await p.locator(`input[name="colore"][value="${colore}"]`).check();
  await p.locator(`input[name="bollicine"][value="${bollicine}"]`).check();
  if (annata !== undefined) await p.fill('#annata', String(annata));
  if (gusto !== undefined) await p.fill('#gusto', gusto);
  if (descrizione !== undefined) await p.fill('#descrizione', descrizione);
  if (foto !== undefined) {
    await p.setInputFiles('#foto', foto);
    await p.waitForSelector('#anteprima img', { timeout: 15_000 });
  }
  await p.click('button[type="submit"]');
  await p.waitForURL(/vino\/\?id=/, { timeout: 15_000 });
}

try {
  // --- 1. cantina vuota: nessun filtro, solo l'invito -------------------
  await p.goto(`${BASE}vini/`, { waitUntil: 'networkidle' });
  await p.waitForSelector('#quanti');
  ok('cantina vuota: compare l invito', await p.locator('#vuota').isVisible());
  ok('cantina vuota: nessun modulo di ricerca', !(await p.locator('#ricerca').isVisible()));

  // --- 2. primo vino, con foto ------------------------------------------
  const descrizioneLunga = 'Aperto per il compleanno di mia madre, con l arrosto. Da ricomprare.';
  await creaVino({
    nome: 'Barolo Cannubi',
    cantina: 'Marchesi di Barolo',
    paese: 'Italia',
    regione: 'Piemonte',
    colore: 'rosso',
    bollicine: 'fermo',
    annata: 2016,
    gusto: 'Tannico, austero, lunghissimo.',
    descrizione: descrizioneLunga,
    ...(FOTO === null ? {} : { foto: FOTO }),
  });
  ok('il vino salvato apre la sua scheda', /vino\/\?id=marchesi-di-barolo-barolo-cannubi/.test(p.url()), p.url());
  await p.waitForSelector('#vino:not([hidden])');
  ok('la scheda mostra il nome', (await p.locator('#nome').textContent()) === 'Barolo Cannubi');
  ok('la scheda mostra le note lunghe', ((await p.locator('#descrizione').textContent()) ?? '').includes('arrosto'));

  if (FOTO !== null) {
    ok('la foto compare nella scheda', (await p.locator('#figura img').count()) === 1);
    const misure = await p.evaluate(async () => {
      const db = await new Promise((risolvi, rifiuta) => {
        const r = indexedDB.open('semagnaa-immagini', 1);
        r.onsuccess = () => risolvi(r.result);
        r.onerror = () => rifiuta(r.error);
      });
      const foto = await new Promise((risolvi, rifiuta) => {
        const t = db.transaction('foto', 'readonly').objectStore('foto').getAll();
        t.onsuccess = () => risolvi(t.result);
        t.onerror = () => rifiuta(t.error);
      });
      const blob = foto[0];
      if (!blob) return null;
      const bitmap = await createImageBitmap(blob);
      return { quante: foto.length, byte: blob.size, tipo: blob.type, lato: Math.max(bitmap.width, bitmap.height) };
    });
    ok('la foto è salvata in IndexedDB', misure !== null && misure.quante === 1, JSON.stringify(misure));
    ok(
      'la foto viene rimpicciolita prima di salvarla',
      misure !== null && misure.lato <= 1400 && misure.tipo === 'image/jpeg',
      misure === null ? '' : `${misure.lato} px, ${Math.round(misure.byte / 1000)} kB, ${misure.tipo}`,
    );
  }

  // --- 3. altri vini, senza foto ----------------------------------------
  await creaVino({
    nome: 'Franciacorta Brut',
    cantina: 'Ca del Bosco',
    paese: 'Italia',
    regione: 'Lombardia',
    colore: 'bianco',
    bollicine: 'spumante',
    annata: 2020,
    gusto: 'Secco, agrumato.',
  });
  await creaVino({
    nome: 'Chablis',
    cantina: 'Domaine Laroche',
    paese: 'Francia',
    regione: 'Borgogna',
    colore: 'bianco',
    bollicine: 'fermo',
    annata: 2021,
    gusto: 'Minerale, teso.',
  });
  await creaVino({
    nome: 'Lambrusco di Sorbara',
    cantina: 'Paltrinieri',
    paese: 'Italia',
    regione: 'Emilia-Romagna',
    colore: 'rosso',
    bollicine: 'frizzante',
    annata: 2023,
    gusto: 'Asciutto, vivace.',
  });

  // --- 4. la cantina si apre sui filtri, non sui risultati --------------
  await p.goto(`${BASE}vini/`, { waitUntil: 'networkidle' });
  await p.waitForSelector('#ricerca');
  ok('entrando si vedono i filtri', await p.locator('#ricerca').isVisible());
  ok('entrando NON si vedono i vini', !(await p.locator('#risultati').isVisible()));
  ok('il conteggio dice quanti vini ci sono', /4 vini in cantina/.test((await p.locator('#quanti').textContent()) ?? ''));

  // --- 5. i filtri nascono dai vini inseriti ---------------------------
  const paesi = await p.locator('#paese option').allTextContents();
  ok('gli stati vengono dai vini inseriti', paesi.includes('Italia') && paesi.includes('Francia'), paesi.join(' | '));
  const cantine = await p.locator('#cantina option').allTextContents();
  ok('le cantine vengono dai vini inseriti', cantine.includes('Paltrinieri'), cantine.join(' | '));

  // --- 6. cerca: colore bianco ------------------------------------------
  await p.locator('.filtri[data-gruppo="colore"] label:has-text("Bianco")').click();
  await p.click('#cerca');
  await p.waitForSelector('#risultati:not([hidden])');
  ok('dopo Cerca compaiono le bottiglie', (await p.locator('.bottiglia').count()) === 2);
  ok('dopo Cerca i filtri si chiudono', !(await p.locator('#ricerca').isVisible()));
  ok('il riepilogo dice cosa è stato cercato', /Bianco/.test((await p.locator('#riepilogo-testo').textContent()) ?? ''));

  // --- 7. la descrizione lunga NON si vede nell'elenco ------------------
  const testoElenco = (await p.locator('#vetrina').textContent()) ?? '';
  ok('le note lunghe non compaiono nell elenco', !testoElenco.includes('arrosto'));

  // --- 8. torna ai filtri e cerca per stato ----------------------------
  await p.click('#cambia-filtri');
  ok('si torna ai filtri', await p.locator('#ricerca').isVisible());
  await p.locator('.filtri[data-gruppo="colore"] label:has-text("Bianco")').click();
  await p.selectOption('#paese', 'Francia');
  await p.waitForTimeout(150);
  const regioni = await p.locator('#regione option').allTextContents();
  ok('scegliendo lo stato le regioni si restringono', regioni.includes('Borgogna') && !regioni.includes('Piemonte'), regioni.join(' | '));
  await p.click('#cerca');
  await p.waitForSelector('.bottiglia');
  ok('filtro per stato', (await p.locator('.bottiglia').count()) === 1);

  // --- 9. bollicine, indipendenti dal colore ---------------------------
  await p.click('#cambia-filtri');
  await p.selectOption('#paese', '');
  await p.locator('.filtri[data-gruppo="bollicine"] label:has-text("Frizzante")').click();
  await p.click('#cerca');
  await p.waitForSelector('.bottiglia');
  ok('filtro per bollicine', (await p.locator('.bottiglia').count()) === 1);
  ok('è il lambrusco', ((await p.locator('.bottiglia__nome').first().textContent()) ?? '').includes('Lambrusco'));

  // --- 10. la foto sopravvive al ricaricamento -------------------------
  await p.goto(`${BASE}vino/?id=marchesi-di-barolo-barolo-cannubi`, { waitUntil: 'networkidle' });
  await p.waitForSelector('#vino:not([hidden])');
  if (FOTO !== null) {
    await p.waitForSelector('#figura img', { timeout: 10_000 });
    ok('la foto è ancora lì dopo il ricaricamento', (await p.locator('#figura img').count()) === 1);
  }

  // --- 11. eliminando il vino sparisce anche la foto -------------------
  await p.click('#elimina');
  await p.click('#conferma-elimina');
  await p.waitForURL(/vini\//, { timeout: 10_000 });
  const fotoRimaste = await p.evaluate(async () => {
    const db = await new Promise((risolvi, rifiuta) => {
      const r = indexedDB.open('semagnaa-immagini', 1);
      r.onsuccess = () => risolvi(r.result);
      r.onerror = () => rifiuta(r.error);
    });
    return new Promise((risolvi, rifiuta) => {
      const t = db.transaction('foto', 'readonly').objectStore('foto').count();
      t.onsuccess = () => risolvi(t.result);
      t.onerror = () => rifiuta(t.error);
    });
  });
  ok('cancellando il vino sparisce la sua foto', fotoRimaste === 0, `foto rimaste: ${fotoRimaste}`);
  ok('restano gli altri vini', /3 vini in cantina/.test((await p.locator('#quanti').textContent()) ?? ''));

  // --- 12. ricette e vini convivono ------------------------------------
  // La home carica (e al primo avvio semina) le ricette: le pagine della
  // cantina non le toccano, ed è giusto così.
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.waitForSelector('#conteggio');
  const esportato = await p.evaluate(() => ({
    ricette: JSON.parse(localStorage.getItem('semagnaa:ricette') ?? '[]').length,
    vini: JSON.parse(localStorage.getItem('semagnaa:vini') ?? '[]').length,
  }));
  ok('ricette e vini convivono nell archivio', esportato.ricette === 9 && esportato.vini === 3, JSON.stringify(esportato));
} finally {
  await browser.close();
}

console.log('--- CANTINA ---');
for (const passo of passi) console.log(`${passo.esito.padEnd(8)} ${passo.nome}${passo.extra ? ` (${passo.extra})` : ''}`);
if (errori.length > 0) {
  console.log('\nErrori in pagina:');
  for (const e of new Set(errori)) console.log(' -', e);
}
const falliti = passi.filter((x) => x.esito !== 'OK').length;
console.log(`\n${passi.length - falliti}/${passi.length} passi riusciti`);
process.exit(falliti > 0 || errori.length > 0 ? 1 : 0);
