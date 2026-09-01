/**
 * Verifica 16 della Definizione di Fatto: i flussi funzionali, in un browser
 * vero. Crea una ricetta, la ritrova in elenco, ne scala le porzioni, entra in
 * modalità Cucina, avvia e mette in pausa un timer, riprende la sessione,
 * la mette nella spesa, passa dalla checklist dispensa e controlla la lista.
 *
 * Serve Playwright (solo per le verifiche, non è una dipendenza dell'app):
 *   npm i -D playwright && npx playwright install chromium
 * Poi, con il server di preview attivo:
 *   npm run build && npm run preview &
 *   node scripts/verifica-flussi.mjs verifiche
 */
import pw from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { mkdir } from 'node:fs/promises';
const { chromium } = pw;
const BASE = process.env.URL_APP ?? `http://localhost:4321${process.env.BASE_PATH ?? '/Semagnaa/'}`;
const OUT = process.argv[2] ?? '.';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  ...(process.env.CHROME_PATH === undefined ? {} : { executablePath: process.env.CHROME_PATH }),
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const contesto = await browser.newContext({ viewport: { width: 390, height: 844 } });
const p = await contesto.newPage();
const errori = [];
p.on('pageerror', (e) => errori.push(`pageerror: ${e.message}`));
p.on('console', (m) => { if (m.type() === 'error') errori.push(`console: ${m.text()}`); });

const passi = [];
function ok(nome, esito, extra = '') { passi.push({ nome, esito: esito ? 'OK' : 'FALLITO', extra }); if(!esito) console.error('FALLITO:', nome, extra); }

// 1. home + seed
await p.goto(BASE, { waitUntil: 'networkidle' });
const conteggio = (await p.locator('#conteggio').textContent()) ?? '';
ok('home mostra le ricette seed', /9 ricette/.test(conteggio), conteggio);

// 2. elenco ricette
await p.goto(`${BASE}ricette/`, { waitUntil: 'networkidle' });
await p.waitForSelector('.scheda');
const quante = await p.locator('.scheda').count();
ok('elenco mostra 9 ricette', quante === 9, `trovate ${quante}`);

// 3. ricerca
await p.fill('#cerca', 'focaccia');
await p.waitForTimeout(200);
ok('ricerca filtra', (await p.locator('.scheda').count()) === 1);
await p.fill('#cerca', '');

// 4. filtro categoria
await p.goto(`${BASE}ricette/?categoria=dolci`, { waitUntil: 'networkidle' });
await p.waitForSelector('.scheda');
ok('filtro categoria dolci', (await p.locator('.scheda').count()) === 1);

// 5. crea ricetta
await p.goto(`${BASE}modifica/`, { waitUntil: 'networkidle' });
await p.fill('#titolo', 'Pane e pomodoro di prova');
await p.selectOption('#categoria', 'antipasti');
await p.fill('#porzioni', '2');
await p.fill('#descrizione', 'Ricetta creata dal test end-to-end.');
const righeIngredienti = p.locator('li[data-riga="ingrediente"]');
await righeIngredienti.nth(0).locator('[name="nome"]').fill('Pane');
await righeIngredienti.nth(0).locator('[name="quantita"]').fill('200');
await righeIngredienti.nth(0).locator('[name="unita"]').selectOption('g');
await righeIngredienti.nth(0).locator('[name="reparto"]').selectOption('panetteria');
await righeIngredienti.nth(1).locator('[name="nome"]').fill('Pomodori pelati');
await righeIngredienti.nth(1).locator('[name="quantita"]').fill('300');
await righeIngredienti.nth(1).locator('[name="unita"]').selectOption('g');
await righeIngredienti.nth(1).locator('[name="reparto"]').selectOption('dispensa');
const righePassaggi = p.locator('li[data-riga="passaggio"]');
await righePassaggi.nth(0).locator('[name="testo"]').fill('Taglia il pane e condiscilo.');
await righePassaggi.nth(0).locator('[name="timer"]').fill('1');
await righePassaggi.nth(0).locator('[name="timerEtichetta"]').fill('Riposo');
await p.click('button[type="submit"]');
await p.waitForURL(/ricetta\/\?id=pane-e-pomodoro-di-prova/, { timeout: 5000 });
ok('salvataggio porta al dettaglio', p.url().includes('pane-e-pomodoro-di-prova'));

// 6. dettaglio: titolo e ingredienti
await p.waitForSelector('#ricetta:not([hidden])');
ok('dettaglio mostra il titolo', (await p.locator('#titolo').textContent()) === 'Pane e pomodoro di prova');
ok('dettaglio mostra 2 ingredienti', (await p.locator('.elenco-ingredienti li').count()) === 2);

// 7. scala porzioni 2 -> 4
await p.click('#porzioni-piu');
await p.click('#porzioni-piu');
ok('porzioni scalate a 4', (await p.locator('#porzioni-valore').textContent()) === '4');
const quantitaScalate = await p.locator('.elenco-ingredienti__quantita').allTextContents();
ok('quantità raddoppiate', quantitaScalate.includes('400 g') && quantitaScalate.includes('600 g'), quantitaScalate.join(' | '));

// 8. la ricetta creata è nell'elenco
await p.goto(`${BASE}ricette/`, { waitUntil: 'networkidle' });
await p.waitForSelector('.scheda');
ok('la nuova ricetta è in elenco', (await p.locator('.scheda').count()) === 10);

