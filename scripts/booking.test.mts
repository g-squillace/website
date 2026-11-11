import test from 'node:test';
import assert from 'node:assert/strict';
import {
  candidateSlots,
  groupByDay,
  removeBusy,
  removeFullDays,
  type Slot,
} from '../src/lib/booking/slots.ts';
import { instantFromZoned, zonedFields } from '../src/lib/booking/time.ts';

const ROME = 'Europe/Rome';

const base = {
  timeZone: ROME,
  slotMinutes: 30,
  bufferMinutes: 15,
  minNoticeHours: 0,
  daysAhead: 0,
  windows: [{ weekday: 2, from: '09:00', to: '10:30' }],
};

test('la stessa ora locale cade su istanti UTC diversi fra inverno ed estate', () => {
  const inverno = instantFromZoned({ year: 2026, month: 1, day: 13 }, 10, 0, ROME);
  const estate = instantFromZoned({ year: 2026, month: 7, day: 14 }, 10, 0, ROME);
  assert.equal(inverno?.toISOString(), '2026-01-13T09:00:00.000Z');
  assert.equal(estate?.toISOString(), '2026-07-14T08:00:00.000Z');
});

test("l'ora che non esiste nel salto di ora legale viene scartata", () => {
  assert.equal(instantFromZoned({ year: 2026, month: 3, day: 29 }, 2, 30, ROME), null);
  assert.notEqual(instantFromZoned({ year: 2026, month: 3, day: 29 }, 3, 30, ROME), null);
});

test('zonedFields legge giorno e giorno della settimana nel fuso richiesto', () => {
  const fields = zonedFields(new Date('2026-07-14T22:30:00.000Z'), ROME);
  assert.equal(fields.day, 15);
  assert.equal(fields.hour, 0);
  assert.equal(fields.weekday, 3);
});

test('genera gli slot solo nelle fasce del giorno giusto', () => {
  const slots = candidateSlots(new Date('2026-01-12T08:00:00.000Z'), { ...base, daysAhead: 1 });
  assert.deepEqual(
    slots.map((slot) => slot.start),
    ['2026-01-13T08:00:00.000Z', '2026-01-13T08:30:00.000Z', '2026-01-13T09:00:00.000Z'],
  );
});

test('il preavviso minimo taglia gli slot troppo vicini', () => {
  const slots = candidateSlots(new Date('2026-01-13T07:00:00.000Z'), {
    ...base,
    minNoticeHours: 2,
  });
  assert.deepEqual(
    slots.map((slot) => slot.start),
    ['2026-01-13T09:00:00.000Z'],
  );
});

test('un impegno in calendario toglie anche gli slot a ridosso, per via del buffer', () => {
  const slots: Slot[] = [
    { start: '2026-01-13T08:00:00.000Z', end: '2026-01-13T08:30:00.000Z' },
    { start: '2026-01-13T08:30:00.000Z', end: '2026-01-13T09:00:00.000Z' },
    { start: '2026-01-13T09:00:00.000Z', end: '2026-01-13T09:30:00.000Z' },
  ];
  const busy = [
    {
      start: Date.parse('2026-01-13T08:30:00.000Z'),
      end: Date.parse('2026-01-13T08:45:00.000Z'),
    },
  ];
  assert.deepEqual(
    removeBusy(slots, busy, 15).map((slot) => slot.start),
    ['2026-01-13T09:00:00.000Z'],
  );
  assert.deepEqual(
    removeBusy(slots, busy, 0).map((slot) => slot.start),
    ['2026-01-13T08:00:00.000Z', '2026-01-13T09:00:00.000Z'],
  );
});

test('il buffer blocca lo slot che comincia troppo presto dopo un impegno', () => {
  const slots: Slot[] = [{ start: '2026-01-13T09:00:00.000Z', end: '2026-01-13T09:30:00.000Z' }];
  const busy = [
    {
      start: Date.parse('2026-01-13T08:00:00.000Z'),
      end: Date.parse('2026-01-13T08:50:00.000Z'),
    },
  ];
  assert.deepEqual(removeBusy(slots, busy, 15), []);
  assert.deepEqual(
    removeBusy(slots, busy, 5).map((slot) => slot.start),
    ['2026-01-13T09:00:00.000Z'],
  );
});

test('un giorno che ha già raggiunto il tetto sparisce del tutto', () => {
  const slots: Slot[] = [
    { start: '2026-01-13T08:00:00.000Z', end: '2026-01-13T08:30:00.000Z' },
    { start: '2026-01-14T08:00:00.000Z', end: '2026-01-14T08:30:00.000Z' },
  ];
  const taken = [Date.parse('2026-01-13T10:00:00.000Z'), Date.parse('2026-01-13T15:00:00.000Z')];
  assert.deepEqual(
    removeFullDays(slots, taken, 2, ROME).map((slot) => slot.start),
    ['2026-01-14T08:00:00.000Z'],
  );
});

test('gli slot si raggruppano per giornata locale, non per giornata UTC', () => {
  const slots: Slot[] = [
    { start: '2026-07-14T21:00:00.000Z', end: '2026-07-14T21:30:00.000Z' },
    { start: '2026-07-14T22:30:00.000Z', end: '2026-07-14T23:00:00.000Z' },
  ];
  assert.deepEqual(
    groupByDay(slots, ROME).map((day) => day.date),
    ['2026-07-14', '2026-07-15'],
  );
});
