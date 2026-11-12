export const prerender = false;

import type { APIRoute } from 'astro';
import { fetchOre, fetchPeriodi } from '../../../lib/gestionale/api';
import { missingSupabaseVars, supabaseConfigured } from '../../../lib/gestionale/supabase';
import { constantTimeEquals } from '../../../lib/report/auth';
import { readEnv } from '../../../lib/report/env';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (header === null) return null;
  const [scheme, value] = header.split(' ');
  if (scheme !== 'Bearer' || value === undefined || value.length === 0) return null;
  return value;
}

export const GET: APIRoute = async ({ params, request }) => {
  const expected = readEnv('ASSISTENZA_API_TOKEN');
  if (expected === null) {
    return json({ error: "ASSISTENZA_API_TOKEN non è configurata su questo sito" }, 503);
  }

  const offered = bearerToken(request);
  if (offered === null || !constantTimeEquals(offered, expected)) {
    return json({ error: 'non autorizzato' }, 401);
  }

  const progetto = params.progetto ?? '';
  if (!UUID.test(progetto)) return json({ error: 'identificatore di progetto non valido' }, 400);

  if (!supabaseConfigured()) {
    const mancanti = missingSupabaseVars()
      .map((variabile) => variabile.name)
      .join(', ');
    return json({ error: `configurazione incompleta: manca ${mancanti}` }, 503);
  }

  try {
    const periodi = await fetchPeriodi(progetto);
    const corrente = periodi[0];
    if (corrente === undefined) return json({ package: null }, 200);

    const ore = await fetchOre([corrente.id]);
    return json(
      {
        package: {
          totalHours: corrente.monteOre,
          startedOn: corrente.dataInizio,
          entries: ore.map((riga) => ({
            date: riga.data,
            hours: riga.ore,
            description: riga.nota,
          })),
        },
      },
      200,
    );
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'lettura non riuscita' },
      502,
    );
  }
};
