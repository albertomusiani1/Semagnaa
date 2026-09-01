import test from 'node:test';
import assert from 'node:assert/strict';
import { gruppoIngrediente, ordinaIngredienti } from './ordine.ts';
import type { Ingrediente } from './tipi.ts';

const i = (parziale: Partial<Ingrediente> & { nome: string }): Ingrediente => ({
  reparto: 'dispensa',
  ...parziale,
});

test('il gruppo si deduce da nome e reparto', () => {
  assert.equal(gruppoIngrediente(i({ nome: 'Farina 0', quantita: 500, unita: 'g' })), 'base-secca');
  assert.equal(gruppoIngrediente(i({ nome: 'Acqua', quantita: 700, unita: 'ml', reparto: 'bevande' })), 'liquidi');
  assert.equal(gruppoIngrediente(i({ nome: 'Uova', quantita: 3, unita: 'pezzi', reparto: 'latticini' })), 'uova-latticini');
  assert.equal(
    gruppoIngrediente(i({ nome: 'Carne macinata', quantita: 500, unita: 'g', reparto: 'carne-pesce' })),
    'carne-pesce',
  );
  assert.equal(gruppoIngrediente(i({ nome: 'Zucchine', quantita: 2, unita: 'pezzi', reparto: 'frutta-verdura' })), 'frutta-verdura');
  assert.equal(gruppoIngrediente(i({ nome: 'Olio extravergine di oliva', quantita: 3, unita: 'cucchiai' })), 'grassi');
  assert.equal(gruppoIngrediente(i({ nome: 'Alloro', quantita: 2, unita: 'foglie', reparto: 'frutta-verdura' })), 'aromi');
  assert.equal(gruppoIngrediente(i({ nome: 'Sale', unita: 'qb' })), 'quanto-basta');
});

test('gli ingredienti si ordinano come nei libri di cucina', () => {
  const ordinati = ordinaIngredienti([
    i({ nome: 'Sale', unita: 'qb' }),
    i({ nome: 'Olio extravergine di oliva', quantita: 80, unita: 'ml' }),
    i({ nome: 'Acqua', quantita: 700, unita: 'ml', reparto: 'bevande' }),
    i({ nome: 'Basilico', quantita: 10, unita: 'foglie', reparto: 'frutta-verdura' }),
    i({ nome: 'Farina 0', quantita: 1, unita: 'kg' }),
    i({ nome: 'Uova', quantita: 2, unita: 'pezzi', reparto: 'latticini' }),
  ]).map((x) => x.nome);

  assert.deepEqual(ordinati, [
    'Farina 0',
    'Acqua',
    'Uova',
    'Olio extravergine di oliva',
    'Basilico',
    'Sale',
  ]);
});

test('dentro lo stesso gruppo vince la quantità più grande', () => {
  const ordinati = ordinaIngredienti([
    i({ nome: 'Zucchero', quantita: 100, unita: 'g' }),
    i({ nome: 'Farina', quantita: 1, unita: 'kg' }),
    i({ nome: 'Cacao', quantita: 30, unita: 'g' }),
  ]).map((x) => x.nome);
  assert.deepEqual(ordinati, ['Farina', 'Zucchero', 'Cacao']);
});

test('a pari quantità l ordine è alfabetico e l array originale non si tocca', () => {
  const originale = [
    i({ nome: 'Sedano', quantita: 2, unita: 'pezzi', reparto: 'frutta-verdura' }),
    i({ nome: 'Carote', quantita: 2, unita: 'pezzi', reparto: 'frutta-verdura' }),
  ];
  const copia = [...originale];
  assert.deepEqual(ordinaIngredienti(originale).map((x) => x.nome), ['Carote', 'Sedano']);
  assert.deepEqual(originale, copia);
});

test('le conserve di verdura si leggono come verdure, non come basi secche', () => {
  assert.equal(gruppoIngrediente(i({ nome: 'Pomodori pelati', quantita: 800, unita: 'g' })), 'frutta-verdura');
  assert.equal(gruppoIngrediente(i({ nome: 'Passata di pomodoro', quantita: 700, unita: 'g' })), 'frutta-verdura');
  const ordinati = ordinaIngredienti([
    i({ nome: 'Pomodori pelati', quantita: 300, unita: 'g' }),
    i({ nome: 'Pane', quantita: 200, unita: 'g', reparto: 'panetteria' }),
    i({ nome: 'Sale', unita: 'qb' }),
  ]).map((x) => x.nome);
  assert.deepEqual(ordinati, ['Pane', 'Pomodori pelati', 'Sale']);
});

test('più voci "quanto basta" restano in fondo, in ordine alfabetico', () => {
  const ordinati = ordinaIngredienti([
    i({ nome: 'Pepe nero', unita: 'qb' }),
    i({ nome: 'Riso Carnaroli', quantita: 320, unita: 'g' }),
    i({ nome: 'Burro', quantita: 60, unita: 'g', reparto: 'latticini' }),
    i({ nome: 'Sale', unita: 'qb' }),
  ]).map((x) => x.nome);
  assert.deepEqual(ordinati, ['Riso Carnaroli', 'Burro', 'Pepe nero', 'Sale']);
});
