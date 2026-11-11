import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMonth, monthKeys } from '../src/lib/booking/month.ts';

test('la griglia parte di lunedì e lascia vuote le caselle prima del primo giorno', () => {
  const novembre = buildMonth('2026-11', []);
  const prima = novembre.weeks.at(0);
  assert.deepEqual(
    prima?.map((cella) => cella.date),
    [null, null, null, null, null, null, '2026-11-01'],
  );
});

test('la griglia chiude la settimana anche quando il mese finisce di lunedì', () => {
  const ultima = buildMonth('2026-11', []).weeks.at(-1);
  assert.deepEqual(
    ultima?.map((cella) => cella.date),
    ['2026-11-30', null, null, null, null, null, null],
  );
});

test('ogni settimana ha sette celle e ogni giorno del mese compare una volta sola', () => {
  const novembre = buildMonth('2026-11', []);
  for (const settimana of novembre.weeks) assert.equal(settimana.length, 7);
  const giorni = novembre.weeks.flat().flatMap((cella) => (cella.date === null ? [] : [cella.date]));
  assert.equal(giorni.length, 30);
  assert.equal(new Set(giorni).size, 30);
  assert.equal(giorni.at(0), '2026-11-01');
  assert.equal(giorni.at(-1), '2026-11-30');
});

test('febbraio di un anno bisestile arriva al ventinove', () => {
  const giorni = buildMonth('2028-02', []).weeks.flat().filter((cella) => cella.date !== null);
  assert.equal(giorni.length, 29);
  assert.equal(giorni.at(-1)?.date, '2028-02-29');
});

test('sono prenotabili soltanto i giorni passati come disponibili', () => {
  const novembre = buildMonth('2026-11', ['2026-11-12', '2026-11-13', '2026-12-01']);
  const liberi = novembre.weeks
    .flat()
    .filter((cella) => cella.available)
    .map((cella) => cella.date);
  assert.deepEqual(liberi, ['2026-11-12', '2026-11-13']);
});

test('buildMonth riporta anno e mese della chiave richiesta', () => {
  const dicembre = buildMonth('2026-12', []);
  assert.equal(dicembre.key, '2026-12');
  assert.equal(dicembre.year, 2026);
  assert.equal(dicembre.month, 12);
});

test('monthKeys elenca una sola volta i mesi toccati dai giorni liberi, in ordine', () => {
  const chiavi = monthKeys(['2026-11-30', '2026-12-01', '2026-11-12', '2026-12-18']);
  assert.deepEqual(chiavi, ['2026-11', '2026-12']);
});

test('senza giorni liberi non c’è nessun mese da sfogliare', () => {
  assert.deepEqual(monthKeys([]), []);
});
