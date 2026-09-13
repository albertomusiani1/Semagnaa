import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FILTRI_VINO_VUOTI,
  applicaFiltriVino,
  filtriVinoAttivi,
  ordinaVini,
  regioniDi,
  valoriDistinti,
} from './vini.ts';
import { normalizzaNome } from './testo.ts';
import { vinoFinto } from './fixtures-vino-test.ts';

const brunello = vinoFinto({
  id: 'brunello',
  nome: 'Brunello di Montalcino',
  cantina: 'Poggio Antico',
  regione: 'Toscana',
  colore: 'rosso',
  bollicine: 'fermo',
  annata: 2018,
  gusto: 'Tannico, lungo.',
  preferito: true,
});

const franciacorta = vinoFinto({
  id: 'franciacorta',
  nome: 'Franciacorta Brut',
  cantina: 'Ca del Bosco',
  regione: 'Lombardia',
  colore: 'bianco',
  bollicine: 'spumante',
  annata: 2020,
  gusto: 'Secco, agrumato.',
});

const cerasuolo = vinoFinto({
  id: 'cerasuolo',
  nome: 'Cerasuolo d Abruzzo',
  cantina: 'Valle Reale',
  regione: 'Abruzzo',
  colore: 'rosato',
  bollicine: 'fermo',
  annata: 2022,
  gusto: 'Fresco, di ciliegia.',
});

const lambrusco = vinoFinto({
  id: 'lambrusco',
  nome: 'Lambrusco di Sorbara',
  cantina: 'Paltrinieri',
  regione: 'Emilia-Romagna',
  colore: 'rosso',
  bollicine: 'frizzante',
  annata: 2023,
  gusto: 'Asciutto, vivace.',
});

const chablis = vinoFinto({
  id: 'chablis',
  nome: 'Chablis',
  cantina: 'Domaine Laroche',
  paese: 'Francia',
  regione: 'Borgogna',
  colore: 'bianco',
  bollicine: 'fermo',
  annata: 2021,
  gusto: 'Minerale, teso.',
});

const CANTINA = [brunello, franciacorta, cerasuolo, lambrusco, chablis];
const cerca = (parziale: Partial<typeof FILTRI_VINO_VUOTI>) =>
  applicaFiltriVino(CANTINA, { ...FILTRI_VINO_VUOTI, ...parziale }, normalizzaNome).map((v) => v.id);

test('senza filtri esce tutta la cantina', () => {
  assert.deepEqual(cerca({}), ['brunello', 'franciacorta', 'cerasuolo', 'lambrusco', 'chablis']);
});

test('i valori dei filtri nascono dai vini inseriti', () => {
  assert.deepEqual(valoriDistinti(CANTINA, 'paese'), ['Francia', 'Italia']);
  assert.deepEqual(valoriDistinti(CANTINA, 'cantina'), [
    'Ca del Bosco',
    'Domaine Laroche',
    'Paltrinieri',
    'Poggio Antico',
    'Valle Reale',
  ]);
  assert.deepEqual(regioniDi(CANTINA, 'Francia'), ['Borgogna']);
  assert.deepEqual(regioniDi(CANTINA, 'Italia'), ['Abruzzo', 'Emilia-Romagna', 'Lombardia', 'Toscana']);
});

test('filtro per paese e per regione', () => {
  assert.deepEqual(cerca({ paese: 'Francia' }), ['chablis']);
  assert.deepEqual(cerca({ regione: 'Toscana' }), ['brunello']);
});

test('filtro per cantina', () => {
  assert.deepEqual(cerca({ cantina: 'Paltrinieri' }), ['lambrusco']);
});

test('colore e bollicine sono due filtri indipendenti', () => {
  assert.deepEqual(cerca({ colori: ['bianco'] }), ['franciacorta', 'chablis']);
  assert.deepEqual(cerca({ bollicine: ['fermo'] }), ['brunello', 'cerasuolo', 'chablis']);
  // Il caso che un elenco unico non saprebbe esprimere: bianco, ma con le bollicine.
  assert.deepEqual(cerca({ colori: ['bianco'], bollicine: ['spumante'] }), ['franciacorta']);
  assert.deepEqual(cerca({ colori: ['rosso'], bollicine: ['frizzante'] }), ['lambrusco']);
});

test('più colori insieme', () => {
  assert.deepEqual(cerca({ colori: ['rosato', 'bianco'] }), ['franciacorta', 'cerasuolo', 'chablis']);
});

test('filtro per annata', () => {
  assert.deepEqual(cerca({ annataDa: 2021 }), ['cerasuolo', 'lambrusco', 'chablis']);
  assert.deepEqual(cerca({ annataA: 2020 }), ['brunello', 'franciacorta']);
  assert.deepEqual(cerca({ annataDa: 2020, annataA: 2021 }), ['franciacorta', 'chablis']);
});

test('i vini senza annata restano fuori dai filtri sull annata', () => {
  const senzaAnnata = vinoFinto({ id: 'senza', nome: 'Senza annata' });
  const risultato = applicaFiltriVino(
    [senzaAnnata, brunello],
    { ...FILTRI_VINO_VUOTI, annataDa: 2000 },
    normalizzaNome,
  );
  assert.deepEqual(risultato.map((v) => v.id), ['brunello']);
});

test('solo preferiti', () => {
  assert.deepEqual(cerca({ soloPreferiti: true }), ['brunello']);
});

test('la ricerca testuale guarda nome, cantina, regione, paese e gusto', () => {
  assert.deepEqual(cerca({ testo: 'montalcino' }), ['brunello']);
  assert.deepEqual(cerca({ testo: 'paltrinieri' }), ['lambrusco']);
  assert.deepEqual(cerca({ testo: 'borgogna' }), ['chablis']);
  assert.deepEqual(cerca({ testo: 'ciliegia' }), ['cerasuolo']);
  assert.deepEqual(cerca({ testo: 'zzz' }), []);
});

test('i filtri si combinano in AND', () => {
  assert.deepEqual(cerca({ paese: 'Italia', colori: ['rosso'], bollicine: ['fermo'] }), ['brunello']);
  assert.deepEqual(cerca({ paese: 'Francia', colori: ['rosso'] }), []);
});

test('il conteggio dei filtri attivi comprende la ricerca testuale', () => {
  assert.equal(filtriVinoAttivi(FILTRI_VINO_VUOTI), 0);
  assert.equal(filtriVinoAttivi({ ...FILTRI_VINO_VUOTI, testo: 'barolo' }), 1);
  assert.equal(filtriVinoAttivi({ ...FILTRI_VINO_VUOTI, regione: 'Toscana', colori: ['rosso'] }), 2);
  assert.equal(filtriVinoAttivi({ ...FILTRI_VINO_VUOTI, annataDa: 2015, annataA: 2020 }), 1);
});

test('l ordinamento mette insieme i vini della stessa cantina', () => {
  const ordinati = ordinaVini(CANTINA).map((v) => v.cantina);
  assert.deepEqual(ordinati, [
    'Ca del Bosco',
    'Domaine Laroche',
    'Paltrinieri',
    'Poggio Antico',
    'Valle Reale',
  ]);
  // L'array originale non viene toccato.
  assert.equal(CANTINA[0]?.id, 'brunello');
});
