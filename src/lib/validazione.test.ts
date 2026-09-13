import test from 'node:test';
import assert from 'node:assert/strict';
import { validaImportazione, validaRicetta, validaVino } from './validazione.ts';

const VALIDA = {
  titolo: 'Risotto allo zafferano',
  categoria: 'primi',
  difficolta: 'media',
  porzioni: 4,
  tempoPreparazioneMin: 10,
  tempoCotturaMin: 20,
  ingredienti: [
    { nome: 'Riso Carnaroli', quantita: 320, unita: 'g', reparto: 'dispensa' },
    { nome: 'Zafferano', unita: 'qb', reparto: 'dispensa' },
  ],
  passaggi: [{ testo: 'Tosta il riso.' }, { testo: 'Aggiungi il brodo.', timerSecondi: 1080 }],
  tags: ['classico', ' festa '],
};

test('una ricetta completa passa e viene normalizzata', () => {
  const esito = validaRicetta(VALIDA);
  assert.equal(esito.ok, true);
  if (!esito.ok) return;
  assert.equal(esito.dato.id, 'risotto-allo-zafferano');
  assert.deepEqual(esito.dato.tags, ['classico', 'festa']);
  assert.equal(esito.dato.preferita, false);
  assert.equal(esito.dato.passaggi[1]?.timerSecondi, 1080);
});

test('l id viene reso unico rispetto a quelli esistenti', () => {
  const esito = validaRicetta(VALIDA, ['risotto-allo-zafferano']);
  assert.equal(esito.ok, true);
  if (esito.ok) assert.equal(esito.dato.id, 'risotto-allo-zafferano-2');
});

test('titolo mancante: errore leggibile', () => {
  const esito = validaRicetta({ ...VALIDA, titolo: '   ' });
  assert.deepEqual(esito, { ok: false, errore: 'errori.titoloObbligatorio' });
});

test('categoria fuori elenco: rifiutata', () => {
  const esito = validaRicetta({ ...VALIDA, categoria: 'merende' });
  assert.deepEqual(esito, { ok: false, errore: 'errori.categoriaNonValida' });
});

test('porzioni non valide: rifiutate', () => {
  assert.deepEqual(validaRicetta({ ...VALIDA, porzioni: 0 }), { ok: false, errore: 'errori.porzioniNonValide' });
  assert.deepEqual(validaRicetta({ ...VALIDA, porzioni: 'tante' }), {
    ok: false,
    errore: 'errori.porzioniNonValide',
  });
});

test('serve almeno un ingrediente e almeno un passaggio', () => {
  assert.deepEqual(validaRicetta({ ...VALIDA, ingredienti: [] }), {
    ok: false,
    errore: 'errori.almenoUnIngrediente',
  });
  assert.deepEqual(validaRicetta({ ...VALIDA, passaggi: [] }), { ok: false, errore: 'errori.almenoUnPassaggio' });
});

test('reparto e unita fuori elenco: rifiutati', () => {
  assert.deepEqual(
    validaRicetta({ ...VALIDA, ingredienti: [{ nome: 'Riso', quantita: 1, unita: 'g', reparto: 'reparto-x' }] }),
    { ok: false, errore: 'errori.repartoNonValido' },
  );
  assert.deepEqual(
    validaRicetta({ ...VALIDA, ingredienti: [{ nome: 'Riso', quantita: 1, unita: 'tazze', reparto: 'dispensa' }] }),
    { ok: false, errore: 'errori.unitaNonValida' },
  );
});

test('timer non numerico: rifiutato', () => {
  const esito = validaRicetta({ ...VALIDA, passaggi: [{ testo: 'Cuoci.', timerSecondi: 'dieci' }] });
  assert.deepEqual(esito, { ok: false, errore: 'errori.timerNonValido' });
});

test('la quantita accetta la virgola decimale e "qb" resta senza numero', () => {
  const esito = validaRicetta({
    ...VALIDA,
    ingredienti: [
      { nome: 'Acqua', quantita: '1,5', unita: 'l', reparto: 'bevande' },
      { nome: 'Pepe', quantita: '5', unita: 'qb', reparto: 'dispensa' },
    ],
  });
  assert.equal(esito.ok, true);
  if (!esito.ok) return;
  assert.equal(esito.dato.ingredienti[0]?.quantita, 1.5);
  assert.equal(esito.dato.ingredienti[1]?.quantita, undefined);
});

test('importazione: array valido, JSON rotto, formato sbagliato, file vuoto', () => {
  const esportato = JSON.stringify({ versione: 1, ricette: [VALIDA] });
  const esito = validaImportazione(esportato);
  assert.equal(esito.ok, true);
  if (esito.ok) assert.equal(esito.dato.length, 1);

  assert.deepEqual(validaImportazione('{ questo non e json'), { ok: false, errore: 'errori.jsonNonValido' });
  assert.deepEqual(validaImportazione('{"altro": 1}'), { ok: false, errore: 'errori.formatoImportazione' });
  assert.deepEqual(validaImportazione('[]'), { ok: false, errore: 'errori.importazioneVuota' });
  assert.deepEqual(validaImportazione(JSON.stringify([{ titolo: 'Solo il titolo' }])), {
    ok: false,
    errore: 'errori.categoriaNonValida',
  });
});

