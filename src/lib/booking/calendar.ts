import { BOOKING } from '../../config.ts';
import { CALENDAR_SCOPES, googleGet, googlePost, serviceAccount } from '../report/google.ts';
import type { Interval } from './slots.ts';

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const ORIGIN_TAG = 'sito-guidosquillace';

export interface BookingRequest {
  name: string;
  email: string;
  company: string;
  topic: string;
  start: string;
  end: string;
}

export type CalendarState = 'ok' | 'non-configurato' | 'credenziali-mancanti';

export function calendarState(): CalendarState {
  if (serviceAccount() === null) return 'credenziali-mancanti';
  if (BOOKING.calendarId.trim() === '') return 'non-configurato';
  return 'ok';
}

function busyCalendars(): string[] {
  const declared = [BOOKING.calendarId, ...BOOKING.busyCalendarIds]
    .map((id) => id.trim())
    .filter((id) => id !== '');
  return [...new Set(declared)];
}

function isBusyResponse(value: unknown): value is {
  calendars: Record<string, { busy?: { start: string; end: string }[]; errors?: unknown[] }>;
} {
  if (typeof value !== 'object' || value === null) return false;
  const candidate: Record<string, unknown> = { ...value };
  return typeof candidate.calendars === 'object' && candidate.calendars !== null;
}

export async function busyIntervals(from: Date, to: Date): Promise<Interval[]> {
  const items = busyCalendars().map((id) => ({ id }));
  if (items.length === 0) return [];
  const payload = await googlePost(
    `${CALENDAR_API}/freeBusy`,
    {
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      timeZone: BOOKING.timeZone,
      items,
    },
    CALENDAR_SCOPES,
  );
  if (!isBusyResponse(payload)) return [];

  const intervals: Interval[] = [];
  for (const calendar of Object.values(payload.calendars)) {
    for (const block of calendar.busy ?? []) {
      const start = Date.parse(block.start);
      const end = Date.parse(block.end);
      if (Number.isFinite(start) && Number.isFinite(end)) intervals.push({ start, end });
    }
  }
  return intervals;
}

function isEventList(value: unknown): value is { items?: { start?: { dateTime?: string } }[] } {
  return typeof value === 'object' && value !== null;
}

export async function bookedStarts(from: Date, to: Date): Promise<number[]> {
  const url = new URL(`${CALENDAR_API}/calendars/${encodeURIComponent(BOOKING.calendarId)}/events`);
  url.searchParams.set('timeMin', from.toISOString());
  url.searchParams.set('timeMax', to.toISOString());
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('maxResults', '250');
  url.searchParams.set('privateExtendedProperty', `origine=${ORIGIN_TAG}`);

  const payload = await googleGet(url.toString(), CALENDAR_SCOPES);
  if (!isEventList(payload)) return [];
  return (payload.items ?? [])
    .map((event) => Date.parse(event.start?.dateTime ?? ''))
    .filter((instant) => Number.isFinite(instant));
}

export async function createPendingEvent(request: BookingRequest): Promise<void> {
  const details = [
    `Richiesta arrivata da guidosquillace.it`,
    ``,
    `Nome: ${request.name}`,
    `Email: ${request.email}`,
    request.company === '' ? null : `Azienda: ${request.company}`,
    ``,
    `Di cosa vuole parlare:`,
    request.topic,
    ``,
    `L'ospite non è ancora invitato: aggiungi ${request.email} agli invitati per confermare, oppure proponi un altro orario.`,
  ]
    .filter((line) => line !== null)
    .join('\n');

  await googlePost(
    `${CALENDAR_API}/calendars/${encodeURIComponent(BOOKING.calendarId)}/events`,
    {
      summary: `Da confermare · Call con ${request.name}`,
      description: details,
      status: 'tentative',
      transparency: 'opaque',
      colorId: '5',
      start: { dateTime: request.start, timeZone: BOOKING.timeZone },
      end: { dateTime: request.end, timeZone: BOOKING.timeZone },
      extendedProperties: {
        private: {
          origine: ORIGIN_TAG,
          email: request.email,
          stato: 'da-confermare',
        },
      },
    },
    CALENDAR_SCOPES,
  );
}
