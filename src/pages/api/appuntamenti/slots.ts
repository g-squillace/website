export const prerender = false;

import type { APIRoute } from 'astro';
import { BOOKING } from '../../../config';
import { availability } from '../../../lib/booking/availability';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export const GET: APIRoute = async () => {
  try {
    const result = await availability();
    if (result.state !== 'ok') {
      return json({ stato: result.state, giorni: [] }, 200);
    }
    return json(
      {
        stato: 'ok',
        durata: BOOKING.slotMinutes,
        fuso: BOOKING.timeZone,
        giorni: result.days,
      },
      200,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'errore sconosciuto';
    return json({ stato: 'errore', messaggio: message, giorni: [] }, 502);
  }
};
