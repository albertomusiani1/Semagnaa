import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FILTRI_VUOTI,
  attesaRilevanteMin,
  applicaFiltri,
  attesaMassimaMin,
  attesaTotaleMin,
  fasciaDurata,
  filtriAttivi,
  haAtteseLunghe,
  haMoltiPassaggi,
  tempoTotaleMin,
} from './filtri.ts';
import { normalizzaNome } from './testo.ts';
import { ricettaFinta } from './fixtures-test.ts';

const veloce = ricettaFinta({
  id: 'veloce',
  titolo: 'Frittata veloce',
  categoria: 'secondi',
  difficolta: 'facile',
  tempoPreparazioneMin: 10,
  tempoCotturaMin: 12,
  passaggi: [{ testo: 'Sbatti le uova.' }, { testo: 'Cuoci.', timerSecondi: 300 }],
});

const lievitato = ricettaFinta({
  id: 'lievitato',
  titolo: 'Focaccia lunga',
  categoria: 'lievitati',
  difficolta: 'impegnativa',
  tempoPreparazioneMin: 30,
  tempoCotturaMin: 25,
  tags: ['forno'],
  passaggi: [
    { testo: 'Impasta.' },
    { testo: 'Lievita.', timerSecondi: 10800 },
    { testo: 'Stendi.' },
    { testo: 'Seconda lievitazione.', timerSecondi: 3600 },
    { testo: 'Inforna.', timerSecondi: 1320 },
  ],
});

const ragu = ricettaFinta({
  id: 'ragu',
  titolo: 'Ragù lungo',
  categoria: 'basi',
  difficolta: 'media',
  tempoPreparazioneMin: 25,
  tempoCotturaMin: 160,
  passaggi: Array.from({ length: 9 }, (_, i) => ({ testo: `Passaggio ${i + 1}` })),
});

const insalata = ricettaFinta({
  id: 'insalata',
  titolo: 'Insalata di finocchi',
  categoria: 'contorni',
  difficolta: 'facile',
  tempoPreparazioneMin: 10,
  tempoCotturaMin: 0,
  passaggi: [{ testo: 'Affetta.' }, { testo: 'Condisci.' }],
});

const TUTTE = [veloce, lievitato, ragu, insalata];
const filtra = (parziale: Partial<typeof FILTRI_VUOTI>) =>
  applicaFiltri(TUTTE, { ...FILTRI_VUOTI, ...parziale }, normalizzaNome).map((r) => r.id);

test('tempo totale, attesa massima e attesa totale', () => {
  assert.equal(tempoTotaleMin(veloce), 22);
  assert.equal(tempoTotaleMin(ragu), 185);
  assert.equal(attesaMassimaMin(lievitato), 180);
  assert.equal(attesaMassimaMin(insalata), 0);
  assert.equal(attesaTotaleMin(lievitato), 262);
  assert.equal(attesaRilevanteMin(ragu), 160);
});

test('le fasce di durata coprono i confini', () => {
  assert.equal(fasciaDurata(0), 'fino30');
  assert.equal(fasciaDurata(30), 'fino30');
  assert.equal(fasciaDurata(31), 'da30a60');
  assert.equal(fasciaDurata(60), 'da30a60');
  assert.equal(fasciaDurata(61), 'da1a2h');
  assert.equal(fasciaDurata(120), 'da1a2h');
  assert.equal(fasciaDurata(121), 'oltre2h');
});

test('attese lunghe e molti passaggi', () => {
  assert.equal(haAtteseLunghe(lievitato), true);
  // Il ragù non ha timer sui passaggi, ma dichiara 160 minuti di cottura:
  // resta una ricetta da mettere su e lasciar stare.
  assert.equal(haAtteseLunghe(ragu), true);
  assert.equal(haAtteseLunghe(veloce), false);
  assert.equal(haMoltiPassaggi(ragu), true);
  assert.equal(haMoltiPassaggi(lievitato), false);
});

test('senza filtri passano tutte', () => {
  assert.deepEqual(filtra({}), ['veloce', 'lievitato', 'ragu', 'insalata']);
});

test('filtro per categoria', () => {
  assert.deepEqual(filtra({ categoria: 'lievitati' }), ['lievitato']);
});

test('filtro per difficoltà, anche multiplo', () => {
  assert.deepEqual(filtra({ difficolta: ['facile'] }), ['veloce', 'insalata']);
  assert.deepEqual(filtra({ difficolta: ['media', 'impegnativa'] }), ['lievitato', 'ragu']);
});

test('filtro per durata', () => {
  assert.deepEqual(filtra({ durata: ['fino30'] }), ['veloce', 'insalata']);
  assert.deepEqual(filtra({ durata: ['oltre2h'] }), ['ragu']);
  assert.deepEqual(filtra({ durata: ['fino30', 'oltre2h'] }), ['veloce', 'ragu', 'insalata']);
});

test('filtro per attese: lunghe e brevi', () => {
  assert.deepEqual(filtra({ attesa: 'lunghe' }), ['lievitato', 'ragu']);
  assert.deepEqual(filtra({ attesa: 'brevi' }), ['veloce', 'insalata']);
});

test('filtro per numero di passaggi', () => {
  assert.deepEqual(filtra({ passaggi: 'tanti' }), ['ragu']);
  assert.deepEqual(filtra({ passaggi: 'pochi' }), ['veloce', 'insalata']);
});

test('i filtri si combinano in AND', () => {
  assert.deepEqual(filtra({ difficolta: ['facile'], durata: ['fino30'], passaggi: 'pochi' }), [
    'veloce',
    'insalata',
  ]);
  assert.deepEqual(filtra({ attesa: 'lunghe', difficolta: ['facile'] }), []);
});

test('la ricerca testuale guarda titolo, tag e ingredienti', () => {
  assert.deepEqual(filtra({ testo: 'focaccia' }), ['lievitato']);
  assert.deepEqual(filtra({ testo: 'forno' }), ['lievitato']);
  assert.deepEqual(filtra({ testo: 'farina' }), ['veloce', 'lievitato', 'ragu', 'insalata']);
  assert.deepEqual(filtra({ testo: 'ragù' }), ['ragu']);
  assert.deepEqual(filtra({ testo: 'zzz' }), []);
});

test('il conteggio dei filtri attivi ignora la ricerca testuale', () => {
  assert.equal(filtriAttivi(FILTRI_VUOTI), 0);
  assert.equal(filtriAttivi({ ...FILTRI_VUOTI, testo: 'pane' }), 0);
  assert.equal(filtriAttivi({ ...FILTRI_VUOTI, categoria: 'primi', attesa: 'lunghe' }), 2);
  assert.equal(
    filtriAttivi({ ...FILTRI_VUOTI, difficolta: ['facile'], durata: ['fino30'], passaggi: 'pochi' }),
    3,
  );
});
