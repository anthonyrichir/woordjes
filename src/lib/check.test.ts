// Lancer avec : npm test  (node --test, sans dépendance)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { check } from './check.ts';
import { parseCsv, titleFromSlug } from './csv.ts';

const nlfr = { direction: 'nl-fr' } as const;
const frnl = { direction: 'fr-nl' } as const;

test('casse et espaces ignorés', () => {
  assert.equal(check('  Le  Chien ', ['le chien'], nlfr), 'exact');
});

test('plusieurs traductions acceptées', () => {
  assert.equal(check('courir', ['marcher', 'courir'], nlfr), 'exact');
});

test('accents tolérés mais signalés', () => {
  assert.equal(check("l'eleve", ["l'élève"], nlfr), 'accents');
  assert.equal(check('la cour de recre', ['la cour de récréation', 'la cour de récré'], nlfr), 'accents');
});

test('apostrophe typographique acceptée', () => {
  assert.equal(check('l’école', ["l'école"], nlfr), 'exact');
});

test('articles de/het optionnels par défaut en FR→NL', () => {
  assert.equal(check('hond', ['de hond'], frnl), 'exact');
  assert.equal(check('de hond', ['de hond'], frnl), 'exact');
  assert.equal(check('het hond', ['de hond'], frnl), 'exact'); // mauvais article, mais non exigé
});

test('articles exigés si option cochée', () => {
  assert.equal(check('hond', ['de hond'], { ...frnl, requireArticles: true }), 'wrong');
  assert.equal(check('het hond', ['de hond'], { ...frnl, requireArticles: true }), 'wrong');
  assert.equal(check('de hond', ['de hond'], { ...frnl, requireArticles: true }), 'exact');
});

test('réponse vide ou fausse', () => {
  assert.equal(check('', ['de hond'], frnl), 'wrong');
  assert.equal(check('le chat', ['le chien'], nlfr), 'wrong');
});

test('parse CSV avec variantes des deux côtés', () => {
  const words = parseCsv('nl;fr\nde lijm|de plakstift;la colle|le bâton de colle\n\nlopen;marcher|courir\n');
  assert.deepEqual(words, [
    { nl: ['de lijm', 'de plakstift'], fr: ['la colle', 'le bâton de colle'] },
    { nl: ['lopen'], fr: ['marcher', 'courir'] },
  ]);
});

test('titre depuis le nom de fichier', () => {
  assert.equal(titleFromSlug('h1-een-nieuwe-school'), 'Een nieuwe school');
  assert.equal(titleFromSlug('02-de-dieren'), 'De dieren');
  assert.equal(titleFromSlug('kleuren'), 'Kleuren');
});
