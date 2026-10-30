import { googlePost } from './google';
import { readEnv } from './env';
import type { QueryRow, WeekRange } from './types';

const SEARCH_CONSOLE_API = 'https://searchconsole.googleapis.com/webmasters/v3';

export interface SearchTotals {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchWeek {
  totals: SearchTotals;
  queries: QueryRow[];
  pages: QueryRow[];
  daily: Map<string, { clicks: number; impressions: number }>;
  freshUntil: string | null;
}

interface RawRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export function siteUrl(): string | null {
  return readEnv('SEARCH_CONSOLE_SITE_URL');
}

function readRows(payload: unknown): RawRow[] {
  if (typeof payload !== 'object' || payload === null) return [];
  const rows: unknown = Reflect.get(payload, 'rows');
  if (!Array.isArray(rows)) return [];
  const parsed: RawRow[] = [];
  for (const row of rows) {
    if (typeof row !== 'object' || row === null) continue;
    const keys: unknown = Reflect.get(row, 'keys');
    const clicks: unknown = Reflect.get(row, 'clicks');
    const impressions: unknown = Reflect.get(row, 'impressions');
    const ctr: unknown = Reflect.get(row, 'ctr');
    const position: unknown = Reflect.get(row, 'position');
    parsed.push({
      keys: Array.isArray(keys) ? keys.map((key) => (typeof key === 'string' ? key : '')) : [],
      clicks: typeof clicks === 'number' ? clicks : 0,
      impressions: typeof impressions === 'number' ? impressions : 0,
      ctr: typeof ctr === 'number' ? ctr : 0,
      position: typeof position === 'number' ? position : 0,
    });
  }
  return parsed;
}

function toQueryRows(rows: RawRow[]): QueryRow[] {
  return rows.map((row) => ({
    query: row.keys[0] ?? '',
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  }));
}

function aggregate(rows: RawRow[]): SearchTotals {
  const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  const weightedPosition = rows.reduce((sum, row) => sum + row.position * row.impressions, 0);
  return {
    clicks,
    impressions,
    ctr: impressions > 0 ? clicks / impressions : 0,
    position: impressions > 0 ? weightedPosition / impressions : 0,
  };
}

async function query(site: string, body: Record<string, unknown>): Promise<unknown> {
  const endpoint = `${SEARCH_CONSOLE_API}/sites/${encodeURIComponent(site)}/searchAnalytics/query`;
  return googlePost(endpoint, body);
}

export async function fetchSearchConsole(
  week: WeekRange,
  previous: WeekRange,
): Promise<{ current: SearchWeek; previous: SearchTotals }> {
  const site = siteUrl();
  if (site === null) throw new Error('SEARCH_CONSOLE_SITE_URL non è configurata');

  const range = { startDate: week.start, endDate: week.end };

  const [queriesPayload, pagesPayload, dailyPayload, previousPayload] = await Promise.all([
    query(site, { ...range, dimensions: ['query'], rowLimit: 500, dataState: 'all' }),
    query(site, { ...range, dimensions: ['page'], rowLimit: 100, dataState: 'all' }),
    query(site, { ...range, dimensions: ['date'], rowLimit: 14, dataState: 'all' }),
    query(site, {
      startDate: previous.start,
      endDate: previous.end,
      dimensions: ['date'],
      rowLimit: 14,
      dataState: 'all',
    }),
  ]);

  const dailyRows = readRows(dailyPayload);
  const daily = new Map<string, { clicks: number; impressions: number }>();
  for (const row of dailyRows) {
    daily.set(row.keys[0] ?? '', { clicks: row.clicks, impressions: row.impressions });
  }

  const freshUntil = dailyRows
    .map((row) => row.keys[0] ?? '')
    .filter((date) => date !== '')
    .sort()
    .pop() ?? null;

  return {
    current: {
      totals: aggregate(dailyRows),
      queries: toQueryRows(readRows(queriesPayload)),
      pages: toQueryRows(readRows(pagesPayload)),
      daily,
      freshUntil,
    },
    previous: aggregate(readRows(previousPayload)),
  };
}
