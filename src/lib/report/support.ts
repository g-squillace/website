import { SUPPORT, type SupportPackage } from '../../config';
import type { SourceState, SupportSection, WeekRange } from './types';

function shiftDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function examplePackage(week: WeekRange): SupportPackage {
  return {
    totalHours: 20,
    startedOn: shiftDays(week.start, -42),
    entries: [
      {
        date: shiftDays(week.start, 2),
        hours: 3,
        description: 'Scritta e pubblicata la pagina «rifacimento bagno prezzi»',
      },
      {
        date: shiftDays(week.start, -5),
        hours: 1.5,
        description: 'Rifatti titoli e descrizioni di quattro pagine servizio',
      },
      {
        date: shiftDays(week.start, -12),
        hours: 4,
        description: 'Compresse le immagini della galleria: home più veloce da telefono',
      },
      {
        date: shiftDays(week.start, -26),
        hours: 2,
        description: 'Modulo contatti: aggiunto il campo telefono e la notifica via mail',
      },
      {
        date: shiftDays(week.start, -33),
        hours: 1.5,
        description: 'Aggiornamento dipendenze e verifica dei backup',
      },
    ],
  };
}

export function buildSupport(week: WeekRange): { section: SupportSection; source: SourceState } {
  const configured: SupportPackage | null = SUPPORT;
  const data: SupportPackage = configured ?? examplePackage(week);

  const entries = [...data.entries]
    .sort((left, right) => right.date.localeCompare(left.date))
    .map((entry) => ({
      date: entry.date,
      hours: entry.hours,
      description: entry.description,
      inWeek: entry.date >= week.start && entry.date <= week.end,
    }));

  const usedHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
  const usedThisWeek = entries
    .filter((entry) => entry.inWeek)
    .reduce((sum, entry) => sum + entry.hours, 0);

  return {
    section: {
      totalHours: data.totalHours,
      usedHours,
      remainingHours: Math.max(0, data.totalHours - usedHours),
      usedThisWeek,
      startedOn: data.startedOn,
      entries,
    },
    source:
      configured !== null
        ? { status: 'live', message: null }
        : {
            status: 'demo',
            message: 'Ore di esempio: il pacchetto non è ancora collegato a questo sito.',
          },
  };
}