// 9. modalità Cucina + timer
await p.goto(`${BASE}cucina/?id=pasta-al-pomodoro-e-basilico`, { waitUntil: 'networkidle' });
await p.waitForSelector('#passaggio');
ok('cucina: contatore passaggi', /Passaggio 1 di 6/.test((await p.locator('#contatore').textContent()) ?? ''));
await p.click('#successivo');
ok('cucina: avanti', /Passaggio 2 di 6/.test((await p.locator('#contatore').textContent()) ?? ''));
ok('cucina: timer visibile al passaggio 2', await p.locator('#timer').isVisible());
const primoValore = await p.locator('#timer-valore').textContent();
await p.click('#timer-avvia');
await p.waitForTimeout(1600);
const secondoValore = await p.locator('#timer-valore').textContent();
ok('cucina: il timer scorre', primoValore !== secondoValore, `${primoValore} -> ${secondoValore}`);
ok('cucina: barra timer attivi', await p.locator('#barra-timer').isVisible());
await p.click('#timer-pausa');
const inPausa = await p.locator('#timer-valore').textContent();
await p.waitForTimeout(1200);
ok('cucina: la pausa ferma il conto', inPausa === (await p.locator('#timer-valore').textContent()));
await p.click('#successivo');
ok('cucina: il timer resta in barra cambiando passaggio', await p.locator('#barra-timer').isVisible());
// ripresa sessione
await p.goto(`${BASE}cucina/?id=pasta-al-pomodoro-e-basilico`, { waitUntil: 'networkidle' });
ok('cucina: propone di riprendere', await p.locator('#dialogo-riprendi').isVisible());
await p.click('#riprendi-si');
ok('cucina: riprende dal passaggio giusto', /Passaggio 3 di 6/.test((await p.locator('#contatore').textContent()) ?? ''));
await p.click('#esci');
await p.click('#esci-si');
await p.waitForURL(/ricetta\//);

// 10. spesa
await p.goto(`${BASE}spesa/`, { waitUntil: 'networkidle' });
await p.waitForSelector('.voce');
await p.locator('label:has-text("Focaccia genovese")').first().click();
await p.locator('label:has-text("Torta")').first().click().catch(() => {});
await p.locator('#scelta-tiramisu-classico').check();
await p.waitForTimeout(150);
ok('spesa: due ricette selezionate', /2 ricette selezionate/.test((await p.locator('#conteggio').textContent()) ?? ''), (await p.locator('#conteggio').textContent()) ?? '');

await p.goto(`${BASE}spesa/dispensa/`, { waitUntil: 'networkidle' });
await p.waitForSelector('.elenco-dispensa .voce');
const vociDispensa = await p.locator('.elenco-dispensa .voce').count();
ok('dispensa: voci aggregate', vociDispensa > 0, `${vociDispensa} voci`);
const testiDispensa = await p.locator('.voce__nome').allTextContents();
ok('dispensa: farina aggregata in kg', testiDispensa.some((t) => /Farina 0 — 1 kg/.test(t)), testiDispensa.join(' | '));
// segna la prima voce come "ce l'ho"
await p.click('#tutto-mancante');
await p.locator('.elenco-dispensa .voce').first().locator('label:has-text("Ce l\'ho")').click();
await p.waitForTimeout(150);
const nomePresente = (await p.locator('.elenco-dispensa .voce').first().locator('.voce__nome').textContent()) ?? '';

await p.goto(`${BASE}spesa/lista/`, { waitUntil: 'networkidle' });
await p.waitForSelector('.elenco-spesa li');
const vociLista = await p.locator('.elenco-spesa li').count();
ok('lista: contiene solo cio che manca', vociLista === vociDispensa - 1, `dispensa ${vociDispensa}, lista ${vociLista}`);
const testiLista = await p.locator('.elenco-spesa .voce__nome').allTextContents();
ok('lista: la voce "ce l\'ho" è esclusa', !testiLista.some((t) => t === nomePresente), nomePresente);
ok('lista: raggruppata per reparto', (await p.locator('.gruppo-reparto h2').count()) > 1);
await p.locator('.elenco-spesa input[type="checkbox"]').first().check();
await p.waitForTimeout(150);
ok('lista: contatore spunte', /1 di /.test((await p.locator('#conteggio').textContent()) ?? ''), (await p.locator('#conteggio').textContent()) ?? '');
await p.reload({ waitUntil: 'networkidle' });
await p.waitForSelector('.elenco-spesa li');
ok('lista: le spunte sopravvivono al ricaricamento', /1 di /.test((await p.locator('#conteggio').textContent()) ?? ''));

console.log('\n--- FLUSSI FUNZIONALI ---');
for (const passo of passi) console.log(`${passo.esito.padEnd(8)} ${passo.nome}${passo.extra ? ` (${passo.extra})` : ''}`);
const falliti = passi.filter((x) => x.esito !== 'OK').length;
console.log(`\n${passi.length - falliti}/${passi.length} passi riusciti`);
if (errori.length > 0) { console.log('\nErrori in pagina:'); for (const e of new Set(errori)) console.log(' -', e); }

await browser.close();
process.exit(falliti > 0 || errori.length > 0 ? 1 : 0);
