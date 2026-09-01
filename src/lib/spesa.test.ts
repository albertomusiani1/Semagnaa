import test from 'node:test';
import assert from 'node:assert/strict';
import { aggrega, comeTesto, raggruppaPerReparto, vociMancanti } from './spesa.ts';
import { formatta } from './unita.ts';
import { ricettaFinta } from './fixtures-test.ts';

const pasta = ricettaFinta({
  id: 'pasta',
  titolo: 'Pasta al pomodoro',
  porzioni: 4,
  ingredienti: [
    { nome: 'Pasta', quantita: 400, unita: 'g', reparto: 'dispensa' },
    { nome: 'Pomodori pelati', quantita: 800, unita: 'g', reparto: 'dispensa' },
    { nome: 'Olio extravergine', quantita: 2, unita: 'cucchiai', reparto: 'dispensa' },
    { nome: 'Sale', unita: 'qb', reparto: 'dispensa' },
    { nome: 'Basilico', quantita: 6, unita: 'foglie', reparto: 'frutta-verdura' },
  ],
});

const focaccia = ricettaFinta({
  id: 'focaccia',
  titolo: 'Focaccia',
  categoria: 'lievitati',
  porzioni: 8,
  ingredienti: [
    { nome: 'Farina', quantita: 500, unita: 'g', reparto: 'dispensa' },
    { nome: 'Olio extravergine', quantita: 60, unita: 'ml', reparto: 'dispensa' },
    { nome: 'Sale', unita: 'qb', reparto: 'dispensa' },
    { nome: 'Acqua', quantita: 0.35, unita: 'l', reparto: 'bevande' },
  ],
});

const torta = ricettaFinta({
  id: 'torta',
  titolo: 'Torta di mele',
  categoria: 'dolci',
  porzioni: 8,
  ingredienti: [
    { nome: 'Farina', quantita: 300, unita: 'g', reparto: 'dispensa' },
    { nome: 'Mele', quantita: 4, unita: 'pezzi', reparto: 'frutta-verdura' },
    { nome: 'Uova', quantita: 3, unita: 'pezzi', reparto: 'latticini' },
  ],
});

const RICETTE = [pasta, focaccia, torta];

test('gli ingredienti uguali di ricette diverse si sommano', () => {
  const voci = aggrega(RICETTE, [
    { ricettaId: 'focaccia', porzioni: 8 },
    { ricettaId: 'torta', porzioni: 8 },
  ]);
  const farina = voci.find((v) => v.nome === 'Farina');
  assert.ok(farina);
  assert.deepEqual(farina.quantita, { valore: 800, unita: 'g' });
  assert.deepEqual(farina.ricette, ['Focaccia', 'Torta di mele']);
});

test('la somma promuove a kg quando conviene', () => {
  const voci = aggrega(RICETTE, [
    { ricettaId: 'focaccia', porzioni: 16 },
    { ricettaId: 'torta', porzioni: 8 },
  ]);
  const farina = voci.find((v) => v.nome === 'Farina');
  assert.deepEqual(farina?.quantita, { valore: 1.3, unita: 'kg' });
});

test('unita non sommabili restano voci separate', () => {
  const voci = aggrega(RICETTE, [
    { ricettaId: 'pasta', porzioni: 4 },
    { ricettaId: 'focaccia', porzioni: 8 },
  ]);
  const olio = voci.filter((v) => v.nome === 'Olio extravergine');
  assert.equal(olio.length, 2);
  const unita = olio.map((v) => v.quantita.unita).sort();
  assert.deepEqual(unita, ['cucchiai', 'ml']);
});

test('le voci "quanto basta" compaiono una volta sola e senza numero', () => {
  const voci = aggrega(RICETTE, [
    { ricettaId: 'pasta', porzioni: 4 },
    { ricettaId: 'focaccia', porzioni: 8 },
  ]);
  const sale = voci.filter((v) => v.nome === 'Sale');
  assert.equal(sale.length, 1);
  assert.equal(sale[0]?.quantita.valore, undefined);
  assert.equal(sale[0]?.quantita.unita, 'qb');
  assert.deepEqual(sale[0]?.ricette, ['Pasta al pomodoro', 'Focaccia']);
});

test('le porzioni richieste scalano le quantita prima della somma', () => {
  const voci = aggrega(RICETTE, [{ ricettaId: 'pasta', porzioni: 2 }]);
  const pastaVoce = voci.find((v) => v.nome === 'Pasta');
  assert.deepEqual(pastaVoce?.quantita, { valore: 200, unita: 'g' });
});

test('nomi scritti in modo diverso ma equivalenti finiscono nella stessa voce', () => {
  const a = ricettaFinta({
    id: 'a',
    titolo: 'A',
    porzioni: 1,
    ingredienti: [{ nome: 'Pomodori pelati', quantita: 100, unita: 'g', reparto: 'dispensa' }],
  });
  const b = ricettaFinta({
    id: 'b',
    titolo: 'B',
    porzioni: 1,
    ingredienti: [{ nome: '  pomodori  pelati ', quantita: 150, unita: 'g', reparto: 'dispensa' }],
  });
  const voci = aggrega([a, b], [
    { ricettaId: 'a', porzioni: 1 },
    { ricettaId: 'b', porzioni: 1 },
  ]);
  assert.equal(voci.length, 1);
  assert.deepEqual(voci[0]?.quantita, { valore: 250, unita: 'g' });
});

test('una ricetta non selezionata non entra nella lista', () => {
  const voci = aggrega(RICETTE, [{ ricettaId: 'inesistente', porzioni: 4 }]);
  assert.deepEqual(voci, []);
});

test('il raggruppamento segue l ordine dei reparti', () => {
  const voci = aggrega(RICETTE, [{ ricettaId: 'torta', porzioni: 8 }]);
  const gruppi = raggruppaPerReparto(voci);
  assert.deepEqual(gruppi.map((g) => g.reparto), ['frutta-verdura', 'latticini', 'dispensa']);
});

test('la checklist dispensa toglie dalla lista cio che si ha in casa', () => {
  const voci = aggrega(RICETTE, [{ ricettaId: 'torta', porzioni: 8 }]);
  const farina = voci.find((v) => v.nome === 'Farina');
  assert.ok(farina);
  const mancanti = vociMancanti(voci, { [farina.chiave]: true });
  assert.equal(mancanti.length, voci.length - 1);
  assert.equal(mancanti.some((v) => v.nome === 'Farina'), false);
});

test('la lista in testo semplice e leggibile e raggruppata', () => {
  const voci = aggrega(RICETTE, [{ ricettaId: 'torta', porzioni: 8 }]);
  const testo = comeTesto(
    raggruppaPerReparto(voci),
    'Lista della spesa',
    { 'frutta-verdura': 'Frutta e verdura', latticini: 'Latticini e uova', dispensa: 'Dispensa' },
    { g: 'g', pezzi: 'pz' },
    formatta,
  );
  assert.match(testo, /^Lista della spesa/);
  assert.match(testo, /Frutta e verdura:\n- Mele — 4 pz/);
  assert.match(testo, /Dispensa:\n- Farina — 300 g/);
});
