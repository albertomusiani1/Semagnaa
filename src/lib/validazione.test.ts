import test from 'node:test';
import assert from 'node:assert/strict';
import { validaImportazione, validaRicetta } from './validazione.ts';

const VALIDA = {
  titolo: 'Risotto allo zafferano',
  categoria: 'primi',
  difficolta: 'media',
  porzioni: 4,
  tempoPreparazioneMin: 10,
  tempoCotturaMin: 20,
  descrizione: 'Il classico risotto giallo.',
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

test('descrizione troppo lunga: rifiutata', () => {
  const esito = validaRicetta({ ...VALIDA, descrizione: 'a'.repeat(201) });
  assert.deepEqual(esito, { ok: false, errore: 'errori.descrizioneTroppoLunga' });
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
