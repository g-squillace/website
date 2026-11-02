import type { Config } from '@netlify/functions';

export default async (): Promise<Response> => {
  const secret = process.env.REPORT_SESSION_SECRET ?? '';
  const base = process.env.URL ?? '';
  if (secret === '' || base === '') {
    return new Response('Configurazione incompleta', { status: 500 });
  }

  await fetch(`${base}/.netlify/functions/lighthouse-background`, {
    method: 'POST',
    headers: { 'x-report-trigger': secret },
  });

  return new Response('avviato');
};

export const config: Config = {
  schedule: '0 4 * * 1',
};
