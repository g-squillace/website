import { isoDate, weekdayOf } from './time.ts';

export interface MonthCell {
  date: string | null;
  available: boolean;
}

export interface MonthView {
  key: string;
  year: number;
  month: number;
  weeks: MonthCell[][];
}

const DAYS_IN_WEEK = 7;

function emptyCell(): MonthCell {
  return { date: null, available: false };
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function buildMonth(key: string, availableDays: ReadonlyArray<string>): MonthView {
  const year = Number.parseInt(key.slice(0, 4), 10);
  const month = Number.parseInt(key.slice(5, 7), 10);
  const free = new Set(availableDays);
  const cells: MonthCell[] = [];

  const leading = (weekdayOf({ year, month, day: 1 }) + 6) % DAYS_IN_WEEK;
  for (let index = 0; index < leading; index += 1) cells.push(emptyCell());

  const total = daysInMonth(year, month);
  for (let day = 1; day <= total; day += 1) {
    const date = isoDate({ year, month, day });
    cells.push({ date, available: free.has(date) });
  }

  while (cells.length % DAYS_IN_WEEK !== 0) cells.push(emptyCell());

  const weeks: MonthCell[][] = [];
  for (let index = 0; index < cells.length; index += DAYS_IN_WEEK) {
    weeks.push(cells.slice(index, index + DAYS_IN_WEEK));
  }

  return { key, year, month, weeks };
}

export function monthKeys(dayKeys: ReadonlyArray<string>): string[] {
  return [...new Set(dayKeys.map((day) => day.slice(0, 7)))].sort();
}
