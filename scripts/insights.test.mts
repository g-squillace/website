import test from 'node:test';
import assert from 'node:assert/strict';
import { isBranded, portfolioMatcher, strikingDistance } from '../src/lib/report/insights.ts';
import type { QueryRow } from '../src/lib/report/types.ts';

const PROJECT_TITLES = [
  'Marco Calzavara',
  'Gioja Catering',
  'Filusè Siena',
  'Come il latte',
  'Edoardo Conticini',
  'Franco Zampetti',
  'Studio Legale BCM',
  'Maglia 90',
  'Dalet Studio di architetti',
  'Nobile Contrada dell’Aquila',
  'Scheda in ordine',
  'Millenovecentoquattro',
  'Avv. Vincenzo Di Benedetto',
  'Studio commerciale Mastrandrea',
];

const isPortfolio = portfolioMatcher(PROJECT_TITLES);

test('riconosce le ricerche sui nomi dei clienti', () => {
  for (const query of [
    'marco calzavara',
    'marco calzavara scenografo biografia',
    'gioja catering siena',
    'filuse',
    'edoardo conticini',
    'franco zampetti',
    'maglia 90 siena',
    'studio legale bcm',
    'mastrandrea',
    'millenovecentoquattro',
  ]) {
    assert.equal(isPortfolio(query), true, query);
  }
});

test('lascia passare le ricerche commerciali che contengono parole di settore', () => {
  for (const query of [
    'realizzazione sito web siena',
    'quanto costa un sito web professionale',
    'sviluppatore web frontend firenze',
    'ecommerce su misura',
    'sito accessibile wcag',
    'automazione intelligenza artificiale',
    'migrare wordpress a next js',
    'gestionale su misura per studio professionale',
    'landing page google ads',
    'sito per architetti',
    'sito web studio legale',
    'sito per ristorante',
    'preventivo sito vetrina',
    'sito web fotografo',
    'sito web per avvocati siena',
    'web designer toscana',
  ]) {
    assert.equal(isPortfolio(query), false, query);
  }
});

test('riconosce le ricerche sul nome di Guido', () => {
  assert.equal(isBranded('guido squillace'), true);
  assert.equal(isBranded('guidosquillace.it'), true);
  assert.equal(isBranded('sito web siena'), false);
});

test('propone solo le ricerche a portata, ordinate per clic recuperabili', () => {
  const rows: QueryRow[] = [
    { query: 'sito web siena', clicks: 0, impressions: 120, ctr: 0, position: 8.2 },
    { query: 'ecommerce su misura', clicks: 0, impressions: 40, ctr: 0, position: 15.4 },
    { query: 'guido squillace', clicks: 30, impressions: 60, ctr: 0.5, position: 1.1 },
    { query: 'landing page', clicks: 2, impressions: 30, ctr: 0.066, position: 2.1 },
    { query: 'gestionale', clicks: 0, impressions: 2, ctr: 0, position: 11 },
  ];
  const found = strikingDistance(rows).map((item) => item.query);
  assert.deepEqual(found, ['sito web siena', 'ecommerce su misura']);
});
