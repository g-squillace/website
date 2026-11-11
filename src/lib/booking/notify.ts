import { BOOKING, FORMS } from '../../config';
import type { BookingRequest } from './calendar';

export function humanSlot(startIso: string): string {
  const start = new Date(startIso);
  const day = new Intl.DateTimeFormat('it-IT', {
    timeZone: BOOKING.timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(start);
  const time = new Intl.DateTimeFormat('it-IT', {
    timeZone: BOOKING.timeZone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(start);
  return `${day}, ore ${time}`;
}

export async function sendRequestEmail(request: BookingRequest): Promise<boolean> {
  try {
    const response = await fetch(FORMS.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: `Richiesta di call — ${request.name}`,
        Nome: request.name,
        Email: request.email,
        Azienda: request.company === '' ? '—' : request.company,
        Quando: `${humanSlot(request.start)} (${BOOKING.slotMinutes} minuti)`,
        Messaggio: request.topic,
        Provenienza: 'Prenotazione call dal sito',
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
