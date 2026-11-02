export const prerender = false;

import type { APIRoute } from 'astro';
import { isAuthenticated } from '../../../lib/report/auth';
import { LATEST_KEY, readSnapshot } from '../../../lib/report/performance';
import { readEnv } from '../../../lib/report/env';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export const GET: APIRoute = async ({ cookies }) => {
  if (!(await isAuthenticated(cookies))) return json({ error: 'non autorizzato' }, 401);
  const snapshot = await readSnapshot(LATEST_KEY);
  return json({ measuredAt: snapshot?.measuredAt ?? null }, 200);
};

export const POST: APIRoute = async ({ cookies, url }) => {
  if (!(await isAuthenticated(cookies))) return json({ error: 'non autorizzato' }, 401);

  const secret = readEnv('REPORT_SESSION_SECRET');
  if (secret === null) return json({ error: 'REPORT_SESSION_SECRET non configurata' }, 500);

  const target = new URL('/.netlify/functions/lighthouse-background', url.origin);
  const response = await fetch(target.toString(), {
    method: 'POST',
    headers: { 'x-report-trigger': secret },
  });

  if (!response.ok && response.status !== 202) {
    return json({ error: `avvio non riuscito (${response.status})` }, 502);
  }
  return json({ started: true }, 202);
};
