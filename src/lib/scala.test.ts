import test from 'node:test';
import assert from 'node:assert/strict';
import { arrotondaQuantita, fattoreScala, scalaIngredienti, scalaRicetta } from './scala.ts';
import { ricettaFinta } from './fixtures-test.ts';

test('il fattore di scala e il rapporto tra le porzioni', () => {
  assert.equal(fattoreScala(4, 2), 0.5);
  assert.equal(fattoreScala(4, 6), 1.5);
  assert.equal(fattoreScala(0, 6), 1);
  assert.equal(fattoreScala(4, 0), 1);
});

test('le unita discrete si arrotondano a mezzi e mai a zero', () => {
  assert.equal(arrotondaQuantita(1.4, 'pezzi'), 1.5);
  assert.equal(arrotondaQuantita(0.2, 'pezzi'), 0.5);
  assert.equal(arrotondaQuantita(3.1, 'spicchi'), 3);
});

test('i grammi grandi si arrotondano all unita, i piccoli a due decimali', () => {
  assert.equal(arrotondaQuantita(333.333, 'g'), 333);
  assert.equal(arrotondaQuantita(12.4, 'g'), 12.5);
  assert.equal(arrotondaQuantita(0.666, 'g'), 0.67);
});

test('scalare gli ingredienti non tocca le voci senza quantita', () => {
  const ingredienti = scalaIngredienti(
    [
      { nome: 'Farina', quantita: 200, unita: 'g', reparto: 'dispensa' },
      { nome: 'Sale', unita: 'qb', reparto: 'dispensa' },
    ],
    4,
    6,
  );
  assert.equal(ingredienti[0]?.quantita, 300);
  assert.equal(ingredienti[1]?.quantita, undefined);
  assert.equal(ingredienti[1]?.unita, 'qb');
});

test('scalaRicetta aggiorna porzioni e quantita insieme', () => {
  const scalata = scalaRicetta(ricettaFinta({ porzioni: 4 }), 2);
  assert.equal(scalata.porzioni, 2);
  assert.equal(scalata.ingredienti[0]?.quantita, 100);
});
