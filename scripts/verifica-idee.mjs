/**
 * Verifica 21 della Definizione di Fatto: le idee per la domenica.
 *
 * Crea una combinazione di piatti con le note, controlla che nell'elenco si
 * vedano i nomi dei piatti ma non le note, che nella scheda ogni piatto si
 * apra da solo, e che modifica, riordino ed eliminazione funzionino.
 *
 * Serve Playwright (vedi scripts/verifica-flussi.mjs).
 *   node scripts/verifica-idee.mjs
 */
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');

const BASE = process.env.URL_APP ?? `http://localhost:4321${process.env.BASE_PATH ?? '/Semagnaa/'}`;

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

async function aggiungiPiatto(nome, note) {
  await p.fill('#piatto-nome', nome);
  if (note !== undefined) await p.fill('#piatto-note', note);
  await p.click('#aggiungi-piatto');
}

const NOTA_TACOS = 'Carne marinata la sera prima, tortillas scaldate in padella.';

try {
  // --- 1. sezione vuota --------------------------------------------------
  await p.goto(`${BASE}idee/`, { waitUntil: 'networkidle' });
  await p.waitForSelector('#elenco .vuoto');
  ok('senza idee compare l invito con l esempio', /messicano/i.test((await p.locator('#elenco').textContent()) ?? ''));

  // --- 2. nuova idea con tre piatti -------------------------------------
  await p.goto(`${BASE}idea/modifica/`, { waitUntil: 'networkidle' });
  await p.fill('#titolo', 'Pranzo messicano');
  await p.fill('#nota', 'Per sei, con birra chiara.');
  await aggiungiPiatto('Tacos di manzo', NOTA_TACOS);
  await aggiungiPiatto('Guacamole');
  await aggiungiPiatto('Caesar salad', 'Senza acciughe.');
  ok('i piatti si aggiungono uno alla volta', (await p.locator('#piatti > li').count()) === 3);

  // un piatto senza nome non entra
  await p.click('#aggiungi-piatto');
  ok(
    'un piatto senza nome viene rifiutato',
    (await p.locator('#piatti > li').count()) === 3 &&
      (await p.locator('#messaggio').getAttribute('data-tipo')) === 'errore',
  );

  // riordino
  await p.locator('#piatti > li').nth(2).locator('button[aria-label="Sposta su"]').click();
  ok(
    'i piatti si riordinano',
    ((await p.locator('#piatti > li').nth(1).textContent()) ?? '').includes('Caesar'),
  );
  await p.locator('#piatti > li').nth(1).locator('button[aria-label="Sposta giu"]').click();

  await p.click('button[type="submit"]');
  await p.waitForURL(/idea\/\?id=pranzo-messicano/, { timeout: 10_000 });
  ok('il salvataggio apre la scheda', p.url().includes('idea/?id=pranzo-messicano'), p.url());

  // --- 3. la scheda: piatti apribili ------------------------------------
  await p.waitForSelector('#idea:not([hidden])');
  ok('la scheda mostra il titolo', (await p.locator('#titolo').textContent()) === 'Pranzo messicano');
  ok('la scheda mostra la nota generale', ((await p.locator('#nota').textContent()) ?? '').includes('birra'));
  ok('conta piatti e note', /3 piatti · 2 con note/.test((await p.locator('#meta').textContent()) ?? ''), (await p.locator('#meta').textContent()) ?? '');
  ok('i piatti sono tre', (await p.locator('#piatti > li').count()) === 3);

  const tacos = p.locator('details.piatto', { hasText: 'Tacos di manzo' });
  ok('il piatto con note parte chiuso', (await tacos.getAttribute('open')) === null);
  ok('le note non si vedono a piatto chiuso', !(await tacos.locator('.piatto__note').isVisible()));
  await tacos.locator('summary').click();
  ok('aprendo il piatto si leggono le note', await tacos.locator('.piatto__note').isVisible());
  ok('sono le note giuste', ((await tacos.locator('.piatto__note').textContent()) ?? '').includes('marinata'));
  ok('il piatto senza note non è apribile', (await p.locator('li.piatto--semplice').count()) === 1);

  // --- 4. nell'elenco si vedono i nomi, non le note ---------------------
  await p.goto(`${BASE}idee/`, { waitUntil: 'networkidle' });
  await p.waitForSelector('.idea-scheda');
  const testoElenco = (await p.locator('#elenco').textContent()) ?? '';
  ok('l elenco mostra i nomi dei piatti', testoElenco.includes('Tacos di manzo') && testoElenco.includes('Guacamole'));
  ok('l elenco non mostra le note dei piatti', !testoElenco.includes('marinata'));
  ok('l elenco conta i piatti', /3 piatti/.test(testoElenco));

  // --- 5. seconda idea, ricerca e preferite -----------------------------
  await p.goto(`${BASE}idea/modifica/`, { waitUntil: 'networkidle' });
  await p.fill('#titolo', 'Domenica di pesce');
  await aggiungiPiatto('Spaghetti alle vongole');
  await aggiungiPiatto('Orata al forno');
  await p.check('#preferita');
  await p.click('button[type="submit"]');
  await p.waitForURL(/idea\/\?id=domenica-di-pesce/, { timeout: 10_000 });

  await p.goto(`${BASE}idee/`, { waitUntil: 'networkidle' });
  await p.waitForSelector('.idea-scheda');
  ok('due idee in elenco', (await p.locator('.idea-scheda').count()) === 2);
  ok(
    'la preferita sta in cima',
    ((await p.locator('.idea-scheda__titolo').first().textContent()) ?? '').includes('Domenica di pesce'),
  );

  // --- 6. modifica: i piatti si ritrovano -------------------------------
  await p.goto(`${BASE}idea/modifica/?id=pranzo-messicano`, { waitUntil: 'networkidle' });
  await p.waitForSelector('#piatti > li');
  ok('modificando, i piatti sono già lì', (await p.locator('#piatti > li').count()) === 3);
  ok('il titolo è precompilato', (await p.locator('#titolo').inputValue()) === 'Pranzo messicano');
  await aggiungiPiatto('Churros', 'Solo se avanza spazio.');
  await p.click('button[type="submit"]');
  await p.waitForURL(/idea\/\?id=pranzo-messicano/, { timeout: 10_000 });
  await p.waitForSelector('#idea:not([hidden])');
  ok('il piatto aggiunto compare nella scheda', (await p.locator('#piatti > li').count()) === 4);

  // --- 7. eliminazione ---------------------------------------------------
  await p.click('#elimina');
  await p.click('#conferma-elimina');
  await p.waitForURL(/idee\//, { timeout: 10_000 });
  await p.waitForSelector('.idea-scheda');
  ok("l'idea eliminata sparisce", (await p.locator('.idea-scheda').count()) === 1);

  // --- 8. convivenza con il resto --------------------------------------
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.waitForSelector('#conteggio');
  const archivio = await p.evaluate(() => ({
    ricette: JSON.parse(localStorage.getItem('semagnaa:ricette') ?? '[]').length,
    idee: JSON.parse(localStorage.getItem('semagnaa:idee') ?? '[]').length,
  }));
  ok('ricette e idee convivono', archivio.ricette === 9 && archivio.idee === 1, JSON.stringify(archivio));
} finally {
  await browser.close();
}

console.log('--- IDEE PER LA DOMENICA ---');
for (const passo of passi) console.log(`${passo.esito.padEnd(8)} ${passo.nome}${passo.extra ? ` (${passo.extra})` : ''}`);
if (errori.length > 0) {
  console.log('\nErrori in pagina:');
  for (const e of new Set(errori)) console.log(' -', e);
}
const falliti = passi.filter((x) => x.esito !== 'OK').length;
console.log(`\n${passi.length - falliti}/${passi.length} passi riusciti`);
process.exit(falliti > 0 || errori.length > 0 ? 1 : 0);
