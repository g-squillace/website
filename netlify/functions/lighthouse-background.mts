import { completeWeek } from '../../src/lib/report/week';
import {
  LATEST_KEY,
  measureAll,
  pageSpeedKey,
  writeSnapshot,
} from '../../src/lib/report/performance';

export default async (request: Request): Promise<Response> => {
  const expected = process.env.REPORT_SESSION_SECRET ?? '';
  if (expected === '' || request.headers.get('x-report-trigger') !== expected) {
    return new Response('Non autorizzato', { status: 401 });
  }

  const key = pageSpeedKey();
  if (key === null) {
    return new Response('PAGESPEED_API_KEY non configurata', { status: 500 });
  }

  const snapshot = await measureAll(key);
  const week = completeWeek(new Date(), 0);
  await writeSnapshot(LATEST_KEY, snapshot);
  await writeSnapshot(`${week.year}-W${String(week.isoWeek).padStart(2, '0')}`, snapshot);

  return new Response('ok');
};
