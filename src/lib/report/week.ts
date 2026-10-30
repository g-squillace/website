import type { WeekRange } from './types';

const DAY_MS = 86_400_000;

const MONTHS = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
];

const WEEKDAYS = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function weekdayLabel(isoDate: string): string {
  const index = (parseIsoDate(isoDate).getUTCDay() + 6) % 7;
  return WEEKDAYS[index];
}

function startOfIsoWeek(date: Date): Date {
  const utcMidnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const weekday = (new Date(utcMidnight).getUTCDay() + 6) % 7;
  return new Date(utcMidnight - weekday * DAY_MS);
}

function isoWeekNumber(monday: Date): { week: number; year: number } {
  const thursday = new Date(monday.getTime() + 3 * DAY_MS);
  const year = thursday.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(year, 0, 4));
  const firstMonday = startOfIsoWeek(firstThursday);
  const week = Math.round((thursday.getTime() - firstMonday.getTime()) / (7 * DAY_MS)) + 1;
  return { week, year };
}

function formatRange(start: Date, end: Date): string {
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();
  const startMonth = MONTHS[start.getUTCMonth()];
  const endMonth = MONTHS[end.getUTCMonth()];
  const endYear = end.getUTCFullYear();
  if (start.getUTCMonth() === end.getUTCMonth()) {
    return `${startDay}–${endDay} ${endMonth} ${endYear}`;
  }
  return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${endYear}`;
}

export function completeWeek(reference: Date, weeksBack: number): WeekRange {
  const currentMonday = startOfIsoWeek(reference);
  const start = new Date(currentMonday.getTime() - (weeksBack + 1) * 7 * DAY_MS);
  const end = new Date(start.getTime() + 6 * DAY_MS);
  const { week, year } = isoWeekNumber(start);
  return {
    start: toIsoDate(start),
    end: toIsoDate(end),
    label: formatRange(start, end),
    shortLabel: `${start.getUTCDate()}/${start.getUTCMonth() + 1}`,
    isoWeek: week,
    year,
    weeksBack,
  };
}

export function weekDays(range: WeekRange): string[] {
  const start = parseIsoDate(range.start);
  return Array.from({ length: 7 }, (_, index) => toIsoDate(new Date(start.getTime() + index * DAY_MS)));
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseIsoDate(to).getTime() - parseIsoDate(from).getTime()) / DAY_MS);
}
