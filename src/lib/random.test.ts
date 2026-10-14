// Lancer avec : npm test  (node --test, sans dépendance)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sample, shuffle } from './random.ts';

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

test('shuffle garde les mêmes éléments sans modifier l’original', () => {
  const src = range(20);
  const out = shuffle(src);
  assert.deepEqual(src, range(20));
  assert.deepEqual([...out].sort((a, b) => a - b), src);
});

test('sample limite le nombre d’éléments, sans doublon', () => {
  const out = sample(range(100), 30);
  assert.equal(out.length, 30);
  assert.equal(new Set(out).size, 30);
  assert.ok(out.every((x) => x >= 0 && x < 100));
});

test('sample renvoie tout quand il y a moins d’éléments que demandé', () => {
  assert.deepEqual(sample(range(12), 30).sort((a, b) => a - b), range(12));
});