test('esportazione e reimportazione conservano i dati (andata e ritorno)', () => {
  const primo = validaRicetta(VALIDA);
  assert.equal(primo.ok, true);
  if (!primo.ok) return;
  const secondo = validaImportazione(JSON.stringify([primo.dato]));
  assert.equal(secondo.ok, true);
  if (!secondo.ok) return;
  const tornata = secondo.dato[0];
  assert.ok(tornata);
  assert.equal(tornata.id, primo.dato.id);
  assert.equal(tornata.titolo, primo.dato.titolo);
  assert.deepEqual(tornata.ingredienti, primo.dato.ingredienti);
  assert.deepEqual(tornata.passaggi, primo.dato.passaggi);
  assert.equal(tornata.creataIl, primo.dato.creataIl);
});

/* --- Vini --------------------------------------------------------------- */

const VINO_VALIDO = {
  nome: 'Barolo Cannubi',
  cantina: 'Marchesi di Barolo',
  paese: 'Italia',
  regione: 'Piemonte',
  colore: 'rosso',
  bollicine: 'fermo',
  annata: '2016',
  gusto: 'Tannico, austero, lunghissimo.',
  descrizione: 'Aperto a cena di Natale: servirebbe un altro paio di anni di bottiglia.',
};

test('un vino completo passa e prende un id da cantina e nome', () => {
  const esito = validaVino(VINO_VALIDO);
  assert.equal(esito.ok, true);
  if (!esito.ok) return;
  assert.equal(esito.dato.id, 'marchesi-di-barolo-barolo-cannubi');
  assert.equal(esito.dato.annata, 2016);
  assert.equal(esito.dato.preferito, false);
  assert.equal(esito.dato.colore, 'rosso');
  assert.equal(esito.dato.bollicine, 'fermo');
});

test('nome e cantina sono obbligatori', () => {
  assert.deepEqual(validaVino({ ...VINO_VALIDO, nome: '  ' }), {
    ok: false,
    errore: 'errori.nomeVinoObbligatorio',
  });
  assert.deepEqual(validaVino({ ...VINO_VALIDO, cantina: '' }), {
    ok: false,
    errore: 'errori.cantinaObbligatoria',
  });
});

test('colore e bollicine devono stare nei loro elenchi', () => {
  assert.deepEqual(validaVino({ ...VINO_VALIDO, colore: 'arancione' }), {
    ok: false,
    errore: 'errori.coloreNonValido',
  });
  assert.deepEqual(validaVino({ ...VINO_VALIDO, bollicine: 'gassato' }), {
    ok: false,
    errore: 'errori.bollicineNonValide',
  });
});

test('annata fuori intervallo: rifiutata', () => {
  assert.deepEqual(validaVino({ ...VINO_VALIDO, annata: '1750' }), {
    ok: false,
    errore: 'errori.annataNonValida',
  });
  assert.deepEqual(validaVino({ ...VINO_VALIDO, annata: 'boh' }), {
    ok: false,
    errore: 'errori.annataNonValida',
  });
});

test('un vino senza annata è ammesso', () => {
  const { annata, ...senzaAnnata } = VINO_VALIDO;
  void annata;
  const esito = validaVino(senzaAnnata);
  assert.equal(esito.ok, true);
  if (esito.ok) assert.equal(esito.dato.annata, undefined);
});

test('gusto e descrizione troppo lunghi: rifiutati', () => {
  assert.deepEqual(validaVino({ ...VINO_VALIDO, gusto: 'a'.repeat(141) }), {
    ok: false,
    errore: 'errori.gustoTroppoLungo',
  });
  assert.deepEqual(validaVino({ ...VINO_VALIDO, descrizione: 'a'.repeat(2001) }), {
    ok: false,
    errore: 'errori.descrizioneVinoTroppoLunga',
  });
});

test('il riferimento alla foto viene conservato', () => {
  const esito = validaVino({ ...VINO_VALIDO, fotoId: 'foto-abc123' });
  assert.equal(esito.ok, true);
  if (esito.ok) assert.equal(esito.dato.fotoId, 'foto-abc123');
});

test('due vini con lo stesso nome e cantina prendono id diversi', () => {
  const primo = validaVino(VINO_VALIDO);
  assert.equal(primo.ok, true);
  if (!primo.ok) return;
  const secondo = validaVino(VINO_VALIDO, [primo.dato.id]);
  assert.equal(secondo.ok, true);
  if (secondo.ok) assert.equal(secondo.dato.id, `${primo.dato.id}-2`);
});
