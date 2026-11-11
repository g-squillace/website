export interface ZonedFields {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
}

export interface CivilDate {
  year: number;
  month: number;
  day: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  const cached = formatters.get(timeZone);
  if (cached !== undefined) return cached;
  const created = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  formatters.set(timeZone, created);
  return created;
}

function partValue(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): number {
  const found = parts.find((part) => part.type === type);
  return found === undefined ? 0 : Number.parseInt(found.value, 10);
}

export function zonedFields(instant: Date, timeZone: string): ZonedFields {
  const parts = formatter(timeZone).formatToParts(instant);
  const year = partValue(parts, 'year');
  const month = partValue(parts, 'month');
  const day = partValue(parts, 'day');
  return {
    year,
    month,
    day,
    hour: partValue(parts, 'hour'),
    minute: partValue(parts, 'minute'),
    weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
  };
}

export function instantFromZoned(
  date: CivilDate,
  hour: number,
  minute: number,
  timeZone: string,
): Date | null {
  const wallClock = Date.UTC(date.year, date.month - 1, date.day, hour, minute);
  let guess = new Date(wallClock);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const seen = zonedFields(guess, timeZone);
    const seenAsWallClock = Date.UTC(seen.year, seen.month - 1, seen.day, seen.hour, seen.minute);
    const drift = wallClock - seenAsWallClock;
    if (drift === 0) return guess;
    guess = new Date(guess.getTime() + drift);
  }
  const verification = zonedFields(guess, timeZone);
  const matches =
    verification.year === date.year &&
    verification.month === date.month &&
    verification.day === date.day &&
    verification.hour === hour &&
    verification.minute === minute;
  return matches ? guess : null;
}

export function addDays(date: CivilDate, days: number): CivilDate {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

export function weekdayOf(date: CivilDate): number {
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
}

export function isoDate(date: CivilDate): string {
  const month = String(date.month).padStart(2, '0');
  const day = String(date.day).padStart(2, '0');
  return `${date.year}-${month}-${day}`;
}

export function minutesFromClock(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (match === null) return null;
  const hours = Number.parseInt(match[1] ?? '', 10);
  const minutes = Number.parseInt(match[2] ?? '', 10);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}
