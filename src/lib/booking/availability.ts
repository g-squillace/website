import { BOOKING } from '../../config.ts';
import { bookedStarts, busyIntervals, calendarState, type CalendarState } from './calendar.ts';
import {
  candidateSlots,
  groupByDay,
  removeBusy,
  removeFullDays,
  type Day,
  type Slot,
} from './slots.ts';

export interface Availability {
  state: CalendarState;
  days: Day[];
  slots: Slot[];
}

function options() {
  return {
    timeZone: BOOKING.timeZone,
    slotMinutes: BOOKING.slotMinutes,
    bufferMinutes: BOOKING.bufferMinutes,
    minNoticeHours: BOOKING.minNoticeHours,
    daysAhead: BOOKING.daysAhead,
    windows: BOOKING.windows,
  };
}

export async function availability(now: Date = new Date()): Promise<Availability> {
  const state = calendarState();
  if (state !== 'ok') return { state, days: [], slots: [] };

  const candidates = candidateSlots(now, options());
  const first = candidates.at(0);
  const last = candidates.at(-1);
  if (first === undefined || last === undefined) return { state, days: [], slots: [] };

  const from = new Date(Date.parse(first.start) - BOOKING.bufferMinutes * 60_000);
  const to = new Date(Date.parse(last.end) + BOOKING.bufferMinutes * 60_000);

  const [busy, taken] = await Promise.all([busyIntervals(from, to), bookedStarts(from, to)]);

  const free = removeFullDays(
    removeBusy(candidates, busy, BOOKING.bufferMinutes),
    taken,
    BOOKING.maxPerDay,
    BOOKING.timeZone,
  );

  return { state, days: groupByDay(free, BOOKING.timeZone), slots: free };
}
