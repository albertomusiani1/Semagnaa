import test from 'node:test';
import assert from 'node:assert/strict';
import { famiglia, formatta, inBase, leggibile, somma, sommabili } from './unita.ts';

const ETICHETTE = { g: 'g', kg: 'kg', ml: 'ml', l: 'l', cucchiai: 'cucchiai', qb: 'q.b.' } as const;

test('le famiglie separano peso, volume e conteggi', () => {
  assert.equal(famiglia('g'), 'peso');
  assert.equal(famiglia('kg'), 'peso');
  assert.equal(famiglia('ml'), 'volume');
  assert.equal(famiglia('l'), 'volume');
  assert.equal(famiglia('cucchiai'), 'conteggio:cucchiai');
  assert.equal(famiglia('qb'), null);
  assert.equal(famiglia(undefined), null);
});

test('la conversione all unita base e esatta', () => {
  assert.equal(inBase(1.5, 'kg'), 1500);
  assert.equal(inBase(250, 'g'), 250);
  assert.equal(inBase(0.75, 'l'), 750);
});

test('si sommano solo unita della stessa famiglia', () => {
  assert.equal(sommabili({ valore: 100, unita: 'g' }, { valore: 1, unita: 'kg' }), true);
  assert.equal(sommabili({ valore: 100, unita: 'g' }, { valore: 2, unita: 'cucchiai' }), false);
  assert.equal(sommabili({ valore: 100, unita: 'g' }, { valore: 1, unita: 'l' }), false);
  assert.equal(sommabili({ unita: 'qb' }, { unita: 'qb' }), false);
});

test('somma converte dentro la famiglia e rifiuta il resto', () => {
  assert.deepEqual(somma({ valore: 500, unita: 'g' }, { valore: 1, unita: 'kg' }), { valore: 1500, unita: 'g' });
  assert.deepEqual(somma({ valore: 2, unita: 'cucchiai' }, { valore: 3, unita: 'cucchiai' }), {
    valore: 5,
    unita: 'cucchiai',
  });
  assert.equal(somma({ valore: 100, unita: 'g' }, { valore: 2, unita: 'cucchiai' }), null);
  assert.equal(somma({ unita: 'qb' }, { valore: 1, unita: 'g' }), null);
});

test('leggibile promuove e retrocede le unita', () => {
  assert.deepEqual(leggibile({ valore: 1200, unita: 'g' }), { valore: 1.2, unita: 'kg' });
  assert.deepEqual(leggibile({ valore: 250, unita: 'g' }), { valore: 250, unita: 'g' });
  assert.deepEqual(leggibile({ valore: 0.5, unita: 'l' }), { valore: 500, unita: 'ml' });
  assert.deepEqual(leggibile({ valore: 3, unita: 'cucchiai' }), { valore: 3, unita: 'cucchiai' });
  assert.deepEqual(leggibile({ unita: 'qb' }), { unita: 'qb' });
});

test('formatta usa la virgola decimale e le etichette passate da fuori', () => {
  assert.equal(formatta({ valore: 1200, unita: 'g' }, ETICHETTE), '1,2 kg');
  assert.equal(formatta({ valore: 200, unita: 'g' }, ETICHETTE), '200 g');
  assert.equal(formatta({ unita: 'qb' }, ETICHETTE), 'q.b.');
  assert.equal(formatta({ valore: 2 }, ETICHETTE), '2');
});
