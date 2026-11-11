export const prerender = false;

import type { APIRoute } from 'astro';
import { availability } from '../../../lib/booking/availability';
import { createPendingEvent, type BookingRequest } from '../../../lib/booking/calendar';
import { humanSlot, sendRequestEmail } from '../../../lib/booking/notify';
import { isKnownSlot } from '../../../lib/booking/slots';

const MAX_TOPIC = 1200;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function text(value: unknown, limit: number): string {
  return typeof value === 'string' ? value.trim().slice(0, limit) : '';
}

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

export const POST: APIRoute = async ({ request }) => {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ errore: 'Richiesta non leggibile.' }, 400);
  }
  if (typeof payload !== 'object' || payload === null) {
    return json({ errore: 'Richiesta non leggibile.' }, 400);
  }

  const body: Record<string, unknown> = { ...payload };
  if (text(body.sito, 200) !== '') return json({ ok: true }, 200);

  const name = text(body.nome, 120);
  const email = text(body.email, 160);
  const company = text(body.azienda, 160);
  const topic = text(body.motivo, MAX_TOPIC);
  const start = text(body.inizio, 40);

  if (name.length < 2) return json({ errore: 'Manca il nome.' }, 422);
  if (!looksLikeEmail(email)) return json({ errore: "L'indirizzo email non sembra valido." }, 422);
  if (topic.length < 10) {
    return json({ errore: 'Scrivi due righe su cosa ti serve: mi aiutano a prepararmi.' }, 422);
  }

  try {
    const result = await availability();
    if (result.state !== 'ok') {
      return json({ errore: 'La prenotazione non è ancora attiva.' }, 503);
    }

    const slot = isKnownSlot(result.slots, start);
    if (slot === null) {
      return json(
        { errore: "Quell'orario non è più libero. Ricarica la pagina e scegline un altro.", scaduto: true },
        409,
      );
    }

    const booking: BookingRequest = { name, email, company, topic, start: slot.start, end: slot.end };
    await createPendingEvent(booking);
    const emailSent = await sendRequestEmail(booking);

    return json({ ok: true, quando: humanSlot(slot.start), emailInviata: emailSent }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'errore sconosciuto';
    return json({ errore: 'Non sono riuscito a registrare la richiesta.', dettaglio: message }, 502);
  }
};
