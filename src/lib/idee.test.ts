import test from 'node:test';
import assert from 'node:assert/strict';
import { cercaIdee, elencoPiatti, ordinaIdee, piattiConNote } from './idee.ts';
import { normalizzaNome } from './testo.ts';
import { ideaFinta } from './fixtures-idea-test.ts';

const messicano = ideaFinta({
  id: 'pranzo-messicano',
  titolo: 'Pranzo messicano',
  nota: 'Per sei, con birra chiara.',
  aggiornataIl: '2026-03-01T10:00:00.000Z',
  piatti: [
    { nome: 'Tacos di manzo', note: 'Carne marinata la sera prima.' },
    { nome: 'Guacamole' },
    { nome: 'Caesar salad', note: 'Senza acciughe per la nonna.' },
  ],
});

const pesce = ideaFinta({
  id: 'domenica-di-pesce',
  titolo: 'Domenica di pesce',
  aggiornataIl: '2026-02-01T10:00:00.000Z',
  piatti: [{ nome: 'Spaghetti alle vongole' }, { nome: 'Orata al forno' }],
});

const arrosto = ideaFinta({
  id: 'arrosto-della-nonna',
  titolo: 'Arrosto della nonna',
  preferita: true,
  aggiornataIl: '2026-01-15T10:00:00.000Z',
  piatti: [{ nome: 'Arrosto', note: 'Due ore di forno.' }, { nome: 'Patate al rosmarino' }],
});

const TUTTE = [messicano, pesce, arrosto];

test('le preferite stanno in cima, poi dalla più recente', () => {
  assert.deepEqual(ordinaIdee(TUTTE).map((i) => i.id), [
    'arrosto-della-nonna',
    'pranzo-messicano',
    'domenica-di-pesce',
  ]);
  // L'array originale non viene toccato.
  assert.equal(TUTTE[0]?.id, 'pranzo-messicano');
});

test('elencoPiatti dà i nomi nell ordine scelto', () => {
  assert.deepEqual(elencoPiatti(messicano), ['Tacos di manzo', 'Guacamole', 'Caesar salad']);
});

test('piattiConNote conta solo le note vere', () => {
  assert.equal(piattiConNote(messicano), 2);
  assert.equal(piattiConNote(pesce), 0);
  assert.equal(piattiConNote(ideaFinta({ id: 'x', piatti: [{ nome: 'A', note: '   ' }] })), 0);
});

test('la ricerca guarda titolo, nota e piatti', () => {
  const cerca = (testo: string) => cercaIdee(TUTTE, testo, normalizzaNome).map((i) => i.id);
  assert.deepEqual(cerca('messicano'), ['pranzo-messicano']);
  assert.deepEqual(cerca('vongole'), ['domenica-di-pesce']);
  assert.deepEqual(cerca('birra'), ['pranzo-messicano']);
  assert.deepEqual(cerca('nonna'), ['pranzo-messicano', 'arrosto-della-nonna']);
  assert.deepEqual(cerca('zzz'), []);
  assert.equal(cercaIdee(TUTTE, '', normalizzaNome).length, 3);
});
