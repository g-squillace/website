import {
  addDays,
  instantFromZoned,
  isoDate,
  minutesFromClock,
  weekdayOf,
  zonedFields,
  type CivilDate,
} from './time.ts';

export interface Window {
  weekday: number;
  from: string;
  to: string;
}

export interface SlotOptions {
  timeZone: string;
  slotMinutes: number;
  bufferMinutes: number;
  minNoticeHours: number;
  daysAhead: number;
  windows: ReadonlyArray<Window>;
}

export interface Slot {
  start: string;
  end: string;
}

export interface Interval {
  start: number;
  end: number;
}

export interface Day {
  date: string;
  slots: Slot[];
}

const MINUTE = 60_000;

export function candidateSlots(now: Date, options: SlotOptions): Slot[] {
  if (options.slotMinutes <= 0 || options.daysAhead < 0) return [];
  const today = zonedFields(now, options.timeZone);
  const earliest = now.getTime() + options.minNoticeHours * 60 * MINUTE;
  const slots: Slot[] = [];

  for (let offset = 0; offset <= options.daysAhead; offset += 1) {
    const date: CivilDate = addDays(
      { year: today.year, month: today.month, day: today.day },
      offset,
    );
    const weekday = weekdayOf(date);
    for (const window of options.windows) {
      if (window.weekday !== weekday) continue;
      const opens = minutesFromClock(window.from);
      const closes = minutesFromClock(window.to);
      if (opens === null || closes === null || closes <= opens) continue;

      for (let minute = opens; minute + options.slotMinutes <= closes; minute += options.slotMinutes) {
        const start = instantFromZoned(date, Math.floor(minute / 60), minute % 60, options.timeZone);
        if (start === null) continue;
        if (start.getTime() < earliest) continue;
        const end = new Date(start.getTime() + options.slotMinutes * MINUTE);
        slots.push({ start: start.toISOString(), end: end.toISOString() });
      }
    }
  }

  return slots.sort((left, right) => left.start.localeCompare(right.start));
}

export function removeBusy(
  slots: ReadonlyArray<Slot>,
  busy: ReadonlyArray<Interval>,
  bufferMinutes: number,
): Slot[] {
  const padding = Math.max(0, bufferMinutes) * MINUTE;
  return slots.filter((slot) => {
    const start = Date.parse(slot.start) - padding;
    const end = Date.parse(slot.end) + padding;
    return !busy.some((block) => block.start < end && block.end > start);
  });
}

export function removeFullDays(
  slots: ReadonlyArray<Slot>,
  taken: ReadonlyArray<number>,
  maxPerDay: number,
  timeZone: string,
): Slot[] {
  if (maxPerDay <= 0) return [...slots];
  const counted = new Map<string, number>();
  for (const instant of taken) {
    const key = isoDate(zonedFields(new Date(instant), timeZone));
    counted.set(key, (counted.get(key) ?? 0) + 1);
  }
  return slots.filter((slot) => {
    const key = isoDate(zonedFields(new Date(slot.start), timeZone));
    return (counted.get(key) ?? 0) < maxPerDay;
  });
}

export function groupByDay(slots: ReadonlyArray<Slot>, timeZone: string): Day[] {
  const days = new Map<string, Slot[]>();
  for (const slot of slots) {
    const key = isoDate(zonedFields(new Date(slot.start), timeZone));
    const bucket = days.get(key);
    if (bucket === undefined) days.set(key, [slot]);
    else bucket.push(slot);
  }
  return [...days.entries()]
    .map(([date, bucket]) => ({ date, slots: bucket }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function isKnownSlot(slots: ReadonlyArray<Slot>, start: string): Slot | null {
  return slots.find((slot) => slot.start === start) ?? null;
}
